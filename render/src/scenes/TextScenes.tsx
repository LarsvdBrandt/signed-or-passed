import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {clamp, usePortrait, useUnit} from '../components/common';
import {DashedRule} from '../components/brand';
import type {SceneProps} from '../types';

/** Title card in the style of the channel banner: dashed grey rules, heavy Bricolage title, mono subtitle. */
export const TitleScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const title = String(v.title || '');
  const p = spring({frame: Math.max(0, frame - 6), fps, config: {damping: 16}});
  const rule = interpolate(frame, [0, 18], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  const sub = interpolate(frame, [18, 30], [0, 1], clamp);
  const longest = Math.max(4, ...title.split(/\s+/).map((w) => w.length));
  const size = Math.min((portrait ? 130 : 150) * u, (width * 0.84) / (longest * 0.56), title.length > 22 ? 120 * u : 1e9);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center'}}>
      <DashedRule top={portrait ? '30%' : '24%'} progress={rule} />
      <DashedRule top={portrait ? '70%' : '76%'} progress={rule} fromRight />
      <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: size, lineHeight: 0.98, letterSpacing: -2 * u, color: C.board, textAlign: 'center', maxWidth: '88%', transform: `translateY(${(1 - p) * 60 * u}px)`, opacity: p}}>
        {title}
      </div>
      {v.subtitle ? (
        <div style={{fontFamily: FONT_MONO, fontSize: 38 * u, letterSpacing: 1 * u, color: C.board, marginTop: 34 * u, opacity: sub, textAlign: 'center', maxWidth: '80%'}}>{v.subtitle}</div>
      ) : null}
    </AbsoluteFill>
  );
};

const WordsIn: React.FC<{text: string; start: number; size: number; colour: string}> = ({text, start, size, colour}) => {
  const frame = useCurrentFrame();
  const words = (text || '').split(/\s+/).filter(Boolean);
  return (
    <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.08, color: colour, textAlign: 'center'}}>
      {words.map((w, i) => {
        const o = interpolate(frame, [start + i * 3, start + i * 3 + 8], [0, 1], clamp);
        return (
          <span key={i} style={{display: 'inline-block', marginRight: size * 0.25, opacity: o, transform: `translateY(${(1 - o) * 24}px)`}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const RevealScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const v = scene.visual || {};
  const bar = interpolate(frame, [8, 26], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center', padding: 120 * u}}>
      <div style={{fontFamily: FONT_MONO, fontSize: 30 * u, letterSpacing: 6 * u, color: C.grey, marginBottom: 30 * u}}>WHAT HAPPENED</div>
      <div style={{position: 'relative'}}>
        <div style={{position: 'absolute', left: -20 * u, right: -20 * u, bottom: 4 * u, height: '38%', background: C.greyLight, transform: `scaleX(${bar})`, transformOrigin: 'left center'}} />
        <div style={{position: 'relative'}}>
          <WordsIn text={v.text} start={4} size={96 * u} colour={C.board} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const LessonScene: React.FC<SceneProps> = ({scene}) => {
  const u = useUnit();
  const v = scene.visual || {};
  return (
    <AbsoluteFill style={{backgroundColor: C.board, justifyContent: 'center', alignItems: 'center', padding: 120 * u}}>
      <div style={{fontFamily: FONT_MONO, fontSize: 30 * u, letterSpacing: 6 * u, color: C.greyLight, marginBottom: 36 * u}}>THE LESSON</div>
      <WordsIn text={v.text} start={6} size={88 * u} colour={C.paper} />
    </AbsoluteFill>
  );
};
