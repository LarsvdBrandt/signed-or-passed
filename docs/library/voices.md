# Voice library

Catalogue: `brand/voices.json` (id, engine, language, gender, grade, licence, attribution). Listen to every voice in
`voice-samples.mp4` / `voice-samples.zip` (release `library`, built by `pipeline/voice_samples.py`).

## Engines

| engine | model | licence | notes |
|---|---|---|---|
| `kokoro` (default) | hexgrad/Kokoro-82M v1.0 | Apache-2.0 | English (US `a*`, UK `b*`), Spanish `e*`, French `f*`, Hindi `h*`, Italian `i*`, Brazilian Portuguese `p*`. Japanese / Mandarin voices need misaki[ja]/[zh] and are not installed. Default speed 1.1. |
| `piper` | rhasspy/piper-voices (ONNX) | per voice (below) | Installed on first use (`piper-tts==1.3.0`), model cached in `~/.cache/huggingface/piper`. Default speed 1.0. Only voices listed in `brand/voices.json` are accepted. |
| `chatterbox` | ResembleAI/chatterbox (original model, `chatterbox-tts==0.1.2`) | MIT (code + weights) | Expressive English narration with emotion control (`exaggeration`, `cfg_weight`), zero-shot cloned from a reference clip. Own venv (`pipeline/requirements-chatterbox.txt`, CPU torch 2.6), created on first use. Never time-stretched (VOICE-10a). Every sentence gets a delivery style (below). Kokoro is the per-sentence fallback. Output carries Resemble's inaudible Perth watermark. |

Which free TTS could sound more human, licences, GPU options: [voice-research.md](voice-research.md).

## Channel default (Signed or Passed): use this voice block in every spec

```json
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default"}
```

That is all the Director needs to write: the built-in Chatterbox voice (A/B winner, chosen by Lars on 15 Oct 2026)
with the **VOICE-11 channel default** applied automatically = variant C of `voice-test-2` ("normal voice", Lars
15 Oct 2026 evening: *the sentences and pauses are good now, the voice itself may go back to normal*): natural speed,
moderate emotion, paragraph flow, the good pauses kept:

| setting | channel default | effect |
|---|---|---|
| `exaggerationOffset` | 0 | VOICE-11: no offset (the VOICE-8 +0.15 made the voice static); the VOICE-3 delivery styles alone vary the emotion around exaggeration 0.5 |
| `cfgOffset` | 0 | VOICE-11: no offset (VOICE-8 used -0.10); cfg_weight 0.5 base per the delivery styles |
| `pace` | 1.0 | VOICE-10a: **no time-stretch** (the 0.88 rubberband stretch of VOICE-8 made the voice drone); an explicit value is clamped to 0.97-1.0, scene `voiceSpeed` and style speed factors are ignored for Chatterbox |
| `pauses` | table below | **VOICE-12 breathing room**: exact speech-to-speech pauses (s) per boundary; `false` = the legacy pace (pauses x`pauseScale`) |
| `pauseScale` | 1.0 | VOICE-12: multiplies every value of the pause table (explicit value = pace guard off); legacy layout 1.15 |
| `paceGuard` | true | VOICE-12: when the **overall** rate (words / whole video) is outside 137-143 wpm, all pauses are scaled x0.8-1.4 (each capped at 1.8 s) toward 140; the voice is never stretched. `targetWpm` sets another band |
| `paragraphs` | true | VOICE-10b/11: 2-4 sentences of one thought per Chatterbox call (flowing intonation instead of reading a list), see below; `false` = sentence by sentence |

### Pause defaults (VOICE-12 "breathing room", channel default)

Lars, 15 Oct 2026 21:40: *the speed of the sentences themselves is fine, but the pauses are too short: he rushes the
sentences and chapters one after another*. The voice is unchanged; only the pauses grew. Each value is the silence
from the last word of one sentence to the first word of the next (never inside a sentence), overridable per key in
`spec.voice.pauses`:

| key | default | where |
|---|---|---|
| `sentence` | 0.45 s | between sentences inside one paragraph / scene |
| `paragraph` | 0.75 s | between two paragraph clips (chunks) in the same scene |
| `scene` | 0.9 s | between scenes (the visual cut sits ~40 % into the pause) |
| `section` | 1.6 s | before a new story **section** (hook -> promise -> set the scene -> pressure -> freeze -> reveal -> aftermath -> verdict -> lesson): automatically before every `chapter`, `question`, `reveal`, `verdict` and `lesson` scene and after a cold open; mark other section starts with `scenes[].section: true` (or a label). A soft house `whoosh` (-9 dB) on the cut + a music swell (~+2.6 dB) fill it |
| `beforePunch` | 0.6 s | before a `[punch]` line |
| `afterPunch` | 0.9 s | after a `[punch]` line or a big-number line (thousand / million / billion / percent / $ amounts) |
| `afterReveal` | 1.2 s | after the first line of the reveal scene |
| `afterQuestion` | 3 s | the question hold (`visual.holdSec` wins) |
| `shortScale` | 0.75 | every pause x0.75 in Shorts (they must stay <= 60 s) |

The largest applicable value wins (e.g. a punch line at a scene boundary gets max(0.9, 0.9)); `[pause N]` markers and the
small style pauses (excited / somber 0.1 s ...) come on top; the reveal silence (`sound.revealPauseSec`), the brand
sting and the question hold stay as they were. Target: **135-145 wpm over the whole video** (in-sentence rate
unchanged, ~245 wpm measured on clip time); the pace guard aims at 140. Visuals follow automatically (timing.json),
every intentional pause >= 1 s inside a scene gets an automatic punch-in (build_props), timing.json `breaths` lists
them and qa.py ignores intentional pauses <= 1.8 s in its static-picture scan; render-report.json `voice.pace` reports
`overallWpm` and `inSentenceWpm` side by side.

Override any of them in `spec.voice` only for a reason (e.g. `"exaggeration": 0.65, "cfgWeight": 0.4` = variant D,
more emotion; `"temperature": 0.9` = variant E; `"paragraphs": false` = variant B; `"exaggerationOffset": 0.15,
"cfgOffset": -0.1` = the old VOICE-8 tuning). Mark the moments that matter with the
delivery tags below (`[build]`, `[punch]`, `[excited]`, `[somber]`, `[warm]`, `[tense]`, `[curious]`, `[calm]`).
The measured pace is in `render-report.json` -> `voice.pace` (`overallWpm` = words / whole video, `inSentenceWpm` =
words / sentence time, plus `wpm` and `articulationWpm`) and QA warns (never fails) outside 133-147 wpm over the whole
cut with the breathing layout (legacy layout: 135-165).

## Expressive narration: engine `chatterbox` (VOICE-1..10)

Kokoro reads every sentence in the same tone. `chatterbox` makes the narrator sound like a person telling a story:
livelier at the build-up to a big number, a beat of suspense before the key word, slower and darker at a collapse.

```json
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default"}
"voice": {"engine": "chatterbox", "voice": "narrator", "reference": "narrator", "exaggeration": 0.6, "cfgWeight": 0.45}
```

| field | default | meaning |
|---|---|---|
| `reference` | `narrator` | `narrator` = cloned from our own lively ~13 s reading by Kokoro `bm_george` (generated at render time, cached, copied to `brand/voices/narrator-ref.wav`, never committed: same timbre as before, new delivery); `default` = the built-in Chatterbox voice |
| `exaggeration` | per style | shifts every style's emotion (0.5 = neutral, higher = livelier), 0.25-1.0 |
| `cfgWeight` | per style | shifts every style's cfg_weight (lower = slower, more expressive), 0.1-1.0 |
| `temperature` | 0.8 | sampling temperature, 0.3-1.2 |
| `fallback` | `bm_george` | Kokoro voice for a sentence Chatterbox cannot produce |
| `speed` | 1.0 | Kokoro / Piper only (native speed); Chatterbox is not time-stretched (VOICE-10a) |
| `exaggerationOffset` | 0 | added to every style's exaggeration (-0.5..0.5); VOICE-8 used +0.15, VOICE-11 default 0 |
| `cfgOffset` | 0 | added to every style's cfg_weight (-0.5..0.5, floor 0.25 when negative); VOICE-8 used -0.10 |
| `pace` | 1.0 | VOICE-10a: Chatterbox clamped to 0.97-1.0 (max 3 % stretch); Kokoro / Piper: speed factor; setting it disables the pace guard |
| `paragraphs` | true | VOICE-10b: paragraph generation (chatterbox only); default since VOICE-11 |
| `pauses` | table above | VOICE-12 pause table (seconds per boundary), `false` = legacy layout |
| `pauseScale` | 1.0 | VOICE-12: multiplies every pause of the table (0.5-2.0) and turns the pace guard off; legacy layout: sentence gaps and style pauses, default 1.15 |
| `paceGuard` | true | VOICE-12: scale the pauses (x0.8-1.4, max 1.8 s each) toward ~140 wpm over the whole video |
| `targetWpm` | not set | pace guard band over the whole video (default 137-143 with the breathing layout); legacy layout: opt-in band, e.g. [145, 155]; only the pauses move |

### Delivery styles (`pipeline/delivery.py`)

Base values; since VOICE-11 the channel default adds no offsets, so these are the values Chatterbox gets (an explicit
`exaggerationOffset` / `cfgOffset` or `exaggeration` / `cfgWeight` in `spec.voice` shifts them all). On a retry after a bad ASR check the clip is generated with 0.2 less exaggeration.

**VOICE-13 deep retry:** short clips (<= 4 words, e.g. *You're Nike.* / *Signed.*) are heard with 0.6 s of silence
around them and beam 5 (base.en mishears isolated one- or two-word clips) and every clip still judged bad after two takes gets
two more (up to 4: seeds +7919/+15838/+23757, exaggeration -0.2/-0.1/-0.3, stopping at the first good take). The best
take wins on (bad, CER, WER); its `.json` gets `deepRetry: true`, `takes`, `text`. `pipeline/tts_redo.py` (run by
render.yml before the TTS fan-out and before the render) drops older cached clips that are still judged bad, once, so
they get this deep retry; the voice of every good clip stays exactly the same (cache hit).

The speed column applies to Kokoro / Piper only (Chatterbox is never stretched, VOICE-10a).

| style | exaggeration | cfg | speed | pause after | used for |
|---|---|---|---|---|---|
| `calm` | 0.35 | 0.50 | 1.00 | - | neutral narration |
| `curious` | 0.50 | 0.50 | 1.00 | - | set-up, questions |
| `tense` | 0.55 | 0.45 | 1.00 | 0.05 s | stakes, the question itself |
| `build` | 0.50 -> 0.80 | 0.40 | 1.04 | - | rising across consecutive sentences toward a number / reveal |
| `excited` | 0.85 | 0.30 | 1.03 | 0.10 s | big numbers, wins |
| `punch` | 0.75 | 0.35 | 1.00 | 0.20 s | key line: a beat BEFORE the key number/word (a comma mid-sentence, 0.25 s when it opens the sentence), longer pause after |
| `somber` | 0.40 | 0.55 | 0.94 | 0.10 s | collapse, bankruptcy, failure |
| `warm` | 0.45 | 0.50 | 0.98 | 0.05 s | the lesson |

Where a sentence's style comes from (first match wins):
1. an inline tag at the start of the sentence: `"[build] And the asking price? [punch] Fifty million dollars."`
   (tags are never spoken and never shown: `common.strip_emphasis` removes them from captions, keywords and timing);
2. `scenes[].delivery`: default for the untagged sentences of that scene;
3. auto-delivery: hook -> `punch`; big money / number sentences -> `punch` (`excited` right after a punch); the two
   sentences leading up to such a peak, a reveal or a question -> `build`; question scene -> `curious` with its question
   sentence `tense`; reveal -> `punch`; collapse words -> `somber`; lesson -> `warm`; the rest alternates `curious` /
   `calm`. On the Blockbuster pilot about 21 % of the sentences get a heightened style.

Every sentence also gets a seeded +-5 % speed and +-0.04 exaggeration variation (reproducible per spec), so no two
sentences sound identical. `timing.json` records the style per sentence (`delivery`).

### How it renders
`pipeline/tts.py` lays every cut out once with placeholders to collect the sentences, then
`pipeline/chatterbox_worker.py` generates them in parallel shards (`SOP_TTS_SHARDS`, default 2 on a 4-core runner;
time budget `SOP_TTS_BUDGET_MIN`, default 45) into a cache keyed by text + settings (`~/.cache/huggingface/sop-tts`),
and the real clips are laid out in a second pass. Shorts reuse the main video's clips.

On GitHub one runner is far too slow (Chatterbox needs ~7-10 s of CPU per second of speech, see the A/B below), so
`render.yml` fans the TTS out first: `ci/tts-plan.py` gives every Chatterbox production `ceil(words / 150)` runner
jobs (2-12, `SOP_TTS_FANOUT_MAX`; `SOP_TTS_FANOUT=0` disables it), job `tts` runs
`pipeline/tts.py --slug S --shard i/n --export build/tts-out` on each (a deterministic share of the clips, largest
first) and uploads the clips as artifact `tts-<slug>-<i>`; the render job downloads them into its cache and only
generates what is missing (budget 20 min, then Kokoro fallback). Kokoro / Piper productions get no fan-out jobs.

### Voice QA (`pipeline/qa.py`, `build/<slug>/voice-qa.json`)
- pace: `narrationWpm` = `overallWpm` = words / whole main cut duration (the conventional narration rate, computed by
  qa.py; the QA band is judged on it: 135-145 wpm +/-2 with the VOICE-12 breathing layout, 135-165 legacy), `inSentenceWpm`
  = `articulationWpm`, `wpm` = words / speech time (first to last word of each scene, pauses inside a scene included; scene gaps,
  question holds and the sting excluded), `articulationWpm` = words / clip time; warning outside 135-165 wpm;
- every Chatterbox clip is transcribed with faster-whisper `base.en` and compared with `pipeline/textnorm.py`: both
  sides are mapped to one canonical form first (spelled-out and digit numbers, years, ordinals, decimals and
  dollars compare equal: 'eighty-two and a half million' == '$82.5 million', 'twenty-third of September, two
  thousand and ten' == '23rd of September 2010'). A clip is BAD when its WER > 30 % AND (character error rate > 20 %,
  or >= 6 words with CER > 12 %, or >= 2 words missing); one misheard word in a 2-4 word sentence ('lifer' /
  'life-er') and word-boundary differences in longer sentences ('a rival' / 'arrival', 'capped downside' / 'cap down
  side') are only counted (`misheardShortClips`). A bad clip is generated once more with a lower exaggeration and
  another seed, the better take is kept; cached clips are re-scored on every render;
- whole-track ASR word error rate <= 8 % (gate); bad sentences: a garbled one (CER > 35 %) or more than two fail
  the gate, one or two are a warning ('doubtful sentences (listen to these)'); Kokoro fallback sentences (warning);
- `[pause N]` markers are never spoken: the punch-line beat (a comma before the key word) skips markers;
- liveliness = standard deviation of the pitch (F0, semitones, librosa pyin) per minute (info: higher = less
  monotone). `voice.qa: true` runs the same QA for Kokoro / Piper.

### Pace decision (iteration 53, reversed by VOICE-10a)
Chatterbox articulates fast (~190-215 wpm raw). The pace guard slowed it to its floor `pace` 0.88 with rubberband,
which gave ~183 wpm inside scenes and ~146 wpm over the whole video (Nike, 8662039). Lars heard that version as
*worse, more static*: since VOICE-10a the voice is no longer stretched (see below). QA still judges the 145-155 band
on `narrationWpm` (whole main cut, a warning only); `wpm` / `articulationWpm` stay in the report for comparison.

### VOICE-10 (iteration 54): no stretch, paragraphs, listening test 2
Lars (15 Oct, 19:20) heard the VOICE-8 voice (v4 Blockbuster, Nike) as *worse, more static*, while the liveliness
metric went up. Causes and fixes (details in [voice-research.md](voice-research.md)):
- **No time-stretch** (VOICE-10a): the iteration-53 pace decision above is reversed. Chatterbox clips are never
  stretched by default; "slightly slower" comes from the pauses (pace guard on `pauseScale` 1.0-1.6) and cfg_weight.
- **Paragraph generation** (VOICE-10b, `voice.paragraphs: true`): `tts.chunk_plan` groups 2-4 consecutive sentences
  of the same delivery family (narr = calm/curious/warm, build = tense/build, peak = punch/excited, somber), at most
  45 words / 250 characters, into one Chatterbox call. A chunk may cross scene boundaries (most scenes hold one
  sentence) but never into or out of a chapter / question / reveal / verdict / lesson scene, across the brand sting or
  a cold-open boundary, and never contains a `[pause]` marker; it takes the strongest delivery inside it. The worker
  transcribes the clip with faster-whisper word timestamps, aligns them to the known words (difflib) and cuts at the
  quietest 20 ms between two sentences (`.json`: `cuts`, `speech`). Inside a scene the natural pause is kept
  (+0.06 s x pauseScale); toward the next scene the usual scene gap applies. timing.json keeps its format
  (sentences get `"paragraph": true`).
- **Listening test 2** (`.github/workflows/voice-test-2.yml`, trigger `ci/voice-test-2.txt`, release `voice-test-2`):
  the same ~70 s Blockbuster excerpt (m001-m008 hook + promise, m028-m034 build-up to the $50M and the punch, m060,
  m120) as `<letter>-<name>.mp3` (dry voice) and `.mp4` (full video), each starting with a 1 s beep gap:
  A Kokoro bm_george 1.15 (v2) | B Chatterbox default, no stretch, sentence by sentence, moderate (no VOICE-8 offsets)
  | C like B with paragraphs | D like C, exaggeration 0.65 / cfg 0.4 | E like C, temperature 0.9.
  `voice-test-2-report.json`: WER, liveliness, wpm / narrationWpm, UTMOS (UTMOS22 strong naturalness MOS prediction,
  `chatterbox_worker.py utmos`, tarepan/SpeechMOS v1.2.0 via torch.hub, MIT) and TTS speed per variant.

### Voice A/B (`.github/workflows/voice-test.yml`)
Push `ci/voice-test.txt` (or start it in the Actions tab): the opening ~100 words + question / reveal / verdict of
a production are rendered with 1 Kokoro `bm_george` 1.15, 2 Chatterbox `narrator`, 3 Chatterbox `default` into the
release `voice-test` (`voice-ab-1/2/3.mp4` + `voice-ab-report.json`: WER, liveliness, TTS seconds per audio second
= the CPU speed benchmark). The temporary specs exist only in the CI workspace.

Result of 15 Oct 2026 (Blockbuster opening): Kokoro `bm_george` 1.15 WER 3.1 %, liveliness 4.17 st, 0.8 s/s;
Chatterbox `narrator` WER 6.9 %, liveliness 5.19, 10.3 s/s; Chatterbox `default` WER 3.1 %, liveliness 5.39,
7.3 s/s. Winner and channel default: `{"engine": "chatterbox", "voice": "default", "reference": "default"}`.

### VOICE-11 (iteration 57): the channel voice back to normal

Lars (15 Oct, 20:25, after v4 Blockbuster / Nike): *it already sounds better but the voice itself is still too static;
the sentences are good now with good pauses, the voice itself may go back to normal.* `voice-test-2` (run
38779110526) measured variant C (paragraphs, no offsets, no stretch, pauses x1.15) best on intelligibility and
naturalness: WER 0.8 %, UTMOS 4.41 (B 4.37, D 4.39, E 4.40, Kokoro 4.21), liveliness 4.96 st, in-scene 185 wpm.
`delivery.CHANNEL_TUNING` is now `{exaggerationOffset 0, cfgOffset 0, pace 1.0, pauseScale 1.15, paragraphs true,
paceGuard false}`: no stretch, no VOICE-8 offsets, paragraph generation by default, the pace guard only with an
explicit `targetWpm`. Blockbuster and Nike were re-rendered with it through `ci/rerender.txt` (their specs carry no
voice overrides). D (more emotion) and E (temperature 0.9) remain one spec field away (see the table above).

### VOICE-12 (iteration 60): breathing room

Lars watched Nike v2 (155 wpm overall): the voice is right, the pauses are too short. `delivery.CHANNEL_PAUSES` +
`tts.layout_breathing` lay every pause out as an exact speech-to-speech gap per boundary type (table above), the
channel default for Chatterbox; `delivery.CHANNEL_TUNING.pauseScale` (1.15) only applies to the legacy layout
(`voice.pauses: false`). A layout simulation on both specs gave ~146-148 wpm with the bare table, so the pace guard
(default on, pauses only, x0.8-1.4, each pause capped at 1.8 s) brings the whole video to ~140 wpm. Both productions
were re-rendered through `ci/rerender.txt`.

## Licence rule for Piper voices

A Piper voice is allowed only when its training data is CC0, public domain or CC BY, and it was trained from
scratch or fine-tuned from an allowed voice. Rejected: `lessac` (Blizzard 2013 research licence) and everything
fine-tuned from it (`nl_NL-pim`, `nl_NL-ronnie`, `nl_BE-nathalie`, `en_GB-vctk`, `en_US-libritts_r`).

| voice | language | data licence |
|---|---|---|
| `nl_BE-rdh-medium` | Flemish Dutch | CC0, from scratch |
| `nl_NL-alex-medium` | Dutch | CC0, fine-tuned from rdh |
| `nl_NL-mls-medium` | Dutch, 52 speakers (`voice.speaker` 0-51) | CC BY 4.0 (Multilingual LibriSpeech): credit needed |
| `en_US-ljspeech-high` | US English, female | public domain |
| `en_US-kristin-medium` | US English, female | public domain (LibriVox) |

## spec.voice

```json
"voice": {"engine": "kokoro", "voice": "bm_george", "speed": 1.1}
"voice": {"engine": "piper", "voice": "nl_NL-mls-medium", "speaker": 3, "speed": 1.0}
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default"}
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default", "exaggeration": 0.65, "cfgWeight": 0.4}
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default", "pauses": {"section": 1.8, "scene": 1.0}}
```

## Narration controls

- `[pause 0.5]` anywhere in `narration` inserts 0.5 s of silence. The marker is not spoken and never appears in
  captions or timing (`pipeline/tts.py`); with the VOICE-12 layout it comes on top of the table pause.
- `scenes[].section: true` (or a label) marks the start of a new story section: the longer `section` pause comes
  before it.
- `scenes[].voiceSpeed` (0.5-2.0) overrides `voice.speed` for one scene, e.g. slower for the verdict (Kokoro / Piper;
  ignored for Chatterbox since VOICE-10a).

```json
{"id": "s17", "kind": "question", "narration": "So. [pause 0.6] Would you sign? [pause 0.4] Or would you pass?", "voiceSpeed": 0.95, ...}
```

## Add a voice

1. Read its MODEL_CARD on Hugging Face: dataset licence and what it was fine-tuned from.
2. Add it to `voices` in `brand/voices.json` with `path` (folder in rhasspy/piper-voices), `licence`, `dataset`,
   `modelCard` and `attribution` when the licence needs credit. Never add NC / ND / research-only voices.
