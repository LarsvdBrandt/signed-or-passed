import React from 'react';
import {AbsoluteFill, Easing, Freeze, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, TRANSITION_FRAMES} from './constants';
import {Captions, DateTag, clamp} from './components/common';
import {BrandIntro, EndCard, Watermark} from './components/brand';
import type {Scene, VideoProps} from './types';
import {LessonScene, RevealScene, TitleScene} from './scenes/TextScenes';
import {ChartScene, CounterScene, TimelineScene} from './scenes/DataScenes';
import {MapScene} from './scenes/MapScene';
import {CityScene} from './scenes/CityScene';
import {EvidenceScene, QuoteScene} from './scenes/QuoteEvidence';
import {QuestionScene} from './scenes/QuestionScene';
import {VerdictScene} from './scenes/VerdictScene';
import {IllustrationScene, motionOf} from './scenes/IllustrationScene';
import {DocumentScene, GrowthScene, LineChartScene, MoneyCounterScene, PhotoWallScene, SplitFlapScene, VersusScene} from './scenes/MotionScenes';
import {ShotScene} from './scenes/ShotScene';
import {applyTheme, currentTheme} from './themes';
import {ThemeDefs, ThemeOverlay, themeContentStyle} from './themes/ThemeLayer';

export const SceneContent: React.FC<{scene: Scene; prev?: Scene; ctx: VideoProps}> = ({scene, prev, ctx}) => {
  const v = scene.visual || {};
  switch (scene.kind) {
    case 'title':
      return <TitleScene scene={scene} ctx={ctx} />;
    case 'illustration':
      return <IllustrationScene scene={scene} ctx={ctx} />;
    case 'evidence':
      return <EvidenceScene scene={scene} ctx={ctx} />;
    case 'chart':
      return v.type === 'line' ? <LineChartScene scene={scene} ctx={ctx} /> : <ChartScene scene={scene} ctx={ctx} />;
    case 'counter':
      return v.style === 'money' ? <MoneyCounterScene scene={scene} ctx={ctx} /> : <CounterScene scene={scene} ctx={ctx} />;
    case 'timeline':
      return <TimelineScene scene={scene} ctx={ctx} />;
    case 'map':
      return <MapScene scene={scene} ctx={ctx} />;
    case 'city':
      return <CityScene scene={scene} ctx={ctx} />;
    case 'versus':
      return <VersusScene scene={scene} ctx={ctx} />;
    case 'growth':
      return <GrowthScene scene={scene} ctx={ctx} />;
    case 'split-flap':
      return <SplitFlapScene scene={scene} ctx={ctx} />;
    case 'document':
      return <DocumentScene scene={scene} ctx={ctx} />;
    case 'photo-wall':
      return <PhotoWallScene scene={scene} ctx={ctx} />;
    case 'shot':
      return <ShotScene scene={scene} ctx={ctx} />;
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

/** Camera move over a scene. motion: 'push-in' | 'pull-out' | 'pan-left' | 'pan-right' | 'pan' or {type, strength}. 'parallax' is handled per layer by IllustrationScene. */
const Camera: React.FC<{motion?: any; duration: number; children: React.ReactNode}> = ({motion, duration, children}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, Math.max(1, duration)], [0, 1], clamp);
  const m = motionOf(motion);
  const k = m.strength;
  let t = '';
  if (m.type === 'push-in') t = `scale(${1 + 0.08 * k * p})`;
  else if (m.type === 'pull-out') t = `scale(${1 + 0.08 * k - 0.08 * k * p})`;
  else if (m.type === 'pan-left') t = `scale(${1 + 0.06 * k}) translateX(${2.5 * k - 5 * k * p}%)`;
  else if (m.type === 'pan-right' || m.type === 'pan') t = `scale(${1 + 0.06 * k}) translateX(${-2.5 * k + 5 * k * p}%)`;
  return <AbsoluteFill style={{transform: t || undefined}}>{children}</AbsoluteFill>;
};

/** Paper-slide transition: a new sheet slides in over the previous one. */
export const PaperSheet: React.FC<{slide: boolean; children: React.ReactNode}> = ({slide, children}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const p = !slide ? 1 : interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const x = (1 - p) * width * 1.05;
  const rot = (1 - p) * 2.5;
  const shadow = currentTheme().sheetShadow;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px) rotate(${rot}deg)`, transformOrigin: 'left bottom', backgroundColor: C.paper, overflow: 'hidden', boxShadow: p < 1 ? `-18px 0 0 ${shadow}` : 'none'}}>
      {children}
    </AbsoluteFill>
  );
};

const SceneFrame: React.FC<{scene: Scene; prev?: Scene; slide: boolean; ctx: VideoProps}> = ({scene, prev, slide, ctx}) => (
  <PaperSheet slide={slide}>
    <AbsoluteFill style={themeContentStyle()}>
      <Camera motion={scene.kind === 'illustration' && motionOf(scene.motion).type === 'parallax' ? null : scene.motion} duration={scene.durationFrames}>
        <SceneContent scene={scene} prev={prev} ctx={ctx} />
      </Camera>
    </AbsoluteFill>
  </PaperSheet>
);

export const VideoMain: React.FC<VideoProps> = (props) => {
  applyTheme(props.theme);
  const frame = useCurrentFrame();
  const scenes = props.scenes || [];
  const intro = Math.max(0, Math.round(props.introFrames || 0));
  const outro = Math.max(0, Math.round(props.outroFrames || 0));
  const lastScene = scenes[scenes.length - 1];
  const lastEnd = lastScene ? lastScene.startFrame + lastScene.durationFrames : intro;
  const total = Math.max(1, Math.round(props.totalFrames || lastEnd + outro));
  const outroStart = Math.max(0, Math.min(lastEnd, total - 1));
  const inBody = frame >= intro && frame < lastEnd;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <ThemeDefs />
      {intro > 0 ? (
        <Sequence name="brand-intro" from={0} durationInFrames={intro + TRANSITION_FRAMES}>
          <BrandIntro />
        </Sequence>
      ) : null}
      {scenes.map((sc, i) => {
        const last = i === scenes.length - 1;
        const extra = !last || outro > 0 ? TRANSITION_FRAMES : 0;
        return (
          <Sequence key={sc.id} name={`${sc.kind}:${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationFrames + extra}>
            <SceneFrame scene={sc} prev={scenes[i - 1]} slide={i > 0 || intro > 0} ctx={props} />
          </Sequence>
        );
      })}
      {outro > 0 ? (
        <Sequence name="end-card" from={outroStart} durationInFrames={Math.max(1, total - outroStart)}>
          <PaperSheet slide>
            <EndCard />
          </PaperSheet>
        </Sequence>
      ) : null}
      <ThemeOverlay />
      {inBody ? <DateTag scenes={scenes} /> : null}
      {inBody ? <Watermark /> : null}
      {props.format === 'short' ? <Captions words={props.words} /> : null}
    </AbsoluteFill>
  );
};
