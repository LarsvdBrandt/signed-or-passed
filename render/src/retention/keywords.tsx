import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD} from '../constants';
import {Captions, clamp, useUnit} from '../components/common';
import {StyledCaptions} from '../typography/captions';
import type {Keyword, VideoProps} from '../types';

/**
 * Kinetic keywords (RETENTION-2): numbers, amounts, years and **emphasis** words of the narration as big animated
 * text in the lower third, timed to the word (props.keywords from pipeline/retention.py).
 * spec.captions.long: keywords (default) | full (word-by-word captions like the Shorts, spec.captions.style or
 * spec.captionStyle) | off. spec.captions.style for keywords: stamp (default) | ink | board.
 */
const STYLE_BG: Record<string, () => string> = {stamp: () => C.stamp, ink: () => C.ink, board: () => C.board};

const KeywordCard: React.FC<{k: Keyword; style?: string}> = ({k, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const f = frame - k.startFrame;
  const dur = k.endFrame - k.startFrame;
  const sp = spring({frame: f, fps, config: {damping: 10, stiffness: 200, mass: 0.55}});
  const out = interpolate(f, [dur - 5, dur], [1, 0], clamp);
  const lift = interpolate(f, [dur - 5, dur], [0, -30], clamp) * u;
  const emphasis = k.kind === 'emphasis';
  const bgFn = STYLE_BG[style || ''] || (emphasis ? STYLE_BG.stamp : STYLE_BG.board);
  const len = Math.max(4, k.text.length);
  const fs = Math.min(emphasis ? 120 : 132, 1700 / len) * u;
  const tilt = (k.startFrame % 2 ? 1 : -1) * 2;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '64%', textAlign: 'center', opacity: out, transform: `translateY(${lift}px)`, pointerEvents: 'none'}}>
      <span
        style={{
          display: 'inline-block',
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: fs,
          lineHeight: 1.04,
          textTransform: 'uppercase',
          color: emphasis || style ? C.paper : C.ink,
          background: bgFn(),
          padding: `${8 * u}px ${28 * u}px`,
          boxShadow: `${9 * u}px ${9 * u}px 0 ${emphasis ? C.board : C.stamp}`,
          transform: `scale(${0.35 + 0.65 * sp}) rotate(${tilt * (2 - sp)}deg)`,
        }}
      >
        {k.text}
      </span>
    </div>
  );
};

export const KeywordLayer: React.FC<{ctx: VideoProps}> = ({ctx}) => {
  const frame = useCurrentFrame();
  const mode = (ctx.captions && ctx.captions.long) || 'keywords';
  if (ctx.format === 'short' || mode === 'off') return null;
  if (mode === 'full') {
    const style = (ctx.captions && ctx.captions.style) || ctx.captionStyle;
    return style ? <StyledCaptions words={ctx.words} captionStyle={style} /> : <Captions words={ctx.words} />;
  }
  const k = (ctx.keywords || []).find((x) => frame >= x.startFrame && frame < x.endFrame);
  return k ? <KeywordCard key={`${k.startFrame}`} k={k} style={ctx.captions && ctx.captions.style} /> : null;
};
