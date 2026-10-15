import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {C, FONT_MONO} from '../constants';
import {useUnit} from '../components/common';
import {useT} from '../illustrations/kit';
import {SHOTS} from '../moods';
import type {SceneProps} from '../types';

/** Scene kind 'shot': visual {shot, props?, label?} plays a mood shot from render/src/moods. */
export const ShotScene: React.FC<SceneProps> = ({scene}) => {
  const t = useT();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const def = SHOTS[String(v.shot)] || SHOTS.QuestionMarks;
  const S = def.component;
  const dur = Math.max(1, scene.durationFrames) / fps;
  const bg = def.bg === 'board' ? C.board : def.bg === 'greyLight' ? C.greyLight : C.paper;
  const dark = def.bg === 'board';
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <S t={t} dur={dur} p={v.props || {}} />
      {v.label ? (
        <div style={{position: 'absolute', top: 56 * u, left: 0, right: 0, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 34 * u, letterSpacing: 4 * u, color: dark ? C.greyLight : C.board}}>
          {String(v.label).toUpperCase()}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
