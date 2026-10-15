# Themes

A production picks its look with `spec.theme` (default `signed-or-passed`, the approved house style).
Themes live in `render/src/themes/presets.ts`; the engine is `render/src/themes/index.ts`.

How it works: `applyTheme(id)` overwrites the shared design tokens in `render/src/constants.ts`
(`C.ink/stamp/board/paper/grey/greyLight`, `FONT_HEAD/SIGN/MONO`, `STROKE`, `RADIUS`) before a composition
renders, so every illustration, scene and brand component follows the theme without code changes.
On top of that each theme sets a texture overlay, an optional CSS filter on scene content, a vignette, the
sheet-transition shadow, the entrance easing (`kit.easeOut`) and the Shorts caption style.

| id | look | fonts | texture | good for |
|---|---|---|---|---|
| `signed-or-passed` | flat editorial vector, 3px outlines (default) | Bricolage Grotesque | grain | business stories |
| `paper-cutout` | kraft paper layers, hard drop shadows, stop-motion easing | Bricolage Grotesque | paper fibre | crafts, kids history |
| `engraving` | sepia parchment, cross-hatching, old-print serif | IM Fell English | hatching + vignette | ancient/medieval, Golden Age |
| `blueprint` | white lines on blueprint blue with a grid | Oswald | grid | engineering, inventions |
| `chalkboard` | slate board, rough chalk lines | Caveat | chalk dust + roughen filter | education |
| `retro-comic` | bold outlines, halftone, speech-bubble captions | Bangers | halftone | funny stories |
| `synthwave` | neon pink/cyan on purple, glow, scanlines | Oswald | scanlines + vignette | 1980s, gaming |
| `pastel-kids` | soft pastels, round corners, bouncy motion | Fredoka | none | kids |
| `documentary-dark` | dark, condensed type, heavy vignette | Oswald | grain + vignette | true crime, serious history |

All fonts are OFL-1.1 from github.com/google/fonts, downloaded at render time (`brand/fonts.json`).

Preview: `preview-themes.mp4` in the `library` release shows the same mini-story (illustration, bar chart,
verdict) in every theme. Render locally with `cd render && npx remotion render src/index.ts ThemePreview out.mp4`.

Adding a theme: copy an entry in `presets.ts`, add it to `THEME_LIST`, add the id to the `theme` enum in
`schema/spec.schema.json`, and list any new font in `brand/fonts.json` + `render/src/fonts.ts`.
Rule: components use tokens (`C.*`, `STROKE`, `FONT_*`), never hard-coded colours.
