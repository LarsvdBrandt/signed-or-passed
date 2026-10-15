import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD} from '../constants';
import {clamp, useUnit} from '../components/common';
import type {Word} from '../types';

export const CAPTION_STYLES = ['bold-pop', 'karaoke-highlight', 'boxed', 'minimal'];

/**
 * Burned-in Shorts captions in a chosen style (spec.captionStyle). Without captionStyle the theme's own caption
 * style (components/common Captions) is used.
 *   bold-pop           3 big uppercase words, the active word pops in stamp orange
 *   karaoke-highlight  5 words, each fills with ink while it is spoken
 *   boxed              3 words in black boxes, the active box turns orange
 *   minimal            6 smaller words on a black strip, the active word in paper, the rest grey
 */
export const StyledCaptions: React.FC<{words: Word[]; captionStyle: string}> = ({words, captionStyle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  if (!words || !words.length) return null;
  let idx = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].startFrame <= frame) idx = i;
    else break;
  }
  if (idx < 0) return null;
  if (frame > words[idx].endFrame + 12) return null;
  const style = CAPTION_STYLES.includes(captionStyle) ? captionStyle : 'bold-pop';
  const size = style === 'minimal' ? 6 : style === 'karaoke-highlight' ? 5 : 3;
  const start = Math.floor(idx / size) * size;
  const chunk = words.slice(start, start + size);
  const wrap: React.CSSProperties = {position: 'absolute', left: 50 * u, right: 50 * u, top: '66%', textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, lineHeight: 1.12};
  if (style === 'karaoke-highlight') {
    return (
      <div style={{...wrap, fontSize: 82 * u}}>
        {chunk.map((w, i) => {
          const k = start + i;
          const p = k < idx ? 1 : k > idx ? 0 : interpolate(frame, [w.startFrame, Math.max(w.startFrame + 1, w.endFrame)], [0, 1], clamp);
          return (
            <span key={k} style={{position: 'relative', display: 'inline-block', margin: `0 ${12 * u}px`}}>
              <span style={{color: C.paper, WebkitTextStroke: `${5 * u}px ${C.board}`, paintOrder: 'stroke fill'}}>{w.text}</span>
              <span style={{position: 'absolute', left: 0, top: 0, color: C.ink, WebkitTextStroke: `${5 * u}px ${C.board}`, paintOrder: 'stroke fill', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>{w.text}</span>
            </span>
          );
        })}
      </div>
    );
  }
  if (style === 'boxed') {
    return (
      <div style={{...wrap, fontSize: 84 * u, textTransform: 'uppercase'}}>
        {chunk.map((w, i) => {
          const k = start + i;
          const active = k === idx;
          return (
            <span key={k} style={{display: 'inline-block', margin: 8 * u, padding: `${6 * u}px ${18 * u}px`, background: active ? C.stamp : C.board, color: C.paper, transform: active ? 'rotate(-2deg) scale(1.06)' : 'none'}}>
              {w.text}
            </span>
          );
        })}
      </div>
    );
  }
  if (style === 'minimal') {
    return (
      <div style={{...wrap, top: '72%', fontSize: 56 * u, fontWeight: 600}}>
        <div style={{display: 'inline-block', background: C.board, padding: `${10 * u}px ${24 * u}px`}}>
          {chunk.map((w, i) => {
            const k = start + i;
            return (
              <span key={k} style={{color: k === idx ? C.paper : C.grey, marginRight: i < chunk.length - 1 ? 14 * u : 0}}>
                {w.text}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div style={{...wrap, fontSize: 104 * u, textTransform: 'uppercase', WebkitTextStroke: `${6 * u}px ${C.board}`, paintOrder: 'stroke fill', textShadow: `0 ${8 * u}px 0 ${C.board}`}}>
      {chunk.map((w, i) => {
        const k = start + i;
        const active = k === idx;
        const s = active ? spring({frame: Math.max(0, frame - w.startFrame), fps, config: {damping: 10, stiffness: 220}}) : 1;
        return (
          <span key={k} style={{display: 'inline-block', margin: `0 ${14 * u}px`, color: active ? C.stamp : C.paper, transform: `scale(${active ? 0.8 + 0.35 * s : 1})`}}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
