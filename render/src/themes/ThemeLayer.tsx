import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../constants';
import {currentTheme} from './index';
import type {Theme} from './types';

/** SVG filters that themes reference from CSS (contentFilter: 'url(#theme-rough)'). Render once per frame. */
export const ThemeDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute', left: 0, top: 0}} aria-hidden>
    <defs>
      <filter id="theme-rough" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={3} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={4} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

/** Style for the wrapper around a scene's content (theme filter). */
export const themeContentStyle = (t: Theme = currentTheme()): React.CSSProperties => (t.contentFilter ? {filter: t.contentFilter} : {});

const Noise: React.FC<{id: string; freq: string; opacity: number; blend: string}> = ({id, freq, opacity, blend}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: blend as any, opacity}}>
    <svg width="100%" height="100%">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  </AbsoluteFill>
);

const Pattern: React.FC<{id: string; opacity: number; blend?: string; children: React.ReactNode; w: number; h: number; rotate?: number}> = ({id, opacity, blend, children, w, h, rotate = 0}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: (blend || 'normal') as any, opacity}}>
    <svg width="100%" height="100%">
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse" patternTransform={rotate ? `rotate(${rotate})` : undefined}>
          {children}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  </AbsoluteFill>
);

/** Texture + vignette of the current theme, drawn over everything (replaces the plain PaperGrain). */
export const ThemeOverlay: React.FC = () => {
  const t = currentTheme();
  const o = t.textureOpacity;
  const blend = t.dark ? 'screen' : 'multiply';
  let layer: React.ReactNode = null;
  switch (t.texture) {
    case 'grain':
      // identical to the original PaperGrain for the house style
      layer = <Noise id="sop-grain" freq="0.85" opacity={o} blend={blend} />;
      break;
    case 'paper-fibre':
      layer = (
        <>
          <Noise id="theme-fibre" freq="0.32" opacity={o} blend={blend} />
          <Noise id="sop-grain" freq="0.85" opacity={o * 0.5} blend={blend} />
        </>
      );
      break;
    case 'chalk-dust':
      layer = <Noise id="theme-chalk" freq="0.6" opacity={o} blend="screen" />;
      break;
    case 'hatching':
      layer = (
        <>
          <Pattern id="theme-hatch" opacity={o} blend="multiply" w={7} h={7} rotate={35}>
            <line x1={0} y1={0} x2={0} y2={7} stroke={C.board} strokeWidth={1.3} />
          </Pattern>
          <Noise id="sop-grain" freq="0.85" opacity={0.08} blend="multiply" />
        </>
      );
      break;
    case 'halftone':
      layer = (
        <Pattern id="theme-halftone" opacity={o} blend="multiply" w={10} h={10} rotate={20}>
          <circle cx={5} cy={5} r={2.1} fill={C.board} />
        </Pattern>
      );
      break;
    case 'scanlines':
      layer = (
        <Pattern id="theme-scan" opacity={o} w={8} h={4}>
          <rect x={0} y={0} width={8} height={1.6} fill="#000000" />
        </Pattern>
      );
      break;
    case 'grid':
      layer = (
        <>
          <Pattern id="theme-grid-minor" opacity={o} w={40} h={40}>
            <path d="M40 0 L0 0 L0 40" fill="none" stroke={C.board} strokeWidth={0.8} />
          </Pattern>
          <Pattern id="theme-grid-major" opacity={o * 1.6} w={200} h={200}>
            <path d="M200 0 L0 0 L0 200" fill="none" stroke={C.board} strokeWidth={1.6} />
          </Pattern>
        </>
      );
      break;
    default:
      layer = null;
  }
  const v = t.vignette || 0;
  return (
    <>
      {layer}
      {v > 0 ? <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,${v.toFixed(2)}) 100%)`}} /> : null}
    </>
  );
};
