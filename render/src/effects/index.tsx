import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ChromaticAberration, CameraShake, DepthOfField, GateWeave, GlitchWrap, InkBleedWrap, OldFilmWrap, VhsWrap, ZoomBlur} from './wrappers';
import {FilmGrain, LightLeaks, OldFilmOverlay, PaperTexture, Vignette, VhsOverlay} from './overlays';
import {safeId} from './util';
import type {EffectCtx, EffectDef, EffectInput, EffectSpec} from './types';

export type {EffectDef, EffectInput, EffectSpec} from './types';

/**
 * EFFECT registry: overlay effects that wrap any scene (docs/library/effects.md).
 * Used per scene with scenes[].effects [{id, intensity, params}] and for the whole video with spec.look.
 */
export const EFFECTS: Record<string, EffectDef> = {
  'film-grain': {id: 'film-grain', label: 'Film grain', description: 'animated photographic grain', params: 'size fine|coarse, animated', Overlay: FilmGrain},
  'old-film': {id: 'old-film', label: 'Old film', description: 'sepia/mono grade, gate weave, flicker, scratches, dust, burnt edges', params: 'sepia 0-1, mono', Wrap: OldFilmWrap, Overlay: OldFilmOverlay},
  vignette: {id: 'vignette', label: 'Vignette', description: 'dark edges (flat blurred inner shadow)', params: 'colour', Overlay: Vignette},
  'light-leaks': {id: 'light-leaks', label: 'Light leaks', description: 'flat blurred brand shapes drifting at the edges', params: 'colours[], speed', Overlay: LightLeaks},
  vhs: {id: 'vhs', label: 'VHS', description: 'scanlines, tracking band, RGB split, tracking slips, PLAY / counter OSD', params: 'osd, label, counterStartSec, trackingSpeed', Wrap: VhsWrap, Overlay: VhsOverlay},
  glitch: {id: 'glitch', label: 'Glitch', description: 'digital slice displacement + strong RGB split on random frames', params: 'rate', Wrap: GlitchWrap},
  'chromatic-aberration': {id: 'chromatic-aberration', label: 'Chromatic aberration', description: 'red / blue channel offset', params: 'offsetPx, pulse', Wrap: ChromaticAberration},
  'ink-bleed': {id: 'ink-bleed', label: 'Ink bleed', description: 'boiling, spreading ink lines', params: 'boil, spread', Wrap: InkBleedWrap},
  'paper-texture': {id: 'paper-texture', label: 'Paper texture', description: 'paper surface over the scene', params: 'variant grain|fibre|crumpled|newsprint|kraft|watercolour', Overlay: PaperTexture},
  'camera-shake': {id: 'camera-shake', label: 'Camera shake', description: 'hand-held or impact shake', params: 'freq, startSec, durSec, decay', Wrap: CameraShake},
  'gate-weave': {id: 'gate-weave', label: 'Gate weave', description: 'slow film-gate wobble', params: 'freq', Wrap: GateWeave},
  'depth-of-field': {id: 'depth-of-field', label: 'Depth of field', description: 'soft focus or rack focus', params: 'blurPx, rack none|in|out, rackSec', Wrap: DepthOfField},
  'zoom-blur': {id: 'zoom-blur', label: 'Zoom blur', description: 'radial ghost burst at the start or end', params: 'at start|end|always, burstSec, copies, cx, cy', Wrap: ZoomBlur},
};

export const EFFECT_IDS = Object.keys(EFFECTS);

/** Global looks for spec.look (a preset name, an array of effects, or {preset, effects}). */
export const LOOKS: Record<string, EffectSpec[]> = {
  clean: [],
  archival: [{id: 'old-film', intensity: 1}, {id: 'film-grain', intensity: 0.8}],
  newsreel: [{id: 'old-film', intensity: 1.2, params: {mono: true}}, {id: 'film-grain', intensity: 1, params: {size: 'coarse'}}, {id: 'vignette', intensity: 1.2}],
  documentary: [{id: 'film-grain', intensity: 0.5}, {id: 'vignette', intensity: 0.6}, {id: 'gate-weave', intensity: 0.4}],
  cinematic: [{id: 'film-grain', intensity: 0.6}, {id: 'vignette', intensity: 0.8}, {id: 'light-leaks', intensity: 0.5}],
  vhs: [{id: 'vhs', intensity: 1}],
  glitchy: [{id: 'glitch', intensity: 1}, {id: 'chromatic-aberration', intensity: 0.5}],
  print: [{id: 'paper-texture', intensity: 1, params: {variant: 'newsprint'}}],
  handmade: [{id: 'paper-texture', intensity: 1, params: {variant: 'crumpled'}}, {id: 'ink-bleed', intensity: 0.6}],
  dreamy: [{id: 'light-leaks', intensity: 1}, {id: 'vignette', intensity: 0.5}, {id: 'depth-of-field', intensity: 0.25}],
};

export const LOOK_IDS = Object.keys(LOOKS);

const norm = (e: any): EffectSpec | null => {
  if (typeof e === 'string') return {id: e};
  if (e && typeof e === 'object' && typeof e.id === 'string') return e as EffectSpec;
  return null;
};

const normList = (list: any): EffectSpec[] => (Array.isArray(list) ? (list.map(norm).filter(Boolean) as EffectSpec[]) : []);

/** Later entries override earlier ones with the same id (params are merged). */
const merge = (...lists: EffectSpec[][]): EffectSpec[] => {
  const out = new Map<string, EffectSpec>();
  for (const list of lists) {
    for (const e of list) {
      const prev = out.get(e.id);
      out.set(e.id, prev ? {...prev, ...e, params: {...(prev.params || {}), ...(e.params || {})}} : e);
    }
  }
  return [...out.values()];
};

export const lookEffects = (look: any): EffectSpec[] => {
  if (!look) return [];
  if (typeof look === 'string') return LOOKS[look] || [];
  if (Array.isArray(look)) return normList(look);
  if (typeof look === 'object') return merge(typeof look.preset === 'string' ? LOOKS[look.preset] || [] : [], normList(look.effects));
  return [];
};

/** spec.look + scenes[].effects -> the effects of one scene ({id, intensity: 0} switches a look effect off). */
export const resolveEffects = (look: any, sceneEffects: any): EffectSpec[] => merge(lookEffects(look), normList(sceneEffects));

// inner -> outer for wrappers, bottom -> top for overlays
const WRAP_ORDER = ['ink-bleed', 'depth-of-field', 'chromatic-aberration', 'glitch', 'vhs', 'old-film', 'zoom-blur', 'gate-weave', 'camera-shake'];
const OVERLAY_ORDER = ['paper-texture', 'light-leaks', 'film-grain', 'old-film', 'vhs', 'vignette'];
const rank = (order: string[], id: string) => {
  const i = order.indexOf(id);
  return i < 0 ? order.length : i;
};

/** Wraps a scene's content in its effects. Without effects it renders the children unchanged. */
export const EffectsStack: React.FC<{effects: EffectSpec[]; seed: string; duration: number; children: React.ReactNode}> = ({effects, seed, duration, children}) => {
  const items = (effects || [])
    .map((e, i) => {
      const def = EFFECTS[e.id];
      const raw = e.intensity == null ? 1 : Number(e.intensity);
      const fx: EffectCtx = {
        id: e.id,
        intensity: Math.max(0, Math.min(3, Number.isFinite(raw) ? raw : 1)),
        params: e.params || {},
        seed: `${seed}:${e.id}`,
        duration: Math.max(1, duration),
        uid: `fx-${safeId(seed)}-${safeId(e.id)}-${i}`,
      };
      return {def, fx};
    })
    .filter((x) => x.def && x.fx.intensity > 0);
  if (!items.length) return <>{children}</>;
  const wraps = items.filter((x) => x.def.Wrap).sort((a, b) => rank(WRAP_ORDER, a.fx.id) - rank(WRAP_ORDER, b.fx.id));
  const overlays = items.filter((x) => x.def.Overlay).sort((a, b) => rank(OVERLAY_ORDER, a.fx.id) - rank(OVERLAY_ORDER, b.fx.id));
  let content: React.ReactNode = children;
  for (const w of wraps) {
    const W = w.def.Wrap!;
    content = <W fx={w.fx}>{content}</W>;
  }
  return (
    <AbsoluteFill>
      {content}
      {overlays.map((o) => {
        const O = o.def.Overlay!;
        return <O key={o.fx.uid} fx={o.fx} />;
      })}
    </AbsoluteFill>
  );
};
