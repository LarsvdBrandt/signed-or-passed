export type Sentence = {text: string; startFrame: number; endFrame: number};
export type Word = {text: string; startFrame: number; endFrame: number};

export type Scene = {
  id: string;
  kind: string;
  narration: string;
  onScreenText?: string | null;
  visual: any;
  motion?: string | null;
  sfx?: string | null;
  dateTag?: string | null;
  minDurationSec?: number;
  startFrame: number;
  durationFrames: number;
  sentences: Sentence[];
};

export type VideoProps = {
  slug: string;
  cut: string;
  format: 'long' | 'short';
  verdict: 'SIGNED' | 'PASSED';
  /** Theme id from render/src/themes (spec.theme); default 'signed-or-passed'. */
  theme?: string;
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  /** Brand intro sting length (frames) before the first scene; 0 = none. */
  introFrames?: number;
  /** End card length (frames) after the last scene; 0 = none. */
  outroFrames?: number;
  scenes: Scene[];
  words: Word[];
  assets: Record<string, {src: string; attribution: string}>;
  sources: Record<string, {title: string; url: string}>;
  thumbnail: {bigText?: string; headline?: string; verdict?: 'SIGNED' | 'PASSED'; illustration?: string; illustrationProps?: any};
  title: string;
};

export type SceneProps = {scene: Scene; ctx: VideoProps};
