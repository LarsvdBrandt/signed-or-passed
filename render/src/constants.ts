/**
 * Design tokens. C, the FONT_* strings, STROKE and RADIUS are the CURRENT THEME's tokens:
 * themes/index.ts (applyTheme) overwrites them in place before a composition renders, so every component that
 * reads C.ink / FONT_HEAD / STROKE at render time follows the theme. The defaults below are the approved
 * Signed or Passed house style (theme 'signed-or-passed').
 */
export const C = {
  ink: '#2457E6',
  stamp: '#D9530B',
  board: '#141414',
  paper: '#F3F1EC',
  grey: '#8A8780',
  greyLight: '#CFCBC2',
};

export type ColourName = keyof typeof C;

/** Accepts a brand colour name (ink, stamp, board, paper, grey, greyLight) or a hex value. */
export const colourOf = (name: string | undefined, fallback: string = C.board): string => {
  if (!name) return fallback;
  if (name.startsWith('#')) return name;
  return (C as Record<string, string>)[name] ?? fallback;
};

export let FONT_HEAD = "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
export let FONT_SIGN = "'Mrs Saint Delafield', 'Brush Script MT', cursive";
export let FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

export let STROKE = 3;
/** Corner radius for cards, buttons and frames (0 = square house style). */
export let RADIUS = 0;
export const TRANSITION_FRAMES = 12;

export type TokenSet = {
  colours: {ink: string; stamp: string; board: string; paper: string; grey: string; greyLight: string};
  fonts: {head: string; sign: string; mono: string};
  stroke: number;
  corner: number;
};

/** Called by themes/index.ts only. */
export const setTokens = (t: TokenSet): void => {
  Object.assign(C, t.colours);
  FONT_HEAD = t.fonts.head;
  FONT_SIGN = t.fonts.sign;
  FONT_MONO = t.fonts.mono;
  STROKE = t.stroke;
  RADIUS = t.corner;
};

/** Verdict animation timing (frames at 30 fps). Must match SFX_OFFSETS in pipeline/common.py. */
export const SIGN_START = 15; // pen sfx at 0.5 s
export const SIGN_FRAMES = 30;
export const STAMP_START = 13;
export const STAMP_IMPACT = 19; // stamp sfx at 0.62 s
