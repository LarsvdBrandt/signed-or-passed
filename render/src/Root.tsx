import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {VideoMain} from './Video';
import {Thumbnail} from './compositions/Thumbnail';
import {PREVIEW_FRAMES, Preview} from './compositions/Preview';
import {THEME_PREVIEW_FRAMES, ThemePreview} from './compositions/ThemePreview';
import {ERA_PREVIEW_FRAMES, EraPreview} from './compositions/EraPreview';
import {MOOD_PREVIEW_FRAMES, MoodPreview} from './compositions/MoodPreview';
import {SoundBoard, soundBoardDefaults} from './compositions/SoundBoard';
import {sampleLong, sampleShort} from './sample-props';
import {applyTheme} from './themes';
import type {VideoProps} from './types';

loadFonts();

const calc = ({props}: {props: VideoProps}) => ({
  durationInFrames: Math.max(1, Math.round(props.totalFrames || 1)),
  fps: props.fps || 30,
});

const calcBoard = ({props}: {props: any}) => ({
  durationInFrames: Math.max(1, Math.round((props && props.totalFrames) || 1)),
  fps: 30,
});

const AnyVideo = VideoMain as React.FC<any>;

/** The thumbnail follows spec.theme too. */
const ThemedThumb: React.FC<any> = (props) => {
  applyTheme(props.theme);
  const T = Thumbnail as React.FC<any>;
  return <T {...props} />;
};

const DefaultThemed: React.FC<{children: React.ReactNode}> = ({children}) => {
  applyTheme(null);
  return <>{children}</>;
};

const PreviewDefault: React.FC = () => (
  <DefaultThemed>
    <Preview />
  </DefaultThemed>
);

const EraPreviewDefault: React.FC = () => (
  <DefaultThemed>
    <EraPreview />
  </DefaultThemed>
);

const MoodPreviewDefault: React.FC = () => (
  <DefaultThemed>
    <MoodPreview />
  </DefaultThemed>
);

const SoundBoardDefault: React.FC<any> = (props) => (
  <DefaultThemed>
    <SoundBoard {...props} />
  </DefaultThemed>
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="LongVideo" component={AnyVideo} width={1920} height={1080} fps={30} durationInFrames={sampleLong.totalFrames} defaultProps={sampleLong as any} calculateMetadata={calc as any} />
      <Composition id="ShortVideo" component={AnyVideo} width={1080} height={1920} fps={30} durationInFrames={sampleShort.totalFrames} defaultProps={sampleShort as any} calculateMetadata={calc as any} />
      <Composition id="Thumbnail" component={ThemedThumb} width={1280} height={720} fps={30} durationInFrames={90} defaultProps={sampleLong as any} />
      <Composition id="Preview" component={PreviewDefault} width={1920} height={1080} fps={30} durationInFrames={PREVIEW_FRAMES} />
      <Composition id="ThemePreview" component={ThemePreview} width={1920} height={1080} fps={30} durationInFrames={THEME_PREVIEW_FRAMES} />
      <Composition id="EraPreview" component={EraPreviewDefault} width={1920} height={1080} fps={30} durationInFrames={ERA_PREVIEW_FRAMES} />
      <Composition id="MoodPreview" component={MoodPreviewDefault} width={1920} height={1080} fps={30} durationInFrames={MOOD_PREVIEW_FRAMES} />
      <Composition id="SoundBoard" component={SoundBoardDefault} width={1920} height={1080} fps={30} durationInFrames={soundBoardDefaults.totalFrames} defaultProps={soundBoardDefaults as any} calculateMetadata={calcBoard as any} />
    </>
  );
};
