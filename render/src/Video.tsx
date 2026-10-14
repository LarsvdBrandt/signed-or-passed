import React from 'react';
import {AbsoluteFill, Easing, Freeze, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, TRANSITION_FRAMES} from './constants';
import {Captions, DateTag, PaperGrain, clamp} from './components/common';
import type {Scene, VideoProps} from './types';
import {LessonScene, RevealScene, TitleScene} from './scenes/TextScenes';
import {ChartScene, CounterScene, TimelineScene} from './scenes/DataScenes';
import {MapScene} from './scenes/MapScene';
import {EvidenceScene, QuoteScene} from './scenes/QuoteEvidence';
import {QuestionScene} from './scenes/QuestionScene';
import {VerdictScene} from './scenes/VerdictScene';
import {IllustrationScene} from './scenes/IllustrationScene';

export const SceneContent: React.FC<{scene: Scene; prev?: Scene; ctx: VideoProps}> = ({scene, prev, ctx}) => {
  switch (scene.kind) {
    case 'title':
      return <TitleScene scene={scene} ctx={ctx} />;
    case 'illustration':
      return <IllustrationScene scene={scene} ctx={ctx} />;
    case 'evidence':
      return <EvidenceScene scene={scene} ctx={ctx} />;
    case 'chart':
      return <ChartScene scene={scene} ctx={ctx} />;
    case 'counter':
      return <CounterScene scene={scene} ctx={ctx} />;
    case 'timeline':
      return <TimelineScene scene={scene} ctx={ctx} />;
    case 'map':
      return <MapScene scene={scene} ctx={ctx} />;
    case 'quote':
      return <QuoteScene scene={scene} ctx={ctx} />;
    case 'reveal':
      return <RevealScene scene={scene} ctx={ctx} />;
    case 'lesson':
      return <LessonScene scene={scene} ctx={ctx} />;
    case 'verdict':
      return <VerdictScene scene={scene} ctx={ctx} />;
    case 'question': {
      const bg =
        prev && prev.kind !== 'question' ? (
          <Freeze frame={Math.max(0, prev.durationFrames - 1)}>
            <SceneContent scene={prev} ctx={ctx} />
          </Freeze>
        ) : null;
      return <QuestionScene scene={scene} ctx={ctx} background={bg} />;
    }
    default:
      return <TitleScene scene={{...scene, visual: {title: scene.onScreenText || scene.kind}}} ctx={ctx} />;
  }
};

const Camera: React.FC<{motion?: string | null; duration: number; children: React.ReactNode}> = ({motion, duration, children}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, Math.max(1, duration)], [0, 1], clamp);
  let t = '';
  if (motion === 'push-in') t = `scale(${1 + 0.08 * p})`;
  else if (motion === 'pull-out') t = `scale(${1.08 - 0.08 * p})`;
  else if (motion === 'pan-left') t = `scale(1.06) translateX(${2.5 - 5 * p}%)`;
  else if (motion === 'pan-right') t = `scale(1.06) translateX(${-2.5 + 5 * p}%)`;
  return <AbsoluteFill style={{transform: t}}>{children}</AbsoluteFill>;
};

/** Paper-slide transition: each new scene slides in over the previous one like a new sheet. */
const SceneFrame: React.FC<{scene: Scene; prev?: Scene; index: number; ctx: VideoProps}> = ({scene, prev, index, ctx}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const p = index === 0 ? 1 : interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const x = (1 - p) * width * 1.05;
  const rot = (1 - p) * 2.5;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px) rotate(${rot}deg)`, transformOrigin: 'left bottom', backgroundColor: C.paper, overflow: 'hidden', boxShadow: p < 1 ? '-18px 0 0 rgba(20,20,20,0.18)' : 'none'}}>
      <Camera motion={scene.motion} duration={scene.durationFrames}>
        <SceneContent scene={scene} prev={prev} ctx={ctx} />
      </Camera>
    </AbsoluteFill>
  );
};

export const VideoMain: React.FC<VideoProps> = (props) => {
  const scenes = props.scenes || [];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {scenes.map((sc, i) => {
        const last = i === scenes.length - 1;
        return (
          <Sequence key={sc.id} name={`${sc.kind}:${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationFrames + (last ? 0 : TRANSITION_FRAMES)}>
            <SceneFrame scene={sc} prev={scenes[i - 1]} index={i} ctx={props} />
          </Sequence>
        );
      })}
      <PaperGrain />
      <DateTag scenes={scenes} />
      {props.format === 'short' ? <Captions words={props.words} /> : null}
    </AbsoluteFill>
  );
};
