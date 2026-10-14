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

export const FONT_HEAD = "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
export const FONT_SIGN = "'Mrs Saint Delafield', 'Brush Script MT', cursive";
export const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

export const STROKE = 3;
export const TRANSITION_FRAMES = 12;

/** Verdict animation timing (frames at 30 fps). Must match SFX_OFFSETS in pipeline/common.py. */
export const SIGN_START = 15; // pen sfx at 0.5 s
export const SIGN_FRAMES = 30;
export const STAMP_START = 13;
export const STAMP_IMPACT = 19; // stamp sfx at 0.62 s
