import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../constants';
import {ChromaDefs, rnd, smooth1D} from './util';
import type {WrapProps} from './types';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/** Hand-held / impact shake. params: freq (Hz, 6), startSec (0), durSec (whole scene), decay (true when durSec is set). */
export const CameraShake: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = fx.params;
  const start = Math.round((Number(p.startSec) || 0) * fps);
  const dur = p.durSec != null ? Math.max(1, Math.round(Number(p.durSec) * fps)) : fx.duration;
  const decay = p.decay ?? p.durSec != null;
  const local = frame - start;
  let amp = 0;
  if (local >= 0 && local < dur) amp = decay ? 1 - (local / dur) * 0.9 : 1;
  const t = (frame / fps) * (Number(p.freq) || 6);
  const k = fx.intensity * amp;
  const x = smooth1D(`${fx.seed}:x`, t) * 14 * k;
  const y = smooth1D(`${fx.seed}:y`, t + 17) * 10 * k;
  const r = smooth1D(`${fx.seed}:r`, t + 41) * 0.6 * k;
  const s = 1 + 0.02 * fx.intensity;
  return (
    <AbsoluteFill style={{transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(3)})`}}>
      {children}
    </AbsoluteFill>
  );
};

/** Slow film-gate wobble. params: freq (Hz, 1.6). */
export const GateWeave: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = (frame / fps) * (Number(fx.params.freq) || 1.6);
  const x = smooth1D(`${fx.seed}:wx`, t) * 2.5 * fx.intensity;
  const y = smooth1D(`${fx.seed}:wy`, t * 1.3 + 9) * 3.5 * fx.intensity;
  const r = smooth1D(`${fx.seed}:wr`, t * 0.7 + 3) * 0.12 * fx.intensity;
  return (
    <AbsoluteFill style={{transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(1.012)`}}>
      {children}
    </AbsoluteFill>
  );
};

/** Old film: sepia / mono grade + gate weave + rare frame jumps (the overlay adds flicker, scratches and dust). params: sepia (0-1), mono (bool). */
export const OldFilmWrap: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = fx.intensity;
  const sepia = fx.params.sepia != null ? Number(fx.params.sepia) : Math.min(1, 0.45 * k);
  const mono = fx.params.mono === true;
  const t = (frame / fps) * 1.6;
  const jump = rnd(fx.seed, 'jump', Math.floor(frame / 2)) < 0.02 * k ? 6 : 0;
  const x = smooth1D(`${fx.seed}:wx`, t) * 2.5 * k;
  const y = smooth1D(`${fx.seed}:wy`, t * 1.3 + 5) * 3.5 * k + jump;
  const filter = `${mono ? 'grayscale(1) ' : ''}sepia(${sepia.toFixed(2)}) contrast(${(1 + 0.08 * k).toFixed(2)})`;
  return (
    <AbsoluteFill style={{filter, transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(1.012)`}}>
      {children}
    </AbsoluteFill>
  );
};

/** Depth-of-field blur. params: blurPx (6), rack none | in (blurred -> sharp at the start) | out (sharp -> blurred at the end), rackSec (1). */
export const DepthOfField: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = (Number(fx.params.blurPx) || 6) * fx.intensity;
  const r = Math.max(1, Math.round((Number(fx.params.rackSec) || 1) * fps));
  let b = max;
  if (fx.params.rack === 'in') b = interpolate(frame, [0, r], [max, 0], clamp);
  else if (fx.params.rack === 'out') b = interpolate(frame, [fx.duration - r, fx.duration], [0, max], clamp);
  return <AbsoluteFill style={{filter: `blur(${b.toFixed(2)}px)`, transform: 'scale(1.02)'}}>{children}</AbsoluteFill>;
};

/** Radial zoom blur burst (ghost copies). params: at start | end | always, burstSec (0.6), copies (1-4, 3), cx / cy (percent, 50). */
export const ZoomBlur: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const burst = Math.max(1, Math.round((Number(fx.params.burstSec) || 0.6) * fps));
  const at = fx.params.at || 'start';
  let s = 0;
  if (at === 'always') s = 1;
  else if (at === 'end') s = interpolate(frame, [fx.duration - burst, fx.duration], [0, 1], clamp);
  else s = interpolate(frame, [0, burst], [1, 0], clamp);
  s *= fx.intensity;
  const copies = Math.max(1, Math.min(4, Math.round(Number(fx.params.copies) || 3)));
  const origin = `${Number(fx.params.cx ?? 50)}% ${Number(fx.params.cy ?? 50)}%`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${(1 + 0.04 * s).toFixed(4)})`, transformOrigin: origin}}>{children}</AbsoluteFill>
      {Array.from({length: copies}, (_, i) =>
        s > 0.01 ? (
          <AbsoluteFill key={i} style={{transform: `scale(${(1 + 0.04 * s + 0.05 * (i + 1) * s).toFixed(4)})`, transformOrigin: origin, opacity: 0.3 / (i + 1)}}>
            {children}
          </AbsoluteFill>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

/** RGB split. params: offsetPx (4), pulse (bool: offset breathes). */
export const ChromaticAberration: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const base = (Number(fx.params.offsetPx) || 4) * fx.intensity;
  const d = fx.params.pulse ? base * (0.6 + 0.4 * smooth1D(`${fx.seed}:p`, (frame / fps) * 2)) : base;
  const id = `${fx.uid}-chroma`;
  return (
    <AbsoluteFill>
      <ChromaDefs id={id} dx={Number(d.toFixed(2))} />
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Digital glitch: slices jump sideways with a strong RGB split on random frames. params: rate (0.12 = share of time glitching). */
export const GlitchWrap: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const k = fx.intensity;
  const bucket = Math.floor(frame / 2);
  const rate = fx.params.rate != null ? Number(fx.params.rate) : 0.12;
  const on = rnd(fx.seed, 'g', bucket) < rate * k;
  const id = `${fx.uid}-glitch`;
  const n = on ? 2 + Math.floor(rnd(fx.seed, 'n', bucket) * 3) : 0;
  return (
    <AbsoluteFill>
      <ChromaDefs id={id} dx={on ? 9 * k : 1.2 * k} />
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
      {Array.from({length: n}, (_, i) => {
        const top = rnd(fx.seed, 't', bucket, i) * 90;
        const h = 2 + rnd(fx.seed, 'h', bucket, i) * 9;
        const dx = (rnd(fx.seed, 'dx', bucket, i) - 0.5) * 80 * k;
        return (
          <AbsoluteFill key={i} style={{clipPath: `inset(${top.toFixed(2)}% 0 ${Math.max(0, 100 - top - h).toFixed(2)}% 0)`, transform: `translateX(${dx.toFixed(1)}px)`, backgroundColor: C.paper}}>
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** VHS: soft, saturated, slight RGB split and occasional tracking slips (the overlay adds scanlines, tracking band and OSD). */
export const VhsWrap: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const k = fx.intensity;
  const bucket = Math.floor(frame / 3);
  const slip = rnd(fx.seed, 'slip', bucket) < 0.04 * k;
  const id = `${fx.uid}-vhs`;
  const top = rnd(fx.seed, 'st', bucket) * 80;
  return (
    <AbsoluteFill>
      <ChromaDefs id={id} dx={2.5 * k} />
      <AbsoluteFill style={{filter: `url(#${id}) saturate(${(1 + 0.25 * k).toFixed(2)}) blur(${(0.5 * k).toFixed(2)}px)`}}>{children}</AbsoluteFill>
      {slip ? (
        <AbsoluteFill style={{clipPath: `inset(${top.toFixed(2)}% 0 ${(100 - top - 12).toFixed(2)}% 0)`, transform: `translateX(${(24 * k).toFixed(1)}px)`, backgroundColor: C.paper}}>
          {children}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Ink bleed: lines wobble and spread like ink on absorbent paper. params: boil (true: re-seeds every 4 frames), spread (1). */
export const InkBleedWrap: React.FC<WrapProps> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const k = fx.intensity;
  const spread = Number(fx.params.spread) || 1;
  const seed = fx.params.boil === false ? 1 : (Math.floor(frame / 4) % 6) + 1;
  const id = `${fx.uid}-ink`;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute', left: 0, top: 0}} aria-hidden>
        <defs>
          <filter id={id} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={Number((5 * k).toFixed(2))} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feMorphology in="d" operator="erode" radius={Number((0.9 * k * spread).toFixed(2))} />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
