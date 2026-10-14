# Brand analysis (factory, iteration 10)

Lars uploaded four images to `brand/` (commit f447370). They are the source of truth: the factory never edits,
renames or deletes them, and adapts its own files (palette.json, fonts.json, render/src) to them.

| File | Size | What it is |
|---|---|---|
| `Logo & merkbord.png` | 2000x1250 PNG | Brand board v1: logo lockup, tagline, colours, type, "het merkteken" |
| `Kanaalbanner 2560×1440.png` | 2560x1440 PNG | Channel banner: lockup + headline + mono subline between two dashed grey rules |
| `Thumbnail-template 1280×720.png` | 1280x720 PNG | Thumbnail layout: black left half with text + stamp, paper right half for the illustration |
| `Profielfoto 800×800.png` | 800x800 PNG | Profile mark: orange ring, big ink-blue script "S", small orange "or P" |

No SVG, icon set or extra fonts were included, so there is no separate icon style to copy: the illustration
library keeps the house style (flat, 3px Board outlines, brand colours only, faceless people) and borrows the
brand board's look: generous Paper space, heavy Bricolage type, thin mono labels, the rounded stamp box.

## Colours (exactly as on the brand board)
| Name | Hex | Use |
|---|---|---|
| Ink | `#2457E6` | "Signed" signature, SIGNED, positive accents |
| Stamp | `#D9530B` | PASSED stamp box, profile ring, warnings, DISPUTED |
| Board | `#141414` | text, outlines, the dark left half of thumbnails |
| Paper | `#F3F1EC` | default background |
| Greys (factory) | `#8A8780`, `#CFCBC2` | secondary text; `#CFCBC2` also the dashed banner rules |

On the black thumbnail half the stamp orange looks a little brighter in the template; the factory keeps the
exact `#D9530B` from the brand board (no new colour invented).

## Type
- **Bricolage Grotesque** ExtraBold (800): headlines, tagline, the word PASSED in the stamp. Tight leading (~0.95).
- **Mrs Saint Delafield**: the word "Signed" and the "S" of the profile mark.
- **IBM Plex Mono**: the small "or", dates, figures, sublines ("2000 · $50M", "Would you have signed? · New story every week").

These are the three fonts the factory already downloads (brand/fonts.json), so no font change was needed.

## The marks
- **Lockup**: `Signed` (script, ink) + `or` (mono, small, board) + `PASSED` in a rounded orange outline box, rotated about -6°.
- **Tagline**: "One decision. Then history happened."
- **Banner lines**: "The business decisions that changed history." / "Would you have signed? · New story every week".
- **Rule** (het merkteken): blue signature = they signed; orange stamp = they said no. Every video ends with one of the two on screen.

## How the factory uses it (render/src/components/brand.tsx)
- `LogoLockup` and `StampBox` rebuild the lockup in code with the brand fonts (sharp at any size, animatable).
- **Intro sting** (`BrandIntro`, first 3 s of every long video): dashed rules draw, "Signed" writes on with a pen
  sound, "or" appears, the PASSED stamp drops (scale 1.6 to 1) with a stamp sound and a short shake, tagline fades in.
- **End card** (`EndCard`, last 6 s of every long video): lockup + banner headline + mono subline between dashed
  rules; the lower part stays calm for YouTube end-screen elements.
- **Watermark** (`Watermark`): the profile mark (orange ring + ink "S") at 40% opacity, bottom-right on long
  videos, top-right on Shorts; hidden during intro and end card. Source lines moved left to make room.
- **Title card**: heavy Bricolage title with mono subtitle between the banner's dashed grey rules.
- **Thumbnail**: follows the template: Board left half (640 px) with a mono line (`thumbnail.bigText`, e.g.
  "2000 · $50M"), a huge Paper headline (`thumbnail.headline`, auto-fitted, 3-5 words) and the orange PASSED stamp
  box or the ink Signed signature; Paper right half with the illustration (`thumbnail.illustration`).
- The PNGs themselves are not composited into videos (they have opaque paper backgrounds); they stay the visual
  reference. The same data is in Hive shared state `app:signed-or-passed` / `brand` for the other agents.
