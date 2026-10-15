import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {clamp, useUnit} from '../components/common';
import type {SceneProps} from '../types';

const ez = (f: number, a: number, b: number): number => interpolate(f, [a, Math.max(a + 1, b)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

export const LOWER_THIRD_STYLES = ['bar', 'tab', 'underline'];

/**
 * Lower third on any scene: scenes[].lowerThird {style?: bar | tab | underline, title, subtitle?, atSec? (0.5),
 * durationSec? (4.5)}. Landscape: bottom-left above the date tag; portrait (Shorts): top-left, clear of the captions.
 */
export const LowerThird: React.FC<{lt: any; duration: number}> = ({lt, duration}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = useUnit();
  if (!lt || !lt.title) return null;
  const style = LOWER_THIRD_STYLES.includes(String(lt.style)) ? String(lt.style) : 'bar';
  const atSec = Number(lt.atSec);
  const lenSec = Number(lt.durationSec);
  const a = Math.round((Number.isFinite(atSec) && atSec >= 0 ? atSec : 0.5) * fps);
  const len = Math.round((Number.isFinite(lenSec) && lenSec > 0 ? lenSec : 4.5) * fps);
  const b = Math.min(duration - 6, a + len);
  if (b <= a + 10) return null;
  const pin = ez(frame, a, a + 10);
  const pout = interpolate(frame, [b - 8, b], [0, 1], clamp);
  if (frame < a || pout >= 1) return null;
  const portrait = height > width;
  const pos: React.CSSProperties = portrait ? {top: height * 0.12} : {bottom: 130 * u};
  const left = 64 * u;
  const title = String(lt.title);
  const sub = lt.subtitle ? String(lt.subtitle) : '';
  const fsT = 46 * u;
  const fsS = 26 * u;
  if (style === 'tab') {
    return (
      <div style={{position: 'absolute', left, ...pos, display: 'flex', background: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `${8 * u}px ${8 * u}px 0 ${C.board}`, opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * 30 * u}px)`}}>
        <div style={{width: 16 * u, background: C.stamp}} />
        <div style={{padding: `${10 * u}px ${22 * u}px`}}>
          <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fsT, lineHeight: 1.1, color: C.board}}>{title}</div>
          {sub ? <div style={{fontFamily: FONT_MONO, fontSize: fsS, color: C.grey, marginTop: 4 * u}}>{sub}</div> : null}
        </div>
      </div>
    );
  }
  if (style === 'underline') {
    return (
      <div style={{position: 'absolute', left, ...pos, opacity: 1 - pout}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fsT * 1.1, lineHeight: 1.15, color: C.board, background: C.paper, padding: `0 ${8 * u}px`, clipPath: `inset(0 ${(1 - pin) * 100}% 0 0)`}}>{title}</div>
        <div style={{height: 6 * u, background: C.ink, width: `${ez(frame, a + 4, a + 16) * 100}%`}} />
        {sub ? <div style={{fontFamily: FONT_MONO, fontSize: fsS, color: C.board, background: C.paper, padding: `${4 * u}px ${8 * u}px`, display: 'inline-block', opacity: ez(frame, a + 10, a + 18)}}>{sub}</div> : null}
      </div>
    );
  }
  const subIn = ez(frame, a + 5, a + 15);
  return (
    <div style={{position: 'absolute', left, ...pos, opacity: 1 - pout, overflow: 'hidden', paddingRight: 8 * u}}>
      <div style={{display: 'inline-block', background: C.board, color: C.paper, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fsT, lineHeight: 1.15, padding: `${8 * u}px ${22 * u}px`, transform: `translateX(${(1 - pin) * -110}%)`}}>{title}</div>
      {sub ? (
        <div>
          <div style={{display: 'inline-block', background: C.ink, color: C.paper, fontFamily: FONT_MONO, fontSize: fsS, padding: `${6 * u}px ${22 * u}px`, transform: `translateX(${(1 - subIn) * -120}%)`}}>{sub}</div>
        </div>
      ) : null}
    </div>
  );
};

/** Scene kind 'chapter': visual {number?, title, label? (default Chapter)}: board card, big orange number, title. */
export const ChapterScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const raw = v.number === undefined || v.number === null ? '' : String(v.number);
  const num = /^\d$/.test(raw) ? '0' + raw : raw;
  const label = String(v.label || 'Chapter').toUpperCase();
  const title = String(v.title || scene.onScreenText || '');
  const p1 = ez(frame, 4, 16);
  const s = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 12}});
  const line = ez(frame, 14, 30);
  const t = ez(frame, 18, 30);
  const fsT = Math.min(110 * u, (width * 0.8) / (Math.max(1, title.length) * 0.55));
  return (
    <AbsoluteFill style={{backgroundColor: C.board, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{fontFamily: FONT_MONO, fontSize: 30 * u, letterSpacing: 8 * u, color: C.greyLight, opacity: p1}}>{label}</div>
        {num ? <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 200 * u, lineHeight: 1.05, color: C.stamp, transform: `scale(${s})`}}>{num}</div> : null}
        <div style={{width: width * 0.4 * line, height: 6 * u, background: C.paper, margin: `${20 * u}px 0`}} />
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fsT, lineHeight: 1.05, color: C.paper, opacity: t, transform: `translateY(${(1 - t) * 30 * u}px)`, textAlign: 'center', maxWidth: width * 0.85}}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};
