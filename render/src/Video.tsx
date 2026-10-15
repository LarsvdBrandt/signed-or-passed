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
import {InfographicScene} from './infographics';
import {KineticTextScene} from './typography';
import {ChapterScene, LowerThird} from './typography/overlays';
import {StyledCaptions} from './typography/captions';
import {TemplateScene} from './templates';
import {applyTheme, currentTheme} from './themes';
import {ThemeDefs, ThemeOverlay, themeContentStyle} from './themes/ThemeLayer';
import {EffectsStack, resolveEffects} from './effects';
import {TransitionLayer, resolveTransition, type ResolvedTransition} from './transitions';
import {isParallax} from './transitions/parallax';
import {BeatCamera, BeatOverlays, swapsOf} from './retention/beats';
import {KeywordLayer} from './retention/keywords';
import {COLD_OPEN_FLASH_FRAMES, COLD_OPEN_FLASH_LEAD, ColdOpenFlash, ColdOpenLayer, coldOpenOf} from './retention/coldopen';

export const SceneContent: React.FC<{scene: Scene; prev?: Scene; ctx: VideoProps}> = ({scene, prev, ctx}) => {
  const v = scene.visual || {};
  switch (scene.kind) {
    case 'title':
      return <TitleScene scene={scene} ctx={ctx} />;
    case 'illustration':
      return <IllustrationScene scene={scene} ctx={ctx} />;
    case 'template':
      return <TemplateScene scene={scene} ctx={ctx} />;
    case 'evidence':
      return <EvidenceScene scene={scene} ctx={ctx} />;
    case 'chart':
      return v.type === 'line' ? <LineChartScene scene={scene} ctx={ctx} /> : <ChartScene scene={scene} ctx={ctx} />;
    case 'counter':
      return v.style === 'money' ? <MoneyCounterScene scene={scene} ctx={ctx} /> : <CounterScene scene={scene} ctx={ctx} />;
    case 'infographic':
      return <InfographicScene scene={scene} ctx={ctx} />;
    case 'kinetic-text':
      return <KineticTextScene scene={scene} ctx={ctx} />;
    case 'chapter':
      return <ChapterScene scene={scene} ctx={ctx} />;
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

/** Camera move over a scene. motion: 'push-in' | 'pull-out' | 'pan-left' | 'pan-right' | 'pan' or {type, strength}. 'parallax*' is handled per layer by IllustrationScene. */
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

/** Paper-slide transition: a new sheet slides in over the previous one (used by the end card and older previews). */
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

/** The scene content; 'swap' beats replace it with another visual layer (hard cut) from their frame on. */
const SwappableContent: React.FC<{scene: Scene; prev?: Scene; ctx: VideoProps}> = ({scene, prev, ctx}) => {
  const swaps = swapsOf(scene);
  if (!swaps.length) return <SceneContent scene={scene} prev={prev} ctx={ctx} />;
  const parts = [{from: 0, sc: scene}, ...swaps.map((b) => ({from: b.frame, sc: {...scene, kind: b.kind || scene.kind, visual: b.visual, onScreenText: b.onScreenText ?? scene.onScreenText}}))];
  return (
    <>
      {parts.map((p, i) => {
        const until = i + 1 < parts.length ? parts[i + 1].from : scene.durationFrames + 30;
        const shifted = {...p.sc, sentences: (scene.sentences || []).map((x) => ({...x, startFrame: x.startFrame - p.from, endFrame: x.endFrame - p.from}))};
        return (
          <Sequence key={i} name={i ? `swap:${i}` : 'visual'} from={p.from} durationInFrames={Math.max(1, until - p.from)}>
            <AbsoluteFill style={{backgroundColor: C.paper}}>
              <SceneContent scene={shifted} prev={prev} ctx={ctx} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * One scene on its paper sheet: entering transition (scenes[].transition / spec.transition, render/src/transitions),
 * the exit move of the next scene's transition, theme filter, camera move, the lower third (scenes[].lowerThird,
 * not moved by the camera), then the effects (spec.look + scenes[].effects).
 */
const SceneFrame: React.FC<{scene: Scene; prev?: Scene; enter: ResolvedTransition | null; exit: ResolvedTransition | null; ctx: VideoProps}> = ({scene, prev, enter, exit, ctx}) => (
  <TransitionLayer enter={enter} exit={exit} exitAt={scene.durationFrames} seed={scene.id}>
    <EffectsStack effects={resolveEffects(ctx.look, scene.effects)} seed={scene.id} duration={scene.durationFrames}>
      <AbsoluteFill style={themeContentStyle()}>
        <ColdOpenLayer cfg={coldOpenOf(scene, ctx.fps || 30)} duration={scene.durationFrames}>
          <BeatCamera scene={scene} ctx={ctx}>
            <Camera motion={scene.kind === 'illustration' && isParallax(motionOf(scene.motion).type) ? null : scene.motion} duration={scene.durationFrames}>
              <SwappableContent scene={scene} prev={prev} ctx={ctx} />
            </Camera>
          </BeatCamera>
        </ColdOpenLayer>
        <BeatOverlays scene={scene} />
        {scene.lowerThird ? <LowerThird lt={scene.lowerThird} duration={scene.durationFrames} /> : null}
      </AbsoluteFill>
    </EffectsStack>
  </TransitionLayer>
);

export const VideoMain: React.FC<VideoProps> = (props) => {
  applyTheme(props.theme);
  const frame = useCurrentFrame();
  const fps = props.fps || 30;
  const scenes = props.scenes || [];
  const intro = Math.max(0, Math.round(props.introFrames || 0));
  // RETENTION-3: the sting starts at introAtFrame (right after the hook); 0 = before the first scene (legacy props)
  const introAt = intro > 0 ? Math.max(0, Math.round(props.introAtFrame || 0)) : 0;
  const introEnd = introAt + intro;
  const outro = Math.max(0, Math.round(props.outroFrames || 0));
  const lastScene = scenes[scenes.length - 1];
  const lastEnd = lastScene ? lastScene.startFrame + lastScene.durationFrames : introEnd;
  const total = Math.max(1, Math.round(props.totalFrames || lastEnd + outro));
  const outroStart = Math.max(0, Math.min(lastEnd, total - 1));
  const firstStart = scenes.length ? scenes[0].startFrame : 0;
  const inSting = intro > 0 && frame >= introAt && frame < introEnd;
  const inBody = frame >= firstStart && frame < lastEnd && !inSting;
  // the scene that ends where the sting starts (hard cut into the sting), and the one that enters over it
  const beforeSting = intro > 0 && introAt > 0 ? scenes.findIndex((sc) => sc.startFrame + sc.durationFrames >= introAt) : -1;
  const afterSting = intro > 0 ? (introAt > 0 ? beforeSting + 1 : 0) : -1;
  // the transition INTO each scene (none for the very first scene when no sting precedes it)
  const enters: Array<ResolvedTransition | null> = scenes.map((sc, i) => (i > 0 || afterSting === 0 ? resolveTransition(sc.transition, props.transition, fps) : null));
  const stingEnter = afterSting >= 0 && afterSting < scenes.length ? enters[afterSting] : null;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <ThemeDefs />
      {intro > 0 ? (
        <Sequence name="brand-intro" from={introAt} durationInFrames={intro + (stingEnter ? stingEnter.frames : TRANSITION_FRAMES)}>
          <BrandIntro frames={intro} />
        </Sequence>
      ) : null}
      {scenes.map((sc, i) => {
        const last = i === scenes.length - 1;
        const next = !last && i !== beforeSting ? enters[i + 1] : null;
        // the outgoing scene stays visible under the next scene's transition
        const extra = i === beforeSting ? 0 : next ? next.frames : outro > 0 ? TRANSITION_FRAMES : 0;
        return (
          <Sequence key={sc.id} name={`${sc.kind}:${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationFrames + extra}>
            <SceneFrame scene={sc} prev={scenes[i - 1]} enter={enters[i]} exit={next} ctx={props} />
          </Sequence>
        );
      })}
      {outro > 0 ? (
        <Sequence name="end-card" from={outroStart} durationInFrames={Math.max(1, total - outroStart)}>
          <PaperSheet slide>
            <EndCard teaser={props.nextTeaser} />
          </PaperSheet>
        </Sequence>
      ) : null}
      {scenes.map((sc) => {
        const co = coldOpenOf(sc, fps);
        if (!co || !co.flash) return null;
        const end = sc.startFrame + sc.durationFrames;
        return (
          <Sequence key={`flash-${sc.id}`} name={`cold-open-flash:${sc.id}`} from={Math.max(0, end - COLD_OPEN_FLASH_LEAD)} durationInFrames={COLD_OPEN_FLASH_FRAMES}>
            <ColdOpenFlash />
          </Sequence>
        );
      })}
      <ThemeOverlay />
      {inBody ? <DateTag scenes={scenes} /> : null}
      {inBody ? <Watermark /> : null}
      {inBody ? <KeywordLayer ctx={props} /> : null}
      {props.format === 'short' ? props.captionStyle ? <StyledCaptions words={props.words} captionStyle={props.captionStyle} /> : <Captions words={props.words} /> : null}
    </AbsoluteFill>
  );
};
