import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoEqualEarth, geoPath} from 'd3-geo';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {clamp, useUnit} from '../components/common';
import {countries110, findCountry110, REGION_BOXES} from '../geo/countries';
import {colourAt, ease, fmt, num, textOn, usePlot, type InfoProps} from './shared';

/* ------------------------------------------------------------------ bubble */

/** bubble: data {bubbles: [{label, value, colour?}]} (max 14): area = value, packed around the centre, largest first. */
export const BubbleChart: React.FC<InfoProps> = ({v}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const {width, height, portrait, left, top, W, H} = usePlot();
  const d = v.data || {};
  const items = ((d.bubbles || d.items || v.series || []) as any[]).slice(0, 14).map((b: any, i: number) => ({
    label: String(b?.label ?? ''),
    value: Math.max(0, num(b?.value)),
    colour: colourAt(i, b?.colour),
  }));
  if (!items.length) return null;
  const max = Math.max(1e-9, ...items.map((b) => b.value));
  const rel = items.map((b) => Math.sqrt(b.value / max));
  const sumA = rel.reduce((a, r) => a + r * r, 0);
  const Rmax = Math.min(Math.min(W, H) * 0.34, Math.sqrt((W * H * 0.4) / (Math.PI * Math.max(1, sumA))));
  const order = items.map((_, i) => i).sort((a, b) => items[b].value - items[a].value);
  const gap = 10 * u;
  const sx = portrait ? 1 : 1.6;
  const sy = portrait ? 1.6 : 1;
  const placed: Array<{x: number; y: number; r: number; i: number}> = [];
  for (const i of order) {
    const r = Math.max(14 * u, Rmax * rel[i]);
    let x = 0;
    let y = 0;
    if (placed.length) {
      for (let s = 1; s < 3000; s++) {
        const a = s * 0.3;
        const dist = s * 1.5 * u;
        const tx = Math.cos(a) * dist * sx;
        const ty = Math.sin(a) * dist * sy;
        if (placed.every((p) => Math.hypot(p.x - tx, p.y - ty) >= p.r + r + gap)) {
          x = tx;
          y = ty;
          break;
        }
      }
    }
    placed.push({x, y, r, i});
  }
  const minX = Math.min(...placed.map((p) => p.x - p.r));
  const maxX = Math.max(...placed.map((p) => p.x + p.r));
  const minY = Math.min(...placed.map((p) => p.y - p.r));
  const maxY = Math.max(...placed.map((p) => p.y + p.r));
  const k = Math.min(1, W / Math.max(1, maxX - minX), H / Math.max(1, maxY - minY));
  const ox = left + W / 2 - ((minX + maxX) / 2) * k;
  const oy = top + H / 2 - ((minY + maxY) / 2) * k;
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {placed.map((p, n) => {
          const b = items[p.i];
          const s = spring({frame: Math.max(0, frame - 6 - n * 5), fps, config: {damping: 12}});
          if (s <= 0.001) return null;
          const cx = ox + p.x * k;
          const cy = oy + p.y * k;
          const R = p.r * k;
          const inside = R > 70 * u;
          const fs = Math.min(40 * u, R * 0.28);
          const tc = textOn(b.colour);
          return (
            <g key={p.i}>
              <circle cx={cx} cy={cy} r={R * s} fill={b.colour} stroke={C.board} strokeWidth={STROKE} />
              {inside ? (
                <>
                  <text x={cx} y={cy - fs * 0.15} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={fs} fill={tc} opacity={s}>
                    {b.label}
                  </text>
                  <text x={cx} y={cy + fs * 1.05} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={fs * 0.85} fill={tc} opacity={s}>
                    {fmt(b.value, v.unit)}
                  </text>
                </>
              ) : (
                <text x={cx} y={cy + R + 30 * u} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={24 * u} fill={C.board} opacity={s}>
                  {`${b.label} · ${fmt(b.value, v.unit)}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------- comparison-table */

const Mark: React.FC<{ok: boolean; size: number}> = ({ok, size}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    {ok ? (
      <path d="M7 21 L16 30 L33 10" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M10 10 L30 30 M30 10 L10 30" fill="none" stroke={C.stamp} strokeWidth={7} strokeLinecap="round" />
    )}
  </svg>
);

const cellContent = (val: unknown, unit: string | undefined, size: number): React.ReactNode => {
  if (val === true || val === false) return <Mark ok={val} size={size} />;
  if (val === null || val === undefined || val === '') return <span style={{color: C.greyLight}}>-</span>;
  if (typeof val === 'number') return fmt(val, unit);
  return String(val);
};

/**
 * comparison-table: data {columns: ["A", "B", ...] (max 4), rows: [{label, values: [number | string | true | false | null]}] (max 8),
 * highlight?: column index}. Rows slide in one by one; true/false become a tick / cross; the highlighted column gets a frame.
 */
export const ComparisonTable: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const d = v.data || {};
  const columns: string[] = ((d.columns || []) as unknown[]).map((c) => String(c ?? '')).slice(0, 4);
  const rows = ((d.rows || []) as any[]).slice(0, 8).map((r: any) => ({
    label: String(r?.label ?? ''),
    values: (Array.isArray(r?.values) ? r.values : []) as unknown[],
  }));
  if (!columns.length || !rows.length) return null;
  const hl = d.highlight === undefined || d.highlight === null ? -1 : Math.round(num(d.highlight, -1));
  const x0 = width * (portrait ? 0.05 : 0.08);
  const tw = width * (portrait ? 0.9 : 0.84);
  const labelW = tw * (portrait ? 0.36 : 0.34);
  const colW = (tw - labelW) / columns.length;
  const y0 = height * (portrait ? 0.22 : 0.2);
  const rowH = Math.min(110 * u, (height * (portrait ? 0.55 : 0.64)) / (rows.length + 1));
  const fs = Math.min(40 * u, rowH * 0.42);
  const D = Math.max(1, scene.durationFrames);
  const stagger = Math.max(4, Math.min(18, (D * 0.5) / rows.length));
  const head = ease(frame, 2, 12);
  const lastRow = 10 + rows.length * stagger;
  const box = ease(frame, lastRow, lastRow + 12);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: x0, top: y0, width: tw, height: rowH, display: 'flex', opacity: head, background: C.board}}>
        <div style={{width: labelW}} />
        {columns.map((c, j) => (
          <div key={j} style={{width: colW, display: 'flex', alignItems: 'center', justifyContent: 'center', background: j === hl ? C.ink : 'transparent', color: C.paper, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, whiteSpace: 'nowrap', overflow: 'hidden'}}>
            {c}
          </div>
        ))}
      </div>
      {rows.map((r, i) => {
        const at = 10 + i * stagger;
        const o = interpolate(frame, [at, at + 8], [0, 1], clamp);
        return (
          <div key={i} style={{position: 'absolute', left: x0, top: y0 + (i + 1) * rowH, width: tw, height: rowH, display: 'flex', borderBottom: `2px solid ${C.greyLight}`, boxSizing: 'border-box', opacity: o, transform: `translateY(${(1 - o) * 20 * u}px)`}}>
            <div style={{width: labelW, display: 'flex', alignItems: 'center', paddingLeft: 16 * u, boxSizing: 'border-box', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fs, color: C.board, whiteSpace: 'nowrap', overflow: 'hidden'}}>{r.label}</div>
            {columns.map((_, j) => (
              <div key={j} style={{width: colW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: fs * 0.9, color: j === hl ? C.ink : C.board, whiteSpace: 'nowrap'}}>
                {cellContent(r.values[j], v.unit, fs * 1.1)}
              </div>
            ))}
          </div>
        );
      })}
      {hl >= 0 && hl < columns.length ? (
        <div style={{position: 'absolute', left: x0 + labelW + hl * colW - 6 * u, top: y0 - 6 * u, width: colW + 12 * u, height: rowH * (rows.length + 1) + 12 * u, border: `${8 * u}px solid ${C.ink}`, boxSizing: 'border-box', opacity: box, transform: `scale(${1.06 - 0.06 * box})`}} />
      ) : null}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------- calendar-heatmap */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;
const parseDate = (s: unknown): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s ?? ''));
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/**
 * calendar-heatmap: data {start: "YYYY-MM-DD", values: [one number per day]} or {days: [{date, value}]} (max 371 days),
 * colour?. Weeks are columns (Monday on top); 4 tint levels of one brand colour; columns appear left to right.
 */
export const CalendarHeatmap: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const {width, height, portrait, left, top, W, H} = usePlot();
  const d = v.data || {};
  let start = parseDate(d.start);
  let vals: number[] = [];
  if (Array.isArray(d.days) && d.days.length) {
    const ds = (d.days as any[]).map((x: any) => ({t: parseDate(x?.date), v: Math.max(0, num(x?.value))})).filter((x) => x.t !== null) as Array<{t: number; v: number}>;
    if (ds.length) {
      const t0 = start ?? Math.min(...ds.map((x) => x.t));
      start = t0;
      const n = Math.min(371, Math.max(...ds.map((x) => Math.round((x.t - t0) / DAY))) + 1);
      vals = new Array(Math.max(1, n)).fill(0);
      for (const x of ds) {
        const k = Math.round((x.t - t0) / DAY);
        if (k >= 0 && k < vals.length) vals[k] += x.v;
      }
    }
  } else {
    vals = ((d.values || []) as unknown[]).slice(0, 371).map((x) => Math.max(0, num(x)));
  }
  if (!vals.length) return null;
  const t0 = start ?? Date.UTC(2000, 0, 3);
  const offset = (new Date(t0).getUTCDay() + 6) % 7;
  const cols = Math.ceil((vals.length + offset) / 7);
  const cell = Math.min((W - 40 * u) / cols, (H * 0.72) / 7, 64 * u);
  const sz = cell * 0.82;
  const gw = cols * cell;
  const gx = left + 40 * u + (W - 40 * u - gw) / 2;
  const gy = top + (portrait ? 40 : 50) * u;
  const max = Math.max(1e-9, ...vals);
  const D = Math.max(1, scene.durationFrames);
  const colAt = (c: number) => 6 + (c / Math.max(1, cols)) * D * 0.55;
  const level = (x: number) => (x <= 0 ? 0 : Math.min(4, 1 + Math.floor((x / max) * 3.999)));
  const fill = colourOf(d.colour, C.ink);
  const opac = [1, 0.3, 0.55, 0.8, 1];
  const months: Array<{c: number; text: string}> = [];
  let lastM = -1;
  for (let c = 0; c < cols; c++) {
    const dt = new Date(Math.max(t0, t0 + (c * 7 - offset) * DAY));
    const m = dt.getUTCMonth();
    if (m !== lastM) {
      months.push({c, text: MONTHS[m] + (m === 0 || !months.length ? ' ' + dt.getUTCFullYear() : '')});
      lastM = m;
    }
  }
  const total = vals.reduce((a, b) => a + b, 0);
  const legendO = ease(frame, colAt(cols), colAt(cols) + 10);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {months.map((m, i) => (
          <text key={'m' + i} x={gx + m.c * cell} y={gy - 16 * u} fontFamily={FONT_MONO} fontSize={Math.min(26 * u, cell * 1.6)} fill={C.grey} opacity={ease(frame, colAt(m.c), colAt(m.c) + 8)}>
            {m.text}
          </text>
        ))}
        {['Mon', 'Wed', 'Fri'].map((t, i) => (
          <text key={'w' + i} x={gx - 12 * u} y={gy + i * 2 * cell + sz * 0.75} textAnchor="end" fontFamily={FONT_MONO} fontSize={Math.min(22 * u, cell * 0.9)} fill={C.grey}>
            {t}
          </text>
        ))}
        {vals.map((x, k) => {
          const g = k + offset;
          const c = Math.floor(g / 7);
          const r = g % 7;
          const o = ease(frame, colAt(c), colAt(c) + 6);
          if (o <= 0) return null;
          const lv = level(x);
          return (
            <rect key={k} x={gx + c * cell} y={gy + r * cell} width={sz} height={sz} fill={lv ? fill : C.greyLight} fillOpacity={opac[lv]} stroke={C.board} strokeWidth={Math.max(1, Math.min(2.5, sz * 0.08))} opacity={o} />
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: gx, top: gy + 7 * cell + 34 * u, display: 'flex', alignItems: 'center', gap: 10 * u, fontFamily: FONT_MONO, fontSize: 24 * u, color: C.grey, opacity: legendO}}>
        <span style={{marginRight: 6 * u}}>Less</span>
        {[0, 1, 2, 3, 4].map((lv) => (
          <div key={lv} style={{width: 28 * u, height: 28 * u, background: C.paper, border: `2px solid ${C.board}`, boxSizing: 'border-box', position: 'relative'}}>
            <div style={{position: 'absolute', inset: 0, background: lv ? fill : C.greyLight, opacity: opac[lv]}} />
          </div>
        ))}
        <span style={{marginLeft: 6 * u}}>More</span>
        {d.showTotal !== false ? <span style={{marginLeft: 36 * u, color: C.board, fontWeight: 700}}>Total {fmt(total, v.unit)}</span> : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- map-choropleth */

const mainCentroid = (path: any, f: any): [number, number] => {
  const g = f?.geometry;
  if (!g || g.type !== 'MultiPolygon') return path.centroid(f);
  let best: any = null;
  let bestA = -1;
  for (const poly of g.coordinates) {
    const sub = {type: 'Polygon', coordinates: poly};
    const a = path.area(sub);
    if (a > bestA) {
      bestA = a;
      best = sub;
    }
  }
  return path.centroid(best);
};

/**
 * map-choropleth: data {values: [{country: ISO3 | name, value}], region?: world | europe | ... (default world), bins?: 2-6,
 * colour?, legend? (title), showValues? (default true: value tags on the 8 highest)}. Equal Earth projection, Natural Earth
 * 1:110m (public domain). Countries fill in from low to high; no-data countries stay light grey.
 */
export const Choropleth: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const d = v.data || {};
  const entries = ((d.values || []) as any[])
    .map((e: any) => ({f: findCountry110(e?.country), value: num(e?.value)}))
    .filter((e) => !!e.f);
  const box = REGION_BOXES[String(d.region || 'world')] || REGION_BOXES.world;
  const ext: [[number, number], [number, number]] = portrait
    ? [[width * 0.05, height * 0.2], [width * 0.95, height * 0.62]]
    : [[width * 0.04, height * 0.17], [width * 0.74, height * 0.9]];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 8; i++) {
    const lon = box[0] + ((box[1] - box[0]) * i) / 8;
    const lat = box[2] + ((box[3] - box[2]) * i) / 8;
    pts.push([lon, box[2]], [lon, box[3]], [box[0], lat], [box[1], lat]);
  }
  const proj = geoEqualEarth()
    .rotate([-(box[0] + box[1]) / 2, 0])
    .fitExtent(ext, {type: 'MultiPoint', coordinates: pts} as any);
  const path: any = geoPath(proj);
  const vals = entries.map((e) => e.value);
  const lo = vals.length ? Math.min(...vals) : 0;
  const hi = vals.length ? Math.max(...vals) : 1;
  const bins = Math.max(2, Math.min(6, Math.round(num(d.bins, 5))));
  const binOf = (x: number) => (hi > lo ? Math.min(bins - 1, Math.floor(((x - lo) / (hi - lo)) * bins)) : bins - 1);
  const op = (b: number) => 0.2 + (0.8 * b) / (bins - 1);
  const fill = colourOf(d.colour, C.ink);
  const D = Math.max(1, scene.durationFrames);
  const ranked = entries.map((_, i) => i).sort((a, b) => entries[a].value - entries[b].value);
  const rankOf: number[] = new Array(entries.length).fill(0);
  ranked.forEach((i, r) => {
    rankOf[i] = r;
  });
  const stagger = entries.length > 1 ? (D * 0.4) / entries.length : 0;
  const appearAt = (i: number) => 10 + rankOf[i] * stagger;
  const base = ease(frame, 0, 10);
  const clipId = `chl-${scene.id}`;
  const labelled = d.showValues === false ? [] : ranked.slice().reverse().slice(0, 8);
  const all = countries110().filter((f) => String(f.properties?.name) !== 'Antarctica');
  const legendX = portrait ? width * 0.1 : width * 0.77;
  const legendY = portrait ? height * 0.65 : height * 0.3;
  const legendO = ease(frame, 10, 22);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <defs>
          <clipPath id={clipId}>
            <rect x={ext[0][0]} y={ext[0][1]} width={ext[1][0] - ext[0][0]} height={ext[1][1] - ext[0][1]} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`} opacity={base}>
          {all.map((f, i) => (
            <path key={i} d={path(f) || ''} fill={C.greyLight} stroke={C.board} strokeWidth={1.2 * u} strokeLinejoin="round" />
          ))}
          {entries.map((e, i) => {
            const o = ease(frame, appearAt(i), appearAt(i) + 10);
            const dd = path(e.f) || '';
            return (
              <g key={'d' + i}>
                <path d={dd} fill={C.paper} opacity={o} />
                <path d={dd} fill={fill} fillOpacity={op(binOf(e.value)) * o} stroke={C.board} strokeWidth={2 * u} strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
      </svg>
      {labelled.map((i) => {
        const e = entries[i];
        const c = mainCentroid(path, e.f);
        if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
        if (c[0] < ext[0][0] || c[0] > ext[1][0] || c[1] < ext[0][1] || c[1] > ext[1][1]) return null;
        const o = ease(frame, appearAt(i) + 6, appearAt(i) + 14);
        return (
          <div key={'l' + i} style={{position: 'absolute', left: c[0], top: c[1], transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * o})`, opacity: o, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 24 * u, color: C.paper, background: C.board, padding: `${2 * u}px ${8 * u}px`, whiteSpace: 'nowrap'}}>
            {fmt(e.value, v.unit)}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: legendX, top: legendY, opacity: legendO, fontFamily: FONT_MONO, fontSize: 24 * u, color: C.board}}>
        {d.legend ? <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 32 * u, marginBottom: 14 * u}}>{String(d.legend)}</div> : null}
        {Array.from({length: bins}, (_, b) => bins - 1 - b).map((b) => (
          <div key={b} style={{display: 'flex', alignItems: 'center', marginBottom: 10 * u}}>
            <div style={{width: 34 * u, height: 34 * u, background: C.paper, border: `2px solid ${C.board}`, boxSizing: 'border-box', position: 'relative', marginRight: 14 * u}}>
              <div style={{position: 'absolute', inset: 0, background: fill, opacity: op(b)}} />
            </div>
            {fmt(lo + ((hi - lo) * b) / bins, v.unit)} - {fmt(lo + ((hi - lo) * (b + 1)) / bins, v.unit)}
          </div>
        ))}
        <div style={{display: 'flex', alignItems: 'center', color: C.grey}}>
          <div style={{width: 34 * u, height: 34 * u, background: C.greyLight, border: `2px solid ${C.board}`, boxSizing: 'border-box', marginRight: 14 * u}} />
          no data
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ money-stacks */

/** money-stacks: data {items: [{label, value, colour?}]} (max 6): banknote piles grow to scale while the amounts count up. */
export const MoneyStacks: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const {left, top, W, H} = usePlot();
  const d = v.data || {};
  const items = ((d.items || v.series || []) as any[]).slice(0, 6).map((it: any, i: number) => ({
    label: String(it?.label ?? ''),
    value: Math.max(0, num(it?.value)),
    colour: colourAt(i, it?.colour),
  }));
  if (!items.length) return null;
  const n = items.length;
  const max = Math.max(1e-9, ...items.map((it) => it.value));
  const noteH = 16 * u;
  const maxNotes = Math.max(4, Math.floor((H * 0.78) / noteH));
  const slot = W / n;
  const noteW = Math.min(300 * u, slot * 0.66);
  const baseY = top + H;
  const D = Math.max(1, scene.durationFrames);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: left - 20 * u, top: baseY, width: W + 40 * u, height: STROKE * 2, background: C.board}} />
      {items.map((it, i) => {
        const count = Math.max(1, Math.round((it.value / max) * maxNotes));
        const a = 8 + i * 6;
        const p = ease(frame, a, a + Math.max(15, D * 0.5));
        const shown = Math.min(count, Math.ceil(count * p));
        const cx = left + slot * (i + 0.5);
        const stackTop = baseY - shown * noteH;
        const tc = textOn(it.colour);
        return (
          <React.Fragment key={i}>
            {Array.from({length: shown}, (_, j) => {
              const jitter = (((j * 37 + i * 11) % 7) - 3) * 2 * u;
              return (
                <div key={j} style={{position: 'absolute', left: cx - noteW / 2 + jitter, top: baseY - (j + 1) * noteH, width: noteW, height: noteH, background: it.colour, border: `${Math.max(1.5, STROKE * 0.6)}px solid ${C.board}`, boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  <div style={{width: noteH * 0.55, height: noteH * 0.55, borderRadius: '50%', border: `1.5px solid ${tc}`, boxSizing: 'border-box'}} />
                </div>
              );
            })}
            <div style={{position: 'absolute', left: cx - slot / 2, width: slot, top: stackTop - 70 * u, textAlign: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 44 * u, color: C.board, opacity: ease(frame, a, a + 6)}}>
              {fmt(it.value * p, v.unit)}
            </div>
            <div style={{position: 'absolute', left: cx - slot / 2, width: slot, top: baseY + 22 * u, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 36 * u, color: C.board}}>
              {it.label}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- what-could-buy */

const GLYPHS: Record<string, (f: string, l: string) => React.ReactNode> = {
  box: (f, l) => (
    <>
      <path d="M14 32 L26 16 L74 16 L86 32 Z" fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
      <rect x={14} y={32} width={72} height={54} fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
      <line x1={50} y1={32} x2={50} y2={86} stroke={l} strokeWidth={5} />
    </>
  ),
  house: (f, l) => (
    <>
      <rect x={22} y={46} width={56} height={40} fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
      <path d="M12 48 L50 14 L88 48 Z" fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
      <rect x={43} y={62} width={14} height={24} fill={C.paper} stroke={l} strokeWidth={4} />
    </>
  ),
  car: (f, l) => (
    <>
      <path d="M8 64 L18 46 L34 32 L66 32 L80 46 L92 52 L92 70 L8 70 Z" fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
      <path d="M38 38 L62 38 L72 48 L30 48 Z" fill={C.paper} stroke={l} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={28} cy={72} r={11} fill={l} />
      <circle cx={72} cy={72} r={11} fill={l} />
    </>
  ),
  person: (f, l) => (
    <>
      <circle cx={50} cy={24} r={14} fill={f} stroke={l} strokeWidth={6} />
      <path d="M24 90 L24 62 Q24 44 50 44 Q76 44 76 62 L76 90 Z" fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
    </>
  ),
  coin: (f, l) => (
    <>
      <circle cx={50} cy={50} r={38} fill={f} stroke={l} strokeWidth={6} />
      <circle cx={50} cy={50} r={25} fill="none" stroke={C.paper} strokeWidth={4} />
    </>
  ),
  bag: (f, l) => (
    <>
      <path d="M36 18 L64 18 L58 34 Q86 46 84 72 Q82 90 50 90 Q18 90 16 72 Q14 46 42 34 Z" fill={f} stroke={l} strokeWidth={6} strokeLinejoin="round" />
      <line x1={40} y1={34} x2={60} y2={34} stroke={l} strokeWidth={5} />
    </>
  ),
};

export const BUY_ICONS = Object.keys(GLYPHS);

/**
 * what-could-buy: data {amount, price, item: "cars", icon?: box | house | car | person | coin | bag, max? (icons, default 100),
 * colour?}. Headline "$1M = 40 cars" counts up; a grid of icons pops in (1 icon = N items when the count exceeds max).
 */
export const WhatCouldBuy: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const {left, top, W, H} = usePlot();
  const d = v.data || {};
  const amount = Math.max(0, num(d.amount));
  const price = Math.max(0, num(d.price));
  const count = price > 0 ? Math.floor(amount / price) : 0;
  const maxIcons = Math.max(1, Math.min(200, Math.round(num(d.max, 100))));
  const per = count > maxIcons ? Math.ceil(count / maxIcons) : 1;
  const icons = Math.ceil(count / per);
  const item = String(d.item ?? 'items');
  const glyph = GLYPHS[String(d.icon || 'box')] || GLYPHS.box;
  const fill = colourOf(d.colour, C.ink);
  const headH = 110 * u;
  const footH = 50 * u;
  const gTop = top + headH;
  const gH = Math.max(10, H - headH - footH);
  let cols = 1;
  let cell = 0;
  for (let c = 1; c <= Math.max(1, icons); c++) {
    const rows = Math.ceil(Math.max(1, icons) / c);
    const s = Math.min(W / c, gH / rows);
    if (s > cell) {
      cell = s;
      cols = c;
    }
  }
  cell = Math.min(cell, 180 * u);
  const rowsN = Math.ceil(Math.max(1, icons) / cols);
  const gx = left + (W - cols * cell) / 2;
  const gy = gTop + (gH - rowsN * cell) / 2;
  const D = Math.max(1, scene.durationFrames);
  const stagger = icons > 1 ? (D * 0.45) / icons : 0;
  const counted = Math.min(count, Math.round(count * ease(frame, 10, 10 + D * 0.5)));
  const sz = cell * 0.84;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left, top, width: W, height: headH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 * u, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 64 * u, color: C.board, opacity: ease(frame, 0, 10), whiteSpace: 'nowrap'}}>
        <span>{fmt(amount, v.unit)}</span>
        <span style={{color: C.grey}}>=</span>
        <span style={{color: fill}}>{counted.toLocaleString('en-US')}</span>
        <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 54 * u}}>{item}</span>
      </div>
      {Array.from({length: icons}, (_, k) => {
        const c = k % cols;
        const r = Math.floor(k / cols);
        const s = spring({frame: Math.max(0, frame - 10 - k * stagger), fps, config: {damping: 12}});
        if (s <= 0.001) return null;
        return (
          <svg key={k} width={sz} height={sz} viewBox="0 0 100 100" style={{position: 'absolute', left: gx + c * cell + (cell - sz) / 2, top: gy + r * cell + (cell - sz) / 2, transform: `scale(${s})`}}>
            {glyph(fill, C.board)}
          </svg>
        );
      })}
      <div style={{position: 'absolute', left, width: W, top: top + H - footH + 10 * u, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 26 * u, color: C.grey, opacity: ease(frame, 14, 24)}}>
        {price > 0 ? `at ${fmt(price, v.unit)} each` : 'price missing'}
        {per > 1 ? ` · 1 icon = ${per.toLocaleString('en-US')} ${item}` : ''}
      </div>
    </AbsoluteFill>
  );
};
