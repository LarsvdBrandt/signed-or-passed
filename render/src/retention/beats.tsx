import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, colourOf} from '../constants';
import {clamp, formatNumber, useUnit} from '../components/common';
import {Layer} from '../illustrations';
import type {Beat, Scene, VideoProps} from '../types';

/**
 * Visual beats (RETENTION-1, docs/library/retention.md). scenes[].beats are resolved by pipeline/build_props.py
 * to a 'frame' relative to the scene start.
 *   camera beats  punch-in {scale?} | punch-out | shake {intensity?} | whip {direction?}   -> BeatCamera
 *   overlays      flash {colour?} | kinetic {text, position?, colour?, durationSec?} | pop {component, props?, x?, y?,
 *                 scale?, durationSec?} | counter {from?, to, prefix?, suffix?, decimals?, durationSec?, label?}
 *   swap          {kind?, visual} the scene's visual is replaced by another visual layer from that moment
 * AUTO-BEATS: a scene without beats (and not a question, whose hold stays still) gets a subtle camera change every
 * AUTO_PERIOD frames (punch-in / drift / parallax nudge, alternating), so no frame stays static for more than ~3 s.
 */

export const AUTO_PERIOD = 75; // 2.5 s at 30 fps
const AUTO_MOVE = 14; // frames per eased move
const PUNCH_FRAMES = 6;
const WHIP_FRAMES = 10;
const SHAKE_FRAMES = 14;

type CamState = {s: number; x: number; y: number};
const AUTO_STATES: CamState[] = [
  {s: 1.0, x: 0, y: 0},
  {s: 1.07, x: 0, y: 0},
  {s: 1.07, x: -1.4, y: -0.4},
  {s: 1.03, x: 1.0, y: 0.6},
  {s: 1.08, x: 0.6, y: -0.8},
  {s: 1.02, x: -0.8, y: 0.2},
];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
};

const ease = Easing.inOut(Easing.cubic);
const mix = (a: CamState, b: CamState, p: number): CamState => ({s: a.s + (b.s - a.s) * p, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p});

export const autoBeatsOn = (scene: Scene, ctx: VideoProps): boolean =>
  ctx.autoBeats !== false && scene.kind !== 'question' && !(scene.beats && scene.beats.length) && scene.autoBeats !== false;

/** Camera state of the auto beats at frame f. */
const autoState = (f: number, seed: string): CamState => {
  const k = Math.floor(f / AUTO_PERIOD);
  const off = hash(seed) % (AUTO_STATES.length - 1);
  const st = (i: number) => (i <= 0 ? AUTO_STATES[0] : AUTO_STATES[1 + ((i - 1 + off) % (AUTO_STATES.length - 1))]);
  if (k <= 0) return AUTO_STATES[0];
  const p = interpolate(f - k * AUTO_PERIOD, [0, AUTO_MOVE], [0, 1], {...clamp, easing: ease});
  return mix(st(k - 1), st(k), p);
};

/** Camera transform from explicit beats at frame f (scale level, shake, whip). */
const beatTransform = (beats: Beat[], f: number, width: number): string => {
  let level = 1;
  let from = 1;
  let changeAt = -1000;
  let dx = 0;
  let dy = 0;
  let blur = 0;
  for (const b of beats) {
    if (b.frame > f) break;
    const local = f - b.frame;
    if (b.do === 'punch-in' || b.do === 'punch-out') {
      const cur = from + (level - from) * interpolate(b.frame - changeAt, [0, PUNCH_FRAMES], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
      from = cur;
      level = b.do === 'punch-in' ? Number(b.scale) || 1.15 : 1;
      changeAt = b.frame;
    } else if (b.do === 'shake' && local < SHAKE_FRAMES) {
      const amp = (Number(b.intensity) || 1) * 18 * (1 - local / SHAKE_FRAMES);
      dx += Math.sin(local * 2.7) * amp;
      dy += Math.cos(local * 3.3) * amp * 0.6;
    } else if (b.do === 'whip' && local < WHIP_FRAMES) {
      const dir = b.direction === 'right' ? 1 : -1;
      const half = WHIP_FRAMES / 2;
      const off = local < half ? interpolate(local, [0, half], [0, 0.45], {easing: Easing.in(Easing.quad)}) : interpolate(local, [half, WHIP_FRAMES], [-0.45, 0], {easing: Easing.out(Easing.quad)});
      dx += dir * off * width;
      blur = Math.max(blur, 24 * (1 - Math.abs(local - half) / half));
    }
  }
  const s = from + (level - from) * interpolate(f - changeAt, [0, PUNCH_FRAMES], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})${blur > 0.5 ? `|${blur.toFixed(1)}` : ''}`;
};

/** Wraps the scene content: explicit camera beats, or the auto beats when the scene has none. */
export const BeatCamera: React.FC<{scene: Scene; ctx: VideoProps; children: React.ReactNode}> = ({scene, ctx, children}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const beats = (scene.beats || []).filter((b) => ['punch-in', 'punch-out', 'shake', 'whip'].includes(b.do));
  if (beats.length) {
    const [t, blur] = beatTransform(beats, frame, width).split('|');
    return <AbsoluteFill style={{transform: t, filter: blur ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>;
  }
  if (!autoBeatsOn(scene, ctx)) return <>{children}</>;
  const st = autoState(frame, scene.id);
  return <AbsoluteFill style={{transform: `translate(${st.x}%, ${st.y}%) scale(${st.s.toFixed(4)})`}}>{children}</AbsoluteFill>;
};

const Flash: React.FC<{colour?: string}> = ({colour}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 2, 9], [0, 0.85, 0], clamp);
  return <AbsoluteFill style={{backgroundColor: colourOf(colour, '#FFFFFF'), opacity: o}} />;
};

export const KineticWord: React.FC<{text: string; position?: string; colour?: string; duration: number; size?: number}> = ({text, position, colour, duration, size}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const sp = spring({frame: f, fps, config: {damping: 11, stiffness: 180, mass: 0.6}});
  const out = interpolate(f, [duration - 6, duration], [1, 0], clamp);
  const top = position === 'top' ? '14%' : position === 'lower' ? '64%' : '42%';
  const bg = colourOf(colour, C.stamp);
  const len = Math.max(4, text.length);
  const fs = (size || Math.min(150, 1500 / len)) * u;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: out}}>
        <span style={{display: 'inline-block', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, lineHeight: 1.05, textTransform: 'uppercase', color: C.paper, background: bg, padding: `${10 * u}px ${30 * u}px`, boxShadow: `${10 * u}px ${10 * u}px 0 ${C.board}`, transform: `scale(${0.4 + 0.6 * sp}) rotate(${(1 - sp) * -8 - 2}deg)`}}>
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const CounterOverlay: React.FC<{b: Beat; duration: number}> = ({b, duration}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const run = Math.max(6, Math.round((Number(b.countSec) || 1.2) * fps));
  const p = interpolate(f, [0, run], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const from = Number(b.from) || 0;
  const to = Number(b.to) || 0;
  const v = from + (to - from) * p;
  const dec = Number(b.decimals) || 0;
  const txt = dec > 0 ? v.toFixed(dec) : Math.abs(to) >= 10000 ? formatNumber(Math.round(v)) : String(Math.round(v));
  const pop = spring({frame: f, fps, config: {damping: 12}});
  const out = interpolate(f, [duration - 6, duration], [1, 0], clamp);
  const top = b.position === 'top' ? '12%' : b.position === 'lower' ? '62%' : '36%';
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: out, transform: `scale(${0.6 + 0.4 * pop})`}}>
        <div style={{display: 'inline-block', background: C.board, color: C.paper, padding: `${12 * u}px ${36 * u}px`, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 140 * u, lineHeight: 1}}>
          {b.prefix || ''}
          {txt}
          {b.suffix || ''}
        </div>
        {b.label ? <div style={{marginTop: 12 * u, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 44 * u, color: C.board, textTransform: 'uppercase'}}>{b.label}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Overlay beats (flash, kinetic, pop, counter) on top of the scene, each from its own frame. */
export const BeatOverlays: React.FC<{scene: Scene}> = ({scene}) => {
  const {fps} = useVideoConfig();
  const beats = scene.beats || [];
  if (!beats.length) return null;
  return (
    <>
      {beats.map((b, i) => {
        const rest = Math.max(1, scene.durationFrames - b.frame);
        const dur = b.durationSec ? Math.min(rest, Math.round(Number(b.durationSec) * fps)) : rest;
        const name = `beat:${b.do}:${i}`;
        if (b.do === 'flash')
          return (
            <Sequence key={i} name={name} from={b.frame} durationInFrames={Math.min(rest, 12)}>
              <Flash colour={b.colour} />
            </Sequence>
          );
        if (b.do === 'kinetic' && b.text) {
          const d = b.durationSec ? dur : Math.min(rest, Math.round(1.6 * fps));
          return (
            <Sequence key={i} name={name} from={b.frame} durationInFrames={d}>
              <KineticWord text={String(b.text)} position={b.position} colour={b.colour} duration={d} />
            </Sequence>
          );
        }
        if (b.do === 'pop' && b.component)
          return (
            <Sequence key={i} name={name} from={b.frame} durationInFrames={dur}>
              <Layer layer={{component: b.component, props: b.props, x: b.x ?? 72, y: b.y ?? 55, scale: b.scale ?? 0.8, enter: b.enter || 'pop'}} />
            </Sequence>
          );
        if (b.do === 'counter') {
          const d = b.durationSec ? dur : Math.min(rest, Math.round(2.4 * fps));
          return (
            <Sequence key={i} name={name} from={b.frame} durationInFrames={d}>
              <CounterOverlay b={b} duration={d} />
            </Sequence>
          );
        }
        return null;
      })}
    </>
  );
};

/** The last 'swap' beat at or before frame f (or null): its visual replaces the scene's visual. */
export const swapsOf = (scene: Scene): Beat[] => (scene.beats || []).filter((b) => b.do === 'swap' && b.visual);
