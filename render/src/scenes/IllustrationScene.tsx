import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, colourOf} from '../constants';
import {Kicker, clamp, useUnit} from '../components/common';
import {BACKDROPS, Layer} from '../illustrations';
import {isParallax, parallaxTransform} from '../transitions/parallax';
import type {SceneProps} from '../types';

/** motion may be a string ('parallax', 'push-in', ...) or {type, strength}. */
export const motionOf = (m: any): {type: string; strength: number} => {
  if (!m) return {type: 'none', strength: 1};
  if (typeof m === 'string') return {type: m, strength: 1};
  return {type: String(m.type || 'none'), strength: typeof m.strength === 'number' ? Math.max(0, Math.min(3, m.strength)) : 1};
};

/**
 * Layers on a background. With motion 'parallax' | 'parallax-right' | 'parallax-left' | 'parallax-up' | 'parallax-down'
 * | 'parallax-dolly' | 'parallax-orbit' the layers move by depth (render/src/transitions/parallax.tsx).
 */
export const IllustrationScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const v = scene.visual || {};
  const bg: string = v.background || 'paper';
  const Backdrop = BACKDROPS[bg];
  const dark = !Backdrop && (bg === 'board' || bg === 'ink' || bg === 'stamp');
  const m = motionOf(scene.motion);
  const parallax = isParallax(m.type);
  const p = interpolate(frame, [0, Math.max(1, scene.durationFrames)], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const layers: any[] = v.layers || [];
  const n = layers.length;
  return (
    <AbsoluteFill style={{backgroundColor: Backdrop ? C.paper : colourOf(bg, C.paper)}}>
      {Backdrop ? (
        <AbsoluteFill style={{transform: parallax ? parallaxTransform(m.type, 0, p, m.strength, u, true) : undefined}}>
          <Backdrop />
        </AbsoluteFill>
      ) : null}
      {layers.map((l: any, i: number) => {
        const depth = typeof l.depth === 'number' ? l.depth : n > 1 ? 0.2 + (0.8 * i) / (n - 1) : 0.6;
        if (!parallax) return <Layer key={i} layer={l} />;
        return (
          <AbsoluteFill key={i} style={{transform: parallaxTransform(m.type, depth, p, m.strength, u)}}>
            <Layer layer={l} />
          </AbsoluteFill>
        );
      })}
      <Kicker text={scene.onScreenText} dark={dark} />
    </AbsoluteFill>
  );
};
