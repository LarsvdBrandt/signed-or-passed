import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, colourOf} from '../constants';
import {Kicker, clamp, useUnit} from '../components/common';
import {BACKDROPS, Layer} from '../illustrations';
import type {SceneProps} from '../types';

/** motion may be a string ('parallax', 'push-in', ...) or {type, strength}. */
export const motionOf = (m: any): {type: string; strength: number} => {
  if (!m) return {type: 'none', strength: 1};
  if (typeof m === 'string') return {type: m, strength: 1};
  return {type: String(m.type || 'none'), strength: typeof m.strength === 'number' ? Math.max(0, Math.min(3, m.strength)) : 1};
};

export const IllustrationScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const v = scene.visual || {};
  const bg: string = v.background || 'paper';
  const Backdrop = BACKDROPS[bg];
  const dark = !Backdrop && (bg === 'board' || bg === 'ink' || bg === 'stamp');
  const m = motionOf(scene.motion);
  const parallax = m.type === 'parallax';
  const p = interpolate(frame, [0, Math.max(1, scene.durationFrames)], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const layers: any[] = v.layers || [];
  const n = layers.length;
  const shift = (depth: number) => (parallax ? (0.5 - p) * m.strength * 140 * u * (0.12 + depth) : 0);
  return (
    <AbsoluteFill style={{backgroundColor: Backdrop ? C.paper : colourOf(bg, C.paper)}}>
      {Backdrop ? (
        <AbsoluteFill style={{transform: parallax ? `translateX(${shift(0)}px) scale(1.06)` : undefined}}>
          <Backdrop />
        </AbsoluteFill>
      ) : null}
      {layers.map((l: any, i: number) => {
        const depth = typeof l.depth === 'number' ? l.depth : n > 1 ? 0.2 + (0.8 * i) / (n - 1) : 0.6;
        if (!parallax) return <Layer key={i} layer={l} />;
        return (
          <AbsoluteFill key={i} style={{transform: `translateX(${shift(depth)}px) scale(${1 + 0.05 * depth * p * m.strength})`}}>
            <Layer layer={l} />
          </AbsoluteFill>
        );
      })}
      <Kicker text={scene.onScreenText} dark={dark} />
    </AbsoluteFill>
  );
};
