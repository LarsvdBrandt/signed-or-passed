import React from 'react';
import {random} from 'remotion';

/** Deterministic random number in [0, 1) for a seed and any keys. */
export const rnd = (seed: string, ...keys: (string | number)[]): number => random(`${seed}:${keys.join(':')}`);

/** Smooth deterministic 1D value noise in [-1, 1]; t in 'cells' (1 cell = one random key). */
export const smooth1D = (seed: string, t: number): number => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}:${i}`) * 2 - 1;
  const b = random(`${seed}:${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/** #RGB / #RRGGBB + alpha -> rgba(). */
export const rgba = (hex: string, a: number): string => {
  const h = (hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  const al = Math.max(0, Math.min(1, a)).toFixed(3);
  if (Number.isNaN(n)) return `rgba(0,0,0,${al})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${al})`;
};

export const safeId = (s: string): string => String(s).replace(/[^A-Za-z0-9_-]/g, '-');

export const NO_POINTER: React.CSSProperties = {pointerEvents: 'none'};

/** Full-size grey noise (alpha 1) from feTurbulence. */
export const NoiseRect: React.FC<{id: string; freq: string; octaves?: number; seed: number; type?: 'fractalNoise' | 'turbulence'}> = ({id, freq, octaves = 3, seed, type = 'fractalNoise'}) => (
  <svg width="100%" height="100%" style={{position: 'absolute', left: 0, top: 0}} aria-hidden>
    <defs>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type={type} baseFrequency={freq} numOctaves={octaves} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" />
      </filter>
    </defs>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

/** SVG filter that splits R and B and offsets them in opposite directions (chromatic aberration). */
export const ChromaDefs: React.FC<{id: string; dx: number; dy?: number}> = ({id, dx, dy = 0}) => (
  <svg width={0} height={0} style={{position: 'absolute', left: 0, top: 0}} aria-hidden>
    <defs>
      <filter id={id} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={dx} dy={dy} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-dx} dy={-dy} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="bo" mode="screen" />
      </filter>
    </defs>
  </svg>
);
