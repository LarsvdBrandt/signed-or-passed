# Music library

Two sources, both safe for monetised YouTube:

1. **Generated** (default): `pipeline/musicgen.py` synthesises every note from numpy oscillators and noise with
   fixed seeds. No samples, loops or recordings, so it is CC0 by construction and cannot match a Content ID
   reference. No credit needed.
2. **Library**: tracks listed in `brand/music/licenses.csv` (and, from MUSIC-2, `brand/music/manifest.csv`), only
   CC0 / Public Domain recordings with a source URL. The workflow downloads them at render time; the description
   credits them.

## spec.music

```json
"music": {"mood": "tense", "era": "1920s", "source": "auto", "stingers": true}
```

| field | values | default |
|---|---|---|
| `mood` | `tense`, `curious`, `triumphant`, `somber`, `playful`, `epic`, `mysterious`, `upbeat` (aliases such as suspense, neutral, hopeful, sad, dramatic, mystery are mapped in `pipeline/mix.py`) | `curious` |
| `era` | `modern`, `baroque`, `jazz-age`, `fifties`, `eighties`, `future` or an alias (`ancient`, `medieval`, `1600s`, `victorian`, `1920s`, `1950s`, `1980s`, `2000s`, ...) | `modern` |
| `source` | `auto` (library track with that mood if one exists, else generated), `generated`, `library`, `none` | `auto` |
| `stingers` | `true` / `false`: musical hits at question scenes (`question`) and verdict scenes (`signed`, `passed`) | `true` |

The bed is generated per cut (main video and every short) exactly as long as the narration (`timing.json`), with
the seed `<slug>:<cut>` so a re-render sounds identical. It is ducked under the voice (sidechain) and the final
mix is normalised to -14 LUFS / -1 dBTP.

## Moods (8)

| mood | bpm | character |
|---|---|---|
| tense | 96 | low drone, ticking pulse, phrygian half-step |
| curious | 104 | light plucks, bouncing bass, dorian |
| triumphant | 112 | brassy chords, march snare, I-V-vi-IV |
| somber | 68 | slow minor keys, no drums |
| playful | 126 | staccato plucks, bouncing bass, claps |
| epic | 84 | big minor chords, war toms |
| mysterious | 80 | harmonic-minor bells over a dark pad |
| upbeat | 120 | four-on-the-floor, 16th arps, mixolydian |

## Era flavours (6)

| era | lead | rhythm |
|---|---|---|
| modern | clean pluck | standard kit |
| baroque | harpsichord | timpani instead of drums |
| jazz-age | piano | swung, brushes |
| fifties | organ | light swing |
| eighties | square synth | gated snare |
| future | glassy bells | rolling trap hats |

## Stingers (4)

`reveal` (riser into a major hit), `signed` (rising arpeggio + bell chord), `passed` (low brass hit, timpani,
falling tone), `question` (unresolved sus4 swell with ticks).

## Structure of a bed

One 8-bar loop per layer (pad, bass, arp, lead, drums), rendered circularly so it tiles without clicks, arranged in
sections (intro, full, full, break, groove, full, ...) with short gain ramps. A 10-minute bed costs the same CPU
as one loop.

## CLI

```bash
python pipeline/musicgen.py --list
python pipeline/musicgen.py bed --mood tense --era 1920s --seconds 90 --seed my-slug --out build/bed.wav
python pipeline/musicgen.py stinger --name passed --out build/passed.wav
python pipeline/musicgen.py library --out build/music-lib --zip build/music-library.zip
```

`library` writes every mood bed, one era flavour per era and all stingers, `catalogue.json`, `board.wav` and
`board-props.json`; CI turns the board into `music-board.mp4` (SoundBoard composition) and zips the WAVs with a
CC0 `LICENCE.txt` into `music-library.zip`.
