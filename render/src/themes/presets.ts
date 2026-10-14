import type {Theme} from './types';

const SIGN = "'Mrs Saint Delafield', 'Brush Script MT', cursive";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";
const BRICOLAGE = "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";

/** The approved Signed or Passed house style. Must stay identical to the defaults in constants.ts. */
export const signedOrPassed: Theme = {
  id: 'signed-or-passed',
  name: 'Signed or Passed',
  description: 'Flat editorial vector, 3px board outlines, paper grain (house style)',
  dark: false,
  colours: {ink: '#2457E6', stamp: '#D9530B', board: '#141414', paper: '#F3F1EC', grey: '#8A8780', greyLight: '#CFCBC2'},
  fonts: {head: BRICOLAGE, sign: SIGN, mono: MONO},
  stroke: 3,
  corner: 0,
  texture: 'grain',
  textureOpacity: 0.07,
  sheetShadow: 'rgba(20,20,20,0.18)',
  easing: 'cubic',
  captionStyle: 'outline',
  goodFor: ['business stories', 'explainers'],
};

export const paperCutout: Theme = {
  id: 'paper-cutout',
  name: 'Paper cut-out',
  description: 'Layered kraft paper with hard drop shadows and stop-motion easing',
  dark: false,
  colours: {ink: '#3A7D44', stamp: '#D1495B', board: '#2E2A24', paper: '#F3E3C3', grey: '#A39171', greyLight: '#E2CFA5'},
  fonts: {head: BRICOLAGE, sign: SIGN, mono: MONO},
  stroke: 1.5,
  corner: 6,
  texture: 'paper-fibre',
  textureOpacity: 0.14,
  contentFilter: 'drop-shadow(6px 8px 0 rgba(46,42,36,0.28))',
  sheetShadow: 'rgba(46,42,36,0.35)',
  easing: 'steps',
  captionStyle: 'box',
  goodFor: ['crafts', 'kids history', 'storytelling'],
};

export const engraving: Theme = {
  id: 'engraving',
  name: 'Engraving / woodcut',
  description: 'Sepia parchment, cross-hatching and an old-print serif, for old history',
  dark: false,
  colours: {ink: '#5B3A1E', stamp: '#8E2C1C', board: '#2B1D10', paper: '#EFE3C8', grey: '#8C7A5B', greyLight: '#D6C6A2'},
  fonts: {head: "'IM Fell English', Georgia, 'Times New Roman', serif", sign: SIGN, mono: MONO},
  stroke: 2.5,
  corner: 0,
  texture: 'hatching',
  textureOpacity: 0.16,
  contentFilter: 'sepia(0.35) contrast(1.08)',
  vignette: 0.35,
  sheetShadow: 'rgba(43,29,16,0.3)',
  easing: 'cubic',
  captionStyle: 'box',
  goodFor: ['ancient and medieval history', 'Golden Age', 'old documents'],
};

export const blueprint: Theme = {
  id: 'blueprint',
  name: 'Blueprint',
  description: 'Engineering blueprint: white lines on blue with a measuring grid',
  dark: true,
  colours: {ink: '#7FC8FF', stamp: '#FFB347', board: '#E8F1FF', paper: '#123A6B', grey: '#7FA0C8', greyLight: '#2A5590'},
  fonts: {head: "'Oswald', 'Arial Narrow', sans-serif", sign: SIGN, mono: MONO},
  stroke: 2,
  corner: 0,
  texture: 'grid',
  textureOpacity: 0.22,
  sheetShadow: 'rgba(0,0,0,0.35)',
  easing: 'expo',
  captionStyle: 'box',
  goodFor: ['engineering', 'inventions', 'how it works'],
};

export const chalkboard: Theme = {
  id: 'chalkboard',
  name: 'Chalkboard',
  description: 'Slate green board, rough chalk lines and handwriting',
  dark: true,
  colours: {ink: '#8FD3F4', stamp: '#F7A072', board: '#F2F0E6', paper: '#24332B', grey: '#9AA59D', greyLight: '#3C4D43'},
  fonts: {head: "'Caveat', 'Comic Sans MS', cursive", sign: SIGN, mono: MONO},
  stroke: 3,
  corner: 4,
  texture: 'chalk-dust',
  textureOpacity: 0.16,
  contentFilter: 'url(#theme-rough)',
  vignette: 0.3,
  sheetShadow: 'rgba(0,0,0,0.4)',
  easing: 'cubic',
  captionStyle: 'outline',
  goodFor: ['education', 'science', 'lessons'],
};

export const retroComic: Theme = {
  id: 'retro-comic',
  name: 'Retro comic',
  description: 'Bold black outlines, halftone dots, punchy primaries and speech-bubble captions',
  dark: false,
  colours: {ink: '#1E88E5', stamp: '#E53935', board: '#111111', paper: '#FFF4D6', grey: '#F9A825', greyLight: '#FFE082'},
  fonts: {head: "'Bangers', Impact, sans-serif", sign: SIGN, mono: MONO},
  stroke: 5,
  corner: 10,
  texture: 'halftone',
  textureOpacity: 0.13,
  sheetShadow: 'rgba(17,17,17,0.45)',
  easing: 'back',
  captionStyle: 'bubble',
  goodFor: ['funny stories', 'pop culture', 'heists'],
};

export const synthwave: Theme = {
  id: 'synthwave',
  name: '80s neon / synthwave',
  description: 'Neon pink and cyan on deep purple with glow and CRT scanlines',
  dark: true,
  colours: {ink: '#01CDFE', stamp: '#FF9F1C', board: '#FF71CE', paper: '#1A0B2E', grey: '#B967FF', greyLight: '#2D1B4E'},
  fonts: {head: "'Oswald', 'Arial Narrow', sans-serif", sign: SIGN, mono: MONO},
  stroke: 3,
  corner: 0,
  texture: 'scanlines',
  textureOpacity: 0.2,
  contentFilter: 'drop-shadow(0 0 6px rgba(255,113,206,0.55))',
  vignette: 0.5,
  sheetShadow: 'rgba(1,205,254,0.35)',
  easing: 'expo',
  captionStyle: 'neon',
  goodFor: ['1980s', 'gaming', 'tech history'],
};

export const pastelKids: Theme = {
  id: 'pastel-kids',
  name: 'Minimal kids / pastel',
  description: 'Soft pastels, round corners, thick friendly outlines and bouncy motion',
  dark: false,
  colours: {ink: '#5DADE2', stamp: '#FF8FAB', board: '#4A4E69', paper: '#FFF8F0', grey: '#B8B8D1', greyLight: '#E7E6F7'},
  fonts: {head: "'Fredoka', 'Arial Rounded MT Bold', sans-serif", sign: SIGN, mono: MONO},
  stroke: 4,
  corner: 24,
  texture: 'none',
  textureOpacity: 0,
  sheetShadow: 'rgba(74,78,105,0.18)',
  easing: 'back',
  captionStyle: 'box',
  goodFor: ['kids', 'simple explainers', 'animals and nature'],
};

export const documentaryDark: Theme = {
  id: 'documentary-dark',
  name: 'Documentary dark',
  description: 'Serious dark documentary look: condensed type, grain and a heavy vignette',
  dark: true,
  colours: {ink: '#4C8DFF', stamp: '#FF6A2B', board: '#E9E6DF', paper: '#121416', grey: '#7B7F86', greyLight: '#2A2E33'},
  fonts: {head: "'Oswald', 'Arial Narrow', sans-serif", sign: SIGN, mono: MONO},
  stroke: 2,
  corner: 0,
  texture: 'grain',
  textureOpacity: 0.12,
  contentFilter: 'contrast(1.05)',
  vignette: 0.55,
  sheetShadow: 'rgba(0,0,0,0.5)',
  easing: 'cubic',
  captionStyle: 'box',
  goodFor: ['true crime', 'disasters', 'serious history'],
};

export const THEME_LIST: Theme[] = [signedOrPassed, paperCutout, engraving, blueprint, chalkboard, retroComic, synthwave, pastelKids, documentaryDark];

export const THEMES: Record<string, Theme> = Object.fromEntries(THEME_LIST.map((t) => [t.id, t]));

export const DEFAULT_THEME = 'signed-or-passed';
