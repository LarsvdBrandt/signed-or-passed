# Typography library

Kinetic text, lower thirds, chapter cards and Shorts caption styles. Code: `render/src/typography/`
(`index.tsx` presets + registry, `overlays.tsx` lower thirds + chapter, `captions.tsx`). Everything follows the active
theme (`spec.theme`). Preview: `preview-typography.mp4` (every preset in the house theme and in `synthwave`).

## Scene kind `kinetic-text`

```json
{"id": "s05", "kind": "kinetic-text", "narration": "...",
 "visual": {"preset": "word-pop", "text": "Would you sign this deal?", "accent": ["sign"]}}
```

Common fields: `preset`, `text` (use `\n` for line breaks) or `lines` (max 6), `accent` (words in the accent colour),
`background` (`paper` | `board` | `ink` | `stamp` | `greyLight`, default per preset), `colour`, `accentColour`
(brand name or hex), `sourceId` (optional; shows "Source: ..." and is checked by `validate_spec.py`).

| preset | fields | animation |
|---|---|---|
| `typewriter` | `text`/`lines`, `cps?` (18) | monospace typing, blinking block caret (sfx `typewriter` fits if present in the sfx library) |
| `word-pop` | `text`/`lines`, `accent?`, `stagger?` (s) | words spring in one by one |
| `highlighter-marker` | `text`/`lines`, `accent?`, `colour?` | marker sweeps behind the accent words (default: last line) |
| `strike-then-correct` | `wrong`, `right` | wrong text struck through in orange, right text drops in |
| `stamp-text` | `text`, `colour?`, `rotate?` (-8) | rubber stamp falls 1.6 -> 1, shake; timed like the PASSED stamp (`sfx: "stamp"`) |
| `neon-flicker` | `text`/`lines`, `colour?` | neon sign flickers on (default background board) |
| `handwritten-reveal` | `text`, `colour?` | signature font written left to right, underline (`sfx: "pen"`) |
| `newspaper-spin` | `text`, `masthead?`, `date?` | front page spins in with the headline (default background board) |
| `split-flap` | `lines` (max 5 x 18 chars), `accentRow?` | departure board rows flip into place |
| `scrolling-ticker` | `lines` (items), `label?`, `title?`, `position?` (centre / bottom), `speed?` | news ticker band |
| `quote-card` | `text`, `speaker?`, `status?` (`disputed` shows a DISPUTED tag), `sourceId?` | card, words fade in, speaker line |

Real quotes of real people still belong in the scene kind `quote` (verified / disputed, sourceId required).

## Lower thirds (`scenes[].lowerThird`, any scene)

```json
"lowerThird": {"style": "bar", "title": "Person A", "subtitle": "Founder", "atSec": 0.5, "durationSec": 4.5}
```

Styles: `bar` (black bar + ink strip slide in), `tab` (paper card with orange tab), `underline` (title wipes in,
ink underline draws). Landscape: bottom-left above the date tag; Shorts: top-left (clear of the captions).
The lower third is not moved by the camera move.

## Chapter cards (scene kind `chapter`)

```json
{"id": "c2", "kind": "chapter", "narration": "Chapter two: the offer.", "visual": {"number": 2, "title": "The offer"}}
```

Black card, "CHAPTER" in IBM Plex Mono (`label` to change it), big orange number, title. Chapters in the YouTube
description still come from the scene timings (`metadata.py`).

## Shorts caption styles (`spec.captionStyle`)

`bold-pop` (3 big words, active word pops orange), `karaoke-highlight` (5 words, each fills with ink while spoken),
`boxed` (black boxes, active box orange), `minimal` (6 smaller words on a black strip). Without `captionStyle` the
theme's own caption style is used (house style: outlined words, active word in ink).

## Add a preset
1. Write a `React.FC<TextProps>` (`{v, scene, ctx, fg, bg, accent}`) in `render/src/typography/index.tsx` and
   register it in `TEXT_PRESETS` (component, default background, description, fields).
2. Add the id to `$defs/textPreset` in `schema/spec.schema.json`, document it here and add demo text to
   `render/src/compositions/TypographyPreview.tsx`.
