import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, FONT_SIGN, STROKE, colourOf} from '../constants';
import {Kicker, SourceLine, clamp, formatNumber, usePortrait, useUnit, withUnit} from '../components/common';
import {ILLUSTRATIONS} from '../illustrations';
import {pointAt} from '../illustrations/kit';
import type {SceneProps} from '../types';

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rng = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const num = (x: any, d: number): number => (typeof x === 'number' && isFinite(x) ? x : d);
const fmt = (value: number, target: number, unit?: string) => withUnit(formatNumber(Number.isInteger(target) ? Math.round(value) : value), unit);

/** Renders a library illustration fitted into a square of `size` px. */
const Prop: React.FC<{name?: string; props?: any; size: number}> = ({name, props, size}) => {
  const e = name ? ILLUSTRATIONS[name] : undefined;
  if (!e || e.w >= 1920) return null;
  const s = size / Math.max(e.w, e.h);
  const Comp = e.C;
  return (
    <div style={{width: e.w * s, height: e.h * s, position: 'relative', flexShrink: 0}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: e.w, height: e.h, transform: `scale(${s})`, transformOrigin: 'top left'}}>
        <Comp {...(props || {})} />
      </div>
    </div>
  );
};

type Side = {label?: string; value?: number; unit?: string; colour?: string; component?: string; props?: any};

/** VERSUS: split screen, both sides slide in, VS badge pops, scores count up, the loser dims. */
export const VersusScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const sides: Side[] = [v.left || {}, v.right || {}];
  const D = Math.max(1, scene.durationFrames);
  const slide = spring({frame, fps, config: {damping: 16, stiffness: 110}});
  const vs = spring({frame: Math.max(0, frame - 10), fps, config: {damping: 8, stiffness: 160}});
  const countEnd = Math.max(14, Math.min(D * 0.6, 2.4 * fps));
  const p = interpolate(frame, [12, countEnd], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const lv = sides[0].value;
  const rv = sides[1].value;
  const winner = typeof lv === 'number' && typeof rv === 'number' && p >= 1 ? (lv > rv ? 0 : rv > lv ? 1 : -1) : -1;
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      {sides.map((s, i) => {
        const bg = colourOf(s.colour, i ? C.stamp : C.ink);
        const off = (1 - slide) * (i ? 1 : -1) * (portrait ? H : W) * 0.5;
        const box: React.CSSProperties = portrait
          ? {left: 0, right: 0, top: i ? '50%' : 0, height: '50%', transform: `translateY(${off}px)`}
          : {top: 0, bottom: 0, left: i ? '50%' : 0, width: '50%', transform: `translateX(${off}px)`};
        const target = typeof s.value === 'number' ? s.value : null;
        return (
          <div
            key={i}
            style={{position: 'absolute', ...box, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 * u, opacity: winner >= 0 && winner !== i ? 0.5 : 1, boxSizing: 'border-box', border: `${STROKE}px solid ${C.board}`}}
          >
            {s.component ? <Prop name={s.component} props={s.props} size={(portrait ? 300 : 280) * u} /> : null}
            <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 70 * u, color: C.paper, textAlign: 'center', padding: `0 ${40 * u}px`, lineHeight: 1.05}}>{s.label || ''}</div>
            {target !== null ? <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 92 * u, color: C.paper}}>{fmt(target * p, target, s.unit ?? v.unit)}</div> : null}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 180 * u, height: 180 * u, marginLeft: -90 * u, marginTop: -90 * u, borderRadius: '50%', background: C.board, border: `${6 * u}px solid ${C.paper}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${vs})`, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 76 * u, color: C.paper, boxSizing: 'border-box'}}>
        VS
      </div>
      <Kicker text={scene.onScreenText} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} dark />
    </AbsoluteFill>
  );
};

/** GROWTH: shop pins multiply across a stylised land mass while a counter runs from -> to. */
export const GrowthScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const D = Math.max(1, scene.durationFrames);
  const from = num(v.from, 1);
  const to = num(v.to, 100);
  const pinsN = Math.max(2, Math.min(140, Math.round(Math.abs(to))));
  const minPins = Math.max(1, Math.min(pinsN, Math.round((pinsN * Math.abs(from)) / Math.max(1, Math.abs(to)))));
  const cx = W * (portrait ? 0.5 : 0.4);
  const cy = H * (portrait ? 0.58 : 0.56);
  const R = Math.min(W * (portrait ? 0.4 : 0.3), H * 0.34);
  const sx = portrait ? 1 : 1.3;
  const sy = portrait ? 1.2 : 0.85;
  const shape = (th: number) => R * (1 + 0.12 * Math.sin(3 * th + 1) + 0.08 * Math.sin(5 * th + 2) + 0.05 * Math.sin(7 * th + 0.5));
  let land = '';
  for (let k = 0; k <= 90; k++) {
    const th = (k / 90) * Math.PI * 2;
    const r = shape(th);
    land += `${k ? 'L' : 'M'}${(cx + r * Math.cos(th) * sx).toFixed(1)} ${(cy + r * Math.sin(th) * sy).toFixed(1)} `;
  }
  land += 'Z';
  const rand = rng(hash(scene.id + 'growth'));
  const pts: Array<{x: number; y: number; d: number}> = [];
  for (let i = 0; i < pinsN; i++) {
    const th = rand() * Math.PI * 2;
    const f = Math.sqrt(rand()) * 0.85;
    pts.push({x: cx + shape(th) * f * Math.cos(th) * sx, y: cy + shape(th) * f * Math.sin(th) * sy, d: 0});
  }
  const o = pts[0];
  pts.forEach((q) => (q.d = Math.hypot(q.x - o.x, q.y - o.y)));
  pts.sort((a, b) => a.d - b.d);
  const p = interpolate(frame, [0.5 * fps, Math.max(0.5 * fps + 1, D - 1 * fps)], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const pK = minPins + (pinsN - minPins) * p;
  const value = from + (to - from) * p;
  const ps = 24 * u;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <path d={land} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        {pts.map((q, i) => {
          const s = Math.max(0, Math.min(1, pK - i));
          if (s <= 0) return null;
          return (
            <g key={i} transform={`translate(${q.x} ${q.y}) scale(${s})`}>
              <rect x={-ps / 2} y={-ps * 0.55} width={ps} height={ps * 0.75} fill={C.paper} stroke={C.board} strokeWidth={2} />
              <polygon points={`${-ps * 0.62},${-ps * 0.5} ${ps * 0.62},${-ps * 0.5} ${ps * 0.5},${-ps * 0.85} ${-ps * 0.5},${-ps * 0.85}`} fill={i === 0 ? C.ink : C.stamp} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', right: portrait ? undefined : 90 * u, left: portrait ? 0 : undefined, width: portrait ? '100%' : undefined, top: portrait ? 260 * u : '34%', textAlign: portrait ? 'center' : 'right'}}>
        <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 120 * u, color: C.board, lineHeight: 1}}>{fmt(value, to, v.unit)}</div>
        {v.label ? <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52 * u, color: C.stamp, marginTop: 12 * u}}>{v.label}</div> : null}
      </div>
      <Kicker text={scene.onScreenText} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$%.,-:/';

/** SPLIT-FLAP: departure-board characters spin and settle on dates or amounts. visual: {rows[], accentRow?} */
export const SplitFlapScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const rows: string[] = (Array.isArray(v.rows) && v.rows.length ? v.rows : [v.text || 'SIGNED OR PASSED']).slice(0, 5).map((s: any) => String(s).toUpperCase().slice(0, 18));
  const maxLen = Math.max(4, ...rows.map((r) => r.length));
  const cellW = Math.min(100 * u, (W * 0.86) / maxLen - 8 * u);
  const cellH = cellW * 1.45;
  const rand = rng(hash(scene.id + 'flap'));
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: C.board, padding: 28 * u, border: `${6 * u}px solid ${C.board}`, boxShadow: `${14 * u}px ${14 * u}px 0 ${C.greyLight}`, display: 'flex', flexDirection: 'column', gap: 14 * u}}>
        {rows.map((row, r) => (
          <div key={r} style={{display: 'flex', gap: 8 * u}}>
            {row
              .padEnd(maxLen, ' ')
              .split('')
              .map((ch, c) => {
                const start = Math.round(r * 0.18 * fps);
                const settle = Math.round((0.35 + c * 0.05 + r * 0.18 + rand() * 0.35) * fps);
                let shown = ' ';
                if (frame >= settle) shown = ch;
                else if (frame >= start) shown = CHARS[(Math.floor(frame / 2) + r * 7 + c * 13) % CHARS.length];
                const flipping = frame >= start && frame < settle;
                const accent = typeof v.accentRow === 'number' && v.accentRow === r && frame >= settle;
                return (
                  <div key={c} style={{position: 'relative', width: cellW, height: cellH, background: '#1f1f1f', border: `${2 * u}px solid ${C.grey}`, borderRadius: 6 * u, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box'}}>
                    <span style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: cellH * 0.66, color: accent ? C.stamp : C.paper, transform: flipping && frame % 2 ? 'scaleY(0.82)' : 'none'}}>{shown}</span>
                    <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 2 * u, background: C.board}} />
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      <Kicker text={scene.onScreenText} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

/** DOCUMENT: a contract writes itself line by line, then it is signed (ink) or stamped PASSED (orange). */
export const DocumentScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const D = Math.max(1, scene.durationFrames);
  const verdict: string = v.verdict || ctx.verdict || 'PASSED';
  const lines: string[] = (Array.isArray(v.lines) && v.lines.length ? v.lines : ['The parties agree to the terms', 'set out in this document.', 'Price, date and conditions', 'as discussed.']).slice(0, 7).map(String);
  const writeStart = 0.4 * fps;
  const writeEnd = Math.min(D * 0.55, writeStart + lines.length * 0.7 * fps);
  const per = (writeEnd - writeStart) / lines.length;
  const actionAt = Math.max(writeEnd + 0.3 * fps, Math.min(D - 1.4 * fps, writeEnd + 0.8 * fps));
  const impact = actionAt + 6;
  const shake = frame >= impact && frame < impact + 8 && verdict === 'PASSED' ? Math.sin(frame * 9) * 10 * u * (1 - (frame - impact) / 8) : 0;
  const pw = portrait ? W * 0.84 : Math.min(W * 0.48, 920 * u);
  const ph = H * (portrait ? 0.66 : 0.84);
  const enter = spring({frame, fps, config: {damping: 15, stiffness: 120}});
  const sp = interpolate(frame, [actionAt, impact], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const reveal = interpolate(frame, [actionAt, actionAt + 0.9 * fps], [100, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.greyLight, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: pw, height: ph, background: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `${14 * u}px ${14 * u}px 0 ${C.board}`, padding: 56 * u, boxSizing: 'border-box', transform: `translate(${shake}px, ${(1 - enter) * 300 * u}px)`}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 60 * u, color: C.board}}>{v.title || 'AGREEMENT'}</div>
        <div style={{height: 4 * u, background: C.board, margin: `${18 * u}px 0 ${30 * u}px`}} />
        {lines.map((l, i) => {
          const n = Math.floor(interpolate(frame, [writeStart + i * per, writeStart + (i + 1) * per], [0, l.length], clamp));
          return (
            <div key={i} style={{fontFamily: FONT_MONO, fontSize: 30 * u, lineHeight: 1.6, color: C.board, whiteSpace: 'pre'}}>
              {l.slice(0, n)}
              {n > 0 && n < l.length ? <span style={{color: C.ink}}>|</span> : null}
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 56 * u, right: 56 * u, bottom: 70 * u}}>
          <div style={{height: 120 * u, position: 'relative'}}>
            {verdict === 'SIGNED' ? (
              <div style={{position: 'absolute', left: 0, bottom: 0, fontFamily: FONT_SIGN, fontSize: 130 * u, color: C.ink, lineHeight: 1, whiteSpace: 'nowrap', clipPath: `inset(-20% ${reveal}% -20% 0)`}}>{v.signature || 'Signed'}</div>
            ) : null}
          </div>
          <div style={{height: 3 * u, background: C.board}} />
          <div style={{fontFamily: FONT_MONO, fontSize: 22 * u, color: C.grey, marginTop: 8 * u}}>{v.party ? `Signature · ${v.party}` : 'Signature'}</div>
        </div>
        {verdict === 'PASSED' && sp > 0 ? (
          <div style={{position: 'absolute', left: '50%', top: '58%', transform: `translate(-50%, -50%) rotate(-8deg) scale(${1.6 - 0.6 * sp})`, opacity: Math.min(1, sp * 2), border: `${10 * u}px solid ${C.stamp}`, padding: `${8 * u}px ${30 * u}px`, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 120 * u, letterSpacing: 6 * u, color: C.stamp, mixBlendMode: 'multiply'}}>
            PASSED
          </div>
        ) : null}
      </div>
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

const WALL_L = [
  [22, 34],
  [50, 26],
  [78, 34],
  [30, 72],
  [62, 70],
  [86, 74],
  [10, 66],
  [50, 50],
];
const WALL_P = [
  [28, 22],
  [72, 26],
  [30, 46],
  [70, 50],
  [30, 72],
  [72, 76],
  [50, 36],
  [50, 62],
];

/** PHOTO WALL: evidence cards pinned to a wall one by one, connected with red string. visual: {cards[{label, component?, props?}], links?} */
export const PhotoWallScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const cards: any[] = (Array.isArray(v.cards) ? v.cards : []).slice(0, 8);
  const pos = portrait ? WALL_P : WALL_L;
  const links: Array<[number, number]> = Array.isArray(v.links) && v.links.length ? v.links : cards.slice(1).map((_, i) => [i, i + 1] as [number, number]);
  const cw = 300 * u;
  const ch = 330 * u;
  const rand = rng(hash(scene.id + 'wall'));
  const items = cards.map((c, i) => ({c, x: (pos[i][0] / 100) * W, y: (pos[i][1] / 100) * H, rot: (rand() - 0.5) * 10, at: Math.round((0.3 + i * 0.45) * fps)}));
  return (
    <AbsoluteFill style={{backgroundColor: C.greyLight}}>
      {items.map((it, i) => {
        const d = spring({frame: Math.max(0, frame - it.at), fps, config: {damping: 10, stiffness: 140, mass: 0.6}});
        if (frame < it.at) return null;
        return (
          <div key={i} style={{position: 'absolute', left: it.x - cw / 2, top: it.y - ch / 2, width: cw, height: ch, background: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `${8 * u}px ${8 * u}px 0 ${C.grey}`, transform: `translateY(${(1 - d) * -200 * u}px) rotate(${it.rot}deg)`, opacity: Math.min(1, d * 2), padding: 16 * u, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 * u}}>
            <div style={{flex: 1, background: it.c.dark ? C.board : C.greyLight, border: `2px solid ${C.board}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
              {it.c.component ? <Prop name={it.c.component} props={it.c.props} size={200 * u} /> : <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 90 * u, color: C.board}}>{String(it.c.label || '?').slice(0, 1)}</span>}
            </div>
            <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 24 * u, color: C.board, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden'}}>{it.c.label || ''}</div>
          </div>
        );
      })}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {links.map(([a, b], k) => {
          const A = items[a];
          const B = items[b];
          if (!A || !B) return null;
          const start = Math.max(A.at, B.at) + 0.3 * fps;
          const p = interpolate(frame, [start, start + 0.5 * fps], [0, 1], clamp);
          if (p <= 0) return null;
          const ax = A.x;
          const ay = A.y - ch / 2 + 22 * u;
          const bx = B.x;
          const by = B.y - ch / 2 + 22 * u;
          const mx = ax + (bx - ax) * p;
          const my = ay + (by - ay) * p + Math.sin(p * Math.PI) * 30 * u;
          return <path key={k} d={`M${ax} ${ay} Q${(ax + mx) / 2} ${(ay + my) / 2 + 30 * u * p} ${mx} ${my}`} stroke={C.stamp} strokeWidth={5 * u} fill="none" strokeLinecap="round" />;
        })}
        {items.map((it, i) => (frame >= it.at + 4 ? <circle key={i} cx={it.x} cy={it.y - ch / 2 + 22 * u} r={11 * u} fill={C.stamp} stroke={C.board} strokeWidth={STROKE} /> : null))}
      </svg>
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

/** COUNTER (style money): a number runs from -> to while banknotes pile up. */
export const MoneyCounterScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const D = Math.max(1, scene.durationFrames);
  const from = num(v.from, 0);
  const to = num(v.to, 100);
  const t0 = 0.3 * fps;
  const t1 = Math.max(t0 + 1, Math.min(D * 0.7, 3 * fps));
  const p = interpolate(frame, [t0, t1], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const value = from + (to - from) * p;
  const N = 22;
  const rand = rng(hash(scene.id + 'bills'));
  const bw = 320 * u;
  const bh = 130 * u;
  const baseX = portrait ? W * 0.5 : W * 0.72;
  const baseY = portrait ? H * 0.86 : H * 0.84;
  const sym = v.unit && ['$', '€', '£', '¥'].includes(v.unit) ? v.unit : '$';
  const bills: React.ReactNode[] = [];
  for (let k = 0; k < N; k++) {
    const jx = (rand() - 0.5) * 30 * u;
    const jr = (rand() - 0.5) * 6;
    const at = t0 + (k / N) * (t1 - t0);
    if (frame < at) continue;
    const d = spring({frame: Math.max(0, frame - at), fps, config: {damping: 12, stiffness: 180, mass: 0.5}});
    const y = baseY - bh - k * bh * 0.22;
    bills.push(
      <div key={k} style={{position: 'absolute', left: baseX - bw / 2 + jx, top: y - (1 - d) * 260 * u, width: bw, height: bh, background: C.paper, border: `${STROKE}px solid ${C.board}`, transform: `rotate(${jr}deg)`, boxSizing: 'border-box', padding: 10 * u}}>
        <div style={{width: '100%', height: '100%', border: `${3 * u}px solid ${C.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 70 * u, height: 70 * u, borderRadius: '50%', background: C.ink, color: C.paper, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 40 * u, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{sym}</div>
        </div>
      </div>,
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {bills}
      <div style={{position: 'absolute', left: portrait ? 0 : 90 * u, width: portrait ? '100%' : '55%', top: portrait ? '22%' : '36%', textAlign: portrait ? 'center' : 'left'}}>
        <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: (portrait ? 130 : 150) * u, color: C.board, lineHeight: 1}}>{fmt(value, to, v.unit)}</div>
        {v.label ? <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52 * u, color: C.stamp, marginTop: 16 * u}}>{v.label}</div> : null}
      </div>
      <Kicker text={scene.onScreenText} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

/** CHART (type line): the line draws itself, a dot with a live value label rides the tip. */
export const LineChartScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const D = Math.max(1, scene.durationFrames);
  const series: Array<{label: string; value: number}> = (Array.isArray(v.series) ? v.series : []).map((s: any) => ({label: String(s.label ?? ''), value: num(s.value, 0)}));
  if (series.length < 2) series.push({label: '', value: series[0] ? series[0].value : 0});
  const n = series.length;
  const vals = series.map((s) => s.value);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(...vals) * 1.12 || 1;
  const x0 = W * (portrait ? 0.12 : 0.1);
  const x1 = W * (portrait ? 0.9 : 0.86);
  const y0 = H * (portrait ? 0.3 : 0.24);
  const y1 = H * (portrait ? 0.7 : 0.78);
  const pts: Array<[number, number]> = series.map((s, i) => [x0 + ((x1 - x0) * i) / (n - 1), y1 - ((s.value - lo) / (hi - lo || 1)) * (y1 - y0)]);
  const t0 = 0.4 * fps;
  const t1 = Math.max(t0 + 1, Math.min(D * 0.75, t0 + n * 0.6 * fps + fps));
  const p = interpolate(frame, [t0, t1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const head = pointAt(pts, p);
  const fi = p * (n - 1);
  const i0 = Math.min(n - 2, Math.floor(fi));
  const live = vals[i0] + (vals[i0 + 1] - vals[i0]) * (fi - i0);
  const col = vals[n - 1] < vals[0] ? C.stamp : C.ink;
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  const target = vals[Math.min(n - 1, Math.round(fi))];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {[0, 1, 2, 3].map((k) => {
          const y = y0 + ((y1 - y0) * k) / 4;
          return <line key={k} x1={x0} y1={y} x2={x1} y2={y} stroke={C.greyLight} strokeWidth={2} />;
        })}
        <line x1={x0} y1={y1} x2={x1} y2={y1} stroke={C.board} strokeWidth={STROKE} />
        <path d={d} fill="none" stroke={col} strokeWidth={10 * u} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
        {pts.map((q, i) => (p * (n - 1) >= i - 0.001 ? <circle key={i} cx={q[0]} cy={q[1]} r={9 * u} fill={C.paper} stroke={col} strokeWidth={4 * u} /> : null))}
        <circle cx={head.x} cy={head.y} r={16 * u} fill={col} stroke={C.board} strokeWidth={STROKE} />
      </svg>
      {series.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: pts[i][0] - 120 * u, width: 240 * u, top: y1 + 18 * u, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 26 * u, color: C.board, opacity: p * (n - 1) >= i - 0.001 ? 1 : 0}}>
          {s.label}
        </div>
      ))}
      <div style={{position: 'absolute', left: head.x - 150 * u, width: 300 * u, top: head.y - 100 * u, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: C.board, color: C.paper, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 36 * u, padding: `${6 * u}px ${14 * u}px`}}>{fmt(live, target, v.unit)}</span>
      </div>
      <Kicker text={scene.onScreenText} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};
