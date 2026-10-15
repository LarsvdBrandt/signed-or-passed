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
| Cold open / flash-forward | `scenes[].coldOpen` | none |
| Brand sting after the hook | `spec.brandIntro {after, durationSec}` / `false` | 1.2 s after the first scene that is not a cold open |
| End card teaser | `spec.nextTeaser {title, kicker, verdict}` | plain end card (6 s) |
| Music energy per scene | `scenes[].musicEnergy` low/mid/high/drop/stop | none = the bed's own sections |
| Riser, silence before the reveal, verdict impact | `spec.sound {autoRisers, revealPauseSec, verdictImpact}` | on, 0.6 s, on |

Every render is scored by the retention QA (last section) in `render-report.json`.

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

## Cold open (`scenes[].coldOpen`)

Open with the payoff: the first scene(s) tease the big moment ("One million dollars. And he said no.") before the
story starts. Mark them with `"coldOpen": true` or an object:

```json
{"id": "s00", "kind": "counter", "coldOpen": {"label": "2010", "rampSec": 0.7},
 "narration": "Fifty million dollars. And they said **no**.", "visual": {"from": 0, "to": 50000000, "unit": "$", "style": "money"}}
```

| Field | Default | Effect |
|---|---|---|
| `style` | `flash-forward` | `flash-forward`: desaturated + vignette, back to full colour in the last 0.4 s; `clean`: full colour |
| `label` | none | small tag top-left (`▶▶ 2010`, `▶▶ LATER`) |
| `rampSec` | 0.7 | speed-ramp: the content plays fast and settles to normal speed (with a zoom punch-in), in sync with the voice afterwards; 0 = off |
| `desaturate` | 0.85 / 0 | 0..1 |
| `flash` | true | white flash frame on the cut to the next scene |

Sounds: `whoosh_fast` at the start, `whoosh_long` into the flash (`pipeline/common.py` `COLD_OPEN_SFX`). Works on
every scene kind; beats, keywords and `**emphasis**` work inside a cold open too.

## Brand sting after the hook (`spec.brandIntro`)

The logo sting never plays before the hook. By default it is a 1.2 s version (rules, pen, PASSED stamp; no tagline)
right after the first scene that is not a cold open, so the order is: cold open (optional) -> hook -> sting -> story.

| Spec | Result |
|---|---|
| absent or `{}` | 1.2 s after the first non-cold-open scene |
| `{"after": "s02"}` | after scene `s02` |
| `{"durationSec": 0.8}` | 0.6..1.5 s |
| `false` or `{"enabled": false}` | no sting |

`tts.py` inserts the silent gap and writes `introSec` / `introAtSec` to `timing.json`; `build_props.py` turns them into
`introFrames` / `introAtFrame`; `mix.py` puts the pen and stamp sounds on the compressed sting
(`common.brand_intro_sfx`). The scene before the sting hard-cuts into it; the scene after it enters with its normal
transition. Shorts never get a sting. Old timing files without `introAtSec` keep the sting at the start.

## End card teaser (`spec.nextTeaser`)

The end card stays 6 s. With `"nextTeaser": {"title": "The man who turned down the Beatles", "kicker": "Next story",
"verdict": "PASSED"}` it shows a smaller logo on top and a "NEXT STORY ->" card on the left half; the right half stays
free for the YouTube end-screen video element. Without it the classic centred end card is shown.

## Music energy (`scenes[].musicEnergy`)

The music follows the acts. `musicEnergy` on a scene sets the energy from that scene on, until the next scene that sets
one (before the first one: `mid`). Without `musicEnergy` anywhere the bed keeps its own built-in sections (old specs).

| Energy | Generated bed (`musicdyn.bed_energy`) | Library track |
|---|---|---|
| `low` | filtered pad + arpeggio, no bass, no drums (about 6 dB under mid) | 55 % |
| `mid` | pad, bass, arpeggio, lead; no drums | 80 % |
| `high` | everything incl. drums, filter fully open | 100 % |
| `drop` | only a muffled pad (breakdown, tension); the next `mid`/`high` slams back in within 30 ms | 30 % |
| `stop` | no music | 0 % |

Moving up from `low` sweeps the filter open over 1.5 s; going down takes 0.3-0.4 s. A typical long-form curve:

```json
{"id": "s00", "kind": "counter", "coldOpen": {"label": "LATER"}, "musicEnergy": "high", ...},
{"id": "s01", "kind": "title", "musicEnergy": "low", ...},
{"id": "s05", "kind": "map", "musicEnergy": "mid", ...},
{"id": "s20", "kind": "timeline", "musicEnergy": "high", ...},
{"id": "s30", "kind": "question", "musicEnergy": "drop", ...},
{"id": "s31", "kind": "reveal", "musicEnergy": "high", ...},
{"id": "s34", "kind": "lesson", "musicEnergy": "low", ...}
```

Rule of thumb: `high` for the cold open and the turning points, `low` for context and the lesson, `drop` on the
question (the groove comes back on the reveal), `stop` only for a dramatic quote. The voice always ducks the music.

## Riser, silence before the reveal, impact (`spec.sound`)

Automatic, no spec needed (defaults shown):

```json
"sound": {"autoRisers": true, "revealPauseSec": 0.6, "verdictImpact": true}
```

- **Reveal** = the first `reveal` scene of a cut, else its first `verdict` scene (cold opens are skipped);
  `common.reveal_index`.
- **Silence**: `tts.py` holds the scene before the reveal `revealPauseSec` longer (0-1.5 s; 0 = off) and records
  `revealAtSec` / `revealPauseSec` in `timing.json`; `mix.py` silences the music there and drops sfx that would play
  in it, so voice, music and sfx all stop right before the reveal.
- **Risers**: a 2 s riser (`riser`, the last 2 s of the sfxlib sound, -4 dB) ends exactly at the start of every
  question scene and exactly where the silence before the reveal begins (riser -> silence -> reveal). No riser in
  the first 0.5 s or across the brand sting.
- **Impact**: `impact_boom` (-2 dB) at the start of every verdict scene (with the pen / stamp and the stinger), and a
  softer one (-6 dB) at the start of a separate `reveal` scene.

Applies to the main video and the Shorts.

## Retention QA (`render-report.json`)

`pipeline/qa.py` scans every cut at 64x36 grey, 4 fps (about 9 s per 2.5 min of video) and adds these checks. A
`level: "warn"` check is reported (`[WARN]` in the log) but does not fail the gate; the others do.

| Check | Rule | Level |
|---|---|---|
| First visual change | a frame-to-frame change (mean grey difference >= 2) within 1.5 s | fail |
| Static picture | longest stretch where nothing moves (difference over 0.5 s < 0.15) outside question scenes, the silence before the reveal and the end card: <= 6 s | fail (warn above 4 s) |
| Brand sting after the hook | `timing.introAtSec > 0` when the cut has a sting | fail |
| Number / keyword in the first 8 s | a keyword or kinetic / counter / pop beat, or a text-led scene (counter, title, kinetic-text, chart, ...) starting before 8 s | warn |
| Visual changes per minute | measured changes (frame-to-frame difference >= 2; changes closer than 0.75 s count once: cuts, beats, pops, keywords, camera punches) >= 20 per minute | warn |
| Silence before the reveal | mean level in the `revealPauseSec` window < -35 dB | warn |

`report.retention.<cut>` holds the numbers: `visualChanges`, `visualChangesPerMin` (measured), `beats`, `beatsPerMin`
(planned in `beats.json`: explicit beats + keywords; auto camera beats and scene cuts are not in it), `sfx`, `sfxPerMin`
(from `sfx-events.json`, which `mix.py` writes per cut), `firstVisualChangeSec`, `longestStaticSec`,
`longestStaticAtSec`, `revealSilenceDb`. The sample (iteration 44): 23 changes/min, longest static 2.2 s, reveal
silence -91 dB.
