import React from 'react';
import {AbsoluteFill, Easing, interpolate, random} from 'remotion';
import {C, FONT_HEAD, colourOf} from '../constants';
import {currentTheme} from '../themes';
import type {TCtx, TWrap} from './types';

/*
 * Transition components. Rules that keep rendering cheap and stable:
 * - the children slot is always at the same place in the tree (no remounts when a transition ends);
 * - conditional decorations come AFTER the children slot (or inside an always-present <svg>);
 * - at p >= 1 every In renders the incoming scene unchanged.
 */

const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const eOut = (p: number) => Easing.out(Easing.cubic)(c01(p));
const eInOut = (p: number) => Easing.inOut(Easing.cubic)(c01(p));
const done = (t: TCtx) => t.p >= 1;
const num = (v: any, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const col = (v: any, d: string) => (typeof v === 'string' && v ? colourOf(v, d) : d);

type Dir = 'left' | 'right' | 'up' | 'down';
const dirOf = (v: any, d: Dir): Dir => (v === 'left' || v === 'right' || v === 'up' || v === 'down' ? v : d);
/** unit vector of the side the incoming scene comes FROM */
const vec = (from: Dir): [number, number] => (from === 'right' ? [1, 0] : from === 'left' ? [-1, 0] : from === 'down' ? [0, 1] : [0, -1]);
const FULL: React.CSSProperties = {position: 'absolute', left: 0, top: 0, pointerEvents: 'none'};
const px = (n: number) => `${n.toFixed(2)}px`;

export const Identity: TWrap = ({children}) => <AbsoluteFill>{children}</AbsoluteFill>;

export const FadeIn: TWrap = ({t, children}) => <AbsoluteFill style={{opacity: done(t) ? 1 : eInOut(t.p)}}>{children}</AbsoluteFill>;

/** The house transition: a new paper sheet slides in over the previous one (from right by default). */
export const PaperSlideIn: TWrap = ({t, children}) => {
  const q = 1 - eOut(t.p);
  const [vx, vy] = vec(dirOf(t.params.from, 'right'));
  const moving = q > 0.0001;
  const shadow = currentTheme().sheetShadow;
  return (
    <AbsoluteFill
      style={{
        transform: moving ? `translate(${px(vx * q * t.width * 1.05)}, ${px(vy * q * t.height * 1.05)}) rotate(${((vx + vy) * q * 2.5).toFixed(3)}deg)` : undefined,
        transformOrigin: 'left bottom',
        boxShadow: moving ? `${-vx * 18}px ${-vy * 18}px 0 ${shadow}` : 'none',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const PushIn: TWrap = ({t, children}) => {
  const q = 1 - eInOut(t.p);
  const [vx, vy] = vec(dirOf(t.params.from, 'right'));
  return <AbsoluteFill style={{transform: q > 0.0001 ? `translate(${px(vx * q * t.width)}, ${px(vy * q * t.height)})` : undefined}}>{children}</AbsoluteFill>;
};

export const PushOut: TWrap = ({t, children}) => {
  const p = eInOut(t.p);
  const [vx, vy] = vec(dirOf(t.params.from, 'right'));
  return <AbsoluteFill style={{transform: p > 0.0001 ? `translate(${px(-vx * p * t.width)}, ${px(-vy * p * t.height)})` : undefined}}>{children}</AbsoluteFill>;
};

const blurAt = (p: number) => Math.sin(Math.PI * c01(p)) * 22;

const Streaks: React.FC<{t: TCtx; vertical: boolean}> = ({t, vertical}) => {
  const a = Math.sin(Math.PI * c01(t.p));
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.35 * a}}>
      {new Array(14).fill(0).map((_, i) => {
        const pos = random(`${t.seed}:s:${i}`) * 100;
        const len = 30 + random(`${t.seed}:l:${i}`) * 60;
        const off = random(`${t.seed}:o:${i}`) * (100 - len);
        const thick = 2 + random(`${t.seed}:t:${i}`) * 8;
        const style: React.CSSProperties = vertical
          ? {position: 'absolute', left: `${pos}%`, top: `${off}%`, width: thick, height: `${len}%`, background: C.board}
          : {position: 'absolute', top: `${pos}%`, left: `${off}%`, height: thick, width: `${len}%`, background: C.board};
        return <div key={i} style={style} />;
      })}
    </AbsoluteFill>
  );
};

export const WhipIn: TWrap = ({t, children}) => {
  const q = 1 - eInOut(t.p);
  const [vx, vy] = vec(dirOf(t.params.from, 'right'));
  const b = done(t) ? 0 : blurAt(t.p);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: q > 0.0001 ? `translate(${px(vx * q * t.width * 1.1)}, ${px(vy * q * t.height * 1.1)})` : undefined, filter: b > 0.5 ? `blur(${b.toFixed(1)}px)` : undefined}}>{children}</AbsoluteFill>
      {!done(t) ? <Streaks t={t} vertical={vy !== 0} /> : null}
    </AbsoluteFill>
  );
};

export const WhipOut: TWrap = ({t, children}) => {
  const p = eInOut(t.p);
  const [vx, vy] = vec(dirOf(t.params.from, 'right'));
  const b = t.p <= 0 ? 0 : blurAt(t.p);
  return (
    <AbsoluteFill style={{transform: p > 0.0001 ? `translate(${px(-vx * p * t.width * 1.1)}, ${px(-vy * p * t.height * 1.1)})` : undefined, filter: b > 0.5 ? `blur(${b.toFixed(1)}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

/** The new page swings in around its left edge like a turned page, with a passing shadow. */
export const PageCurlIn: TWrap = ({t, children}) => {
  const p = eOut(t.p);
  const turning = !done(t);
  return (
    <AbsoluteFill style={{perspective: `${Math.round(t.width * 1.4)}px`, perspectiveOrigin: 'left center'}}>
      <AbsoluteFill style={{transform: turning ? `rotateY(${(-(1 - p) * 100).toFixed(2)}deg)` : undefined, transformOrigin: 'left center', backfaceVisibility: 'hidden'}}>
        {children}
        {turning ? <AbsoluteFill style={{backgroundColor: C.board, opacity: (1 - p) * 0.45, pointerEvents: 'none'}} /> : null}
      </AbsoluteFill>
      {turning ? <div style={{...FULL, width: 24, height: '100%', background: C.board, opacity: 0.18 * (1 - p)}} /> : null}
    </AbsoluteFill>
  );
};

export const IrisIn: TWrap = ({t, children}) => {
  const p = eInOut(t.p);
  const fin = done(t);
  const cx = num(t.params.cx, 50);
  const cy = num(t.params.cy, 50);
  const ref = Math.hypot(t.width, t.height) / Math.SQRT2;
  const rPct = p * 150;
  const rPx = (rPct / 100) * ref;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: fin ? undefined : `circle(${rPct.toFixed(2)}% at ${cx}% ${cy}%)`}}>{children}</AbsoluteFill>
      {!fin ? (
        <svg width={t.width} height={t.height} style={FULL}>
          <circle cx={(cx / 100) * t.width} cy={(cy / 100) * t.height} r={Math.max(0.1, rPx)} fill="none" stroke={col(t.params.colour, C.board)} strokeWidth={8} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** Classic cartoon iris: a black circle closes on the old scene, then opens on the new one. */
export const IrisOutIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const w = t.width;
  const h = t.height;
  const cx = (num(t.params.cx, 50) / 100) * w;
  const cy = (num(t.params.cy, 50) / 100) * h;
  const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 4;
  const first = t.p < 0.5;
  const q = first ? 1 - eInOut(t.p * 2) : eInOut((t.p - 0.5) * 2);
  const r = Math.max(0.01, q * maxR);
  const d = `M0 0H${w}V${h}H0Z M${(cx - r).toFixed(2)} ${cy.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: first && !fin ? 0 : 1}}>{children}</AbsoluteFill>
      {!fin ? (
        <svg width={w} height={h} style={FULL}>
          <path d={d} fill={col(t.params.colour, C.board)} fillRule="evenodd" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** Wipe whose edge travels TOWARDS `to` (wipe-right: the new scene is revealed from left to right). */
const makeWipe = (to: Dir): TWrap => {
  const Wipe: TWrap = ({t, children}) => {
    const p = eInOut(t.p);
    const fin = done(t);
    const r = ((1 - p) * 100).toFixed(3);
    const inset = to === 'right' ? `inset(0 ${r}% 0 0)` : to === 'left' ? `inset(0 0 0 ${r}%)` : to === 'down' ? `inset(0 0 ${r}% 0)` : `inset(${r}% 0 0 0)`;
    const edge = t.params.edge !== false;
    const pos = p * 100;
    const bar: React.CSSProperties =
      to === 'right'
        ? {left: `calc(${pos.toFixed(2)}% - 6px)`, top: 0, width: 12, height: '100%'}
        : to === 'left'
          ? {left: `calc(${(100 - pos).toFixed(2)}% - 6px)`, top: 0, width: 12, height: '100%'}
          : to === 'down'
            ? {top: `calc(${pos.toFixed(2)}% - 6px)`, left: 0, height: 12, width: '100%'}
            : {top: `calc(${(100 - pos).toFixed(2)}% - 6px)`, left: 0, height: 12, width: '100%'};
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: fin ? undefined : inset}}>{children}</AbsoluteFill>
        {!fin && edge ? <div style={{position: 'absolute', background: col(t.params.colour, C.ink), ...bar}} /> : null}
      </AbsoluteFill>
    );
  };
  return Wipe;
};

export const WipeLeft = makeWipe('left');
export const WipeRight = makeWipe('right');
export const WipeUp = makeWipe('up');
export const WipeDown = makeWipe('down');

export const DiagonalWipe: TWrap = ({t, children}) => {
  const s = (eInOut(t.p) * 200).toFixed(2);
  const fin = done(t);
  return <AbsoluteFill style={{clipPath: fin ? undefined : `polygon(0% 0%, ${s}% 0%, 0% ${s}%)`}}>{children}</AbsoluteFill>;
};

export const ClockWipe: TWrap = ({t, children}) => {
  const fin = done(t);
  const total = eInOut(t.p) * 360;
  const pt = (a: number) => {
    const r = ((a - 90) * Math.PI) / 180;
    return `${(50 + 150 * Math.cos(r)).toFixed(2)}% ${(50 + 150 * Math.sin(r)).toFixed(2)}%`;
  };
  const pts: string[] = ['50% 50%'];
  for (let a = 0; a < total; a += 10) pts.push(pt(a));
  pts.push(pt(total));
  return <AbsoluteFill style={{clipPath: fin ? undefined : `polygon(${pts.join(', ')})`}}>{children}</AbsoluteFill>;
};

export const BarnDoor: TWrap = ({t, children}) => {
  const r = ((1 - eInOut(t.p)) * 50).toFixed(3);
  const fin = done(t);
  const v = t.params.vertical === true;
  return <AbsoluteFill style={{clipPath: fin ? undefined : v ? `inset(${r}% 0 ${r}% 0)` : `inset(0 ${r}% 0 ${r}%)`}}>{children}</AbsoluteFill>;
};

const blob = (seed: string, cx: number, cy: number, R: number, n = 56): Array<[number, number]> => {
  const a1 = random(`${seed}:a1`) * 6.283;
  const a2 = random(`${seed}:a2`) * 6.283;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.2 * Math.sin(3 * a + a1) + 0.1 * Math.sin(7 * a + a2) + 0.1 * (random(`${seed}:j:${i}`) - 0.5);
    out.push([cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k]);
  }
  return out;
};

/** The new scene is revealed through a growing ink blot with an ink rim and drops. */
export const InkSplashIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const p = eOut(t.p);
  const cx = (num(t.params.cx, 50) / 100) * t.width;
  const cy = (num(t.params.cy, 50) / 100) * t.height;
  const far = Math.hypot(Math.max(cx, t.width - cx), Math.max(cy, t.height - cy));
  const R = (p * far) / 0.6;
  const ink = col(t.params.colour, C.ink);
  const inner = blob(t.seed, cx, cy, R);
  const rim = blob(t.seed, cx, cy, R * 1.08 + 10);
  return (
    <AbsoluteFill>
      <svg width={t.width} height={t.height} style={FULL}>
        {!fin && R > 0 ? <polygon points={rim.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill={ink} /> : null}
        {!fin && R > 0
          ? new Array(9).fill(0).map((_, i) => {
              const a = random(`${t.seed}:da:${i}`) * Math.PI * 2;
              const dist = R * (1.15 + random(`${t.seed}:dd:${i}`) * 0.35) + 20;
              const rr = (6 + random(`${t.seed}:dr:${i}`) * 18) * Math.min(1, p * 2);
              return <circle key={i} cx={cx + Math.cos(a) * dist} cy={cy + Math.sin(a) * dist} r={Math.max(0.1, rr)} fill={ink} />;
            })
          : null}
      </svg>
      <AbsoluteFill style={{clipPath: fin ? undefined : `polygon(${inner.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A big stamp slams onto the old scene (scale 1.7 -> 1, -8 deg, shake); the cut happens under the impact. */
export const StampCutIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const impact = 0.45;
  const fall = interpolate(t.p, [0, impact], [1.7, 1], {...CL, easing: Easing.in(Easing.quad)});
  const op = interpolate(t.p, [0, 0.08, 0.62, 0.9], [0, 1, 1, 0], CL);
  const showIn = fin || t.p >= 0.5;
  const shaking = !fin && t.p > impact && t.p < 0.75;
  const sh = shaking ? (random(`${t.seed}:sh:${t.frame}`) - 0.5) * 26 * (1 - (t.p - impact) / 0.3) : 0;
  const ink = col(t.params.colour, C.stamp);
  const text = typeof t.params.text === 'string' ? t.params.text : '';
  const size = Math.min(t.width, t.height) * 0.8;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: showIn ? 1 : 0, transform: shaking ? `translate(${sh.toFixed(1)}px, ${(-sh * 0.6).toFixed(1)}px)` : undefined}}>{children}</AbsoluteFill>
      {!fin && op > 0 ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: op, pointerEvents: 'none'}}>
          <div
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: ink,
              transform: `scale(${fall.toFixed(3)}) rotate(-8deg)`,
              boxShadow: `inset 0 0 0 ${Math.round(size * 0.04)}px ${ink}, inset 0 0 0 ${Math.round(size * 0.055)}px ${C.paper}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.paper,
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: Math.round(size * 0.15),
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {text}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Flat film burn: orange holes with a hot paper core grow from the edges, flash, and recede on the new scene. */
export const FilmBurnIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const g = t.p < 0.5 ? eInOut(t.p * 2) : 1 - eInOut((t.p - 0.5) * 2);
  const showIn = fin || t.p >= 0.5;
  const hyp = Math.hypot(t.width, t.height);
  const flash = interpolate(t.p, [0.3, 0.5, 0.7], [0, 1, 0], CL);
  const spots: Array<[number, number, number]> = [
    [0.02, 0.2, 1],
    [0.98, 0.8, 0.85],
    [0.3, 1.02, 0.7],
    [0.75, -0.02, 0.6],
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: showIn ? 1 : 0}}>{children}</AbsoluteFill>
      {!fin ? (
        <svg width={t.width} height={t.height} style={FULL}>
          {spots.map(([x, y, k], i) => {
            const wob = 1 + 0.08 * Math.sin(t.frame * 0.9 + i * 2);
            const r = Math.max(0.1, g * hyp * 0.55 * k * wob);
            return (
              <g key={i}>
                <circle cx={x * t.width} cy={y * t.height} r={r} fill={C.stamp} />
                <circle cx={x * t.width} cy={y * t.height} r={Math.max(0.1, r * 0.62)} fill={C.paper} />
              </g>
            );
          })}
          <rect width={t.width} height={t.height} fill={C.paper} opacity={flash} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** Digital cut: the new scene arrives in random horizontal bands with jitter and colour bars. */
export const GlitchCutIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const bucket = Math.floor(t.frame / 2);
  const cov = c01((t.p - 0.15) / 0.6);
  let clip: string | undefined;
  let opacity = 1;
  let dx = 0;
  if (!fin && t.p < 0.15) opacity = 0;
  else if (!fin && cov < 1) {
    const bands = 9;
    const pts: string[] = [];
    for (let i = 0; i < bands; i++) {
      if (random(`${t.seed}:g:${bucket}:${i}`) > cov) continue;
      const y1 = (i / bands) * 100 + random(`${t.seed}:y:${bucket}:${i}`) * 3;
      const y2 = ((i + 1) / bands) * 100;
      pts.push(`0% ${y1.toFixed(2)}%`, `100% ${y1.toFixed(2)}%`, `100% ${y2.toFixed(2)}%`, `0% ${y2.toFixed(2)}%`);
    }
    if (pts.length) clip = `polygon(${pts.join(', ')})`;
    else opacity = 0;
    dx = (random(`${t.seed}:dx:${bucket}`) - 0.5) * 60 * (1 - cov);
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: clip, opacity, transform: dx ? `translateX(${dx.toFixed(1)}px)` : undefined}}>{children}</AbsoluteFill>
      {!fin && t.p < 0.85 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                top: `${(random(`${t.seed}:b:${bucket}:${i}`) * 95).toFixed(2)}%`,
                height: `${(1 + random(`${t.seed}:h:${bucket}:${i}`) * 4).toFixed(2)}%`,
                background: i === 1 ? C.stamp : C.ink,
                opacity: 0.55,
                mixBlendMode: 'multiply',
              }}
            />
          ))}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const ZoomIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const s = 0.6 + 0.4 * eOut(t.p);
  const op = interpolate(t.p, [0, 0.55], [0, 1], CL);
  return <AbsoluteFill style={{transform: fin ? undefined : `scale(${s.toFixed(4)})`, opacity: fin ? 1 : op}}>{children}</AbsoluteFill>;
};

export const ZoomOut: TWrap = ({t, children}) => {
  const p = eInOut(t.p);
  return <AbsoluteFill style={{transform: p > 0.0001 ? `scale(${(1 + 1.2 * p).toFixed(4)})` : undefined, opacity: p > 0.0001 ? 1 - 0.6 * p : 1}}>{children}</AbsoluteFill>;
};

export const FlashIn: TWrap = ({t, children}) => {
  const fin = done(t);
  const a = interpolate(t.p, [0, 0.5, 1], [0, 1, 0], CL);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: fin || t.p >= 0.5 ? 1 : 0}}>{children}</AbsoluteFill>
      {!fin ? <AbsoluteFill style={{backgroundColor: col(t.params.colour, C.paper), opacity: a, pointerEvents: 'none'}} /> : null}
    </AbsoluteFill>
  );
};
