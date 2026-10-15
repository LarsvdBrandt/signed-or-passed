import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Parallax rig: multi-layer depth with a camera move. Layers have a depth 0 (far) .. 1 (near); near layers move
 * more. Used by IllustrationScene (motion 'parallax*') and available as <ParallaxRig> for templates.
 */
export const PARALLAX_MOVES = ['parallax', 'parallax-right', 'parallax-left', 'parallax-up', 'parallax-down', 'parallax-dolly', 'parallax-orbit'];

export const isParallax = (type: any): boolean => typeof type === 'string' && type.startsWith('parallax');

/**
 * CSS transform of one layer. p = eased progress 0..1 of the scene, k = strength (0-3), u = px per 1920-unit,
 * backdrop = the full-frame background layer (gets overscan so no edges show).
 */
export const parallaxTransform = (type: string, depth: number, p: number, k: number, u: number, backdrop = false): string => {
  const d = 0.12 + depth;
  const a = (0.5 - p) * k * 140 * u * d;
  const s = 1 + 0.05 * depth * p * k;
  switch (type) {
    case 'parallax-left':
      return `translateX(${(-a).toFixed(2)}px) scale(${backdrop ? 1.06 : s.toFixed(4)})`;
    case 'parallax-up':
      return `translateY(${(-a * 0.6).toFixed(2)}px) scale(${backdrop ? 1.1 : s.toFixed(4)})`;
    case 'parallax-down':
      return `translateY(${(a * 0.6).toFixed(2)}px) scale(${backdrop ? 1.1 : s.toFixed(4)})`;
    case 'parallax-dolly':
      return `scale(${((backdrop ? 1.02 : 1) + p * k * 0.16 * (0.15 + depth)).toFixed(4)}) translateY(${(-p * k * 10 * u * depth).toFixed(2)}px)`;
    case 'parallax-orbit': {
      const ang = (p - 0.5) * Math.PI;
      const x = Math.sin(ang) * k * 70 * u * d;
      const y = (1 - Math.cos(ang)) * k * 18 * u * d;
      return `translate(${(-x).toFixed(2)}px, ${y.toFixed(2)}px) scale(${backdrop ? 1.1 : s.toFixed(4)})`;
    }
    default:
      // 'parallax' and 'parallax-right': the camera trucks right, layers slide left
      return `translateX(${a.toFixed(2)}px) scale(${backdrop ? 1.06 : s.toFixed(4)})`;
  }
};

export type RigLayer = {depth: number; node: React.ReactNode; backdrop?: boolean};

/** Generic rig: <ParallaxRig move="parallax-dolly" layers={[{depth: 0, backdrop: true, node: <CityBackdrop />}, ...]} />. */
export const ParallaxRig: React.FC<{move?: string; strength?: number; durationFrames?: number; layers: RigLayer[]}> = ({move = 'parallax', strength = 1, durationFrames, layers}) => {
  const frame = useCurrentFrame();
  const {width, durationInFrames} = useVideoConfig();
  const d = Math.max(1, durationFrames || durationInFrames);
  const p = interpolate(frame, [0, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const u = width / 1920;
  return (
    <AbsoluteFill>
      {layers.map((l, i) => (
        <AbsoluteFill key={i} style={{transform: parallaxTransform(move, l.depth, p, strength, u, !!l.backdrop)}}>
          {l.node}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};
