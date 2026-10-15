import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {useT} from '../illustrations/kit';
import {SHOTS, SHOT_IDS, type ShotDef} from '../moods';

const PER = 120;
export const MOOD_PREVIEW_FRAMES = Math.max(1, PER * SHOT_IDS.length);

const Block: React.FC<{def: ShotDef}> = ({def}) => {
  const t = useT();
  const S = def.component;
  const bg = def.bg === 'board' ? C.board : def.bg === 'greyLight' ? C.greyLight : C.paper;
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <S t={t} dur={PER / 30} p={def.demo || {}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, padding: '0 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'center', gap: 24}}>
        <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44}}>{def.id}</span>
        <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.85}}>
          mood: {def.mood} · {def.description} · props: {def.props}
        </span>
      </div>
    </AbsoluteFill>
  );
};

/** Every mood shot for 4 s with its id, mood and props. Rendered as preview-moods.mp4. */
export const MoodPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {SHOT_IDS.map((id, i) => (
      <Sequence key={id} name={`shot:${id}`} from={i * PER} durationInFrames={PER}>
        <Block def={SHOTS[id]} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
