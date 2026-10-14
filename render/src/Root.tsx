import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {VideoMain} from './Video';
import {Thumbnail} from './compositions/Thumbnail';
import {Preview} from './compositions/Preview';
import {sampleLong, sampleShort} from './sample-props';
import type {VideoProps} from './types';

loadFonts();

const calc = ({props}: {props: VideoProps}) => ({
  durationInFrames: Math.max(1, Math.round(props.totalFrames || 1)),
  fps: props.fps || 30,
});

const AnyVideo = VideoMain as React.FC<any>;
const AnyThumb = Thumbnail as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="LongVideo" component={AnyVideo} width={1920} height={1080} fps={30} durationInFrames={sampleLong.totalFrames} defaultProps={sampleLong as any} calculateMetadata={calc as any} />
      <Composition id="ShortVideo" component={AnyVideo} width={1080} height={1920} fps={30} durationInFrames={sampleShort.totalFrames} defaultProps={sampleShort as any} calculateMetadata={calc as any} />
      <Composition id="Thumbnail" component={AnyThumb} width={1280} height={720} fps={30} durationInFrames={90} defaultProps={sampleLong as any} />
      <Composition id="Preview" component={Preview} width={1920} height={1080} fps={30} durationInFrames={150} />
    </>
  );
};
