import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_MONO, colourOf} from '../constants';
import {rnd, smooth1D} from './util';
import type {EffectCtx, OverlayProps} from './types';

/*
 * Particle overlays (EFFECTS-3). Fully deterministic: every particle's position is a pure function of time and
 * its seeded random constants (no simulation state), so any frame renders identically in any order.
 * Common params: density (multiplier, default 1), speed (multiplier, default 1), colour / colours[].
 */

const num = (v: any, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const SVG_STYLE: React.CSSProperties = {position: 'absolute', left: 0, top: 0, pointerEvents: 'none'};
const loop01 = (x: number) => ((x % 1) + 1) % 1;
const TAU = Math.PI * 2;

const countOf = (fx: EffectCtx, base: number) =>
  Math.max(1, Math.min(400, Math.round(base * Math.max(0.2, Math.min(3, fx.intensity)) * Math.max(0.1, Math.min(4, num(fx.params.density, 1))))));

const colours = (fx: EffectCtx, d: string[]): string[] => {
  const raw = fx.params.colours ?? fx.params.colour;
  const list: any[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  const out = list.filter((x) => typeof x === 'string' && x).map((x: string) => colourOf(x, C.board));
  return out.length ? out : d;
};

const useField = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  return {t: frame / (fps || 30), W: width, H: height, s: Math.min(width, height) / 1080};
};

export const Confetti: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 70);
  const cols = colours(fx, [C.ink, C.stamp, C.board, C.greyLight]);
  const burst = fx.params.burst === true;
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const v = (0.16 + r('v') * 0.2) * sp;
    const yy = burst ? -0.12 - r('p') * 0.5 + t * v * 1.4 : -0.1 + loop01(t * v + r('p')) * 1.2;
    if (yy > 1.12 || yy < -0.2) continue;
    const x = r('x') * W + Math.sin(t * (1.5 + r('w') * 2) + r('ph') * TAU) * 40 * s;
    const rot = r('r') * 360 + t * (120 + r('rs') * 240) * (r('d') < 0.5 ? -1 : 1);
    const flip = Math.cos(t * (4 + r('f') * 6) + r('ph2') * TAU);
    const w = (12 + r('sz') * 12) * s;
    const h = w * 0.5;
    items.push(
      <rect key={i} x={-w / 2} y={-h / 2} width={w} height={h} fill={cols[Math.floor(r('c') * cols.length) % cols.length]} transform={`translate(${x.toFixed(1)} ${(yy * H).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(1 ${flip.toFixed(3)})`} />,
    );
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};

export const Dust: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 45);
  const c = colours(fx, [C.grey])[0];
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const x = loop01(r('x') + smooth1D(`${fx.seed}:dx:${i}`, t * 0.25) * 0.03 + t * 0.004 * (r('d') - 0.5)) * W;
    const y = loop01(r('y') - t * (0.01 + r('v') * 0.02) * sp + smooth1D(`${fx.seed}:dy:${i}`, t * 0.25) * 0.02) * H;
    const rad = (1.5 + r('sz') * 3.5) * s;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + r('tw') * 2) + r('ph') * TAU);
    items.push(<circle key={i} cx={x} cy={y} r={rad} fill={c} opacity={(0.2 + 0.5 * tw) * Math.min(1, fx.intensity)} />);
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};

export const Smoke: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 16);
  const c = colours(fx, [C.grey])[0];
  const ox = typeof fx.params.x === 'number' ? fx.params.x / 100 : null;
  const sp = Math.max(0.1, num(fx.params.speed, 1));
  const fid = `${fx.uid}-smoke`;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const L = (4 + r('L') * 3) / sp;
    const a = loop01(t / L + r('p'));
    const cycle = Math.floor(t / L + r('p'));
    const bx = ox == null ? rnd(fx.seed, i, cycle, 'x') : ox + (r('j') - 0.5) * 0.08;
    const x = (bx + Math.sin(a * 3 + r('ph') * TAU) * 0.04 + a * 0.05) * W;
    const y = H * (1.05 - a * 0.95);
    const rad = (70 + r('sz') * 90) * s * (0.4 + a * 1.4);
    const op = Math.sin(Math.PI * a) * 0.35 * Math.min(1.5, fx.intensity);
    items.push(<circle key={i} cx={x} cy={y} r={rad} fill={c} opacity={op} />);
  }
  return (
    <svg width={W} height={H} style={SVG_STYLE}>
      <defs>
        <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6 * s} />
        </filter>
      </defs>
      <g filter={`url(#${fid})`}>{items}</g>
    </svg>
  );
};

export const Rain: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 110);
  const c = colours(fx, [C.grey])[0];
  const slant = num(fx.params.slant, 0.2);
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const v = (1.4 + r('v') * 0.8) * sp;
    const y = (-0.1 + loop01(t * v + r('p')) * 1.2) * H;
    const x = (-0.1 + r('x') * 1.2) * W - slant * H * 0.5 + slant * y;
    const len = (30 + r('l') * 30) * s;
    items.push(<line key={i} x1={x} y1={y} x2={x - slant * len} y2={y - len} stroke={c} strokeWidth={2 * s} strokeLinecap="round" opacity={0.5 * Math.min(1.4, fx.intensity)} />);
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};

export const Snow: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 70);
  const fill = colours(fx, [C.paper])[0];
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const v = (0.05 + r('v') * 0.07) * sp;
    const y = (-0.05 + loop01(t * v + r('p')) * 1.1) * H;
    const x = loop01(r('x') + Math.sin(t * (0.6 + r('w')) + r('ph') * TAU) * 0.02) * W;
    const rad = (3 + r('sz') * 6) * s;
    items.push(<circle key={i} cx={x} cy={y} r={rad} fill={fill} stroke={C.board} strokeWidth={1.5 * s} />);
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};

const flamePath = (cx: number, base: number, w: number, h: number, sway: number) =>
  `M${(cx - w / 2).toFixed(1)} ${base.toFixed(1)} Q${(cx - w / 2).toFixed(1)} ${(base - h * 0.55).toFixed(1)} ${(cx + sway).toFixed(1)} ${(base - h).toFixed(1)} Q${(cx + w / 2).toFixed(1)} ${(base - h * 0.55).toFixed(1)} ${(cx + w / 2).toFixed(1)} ${base.toFixed(1)} Z`;

export const Embers: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 50);
  const c = colours(fx, [C.stamp])[0];
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const v = (0.12 + r('v') * 0.18) * sp;
    const a = loop01(t * v + r('p'));
    const y = H * (1.05 - a * 1.1);
    const x = (r('x') + Math.sin(t * 2 + r('ph') * TAU) * 0.015 + smooth1D(`${fx.seed}:e:${i}`, t * 0.5) * 0.03) * W;
    const rad = (2 + r('sz') * 3.5) * s;
    const flick = 0.55 + 0.45 * Math.sin(t * (10 + r('f') * 8) + r('ph2') * TAU);
    items.push(<circle key={i} cx={x} cy={y} r={rad} fill={c} opacity={flick * (1 - a * 0.8) * Math.min(1, fx.intensity)} />);
  }
  const flames: React.ReactNode[] = [];
  if (fx.params.fire === true) {
    const k = Math.max(4, Math.round(W / (140 * s)));
    for (let j = 0; j < k; j++) {
      const cx = ((j + 0.5) / k) * W;
      const w = (W / k) * 1.5;
      const h = (110 + 70 * smooth1D(`${fx.seed}:fl:${j}`, t * 3)) * s * Math.min(2, fx.intensity);
      const sway = smooth1D(`${fx.seed}:sw:${j}`, t * 2) * w * 0.15;
      flames.push(
        <g key={`f${j}`}>
          <path d={flamePath(cx, H + 4, w, h, sway)} fill={c} stroke={C.board} strokeWidth={3 * s} />
          <path d={flamePath(cx, H + 4, w * 0.5, h * 0.55, sway * 0.6)} fill={C.paper} />
        </g>,
      );
    }
  }
  return (
    <svg width={W} height={H} style={SVG_STYLE}>
      {items}
      {flames}
    </svg>
  );
};

export const Sparkles: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 22);
  const cols = colours(fx, [C.stamp, C.ink]);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const L = 1.1 + r('L') * 0.9;
    const tt = t + r('p') * L;
    const cycle = Math.floor(tt / L);
    const a = (tt - cycle * L) / L;
    const x = rnd(fx.seed, i, cycle, 'x') * W;
    const y = rnd(fx.seed, i, cycle, 'y') * H;
    const R = (14 + r('sz') * 22) * s * Math.sin(Math.PI * a);
    if (R < 0.5) continue;
    const k = R * 0.22;
    const d = `M0 ${-R} L${k} ${-k} L${R} 0 L${k} ${k} L0 ${R} L${-k} ${k} L${-R} 0 L${-k} ${-k} Z`;
    items.push(<path key={i} d={d} fill={cols[i % cols.length]} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 90).toFixed(1)})`} />);
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};

export const MoneyRain: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 26);
  const ink = colours(fx, [C.ink])[0];
  const sym = typeof fx.params.symbol === 'string' && fx.params.symbol ? fx.params.symbol.slice(0, 2) : '$';
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const v = (0.1 + r('v') * 0.1) * sp;
    const y = (-0.12 + loop01(t * v + r('p')) * 1.25) * H;
    const x = (r('x') + Math.sin(t * (1 + r('w')) + r('ph') * TAU) * 0.03) * W;
    const rot = Math.sin(t * (1.2 + r('rs')) + r('ph2') * TAU) * 28 + (r('r') - 0.5) * 40;
    const flip = 0.25 + 0.75 * Math.abs(Math.cos(t * (2 + r('f') * 3) + r('ph3') * TAU));
    const w = (92 + r('sz') * 30) * s;
    const h = w * 0.46;
    items.push(
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(1 ${flip.toFixed(3)})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={C.paper} stroke={ink} strokeWidth={3 * s} />
        <rect x={-w / 2 + 6 * s} y={-h / 2 + 6 * s} width={w - 12 * s} height={h - 12 * s} fill="none" stroke={ink} strokeWidth={1.5 * s} />
        <circle r={h * 0.28} fill="none" stroke={ink} strokeWidth={2 * s} />
        <text x={0} y={h * 0.13} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={h * 0.36} fill={ink}>
          {sym}
        </text>
      </g>,
    );
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};

export const PaperScraps: React.FC<OverlayProps> = ({fx}) => {
  const {t, W, H, s} = useField();
  const n = countOf(fx, 24);
  const wind = num(fx.params.wind, 0.18);
  const sp = num(fx.params.speed, 1);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => rnd(fx.seed, i, k);
    const v = (0.05 + r('v') * 0.06) * sp;
    const y = (-0.1 + loop01(t * v + r('p')) * 1.2) * H;
    const x = (-0.1 + loop01(r('x') + t * wind * (0.6 + r('ws') * 0.8) * sp) * 1.2) * W;
    const rot = r('r') * 360 + t * (40 + r('rs') * 80) * (r('d') < 0.5 ? -1 : 1);
    const size = (22 + r('sz') * 28) * s;
    const pts = new Array(6)
      .fill(0)
      .map((_, j) => {
        const a = (j / 6) * TAU + (rnd(fx.seed, i, j, 'a') - 0.5) * 0.6;
        const rr = size * (0.55 + rnd(fx.seed, i, j, 'rr') * 0.45);
        return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
      })
      .join(' ');
    items.push(
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
        <polygon points={pts} fill={r('c') < 0.7 ? C.paper : C.greyLight} stroke={C.board} strokeWidth={2 * s} />
        <line x1={-size * 0.35} y1={-size * 0.1} x2={size * 0.35} y2={-size * 0.1} stroke={C.grey} strokeWidth={1.5 * s} />
      </g>,
    );
  }
  return <svg width={W} height={H} style={SVG_STYLE}>{items}</svg>;
};
