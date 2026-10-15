export type Sentence = {text: string; startFrame: number; endFrame: number};
export type Word = {text: string; startFrame: number; endFrame: number};

/** A visual beat (scenes[].beats, docs/library/retention.md); frame is relative to the scene start (build_props). */
export type Beat = {do: string; frame: number; at?: number | string; [k: string]: any};
/** A kinetic keyword (numbers / **emphasis**), absolute frames (pipeline/retention.py). */
export type Keyword = {text: string; kind: 'emphasis' | 'number'; startFrame: number; endFrame: number; sceneId?: string};

export type Scene = {
  id: string;
  kind: string;
  narration: string;
  onScreenText?: string | null;
  visual: any;
  /** camera move: a string or {type, strength} (see IllustrationScene.motionOf) */
  motion?: any;
  sfx?: string | null;
  dateTag?: string | null;
  minDurationSec?: number;
  /** overlay effects (render/src/effects): ids or {id, intensity, params}; merged over spec.look */
  effects?: any[];
  /** transition INTO this scene (render/src/transitions): id or {id, durationSec, params}; default spec.transition */
  transition?: any;
  /** lower third overlay (render/src/typography/overlays): {style, title, subtitle?, atSec?, durationSec?} */
  lowerThird?: any;
  /** visual beats (RETENTION-1) */
  beats?: Beat[];
  /** false = no auto beats for this scene */
  autoBeats?: boolean;
  /** cold open / flash-forward (RETENTION-3): true | {style, label, rampSec, desaturate, flash} */
  coldOpen?: any;
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
  /** Global look (spec.look): preset name, effect array or {preset, effects}; see docs/library/effects.md. */
  look?: any;
  /** Default transition between scenes (spec.transition); default 'paper-slide'. */
  transition?: any;
  /** Shorts caption style (spec.captionStyle): bold-pop | karaoke-highlight | boxed | minimal; default = theme style. */
  captionStyle?: string | null;
  /** Long-form captions (spec.captions): {long: keywords | full | off, style?}; default keywords. */
  captions?: {long?: string; style?: string | null} | null;
  /** Auto camera beats for scenes without beats (spec.autoBeats); default true. */
  autoBeats?: boolean;
  /** Kinetic keywords (absolute frames) for captions.long = keywords. */
  keywords?: Keyword[];
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  /** Brand sting length (frames); 0 = none. */
  introFrames?: number;
  /** Frame where the sting starts (RETENTION-3: right after the hook); 0 = before the first scene. */
  introAtFrame?: number;
  /** 'Next story' teaser on the end card (spec.nextTeaser). */
  nextTeaser?: {title: string; kicker?: string; verdict?: 'SIGNED' | 'PASSED'} | null;
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
