import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {clamp, usePortrait, useUnit} from '../components/common';
import type {SceneProps} from '../types';

const Button: React.FC<{label: string; colour: string; f: number; u: number}> = ({label, colour, f, u}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: Math.max(0, f), fps, config: {damping: 11}});
  return (
    <div style={{transform: `scale(${p})`, background: colour, color: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `${10 * u}px ${10 * u}px 0 ${C.board}`, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 72 * u, letterSpacing: 4 * u, padding: `${18 * u}px ${64 * u}px`, borderRadius: 14 * u}}>
      {label}
    </div>
  );
};

export const QuestionScene: React.FC<SceneProps & {background?: React.ReactNode}> = ({scene, background}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const hold = Math.round((v.holdSec ?? 3) * fps);
  const cdStart = scene.durationFrames - hold;
  const desat = interpolate(frame, [0, 10], [0, 1], clamp);
  const pop = spring({frame: Math.max(0, frame - 4), fps, config: {damping: 12}});
  const opts: string[] = v.options && v.options.length === 2 ? v.options : ['SIGN', 'PASS'];
  const cd = frame - cdStart;
  const n = hold > 0 && cd >= 0 ? Math.max(1, Math.ceil((hold - cd) / fps)) : null;
  const ring = n !== null ? 1 - (cd % fps) / fps : 0;
  const R = 70 * u;
  const circ = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      {background ? <AbsoluteFill style={{filter: `grayscale(${desat}) brightness(${1 - 0.5 * desat})`}}>{background}</AbsoluteFill> : null}
      <AbsoluteFill style={{backgroundColor: `rgba(20,20,20,${0.45 * desat})`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 80 * u}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: (portrait ? 130 : 150) * u, lineHeight: 1, color: C.paper, textAlign: 'center', transform: `scale(${0.7 + 0.3 * pop})`, opacity: pop}}>Would you sign?</div>
        {v.question ? (
          <div style={{marginTop: 30 * u, fontFamily: FONT_MONO, fontSize: 40 * u, color: C.greyLight, textAlign: 'center', maxWidth: '85%', opacity: interpolate(frame, [10, 20], [0, 1], clamp)}}>{v.question}</div>
        ) : null}
        <div style={{display: 'flex', flexDirection: 'row', gap: 60 * u, marginTop: 60 * u}}>
          <Button label={opts[0]} colour={C.ink} f={frame - 14} u={u} />
          <Button label={opts[1]} colour={C.stamp} f={frame - 19} u={u} />
        </div>
        <div style={{height: 2 * R + 20 * u, marginTop: 50 * u, position: 'relative', width: 2 * R + 20 * u}}>
          {n !== null ? (
            <>
              <svg width={2 * R + 20 * u} height={2 * R + 20 * u} style={{position: 'absolute', left: 0, top: 0}}>
                <circle cx={R + 10 * u} cy={R + 10 * u} r={R} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
                <circle cx={R + 10 * u} cy={R + 10 * u} r={R} fill="none" stroke={C.stamp} strokeWidth={10 * u} strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-90 ${R + 10 * u} ${R + 10 * u})`} />
              </svg>
              <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 84 * u, color: C.board}}>{n}</div>
            </>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
