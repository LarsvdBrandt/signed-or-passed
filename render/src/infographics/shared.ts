import {Easing, interpolate, useVideoConfig} from 'remotion';
import {C, colourOf} from '../constants';
import {clamp, formatNumber, withUnit} from '../components/common';
import type {Scene, VideoProps} from '../types';

/** Props every infographic receives: the scene visual (v), the scene and the video context. */
export type InfoProps = {v: any; scene: Scene; ctx: VideoProps};

/** Theme palette in series order (read at render time so themes apply). */
export const palette = (): string[] => [C.ink, C.stamp, C.board, C.grey, C.greyLight];

/** Series colour: explicit colour (brand name or hex) or the palette in order. */
export const colourAt = (i: number, c?: string): string => {
  const p = palette();
  const def = p[((i % p.length) + p.length) % p.length];
  return c ? colourOf(String(c), def) : def;
};

/** Readable text colour on a fill. */
export const textOn = (fill: string): string => (fill === C.greyLight || fill === C.paper ? C.board : C.paper);

/** 0..1 eased progress between frames a and b. */
export const ease = (frame: number, a: number, b: number): number =>
  interpolate(frame, [a, Math.max(a + 1, b)], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

export const num = (x: unknown, d = 0): number => {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
};

export const fmt = (n: number, unit?: string, decimals?: number): string =>
  withUnit(
    decimals === undefined ? formatNumber(n) : n.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}),
    unit,
  );

/** Round a maximum up to 1 / 2 / 2.5 / 5 / 10 x 10^k for clean axes. */
export const niceMax = (m: number): number => {
  if (!(m > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  const r = m / p;
  const s = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
  return s * p;
};

/** Plot area that leaves room for the kicker (top-left) and the Source line (bottom-right). */
export const usePlot = () => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const left = width * (portrait ? 0.16 : 0.12);
  const right = width * (portrait ? 0.92 : 0.9);
  const top = height * (portrait ? 0.22 : 0.24);
  const bottom = height * (portrait ? 0.7 : 0.78);
  return {width, height, portrait, left, top, W: right - left, H: bottom - top};
};
