# Library catalogue

The video factory ships a reusable motion-graphics + audio library. It is built for **Signed or Passed** (whose
approved house style stays the default theme) but works for any channel: pick a theme, an era, a mood and a voice in
`spec.json` and the same scene kinds render in another look.

**Watch first:** `library-reel.mp4` in the GitHub release **`library`** (2.5 min, a title card + three excerpts of
every section below, on a generated CC0 music bed). Every preview, board and zip listed here is in that release; it is
rebuilt by `.github/workflows/library.yml` (`ci/render-library.sh`; Actions tab or push `ci/library-trigger.txt`),
separately from production renders.

## Licence rules (apply to everything below)

- Self-made code (SVG / React / CSS, seeded randomness) and procedurally generated audio (numpy, ffmpeg) are ours: CC0.
- External files only when CC0 or Public Domain, with a manifest entry (file, url, source page, licence, author,
  attribution) and a licence check at render time. No CC-BY-NC, no ND, no unclear licences, no Content-ID music.
- Binary files are never committed: manifests list URLs, CI downloads and caches them, or generates them.

## Visual library

| Section | Spec field / scene kind | Code | Preview (release `library`) | Docs |
|---|---|---|---|---|
| Illustrations + scene kinds | `scenes[].kind` + `visual` (all kinds) | `render/src/illustrations`, `render/src/scenes` | `preview.mp4` | main `README.md` |
| Themes | `theme` | `render/src/themes` | `preview-themes.mp4` | [themes.md](themes.md) |
| Eras | `visual.era` (e.g. kind `template`), `music.era` | `render/src/eras` | `preview-eras.mp4` | [eras.md](eras.md) |
| Characters | figures inside illustration / template / shot visuals | `render/src/characters` | `preview-characters.mp4` | [characters.md](characters.md) |
| Mood shots | kind `shot` | `render/src/moods` | `preview-moods.mp4` | [moods.md](moods.md) |
| Effects + looks + particles | `scenes[].effects`, `look` | `render/src/effects` | `preview-effects.mp4` | [effects.md](effects.md) |
| Transitions + parallax | `transition`, `scenes[].transition`, `scenes[].motion` | `render/src/transitions` | `preview-transitions.mp4` | [effects.md](effects.md) |
| Infographics | kind `infographic` | `render/src/infographics` | `preview-infographics.mp4` | [infographics.md](infographics.md) |
| Typography | kinds `kinetic-text`, `chapter`; `scenes[].lowerThird`; `captionStyle` | `render/src/typography` | `preview-typography.mp4` | [typography.md](typography.md) |
| Scene templates | kind `template` | `render/src/templates` | `preview-templates.mp4` | [templates.md](templates.md) |
| Showcase | - | `render/src/compositions/LibraryReel.tsx` | `library-reel.mp4` | this file |

## Audio library

| Section | Spec field | Code / manifest | Board + download (release `library`) | Docs |
|---|---|---|---|---|
| Sound effects (procedural + CC0/PD recordings) | `scenes[].sfx`, `scenes[].sfxCues` | `pipeline/sfxlib.py`, `brand/sfx/manifest.csv` | `sound-board.mp4`, `sfx-library.zip` | [sound.md](sound.md), [sound-usage.md](sound-usage.md) |
| Music (generated beds, era flavours, stingers; CC0/PD recordings) | `music` (`mood`, `era`, `source`, `track`, `stingers`) | `pipeline/musicgen.py`, `brand/music/manifest.csv` | `music-board.mp4`, `music-library.zip` | [music.md](music.md) |
| Voices (Kokoro, licence-checked Piper) | `voice` (`engine`, `voice`, `speaker`, `speed`), `scenes[].voiceSpeed`, `[pause]` in narration | `brand/voices.json`, `pipeline/voice_samples.py` | `voice-samples.mp4`, `voice-samples.zip` | [voices.md](voices.md) |

## Using it for another channel

1. Pick or add a theme in `render/src/themes/presets.ts` (colours, fonts, stroke, corners) and set `theme`.
2. Choose eras per scene (`visual.era`), a music mood (`music.mood`) and a voice from `brand/voices.json` (`voice`).
3. Build scenes from the kinds above; validate with `python pipeline/validate_spec.py productions/<slug>/spec.json`.
4. Push `productions/<slug>/spec.json`: `.github/workflows/render.yml` renders it in its own job.

## Adding to the library

Add the component to its registry, make sure the section's preview composition shows it (the reel picks it up
automatically), document it in the section's file above and, for external files, add a manifest row with a verified
CC0 / Public Domain licence.
