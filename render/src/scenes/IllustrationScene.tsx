import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, colourOf} from '../constants';
import {Kicker} from '../components/common';
import {BACKDROPS, Layer} from '../illustrations';
import type {SceneProps} from '../types';

export const IllustrationScene: React.FC<SceneProps> = ({scene}) => {
  const v = scene.visual || {};
  const bg: string = v.background || 'paper';
  const Backdrop = BACKDROPS[bg];
  const dark = !Backdrop && (bg === 'board' || bg === 'ink' || bg === 'stamp');
  return (
    <AbsoluteFill style={{backgroundColor: Backdrop ? C.paper : colourOf(bg, C.paper)}}>
      {Backdrop ? <Backdrop /> : null}
      {(v.layers || []).map((l: any, i: number) => (
        <Layer key={i} layer={l} />
      ))}
      <Kicker text={scene.onScreenText} dark={dark} />
    </AbsoluteFill>
  );
};
