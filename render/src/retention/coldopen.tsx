import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_MONO} from '../constants';
import {clamp, useUnit} from '../components/common';
import type {Scene} from '../types';

/**
 * RETENTION-3 cold open / flash-forward (scenes[].coldOpen, docs/library/retention.md).
 * true or {style: 'flash-forward' | 'clean', label, rampSec, desaturate, flash}:
 *  - speed-ramp: the first rampSec play fast and settle to normal speed (time remap, ends in sync with the voice)
 *    with a zoom punch-in,
 *  - flash-forward look: desaturated + a little contrast, back to full colour in the last 0.4 s,
 *  - a white flash frame on the cut to the next scene (ColdOpenFlash, top level in Video.tsx),
 *  - sounds: whoosh_fast at the start, whoosh_long into the flash (pipeline/common.py COLD_OPEN_SFX).
 */
export type ColdOpenCfg = {style: 'flash-forward' | 'clean'; label: string | null; ramp: number; desaturate: number; flash: boolean};

export const coldOpenOf = (scene: Scene, fps = 30): ColdOpenCfg | null => {
  const c = (scene as any).coldOpen;
  if (!c) return null;
  const o = c === true ? {} : c;
  const style = o.style === 'clean' ? 'clean' : 'flash-forward';
  return {
    style,
    label: o.label ? String(o.label) : null,
    ramp: Math.max(0, Math.round((o.rampSec ?? 0.7) * fps)),
    desaturate: Math.max(0, Math.min(1, o.desaturate ?? (style === 'flash-forward' ? 0.85 : 0))),
    flash: o.flash !== false,
  };
};

/** Content time for the speed-ramp: fast at the start (3x), easing to 1x at frame `ramp`, in sync from there on. */
const remap = (f: number, ramp: number) => (ramp > 0 && f < ramp ? Math.round(ramp * Easing.out(Easing.cubic)(f / ramp)) : f);

export const ColdOpenLayer: React.FC<{cfg: ColdOpenCfg | null; duration: number; children: React.ReactNode}> = ({cfg, duration, children}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  if (!cfg) return <>{children}</>;
  const zoom = cfg.ramp > 0 ? interpolate(frame, [0, cfg.ramp], [1.16, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 1;
  const back = interpolate(frame, [duration - 12, duration - 2], [1, 0], clamp);
  const grey = cfg.desaturate * back;
  const filter = grey > 0.001 ? `grayscale(${grey}) contrast(${1 + 0.12 * grey}) sepia(${0.12 * grey})` : undefined;
  const tagIn = interpolate(frame, [4, 12], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: zoom !== 1 ? `scale(${zoom})` : undefined, filter}}>
        {cfg.ramp > 0 ? <Freeze frame={remap(frame, cfg.ramp)} active={frame < cfg.ramp}>{children}</Freeze> : children}
      </AbsoluteFill>
      {cfg.style === 'flash-forward' ? (
        <AbsoluteFill style={{pointerEvents: 'none', boxShadow: `inset 0 0 ${220 * u}px rgba(0,0,0,${0.35 * back})`}} />
      ) : null}
      {cfg.label ? (
        <div
          style={{
            position: 'absolute',
            left: 56 * u,
            top: 48 * u,
            opacity: tagIn,
            transform: `translateX(${(1 - tagIn) * -30 * u}px)`,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 34 * u,
            letterSpacing: 4 * u,
            color: C.paper,
            background: C.board,
            padding: `${8 * u}px ${18 * u}px`,
          }}
        >
          {'▶▶ '}
          {cfg.label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** White flash on the cut out of a cold open: rises over the last 4 frames, fades over 8 frames of the next scene. */
export const ColdOpenFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 4, 6, 14], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{backgroundColor: '#ffffff', opacity: o, pointerEvents: 'none'}} />;
};
export const COLD_OPEN_FLASH_LEAD = 4;
export const COLD_OPEN_FLASH_FRAMES = 14;
