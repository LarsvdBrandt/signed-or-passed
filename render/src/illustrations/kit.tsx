import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, STROKE} from '../constants';

/** Shared helpers for the illustration library (house style: flat, 3px Board outlines, brand colours only). */

export const useT = (): number => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return Math.max(0, f) / fps;
};

export const c01 = (x: number): number => Math.max(0, Math.min(1, x));
export const easeOut = (x: number): number => 1 - Math.pow(1 - c01(x), 3);
export const easeInOut = (x: number): number => {
  const v = c01(x);
  return v * v * (3 - 2 * v);
};
export const frac = (x: number): number => ((x % 1) + 1) % 1;

/** Squeeze long labels into a fixed width instead of overflowing. */
export const fitText = (label: string | undefined, maxChars: number, width: number): Record<string, any> =>
  (label || '').length > maxChars ? {textLength: width, lengthAdjust: 'spacingAndGlyphs'} : {};

export const Smoke: React.FC<{x: number; y: number; t: number; n?: number; dx?: number; rise?: number; size?: number; fill?: string; speed?: number}> = ({
  x,
  y,
  t,
  n = 4,
  dx = 30,
  rise = 120,
  size = 18,
  fill = C.paper,
  speed = 0.6,
}) => {
  const puffs: React.ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    const ph = frac(t * speed + j / n);
    puffs.push(<circle key={j} cx={x + ph * dx} cy={y - ph * rise} r={size * (0.5 + ph)} fill={fill} stroke={C.grey} strokeWidth={2} opacity={(1 - ph) * 0.9} />);
  }
  return <g>{puffs}</g>;
};

export const Wheel: React.FC<{x: number; y: number; r: number; t: number; speed?: number; fill?: string}> = ({x, y, r, t, speed = 360, fill = C.board}) => (
  <g transform={`translate(${x} ${y}) rotate(${(t * speed) % 360})`}>
    <circle r={r} fill={fill} stroke={C.board} strokeWidth={STROKE} />
    <circle r={r * 0.45} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
    <line x1={-r * 0.45} y1={0} x2={r * 0.45} y2={0} stroke={C.board} strokeWidth={STROKE} />
    <line x1={0} y1={-r * 0.45} x2={0} y2={r * 0.45} stroke={C.board} strokeWidth={STROKE} />
  </g>
);

export const wavePath = (w: number, y: number, amp: number, len: number, phase: number, bottom: number): string => {
  let d = `M0 ${bottom} L0 ${(y + amp * Math.sin(phase)).toFixed(1)}`;
  for (let x = 10; x <= w; x += 10) d += ` L${x} ${(y + amp * Math.sin((x / len) * Math.PI * 2 + phase)).toFixed(1)}`;
  return d + ` L${w} ${bottom} Z`;
};

export const Waves: React.FC<{w: number; y: number; t: number; h: number}> = ({w, y, t, h}) => (
  <g>
    <path d={wavePath(w, y, 8, 120, t * 2.2, h)} fill={C.ink} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
    <path d={wavePath(w, y + 22, 7, 90, -t * 2.8 + 1, h)} fill={C.ink} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
  </g>
);

/** Point and direction at fraction p (0..1) along a polyline. */
export const pointAt = (pts: Array<[number, number]>, p: number): {x: number; y: number; a: number} => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let target = c01(p) * total;
  for (let i = 1; i < pts.length; i++) {
    const l = seg[i - 1];
    if (target <= l || i === pts.length - 1) {
      const k = l > 0 ? Math.min(1, target / l) : 0;
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k;
      const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k;
      const a = (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) / Math.PI;
      return {x, y, a};
    }
    target -= l;
  }
  return {x: pts[0][0], y: pts[0][1], a: 0};
};
