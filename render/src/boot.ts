/**
 * Imported FIRST by index.ts. Applies spec.theme from the input props before any illustration module is evaluated,
 * so module-level copies of tokens (e.g. `const S = STROKE` in the illustration files) pick up the theme's outline
 * width. Compositions still call applyTheme() at render time for colours, fonts and easing.
 *
 * Limitation: inside ONE render the outline width is fixed by the theme in the input props. Multi-theme previews
 * (ThemePreview) therefore show every theme with the default 3px outline; real productions use their own theme's
 * width. New library code should read STROKE at render time (live import) instead of copying it into a constant.
 */
import {getInputProps} from 'remotion';
import {applyTheme} from './themes';

try {
  const p = getInputProps() as {theme?: unknown} | null;
  applyTheme(p && typeof p.theme === 'string' ? p.theme : null);
} catch (_e) {
  // no input props available (e.g. Studio): keep the default theme
}
