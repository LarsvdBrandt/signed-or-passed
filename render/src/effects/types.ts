import type React from 'react';

/** One effect as written in spec.json: an id, or {id, intensity 0-3 (default 1; 0 = off), params}. */
export type EffectSpec = {id: string; intensity?: number; params?: Record<string, any>};
export type EffectInput = string | EffectSpec;

/** What an effect component receives. */
export type EffectCtx = {
  id: string;
  intensity: number;
  params: Record<string, any>;
  /** deterministic seed (scene id + effect id) */
  seed: string;
  /** scene length in frames */
  duration: number;
  /** unique DOM id prefix for SVG filters / patterns */
  uid: string;
};

export type WrapProps = {fx: EffectCtx; children: React.ReactNode};
export type OverlayProps = {fx: EffectCtx};

export type EffectDef = {
  id: string;
  label: string;
  description: string;
  /** params documented in docs/library/effects.md */
  params: string;
  /** wraps the scene content (transform / CSS or SVG filter) */
  Wrap?: React.FC<WrapProps>;
  /** drawn over the scene content, inside the paper sheet */
  Overlay?: React.FC<OverlayProps>;
};
