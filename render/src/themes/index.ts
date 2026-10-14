import {setTokens} from '../constants';
import {DEFAULT_THEME, THEMES} from './presets';
import type {Theme} from './types';

export type {Theme, ThemeColours, ThemeTexture, ThemeEasing, CaptionStyle} from './types';
export {DEFAULT_THEME, THEMES, THEME_LIST} from './presets';

let current: Theme = THEMES[DEFAULT_THEME];

export const resolveTheme = (id?: string | null): Theme => (id && THEMES[id]) || THEMES[DEFAULT_THEME];

/**
 * Make a theme current: overwrites the shared tokens (C, FONT_*, STROKE, RADIUS) in constants.ts.
 * Call it at the top of a composition's render function (before children render). Unknown ids fall back to the
 * default theme.
 */
export const applyTheme = (id?: string | null): Theme => {
  const t = resolveTheme(id);
  if (t !== current) {
    setTokens(t);
    current = t;
  }
  return t;
};

export const currentTheme = (): Theme => current;

const cubic = (x: number): number => 1 - Math.pow(1 - x, 3);

/** Entrance easing of the current theme (0..1 -> 0..~1.1). */
export const themeEase = (x: number): number => {
  const v = Math.max(0, Math.min(1, x));
  switch (current.easing) {
    case 'back': {
      const c1 = 1.70158 * 0.8;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2);
    }
    case 'expo':
      return v >= 1 ? 1 : 1 - Math.pow(2, -10 * v);
    case 'steps':
      return Math.round(cubic(v) * 6) / 6;
    default:
      return cubic(v);
  }
};
