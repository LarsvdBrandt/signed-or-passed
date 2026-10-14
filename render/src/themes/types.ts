export type ThemeColours = {
  /** primary accent (Signed in the house style) */
  ink: string;
  /** secondary accent (Passed in the house style) */
  stamp: string;
  /** outlines and main text */
  board: string;
  /** background and light fills */
  paper: string;
  grey: string;
  greyLight: string;
};

export type ThemeTexture = 'grain' | 'paper-fibre' | 'hatching' | 'halftone' | 'scanlines' | 'chalk-dust' | 'grid' | 'none';
export type ThemeEasing = 'cubic' | 'back' | 'expo' | 'steps';
export type CaptionStyle = 'outline' | 'box' | 'bubble' | 'neon';

export type Theme = {
  id: string;
  name: string;
  description: string;
  /** true when paper (the background) is dark: overlays use screen instead of multiply */
  dark: boolean;
  colours: ThemeColours;
  fonts: {head: string; sign: string; mono: string};
  /** outline width in px at 1080p */
  stroke: number;
  /** corner radius for cards and frames */
  corner: number;
  texture: ThemeTexture;
  textureOpacity: number;
  /** CSS filter applied to each scene's content (sepia, glow, cut-paper shadow, chalk roughness) */
  contentFilter?: string;
  /** 0..1 strength of a dark vignette */
  vignette?: number;
  /** shadow colour of the sliding paper sheet transition */
  sheetShadow: string;
  /** easing of illustration entrances (kit.easeOut) */
  easing: ThemeEasing;
  /** burned-in Shorts caption style */
  captionStyle: CaptionStyle;
  /** suggested uses, for the catalogue */
  goodFor: string[];
};
