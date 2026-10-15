# Retention toolkit (phase C)

Lars's verdict on the pilot: "looks good, but hard to keep watching". These spec features make sure something changes
on screen every 2-3 seconds, numbers and key words pop up big, and the sound follows the beats. All of them are
optional and backward compatible: an old spec still renders and simply gets the automatic parts (auto beats,
automatic keywords, beat sounds, faster pace).
The editorial rules behind this live in the workspace memory "Signed or Passed Retention Playbook".

| Feature | Spec | Default |
|---|---|---|
| Visual beats | `scenes[].beats` | none (auto beats instead) |
| Auto camera beats | `spec.autoBeats`, `scenes[].autoBeats` | on, except question scenes |
| Emphasis | `**word**` in a narration | - |
| Kinetic keywords / long-form captions | `spec.captions {long, style}` | `keywords` |
| Beat sounds | `spec.sfxDensity` | `mid` |
| Pace | `spec.voice.speed`, `[pause N]`, `[PAUSE]` | speed 1.15, 0.25 s between sentences, 0.35 s between scenes |

Still to come in this phase (see factory-status): cold open + brand sting after the hook, music energy per scene,
risers / silence before the reveal, retention QA checks.

## Visual beats (`scenes[].beats`)

```json
"beats": [
  {"at": "fifty", "do": "punch-in", "scale": 1.15},
  {"at": 2.4, "do": "kinetic", "text": "$50 MILLION", "position": "center"},
  {"at": "laughed", "do": "shake"},
  {"at": "Netflix", "do": "pop", "component": "Lightbulb", "x": 75, "y": 35, "scale": 0.7},
  {"at": "today", "do": "swap", "kind": "counter", "visual": {"from": 0, "to": 5000000000, "unit": "$", "style": "money", "sourceId": "src3"}},
  {"at": "later", "do": "punch-out"}
]
```

`at` is seconds from the scene start, or a word / phrase of the narration (first occurrence, case and punctuation
are ignored; `validate_spec.py` warns about words that do not occur, and such a beat is dropped). The word timing
comes from the captions, so a beat lands on the spoken word.

| do | Fields | What happens |
|---|---|---|
| `punch-in` | `scale` (default 1.15) | fast zoom in (6 frames), holds until a `punch-out` or the scene ends |
| `punch-out` | | back to normal size |
| `shake` | `intensity` 0-3 | short damped camera shake (impact) |
| `whip` | `direction` left/right | whip pan with motion blur: the scene flies out and back in |
| `flash` | `colour` | white (or colour) flash frame |
| `kinetic` | `text`, `position` top/center/lower, `colour`, `durationSec` (1.6) | big text card that pops in |
| `pop` | `component`, `props`, `x`, `y` (%), `scale` (0.8), `enter`, `durationSec` | an illustration from render/src/illustrations pops in on top |
| `counter` | `to`, `from`, `prefix`, `suffix`, `decimals`, `countSec`, `label`, `position`, `durationSec` | counting number card |
| `swap` | `visual`, `kind` (default: the scene's kind), `onScreenText` | hard cut to another visual layer for the rest of the scene |

Every beat may carry `"sfx": "<sfxlib name>"` (or `null` for silence) to override its automatic sound.

## Auto beats

A scene without `beats` gets a subtle camera change every 2.5 s (punch-in 1.07x, drift, parallax nudge,
alternating, eased over 14 frames, order seeded by the scene id), so no frame stays static for more than ~3 s.
Question scenes keep their hold still. Turn it off with `"autoBeats": false` on a scene or for the whole spec.

## Emphasis and kinetic keywords

`**word**` (or `**a phrase**`) in a narration is spoken normally (the asterisks are removed before TTS and never
appear in captions) and shown as a big kinetic keyword card timed to the word, with a soft pop.

`spec.captions` (long-form only; Shorts keep their word-by-word captions):

- `"long": "keywords"` (default): emphasis words always, plus numbers, money amounts, years and spelled-out amounts
  ("fifty million dollars") automatically, at most one every 2 s, in the lower third. Scenes that already show their
  numbers big (counter, chart, infographic, split-flap, kinetic-text, title, chapter, growth, versus, timeline,
  document) get no automatic number keywords; question and verdict scenes get none at all.
- `"long": "full"`: word-by-word captions like the Shorts (`captions.style` or `captionStyle`).
- `"long": "off"`.
- `"style"` for keywords: `stamp` | `ink` | `board` (default: orange cards for emphasis, black cards for numbers).

## Beat sounds (`spec.sfxDensity`)

Beats and keywords get a sound 12 dB under a normal scene sfx (and at least 0.35 s apart):

| beat | sound | low | mid | high |
|---|---|---|---|---|
| punch-in / whip | whoosh_fast | x | x | x |
| shake | impact_boom | x | x | x |
| kinetic, emphasis keyword | pop | x | x | x |
| punch-out, swap | whoosh_soft | | x | x |
| flash | camera_shutter | | x | x |
| pop | pop | | x | x |
| counter | clock_tick | | x | x |
| number keyword | click | | | x |

The sound plan per cut is written to `build/<slug>/<cut>/beats.json` and mixed by `pipeline/mix.py`.

## Pace

Default voice speed 1.15 (when `voice.speed` is missing). Every sentence clip is trimmed of leading and trailing
silence; 0.25 s between sentences, 0.35 s at scene boundaries. Longer pauses only on purpose: `[pause 0.6]`, or
`[PAUSE]` for 0.5 s.
