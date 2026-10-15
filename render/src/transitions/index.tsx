import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../constants';
import * as L from './library';
import type {ResolvedTransition, TCtx, TransitionDef, TransitionSpec} from './types';

export type {ResolvedTransition, TCtx, TransitionDef, TransitionSpec} from './types';

/**
 * TRANSITION registry (docs/library/effects.md). A transition plays at the START of a scene: the incoming scene is
 * drawn over the tail of the previous one. Use scenes[].transition per scene and spec.transition as the default.
 */
export const TRANSITIONS: Record<string, TransitionDef> = {
  'paper-slide': {id: 'paper-slide', label: 'Paper slide', description: 'house style: a new paper sheet slides over the old one', params: 'from right|left|up|down', defaultSec: 0.4, In: L.PaperSlideIn},
  cut: {id: 'cut', label: 'Cut', description: 'hard cut', params: '-', defaultSec: 0.04, In: L.Identity},
  fade: {id: 'fade', label: 'Fade', description: 'cross-fade', params: '-', defaultSec: 0.5, In: L.FadeIn},
  push: {id: 'push', label: 'Push', description: 'the new scene pushes the old one out', params: 'from right|left|up|down', defaultSec: 0.5, In: L.PushIn, Out: L.PushOut},
  'page-curl': {id: 'page-curl', label: 'Page turn', description: 'the new page swings in around its left edge', params: '-', defaultSec: 0.6, In: L.PageCurlIn},
  'whip-pan': {id: 'whip-pan', label: 'Whip pan', description: 'fast motion-blurred pan with speed streaks', params: 'from right|left|up|down', defaultSec: 0.35, In: L.WhipIn, Out: L.WhipOut},
  'iris-in': {id: 'iris-in', label: 'Iris in', description: 'circle opens on the new scene', params: 'cx, cy (percent), colour (ring)', defaultSec: 0.6, In: L.IrisIn},
  'iris-out': {id: 'iris-out', label: 'Iris out', description: 'cartoon iris: closes to black, opens on the new scene', params: 'cx, cy (percent), colour', defaultSec: 0.9, In: L.IrisOutIn},
  'wipe-left': {id: 'wipe-left', label: 'Wipe left', description: 'straight wipe moving left with an ink edge', params: 'colour, edge (true)', defaultSec: 0.5, In: L.WipeLeft},
  'wipe-right': {id: 'wipe-right', label: 'Wipe right', description: 'straight wipe moving right with an ink edge', params: 'colour, edge (true)', defaultSec: 0.5, In: L.WipeRight},
  'wipe-up': {id: 'wipe-up', label: 'Wipe up', description: 'straight wipe moving up with an ink edge', params: 'colour, edge (true)', defaultSec: 0.5, In: L.WipeUp},
  'wipe-down': {id: 'wipe-down', label: 'Wipe down', description: 'straight wipe moving down with an ink edge', params: 'colour, edge (true)', defaultSec: 0.5, In: L.WipeDown},
  'diagonal-wipe': {id: 'diagonal-wipe', label: 'Diagonal wipe', description: 'wipe from the top-left corner', params: '-', defaultSec: 0.6, In: L.DiagonalWipe},
  'clock-wipe': {id: 'clock-wipe', label: 'Clock wipe', description: 'radial sweep like a clock hand', params: '-', defaultSec: 0.7, In: L.ClockWipe},
  'barn-door': {id: 'barn-door', label: 'Barn door', description: 'opens from the centre line', params: 'vertical (false)', defaultSec: 0.5, In: L.BarnDoor},
  'ink-splash': {id: 'ink-splash', label: 'Ink splash', description: 'revealed through a growing ink blot with drops', params: 'cx, cy (percent), colour', defaultSec: 0.7, In: L.InkSplashIn},
  'stamp-cut': {id: 'stamp-cut', label: 'Stamp cut', description: 'a stamp slams down, the cut happens under the impact', params: 'text, colour', defaultSec: 0.6, In: L.StampCutIn},
  'film-burn': {id: 'film-burn', label: 'Film burn', description: 'flat orange burn holes and a paper flash', params: '-', defaultSec: 0.8, In: L.FilmBurnIn},
  'glitch-cut': {id: 'glitch-cut', label: 'Glitch cut', description: 'the new scene arrives in jittering bands', params: '-', defaultSec: 0.4, In: L.GlitchCutIn},
  'zoom-through': {id: 'zoom-through', label: 'Zoom through', description: 'the old scene zooms past, the new one zooms in', params: '-', defaultSec: 0.5, In: L.ZoomIn, Out: L.ZoomOut},
  flash: {id: 'flash', label: 'Flash', description: 'flash to paper (or a colour) and back', params: 'colour', defaultSec: 0.4, In: L.FlashIn},
};

export const TRANSITION_IDS = Object.keys(TRANSITIONS);
export const DEFAULT_TRANSITION = 'paper-slide';

const normT = (x: any): TransitionSpec | null => {
  if (typeof x === 'string' && x) return {id: x};
  if (x && typeof x === 'object' && typeof x.id === 'string') return x as TransitionSpec;
  return null;
};

/** scenes[].transition (or spec.transition as fallback) -> definition + length in frames (1..60). */
export const resolveTransition = (raw: any, fallback: any, fps = 30): ResolvedTransition => {
  const spec = normT(raw) || normT(fallback) || {id: DEFAULT_TRANSITION};
  const def = TRANSITIONS[spec.id] || TRANSITIONS[DEFAULT_TRANSITION];
  const sec = typeof spec.durationSec === 'number' && Number.isFinite(spec.durationSec) ? spec.durationSec : def.defaultSec;
  const frames = Math.max(1, Math.min(60, Math.round(sec * (fps || 30))));
  return {def, spec: {...spec, id: def.id}, frames};
};

/**
 * One scene on its paper sheet with its entering transition (frame 0..enter.frames) and, when the NEXT scene's
 * transition has an Out part, the exit move from exitAt on. The tree shape never changes between frames.
 */
export const TransitionLayer: React.FC<{enter: ResolvedTransition | null; exit: ResolvedTransition | null; exitAt: number; seed: string; children: React.ReactNode}> = ({
  enter,
  exit,
  exitAt,
  seed,
  children,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const mk = (r: ResolvedTransition | null, f: number): TCtx => ({
    p: r ? Math.max(0, Math.min(1, f / r.frames)) : 1,
    frame: f,
    frames: r ? r.frames : 1,
    width,
    height,
    params: (r && r.spec.params) || {},
    seed: `${seed}:${r ? r.def.id : 'none'}`,
  });
  const In = enter ? enter.def.In : L.Identity;
  const Out = exit && exit.def.Out ? exit.def.Out : L.Identity;
  return (
    <In t={mk(enter, frame)}>
      <Out t={mk(exit, frame - exitAt)}>
        <AbsoluteFill style={{backgroundColor: C.paper, overflow: 'hidden'}}>{children}</AbsoluteFill>
      </Out>
    </In>
  );
};
