# Music library

Two sources, both safe for monetised YouTube:

1. **Generated** (default): `pipeline/musicgen.py` synthesises every note from numpy oscillators and noise with
   fixed seeds. No samples, loops or recordings, so it is CC0 by construction and cannot match a Content ID
   reference. No credit needed.
2. **Library**: tracks listed in `brand/music/licenses.csv` and the CC0 / public-domain classical recordings of
   `brand/music/manifest.csv` (below), each with a source URL. The workflow downloads them at render time; the
   description credits them. Manifest recordings are **opt-in** (`source: "library"` or `track`).

## spec.music

```json
"music": {"mood": "tense", "era": "1920s", "source": "auto", "stingers": true}
```

| field | values | default |
|---|---|---|
| `mood` | `tense`, `curious`, `triumphant`, `somber`, `playful`, `epic`, `mysterious`, `upbeat` (aliases such as suspense, neutral, hopeful, sad, dramatic, mystery are mapped in `pipeline/mix.py`) | `curious` |
| `era` | `modern`, `baroque`, `jazz-age`, `fifties`, `eighties`, `future` or an alias (`ancient`, `medieval`, `1600s`, `victorian`, `1920s`, `1950s`, `1980s`, `2000s`, ...) | `modern` |
| `source` | `auto` (library track with that mood if one exists, else generated), `generated`, `library`, `none` | `auto` |
| `track` | file name (with or without extension) or title of a `brand/music/manifest.csv` recording; implies `source: library` | none |
| `stingers` | `true` / `false`: musical hits at question scenes (`question`) and verdict scenes (`signed`, `passed`) | `true` |
| `scenes[].musicEnergy` | low / mid / high / drop / stop per scene (sticky): re-arranges the generated bed per act, a gain curve for library tracks (docs/library/retention.md) | none = built-in sections |

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

## Recorded library (brand/music/manifest.csv)

14 classical recordings made for **Musopen** and published on Wikimedia Commons as CC0 or public domain (the
*recording*, not only the composition). Columns: `file,url,source_page,licence,author,attribution,mood,era,start,
title,description`. At render time `pipeline/mix.py` re-checks every file's licence through the MediaWiki API
(`fetch_sfx.verify`, extmetadata `LicenseShortName` / `NonFree`); a file that is no longer CC0 / PD, or a Commons
outage, falls back to a generated bed with a warning in `render-report.json`. The recording is trimmed from
`start`, faded in, looped under the narration and ducked like any library track.

Why opt-in: public-domain classical recordings are sometimes hit by *false* Content ID claims from labels that own
other recordings of the same work. Such a claim can be disputed, but the generated beds avoid it entirely, so
`auto` never picks these recordings.

```json
"music": {"source": "library", "mood": "tense"}
"music": {"track": "grieg_mountain_king"}
```

| track | title | mood | era | licence | character |
|---|---|---|---|---|---|
| `bach_goldberg_aria` | Goldberg Variations, Aria (J. S. Bach) | curious | baroque | CC0 | slow, reflective solo keyboard |
| `bach_wtc_prelude_c` | Well-Tempered Clavier, Prelude and Fugue No. 1 in C major (J. S. Bach) | curious | baroque | CC0 | flowing arpeggios, neutral |
| `grieg_mountain_king` | Peer Gynt: In the Hall of the Mountain King (Grieg) | tense | romantic | Public domain | creeping build-up to a frantic climax |
| `grieg_morning_mood` | Peer Gynt: Morning Mood (Grieg) | upbeat | romantic | Public domain | sunrise, hopeful, new beginning |
| `grieg_death_of_aase` | Peer Gynt: The Death of Aase (Grieg) | somber | romantic | Public domain | slow strings, grief |
| `mozart_symphony_40_i` | Symphony No. 40 in G minor, I. Molto allegro (Mozart) | tense | classical | Public domain | restless, urgent minor key |
| `mozart_figaro_overture` | The Marriage of Figaro, Overture (Mozart) | playful | classical | Public domain | quick, witty, bustling |
| `chopin_prelude_raindrop` | Prelude Op. 28 No. 15 'Raindrop' (Chopin) | somber | romantic | CC0 | solo piano, quiet repetition, dark middle |
| `chopin_waltz_34_3` | Waltz Op. 34 No. 3 (Chopin) | playful | romantic | CC0 | fast, light, spinning piano |
| `beethoven_coriolan` | Coriolan Overture, Op. 62 (Beethoven) | epic | classical | Public domain | hammer-blow chords, drama |
| `brahms_symphony_2_iv` | Symphony No. 2, IV. Allegro con spirito (Brahms) | triumphant | romantic | Public domain | energetic, ends in brass triumph |
| `mendelssohn_hebrides` | The Hebrides (Fingal's Cave) Overture (Mendelssohn) | mysterious | romantic | Public domain | rolling sea, misty, mysterious |
| `mendelssohn_italian_i` | Symphony No. 4 'Italian', I. Allegro vivace (Mendelssohn) | upbeat | romantic | Public domain | bright, sunny, fast |
| `brahms_symphony_3_iii` | Symphony No. 3, III. Poco allegretto (Brahms) | somber | romantic | CC0 | wistful cello melody |

### Add a recording
1. Find it on Wikimedia Commons; the file page must carry CC0 or a public-domain tag for the **recording**
   (Musopen uploads usually do). No CC BY-NC / ND, no "free for YouTube" claims without a licence.
2. Add a row to `brand/music/manifest.csv` (mood = one of the 8 musicgen moods).
3. Push; the next render verifies the licence again before it uses the file.
