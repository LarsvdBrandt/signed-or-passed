import type React from 'react';

/** One transition as written in spec.json: an id, or {id, durationSec, params}. */
export type TransitionSpec = {id: string; durationSec?: number; params?: Record<string, any>};

/** What a transition component receives. p = 0..1 progress of the transition (0 = start, 1 = done). */
export type TCtx = {
  p: number;
  /** frame relative to the transition start (may be negative or beyond frames) */
  frame: number;
  frames: number;
  width: number;
  height: number;
  params: Record<string, any>;
  seed: string;
};

export type TWrap = React.FC<{t: TCtx; children: React.ReactNode}>;

export type TransitionDef = {
  id: string;
  label: string;
  description: string;
  /** params documented in docs/library/effects.md */
  params: string;
  /** default length in seconds */
  defaultSec: number;
  /** wraps the INCOMING scene (drawn on top of the outgoing one) */
  In: TWrap;
  /** optional: wraps the OUTGOING scene during the transition (push, whip-pan, zoom-through) */
  Out?: TWrap;
};

export type ResolvedTransition = {def: TransitionDef; spec: TransitionSpec; frames: number};
