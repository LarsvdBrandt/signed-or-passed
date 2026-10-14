import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import type {Scene, Word} from '../types';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 1.0 at 1080p; scales sizes for other formats. */
export const useUnit = () => {
  const {width, height} = useVideoConfig();
  return Math.min(width, height) / 1080;
};

export const usePortrait = () => {
  const {width, height} = useVideoConfig();
  return height > width;
};

export const enterStyle = (enter: string | undefined, f: number, fps: number): {transform: string; opacity: number} => {
  if (!enter || enter === 'none') return {transform: '', opacity: 1};
  const p = spring({frame: Math.max(0, f), fps, config: {damping: 14, mass: 0.7, stiffness: 120}});
  const o = interpolate(f, [0, 8], [0, 1], clamp);
  switch (enter) {
    case 'pop':
      return {transform: `scale(${0.5 + 0.5 * p})`, opacity: o};
    case 'slide-up':
      return {transform: `translateY(${(1 - p) * 140}px)`, opacity: o};
    case 'slide-down':
      return {transform: `translateY(${-(1 - p) * 140}px)`, opacity: o};
    case 'slide-left':
      return {transform: `translateX(${(1 - p) * 220}px)`, opacity: o};
    case 'slide-right':
      return {transform: `translateX(${-(1 - p) * 220}px)`, opacity: o};
    case 'drop': {
      const d = spring({frame: Math.max(0, f), fps, config: {damping: 9, mass: 0.6, stiffness: 140}});
      return {transform: `translateY(${-(1 - d) * 320}px)`, opacity: o};
    }
    default:
      return {transform: '', opacity: o};
  }
};

/** Subtle paper grain over everything (no gradients: fractal noise, multiplied). */
export const PaperGrain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply', opacity}}>
    <svg width="100%" height="100%">
      <filter id="sop-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#sop-grain)" />
    </svg>
  </AbsoluteFill>
);

/** "Source: <title>" bottom-right (left of the watermark). */
export const SourceLine: React.FC<{sourceId?: string; sources?: Record<string, {title: string}>; dark?: boolean}> = ({sourceId, sources, dark}) => {
  const u = useUnit();
  const s = sourceId && sources ? sources[sourceId] : undefined;
  if (!s) return null;
  return (
    <div style={{position: 'absolute', right: 150 * u, bottom: 50 * u, maxWidth: '58%', textAlign: 'right', fontFamily: FONT_MONO, fontSize: 24 * u, color: dark ? C.greyLight : C.grey}}>
      Source: {s.title}
    </div>
  );
};

/** Small heading at the top-left of a scene (scene.onScreenText). */
export const Kicker: React.FC<{text?: string | null; dark?: boolean}> = ({text, dark}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  if (!text) return null;
  return (
    <div style={{position: 'absolute', left: 64 * u, top: 56 * u, maxWidth: '70%', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 54 * u, lineHeight: 1.05, color: dark ? C.paper : C.board, background: dark ? 'transparent' : C.paper, padding: `${6 * u}px ${12 * u}px`, opacity: interpolate(frame, [4, 14], [0, 1], clamp)}}>
      {text}
    </div>
  );
};

/** Date tag bottom-left: the most recent scene.dateTag at or before the current frame. */
export const DateTag: React.FC<{scenes: Scene[]}> = ({scenes}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  let tag: string | null = null;
  for (const s of scenes) {
    if (s.startFrame > frame) break;
    if (s.dateTag) tag = s.dateTag;
  }
  if (!tag) return null;
  return (
    <div style={{position: 'absolute', left: 48 * u, bottom: 40 * u, fontFamily: FONT_MONO, fontSize: 26 * u, letterSpacing: 2 * u, color: C.board, background: C.paper, border: `3px solid ${C.board}`, padding: `${6 * u}px ${14 * u}px`}}>
      {tag}
    </div>
  );
};

/** Big word-by-word burned-in captions for Shorts (3 words per group, active word in ink blue). */
export const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  if (!words || !words.length) return null;
  let idx = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].startFrame <= frame) idx = i;
    else break;
  }
  if (idx < 0) return null;
  if (frame > words[idx].endFrame + 12) return null;
  const start = Math.floor(idx / 3) * 3;
  const chunk = words.slice(start, start + 3);
  return (
    <div style={{position: 'absolute', left: 50 * u, right: 50 * u, top: '66%', textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 96 * u, lineHeight: 1.08, textTransform: 'uppercase', WebkitTextStroke: `${5 * u}px ${C.board}`, textShadow: `0 ${8 * u}px 0 ${C.board}`}}>
      {chunk.map((w, i) => (
        <span key={start + i} style={{color: start + i === idx ? C.ink : C.paper, marginRight: 22 * u, display: 'inline-block'}}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

export const formatNumber = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e4) return (n / 1e3).toFixed(0) + 'K';
  return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(1);
};

export const withUnit = (value: string, unit?: string): string => {
  if (!unit) return value;
  if (['$', '€', '£', '¥'].includes(unit)) return unit + value;
  if (unit === '%') return value + '%';
  return value + ' ' + unit;
};
