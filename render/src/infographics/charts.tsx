import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {clamp, useUnit} from '../components/common';
import {colourAt, ease, fmt, niceMax, num, textOn, usePlot, type InfoProps} from './shared';

type Pt = {label: string; value: number};

const pointsOf = (d: any, v: any): Pt[] =>
  ((d.points || d.series || v.series || []) as any[]).map((p: any) => ({label: String(p?.label ?? ''), value: num(p?.value)}));

/** Horizontal grid lines with value labels (IBM Plex Mono). */
const Grid: React.FC<{lo: number; hi: number; left: number; top: number; W: number; H: number; unit?: string}> = ({lo, hi, left, top, W, H, unit}) => {
  const u = useUnit();
  return (
    <g>
      {[0, 1, 2, 3, 4].map((g) => {
        const val = lo + ((hi - lo) * g) / 4;
        const y = top + H - (g / 4) * H;
        return (
          <g key={g}>
            <line x1={left} y1={y} x2={left + W} y2={y} stroke={g === 0 ? C.board : C.greyLight} strokeWidth={g === 0 ? STROKE : 2} />
            <text x={left - 16 * u} y={y + 9 * u} textAnchor="end" fontFamily={FONT_MONO} fontSize={24 * u} fill={C.grey}>
              {fmt(val, unit)}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/**
 * bar-race: data {periods: ["2000", ...], series: [{label, values: [...], colour?}], top?: 8}.
 * Bars grow, re-sort smoothly as the period advances; the period runs big in the corner.
 */
export const BarRace: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = useUnit();
  const d = v.data || {};
  const periods: string[] = ((d.periods || []) as unknown[]).map((p) => String(p));
  const series: Array<{label: string; values: unknown[]; colour?: string}> = ((d.series || []) as any[]).slice(0, 16);
  if (!series.length) return null;
  const P = Math.max(1, periods.length, ...series.map((s) => (s.values || []).length));
  const top = Math.max(1, Math.min(Math.round(num(d.top, 8)), series.length));
  const t = interpolate(frame, [12, Math.max(13, scene.durationFrames * 0.85)], [0, P - 1], clamp);
  const i0 = Math.floor(t);
  const i1 = Math.min(P - 1, i0 + 1);
  const f = t - i0;
  const valAt = (k: number, i: number): number => num((series[k].values || [])[i]);
  const rankAt = (i: number): number[] => {
    const order = series.map((_, k) => k).sort((a, b) => valAt(b, i) - valAt(a, i));
    const r: number[] = new Array(series.length).fill(0);
    order.forEach((k, pos) => {
      r[k] = pos;
    });
    return r;
  };
  const r0 = rankAt(i0);
  const r1 = rankAt(i1);
  const ef = Easing.inOut(Easing.cubic)(Math.min(1, f * 1.6));
  const rows = series.map((s, k) => ({
    k,
    label: String(s.label ?? ''),
    colour: colourAt(k, s.colour),
    value: valAt(k, i0) + (valAt(k, i1) - valAt(k, i0)) * f,
    rank: r0[k] + (r1[k] - r0[k]) * ef,
  }));
  const max = Math.max(1e-9, ...rows.map((r) => r.value));
  const portrait = height > width;
  const left = width * (portrait ? 0.05 : 0.07);
  const labelW = width * (portrait ? 0.3 : 0.2);
  const barX = left + labelW;
  const barMax = width * 0.92 - barX - 170 * u;
  const topY = height * 0.2;
  const areaH = height * (portrait ? 0.56 : 0.62);
  const rowH = areaH / top;
  const bh = rowH * 0.72;
  const grow = ease(frame, 0, 16);
  const fs = Math.min(40 * u, bh * 0.5);
  const period = periods[Math.min(periods.length - 1, Math.round(t))] ?? '';
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', right: 130 * u, bottom: 110 * u, fontFamily: FONT_MONO, fontWeight: 700, fontSize: (portrait ? 130 : 160) * u, color: C.greyLight, lineHeight: 1}}>{period}</div>
      {rows.map((r) => {
        const o = interpolate(r.rank, [top - 1, top - 0.2], [1, 0], clamp);
        if (o <= 0) return null;
        const y = topY + r.rank * rowH;
        const bw = Math.max(2, (r.value / max) * barMax * grow);
        return (
          <React.Fragment key={r.k}>
            <div style={{position: 'absolute', left, top: y, width: labelW - 22 * u, height: bh, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fs, color: C.board, whiteSpace: 'nowrap', overflow: 'hidden', opacity: o}}>
              {r.label}
            </div>
            <div style={{position: 'absolute', left: barX, top: y, width: bw, height: bh, background: r.colour, border: `${STROKE}px solid ${C.board}`, boxSizing: 'border-box', opacity: o}} />
            <div style={{position: 'absolute', left: barX + bw + 16 * u, top: y, height: bh, display: 'flex', alignItems: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: fs * 0.9, color: C.board, whiteSpace: 'nowrap', opacity: o * grow}}>
              {fmt(r.value, v.unit)}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * line-annotated: data {points: [{label, value}], annotations?: [{at: index | label, text}]}.
 * The line draws itself with a value at its head; callouts pop in when the line reaches them.
 */
export const LineAnnotated: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const {width, height, left, top, W, H} = usePlot();
  const d = v.data || {};
  const pts = pointsOf(d, v);
  if (!pts.length) return null;
  const n = pts.length;
  const vals = pts.map((p) => p.value);
  const mn = Math.min(...vals);
  const lo = mn < 0 ? -niceMax(-mn) : 0;
  const hi = Math.max(lo + 1e-9, niceMax(Math.max(...vals)));
  const X = (i: number) => left + (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const Y = (val: number) => top + H - ((val - lo) / Math.max(1e-9, hi - lo)) * H;
  const xy: Array<[number, number]> = pts.map((p, i) => [X(i), Y(p.value)]);
  const endF = Math.max(20, scene.durationFrames * 0.7);
  const p = ease(frame, 8, endF);
  const pos = p * (n - 1);
  const k = Math.min(n - 1, Math.floor(pos));
  const f = pos - k;
  const vis: Array<[number, number]> = xy.slice(0, k + 1);
  if (k + 1 < n) vis.push([xy[k][0] + (xy[k + 1][0] - xy[k][0]) * f, xy[k][1] + (xy[k + 1][1] - xy[k][1]) * f]);
  const head = vis[vis.length - 1];
  const headVal = k + 1 < n ? pts[k].value + (pts[k + 1].value - pts[k].value) * f : pts[n - 1].value;
  const path = vis.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ');
  const step = Math.max(1, Math.ceil(n / 10));
  const anns = ((d.annotations || []) as any[]).slice(0, 6);
  const idxOf = (at: unknown): number => (typeof at === 'number' ? Math.round(at) : pts.findIndex((q) => q.label === String(at)));
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <Grid lo={lo} hi={hi} left={left} top={top} W={W} H={H} unit={v.unit} />
        {pts.map((q, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={i} x={X(i)} y={top + H + 44 * u} textAnchor="middle" fontFamily={FONT_MONO} fontSize={26 * u} fill={C.grey}>
              {q.label}
            </text>
          ) : null,
        )}
        <path d={path} fill="none" stroke={C.ink} strokeWidth={8 * u} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={head[0]} cy={head[1]} r={13 * u} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
        <text x={head[0]} y={head[1] - 28 * u} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={32 * u} fill={C.ink}>
          {fmt(headVal, v.unit)}
        </text>
        {anns.map((a, j) => {
          const i = idxOf(a?.at);
          if (i < 0 || i >= n || pos < i - 1e-6) return null;
          const appear = 8 + (n === 1 ? 0 : (i / (n - 1)) * (endF - 8));
          const s = spring({frame: Math.max(0, frame - appear), fps, config: {damping: 13}});
          const [x, y] = xy[i];
          const up = y - 190 * u > top * 0.75;
          const y2 = up ? y - 18 * u - 92 * u * s : y + 18 * u + 92 * u * s;
          return (
            <g key={j}>
              <line x1={x} y1={up ? y - 16 * u : y + 16 * u} x2={x} y2={y2} stroke={C.board} strokeWidth={STROKE} />
              <circle cx={x} cy={y} r={15 * u * s} fill={C.stamp} stroke={C.board} strokeWidth={STROKE} />
            </g>
          );
        })}
      </svg>
      {anns.map((a, j) => {
        const i = idxOf(a?.at);
        if (i < 0 || i >= n || pos < i - 1e-6) return null;
        const appear = 8 + (n === 1 ? 0 : (i / (n - 1)) * (endF - 8));
        const s = spring({frame: Math.max(0, frame - appear), fps, config: {damping: 13}});
        const [x, y] = xy[i];
        const up = y - 190 * u > top * 0.75;
        const bw = 420 * u;
        const bx = Math.max(30 * u, Math.min(width - bw - 30 * u, x - bw / 2));
        return (
          <div key={j} style={{position: 'absolute', left: bx, width: bw, top: up ? y - 110 * u : y + 110 * u, transform: `translateY(${up ? -100 : 0}%) scale(${0.6 + 0.4 * s})`, opacity: s, display: 'flex', justifyContent: 'center'}}>
            <div style={{background: C.board, color: C.paper, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 30 * u, lineHeight: 1.15, padding: `${10 * u}px ${18 * u}px`, textAlign: 'center'}}>{String(a?.text ?? '')}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

/** Pie slice (r0 = 0) or ring segment between angles a0 and a1 (radians, clockwise). */
export const arcPath = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string => {
  const span = Math.max(0, Math.min(a1 - a0, Math.PI * 2 - 1e-4));
  const b = a0 + span;
  const large = span > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, b);
  if (r0 <= 0) return `M${cx} ${cy} L${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} Z`;
  const [x2, y2] = polar(cx, cy, r0, b);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
};

/** pie / donut: data {slices: [{label, value, colour?}], highlight?: index, centerText?, centerLabel?, showValues?}. */
const PieDonut: React.FC<InfoProps & {donut: boolean}> = ({v, scene, donut}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = useUnit();
  const portrait = height > width;
  const d = v.data || {};
  const slices = ((d.slices || v.series || []) as any[]).slice(0, 8).map((s: any, i: number) => ({label: String(s?.label ?? ''), value: Math.max(0, num(s?.value)), colour: colourAt(i, s?.colour)}));
  if (!slices.length) return null;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const cx = portrait ? width / 2 : width * 0.34;
  const cy = portrait ? height * 0.4 : height * 0.54;
  const R = portrait ? width * 0.34 : height * 0.3;
  const r0 = donut ? R * 0.58 : 0;
  const sweepEndF = Math.max(20, scene.durationFrames * 0.45);
  const p = ease(frame, 6, sweepEndF);
  const hl = d.highlight === undefined || d.highlight === null ? -1 : Math.round(num(d.highlight, -1));
  const pop = ease(frame, sweepEndF, sweepEndF + 12);
  const sweep = -Math.PI / 2 + p * Math.PI * 2;
  let acc = 0;
  const segs = slices.map((s) => {
    const a0 = -Math.PI / 2 + (acc / total) * Math.PI * 2;
    acc += s.value;
    const a1 = -Math.PI / 2 + (acc / total) * Math.PI * 2;
    return {...s, a0, a1, share: s.value / total};
  });
  const rowH = 74 * u;
  const lx = portrait ? width * 0.14 : width * 0.62;
  const ly = portrait ? cy + R + 60 * u : cy - (segs.length * rowH) / 2;
  const centre = d.centerText !== undefined ? String(d.centerText) : fmt(total * p, v.unit);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {segs.map((s, i) => {
          if (sweep <= s.a0 || s.a1 <= s.a0) return null;
          const b = Math.min(s.a1, sweep);
          const mid = (s.a0 + s.a1) / 2;
          const off = i === hl ? 24 * u * pop : 0;
          const lr = donut ? (r0 + R) / 2 : R * 0.64;
          const [tx, ty] = polar(cx, cy, lr, mid);
          const full = b >= s.a1 - 1e-6;
          return (
            <g key={i} transform={`translate(${Math.cos(mid) * off} ${Math.sin(mid) * off})`}>
              <path d={arcPath(cx, cy, r0, R, s.a0, b)} fill={s.colour} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
              {full && s.share >= 0.06 ? (
                <text x={tx} y={ty + 11 * u} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={32 * u} fill={textOn(s.colour)} opacity={pop}>
                  {Math.round(s.share * 100)}%
                </text>
              ) : null}
            </g>
          );
        })}
        {donut ? (
          <>
            <text x={cx} y={cy + (d.centerLabel ? 0 : 20 * u)} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={Math.min(64 * u, (r0 * 1.6) / Math.max(3, centre.length * 0.62))} fill={C.board}>
              {centre}
            </text>
            {d.centerLabel ? (
              <text x={cx} y={cy + 46 * u} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={28 * u} fill={C.grey}>
                {String(d.centerLabel)}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>
      {segs.map((s, i) => {
        const o = interpolate(frame, [10 + i * 5, 20 + i * 5], [0, 1], clamp);
        return (
          <div key={i} style={{position: 'absolute', left: lx, top: ly + i * rowH, height: rowH * 0.8, display: 'flex', alignItems: 'center', opacity: o, transform: `translateX(${(1 - o) * 30 * u}px)`}}>
            <div style={{width: 34 * u, height: 34 * u, background: s.colour, border: `${STROKE}px solid ${C.board}`, boxSizing: 'border-box', marginRight: 20 * u}} />
            <div style={{fontFamily: FONT_HEAD, fontWeight: i === hl ? 800 : 700, fontSize: 38 * u, color: C.board, marginRight: 18 * u, whiteSpace: 'nowrap'}}>{s.label}</div>
            <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 32 * u, color: C.grey, whiteSpace: 'nowrap'}}>
              {d.showValues ? `${fmt(s.value, v.unit)} · ` : ''}
              {Math.round(s.share * 100)}%
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const PieChart: React.FC<InfoProps> = (p) => <PieDonut {...p} donut={false} />;
export const DonutChart: React.FC<InfoProps> = (p) => <PieDonut {...p} donut />;

/** stacked-area: data {labels: [x labels], series: [{label, values: [...], colour?}]}; revealed left to right. */
export const StackedArea: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const {width, height, left, top, W, H} = usePlot();
  const d = v.data || {};
  const labels: string[] = ((d.labels || []) as unknown[]).map((x) => String(x));
  const series = ((d.series || []) as any[]).slice(0, 6).map((s: any, k: number) => ({label: String(s?.label ?? ''), values: (s?.values || []) as unknown[], colour: colourAt(k, s?.colour)}));
  if (!series.length) return null;
  const n = Math.max(1, labels.length, ...series.map((s) => s.values.length));
  const cum: number[][] = [];
  series.forEach((s, k) => {
    cum.push(Array.from({length: n}, (_, i) => Math.max(0, num(s.values[i])) + (k ? cum[k - 1][i] : 0)));
  });
  const hi = niceMax(Math.max(1e-9, ...cum[cum.length - 1]));
  const X = (i: number) => left + (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const Y = (val: number) => top + H - (val / hi) * H;
  const p = ease(frame, 8, Math.max(20, scene.durationFrames * 0.65));
  const clipId = `sa-clip-${scene.id}`;
  const step = Math.max(1, Math.ceil(n / 10));
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <defs>
          <clipPath id={clipId}>
            <rect x={left - 10} y={0} width={(W + 20) * p} height={height} />
          </clipPath>
        </defs>
        <Grid lo={0} hi={hi} left={left} top={top} W={W} H={H} unit={v.unit} />
        <g clipPath={`url(#${clipId})`}>
          {series.map((s, k) => {
            const upper = cum[k].map((val, i) => `${X(i)},${Y(val)}`);
            const lower = cum[k].map((_, i) => `${X(i)},${Y(k ? cum[k - 1][i] : 0)}`).reverse();
            return <polygon key={k} points={[...upper, ...lower].join(' ')} fill={s.colour} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />;
          })}
        </g>
        {Array.from({length: n}, (_, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={i} x={X(i)} y={top + H + 44 * u} textAnchor="middle" fontFamily={FONT_MONO} fontSize={26 * u} fill={C.grey}>
              {labels[i] ?? ''}
            </text>
          ) : null,
        )}
      </svg>
      <div style={{position: 'absolute', left, top: top - 70 * u, display: 'flex', flexWrap: 'wrap', gap: 28 * u, opacity: ease(frame, 4, 16)}}>
        {series.map((s, k) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 30 * u, color: C.board}}>
            <div style={{width: 26 * u, height: 26 * u, background: s.colour, border: `${STROKE}px solid ${C.board}`, boxSizing: 'border-box', marginRight: 10 * u}} />
            {s.label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** ranking: data {items: [{label, value?, note?}], order?: 'top-down' | 'countdown'} (max 10); #1 in ink. */
export const RankingList: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = useUnit();
  const d = v.data || {};
  const items = ((d.items || v.series || []) as any[]).slice(0, 10).map((it: any) => ({
    label: String(it?.label ?? ''),
    value: it?.value === undefined || it?.value === null ? null : num(it.value),
    note: it?.note ? String(it.note) : '',
  }));
  if (!items.length) return null;
  const n = items.length;
  const countdown = d.order === 'countdown';
  const areaTop = height * 0.2;
  const areaH = height * (height > width ? 0.6 : 0.66);
  const rowH = Math.min(120 * u, areaH / n);
  const stagger = Math.max(4, Math.min(24, (scene.durationFrames * 0.6) / n));
  const maxVal = Math.max(1e-9, ...items.map((it) => it.value ?? 0));
  const box = rowH * 0.82;
  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        const at = 8 + (countdown ? n - 1 - i : i) * stagger;
        const s = spring({frame: Math.max(0, frame - at), fps, config: {damping: 14}});
        const o = interpolate(frame, [at, at + 6], [0, 1], clamp);
        const first = i === 0;
        return (
          <div key={i} style={{position: 'absolute', left: width * 0.09, width: width * 0.82, top: areaTop + i * rowH, height: box, display: 'flex', alignItems: 'center', opacity: o, transform: `translateX(${(1 - s) * -70 * u}px)`}}>
            <div style={{width: box, height: box, flexShrink: 0, background: first ? C.ink : C.board, color: C.paper, fontFamily: FONT_MONO, fontWeight: 700, fontSize: box * 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
            <div style={{flex: 1, minWidth: 0, marginLeft: 24 * u, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: Math.min(48 * u, box * 0.48), lineHeight: 1.05, color: C.board, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                {it.label}
                {it.note ? <span style={{fontFamily: FONT_MONO, fontWeight: 400, fontSize: Math.min(26 * u, box * 0.28), color: C.grey, marginLeft: 14 * u}}>{it.note}</span> : null}
              </div>
              {it.value !== null ? <div style={{marginTop: 8 * u, height: 9 * u, width: `${(it.value / maxVal) * 100 * s}%`, background: first ? C.ink : C.greyLight}} /> : null}
            </div>
            {it.value !== null ? <div style={{marginLeft: 24 * u, fontFamily: FONT_MONO, fontWeight: 700, fontSize: Math.min(44 * u, box * 0.42), color: first ? C.ink : C.board, whiteSpace: 'nowrap'}}>{fmt(it.value, v.unit)}</div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

type Slot = {kind: 'digit'; place: number} | {kind: 'sep'; ch: string; place: number};

/** ticker: data {from, to, decimals?: 0-3, label?}: odometer digits roll from 'from' to 'to'. */
export const NumberTicker: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const d = v.data || {};
  const from = num(d.from);
  const to = num(d.to);
  const dec = Math.max(0, Math.min(3, Math.round(num(d.decimals, 0))));
  const p = interpolate(frame, [6, Math.max(7, scene.durationFrames * 0.7)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const value = from + (to - from) * p;
  const scale = Math.pow(10, dec);
  const V = Math.round(Math.abs(value) * scale * 1000) / 1000;
  const maxInt = Math.floor(Math.max(Math.abs(from), Math.abs(to)));
  const intDigits = Math.max(1, String(maxInt).length);
  const unit = v.unit ? String(v.unit) : '';
  const prefix = ['$', '€', '£', '¥'].includes(unit) ? unit : '';
  const suffix = prefix ? '' : unit === '%' ? '%' : unit ? ' ' + unit : '';
  const slots: Slot[] = [];
  for (let i = intDigits - 1; i >= 0; i--) {
    slots.push({kind: 'digit', place: i + dec});
    if (i > 0 && i % 3 === 0) slots.push({kind: 'sep', ch: ',', place: i + dec});
  }
  if (dec > 0) {
    slots.push({kind: 'sep', ch: '.', place: dec});
    for (let j = dec - 1; j >= 0; j--) slots.push({kind: 'digit', place: j});
  }
  const neg = value < 0 ? '−' : '';
  const chars = slots.length + prefix.length + suffix.length + neg.length;
  const S = Math.min(220 * u, (width * 0.84) / (0.62 * Math.max(4, chars)));
  const cellH = S * 1.15;
  const cellW = S * 0.62;
  const lead = (place: number) => place >= dec + 1 && Math.pow(10, place) > V + 1e-9;
  const digitAt = (place: number): number => {
    const pw = Math.pow(10, place);
    const whole = Math.floor(V / pw);
    const base = whole % 10;
    const roll = place === 0 ? V - Math.floor(V) : Math.max(0, Math.min(1, V - whole * pw - (pw - 1)));
    return base + roll;
  };
  const done = p >= 0.999;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: S, color: C.board, borderBottom: `${10 * u}px solid ${done ? C.ink : C.greyLight}`, paddingBottom: 8 * u}}>
        {neg || prefix ? <div style={{height: cellH, lineHeight: `${cellH}px`}}>{neg + prefix}</div> : null}
        {slots.map((s, i) => {
          if (s.kind === 'sep') {
            return (
              <div key={i} style={{height: cellH, lineHeight: `${cellH}px`, width: cellW * 0.6, textAlign: 'center', color: s.ch === ',' && lead(s.place) ? C.greyLight : C.board}}>
                {s.ch}
              </div>
            );
          }
          const dg = digitAt(s.place);
          return (
            <div key={i} style={{height: cellH, width: cellW, overflow: 'hidden', position: 'relative', color: lead(s.place) ? C.greyLight : C.board}}>
              <div style={{transform: `translateY(${-dg * cellH}px)`}}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((x, j) => (
                  <div key={j} style={{height: cellH, lineHeight: `${cellH}px`, textAlign: 'center'}}>
                    {x}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {suffix ? <div style={{height: cellH, lineHeight: `${cellH}px`, fontSize: S * 0.7}}>{suffix}</div> : null}
      </div>
      {d.label ? <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 52 * u, color: C.board, marginTop: 36 * u, textAlign: 'center', maxWidth: '80%'}}>{String(d.label)}</div> : null}
    </AbsoluteFill>
  );
};

/** percent-ring: data {rings: [{label, value 0-100, colour?}]} (max 4) or {value, label}. */
export const PercentRing: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = useUnit();
  const portrait = height > width;
  const d = v.data || {};
  const raw: any[] = d.rings || (d.value !== undefined ? [{label: d.label, value: d.value, colour: d.colour}] : []);
  const rings = raw.slice(0, 4).map((r: any, i: number) => ({label: String(r?.label ?? ''), value: Math.max(0, Math.min(100, num(r?.value))), colour: colourAt(i, r?.colour)}));
  if (!rings.length) return null;
  const n = rings.length;
  const R = portrait ? Math.min(width * 0.26, (height * 0.62) / (n * 2.5)) : Math.min(height * 0.24, (width * 0.8) / (n * 2.6));
  const sw = R * 0.22;
  const circ = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {rings.map((r, i) => {
          const cx = portrait ? width / 2 : width * 0.1 + (i + 0.5) * ((width * 0.8) / n);
          const cy = portrait ? height * 0.2 + (i + 0.5) * ((height * 0.62) / n) - 30 * u : height * 0.5;
          const p = ease(frame, 8 + i * 8, 8 + i * 8 + Math.max(15, scene.durationFrames * 0.5));
          const shown = r.value * p;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.greyLight} strokeWidth={sw} />
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={r.colour} strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={circ * (1 - shown / 100)} transform={`rotate(-90 ${cx} ${cy})`} />
              <circle cx={cx} cy={cy} r={R + sw / 2} fill="none" stroke={C.board} strokeWidth={STROKE} />
              <circle cx={cx} cy={cy} r={R - sw / 2} fill="none" stroke={C.board} strokeWidth={STROKE} />
              <text x={cx} y={cy + R * 0.17} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={R * 0.48} fill={C.board}>
                {Math.round(shown)}%
              </text>
              {r.label ? (
                <text x={cx} y={cy + R + sw / 2 + 52 * u} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={Math.min(38 * u, R * 0.3)} fill={C.board}>
                  {r.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
