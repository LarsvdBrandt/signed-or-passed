# Voice library

Catalogue: `brand/voices.json` (id, engine, language, gender, grade, licence, attribution). Listen to every voice in
`voice-samples.mp4` / `voice-samples.zip` (release `library`, built by `pipeline/voice_samples.py`).

## Engines

| engine | model | licence | notes |
|---|---|---|---|
| `kokoro` (default) | hexgrad/Kokoro-82M v1.0 | Apache-2.0 | English (US `a*`, UK `b*`), Spanish `e*`, French `f*`, Hindi `h*`, Italian `i*`, Brazilian Portuguese `p*`. Japanese / Mandarin voices need misaki[ja]/[zh] and are not installed. Default speed 1.1. |
| `piper` | rhasspy/piper-voices (ONNX) | per voice (below) | Installed on first use (`piper-tts==1.3.0`), model cached in `~/.cache/huggingface/piper`. Default speed 1.0. Only voices listed in `brand/voices.json` are accepted. |
| `chatterbox` | ResembleAI/chatterbox (original model, `chatterbox-tts==0.1.2`) | MIT (code + weights) | Expressive English narration with emotion control (`exaggeration`, `cfg_weight`), zero-shot cloned from a reference clip. Own venv (`pipeline/requirements-chatterbox.txt`, CPU torch 2.6), created on first use. Default speed 1.0. Every sentence gets a delivery style (below). Kokoro is the per-sentence fallback. Output carries Resemble's inaudible Perth watermark. |

## Channel default (Signed or Passed): use this voice block in every spec

```json
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default"}
```

That is all the Director needs to write: the built-in Chatterbox voice (A/B winner, chosen by Lars on 15 Oct 2026)
with the VOICE-8 channel tuning applied automatically (more emotion, more human, slightly slower):

| setting | channel default | effect |
|---|---|---|
| `exaggerationOffset` | +0.15 | added to every delivery style's exaggeration (cap 1.0): more emotion |
| `cfgOffset` | -0.10 | added to every style's cfg_weight (floor 0.25): more expressive, more deliberate pacing |
| `pace` | 0.94 | every clip slowed after generation, pitch kept (ffmpeg `rubberband`, else `atempo`) |
| `pauseScale` | 1.15 | pauses between sentences and after styles +15 %; punch beat 0.25 s |
| `targetWpm` | [145, 155] | pace guard: when `pace` is not set, the measured pace of the main video is nudged (0.88-1.04) into this band |

Override any of them in `spec.voice` only for a reason (e.g. `"pace": 1.0` for a fast Short; `"exaggerationOffset":
0, "cfgOffset": 0, "pace": 1.0, "pauseScale": 1.0` = the untuned A/B voice). Mark the moments that matter with the
delivery tags below (`[build]`, `[punch]`, `[excited]`, `[somber]`, `[warm]`, `[tense]`, `[curious]`, `[calm]`).
The measured pace is in `render-report.json` -> `voice.pace` (`wpm`, `articulationWpm`) and QA warns outside
135-165 wpm.

## Expressive narration: engine `chatterbox` (VOICE-1..8)

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
| `speed` | 1.0 | time-stretch (pitch kept) on top of the style's speed factor |
| `exaggerationOffset` | 0.15 | VOICE-8: added to every style's exaggeration (-0.5..0.5; 0 = untuned) |
| `cfgOffset` | -0.10 | VOICE-8: added to every style's cfg_weight (-0.5..0.5, floor 0.25 when negative) |
| `pace` | 0.94 | VOICE-8: global pace after generation (0.7-1.3, pitch kept); setting it disables the pace guard |
| `pauseScale` | 1.15 | VOICE-8: multiplies sentence gaps and style pauses (0.5-2.0) |
| `targetWpm` | [145, 155] | VOICE-8 pace guard band (spoken words per minute, pauses inside scenes included) |

### Delivery styles (`pipeline/delivery.py`)

Base values; the channel tuning above is added on top (e.g. `punch` becomes exaggeration 0.90, cfg 0.25; `excited`
1.0 / 0.25; `calm` 0.50 / 0.40). On a retry after a bad ASR check the clip is generated with 0.2 less exaggeration.

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
- pace: `wpm` = words / speech time (first to last word of each scene, pauses inside a scene included; scene gaps,
  question holds and the sting excluded), `articulationWpm` = words / clip time; warning outside 135-165 wpm;
- every Chatterbox clip is transcribed with faster-whisper `base.en`; a clip with a word error rate > 30 % is
  generated once more with a lower exaggeration and another seed, the better take is kept;
- whole-track ASR word error rate <= 8 % (gate), no sentence > 30 % (gate), Kokoro fallback sentences (warning);
- liveliness = standard deviation of the pitch (F0, semitones, librosa pyin) per minute (info: higher = less
  monotone). `voice.qa: true` runs the same QA for Kokoro / Piper.

### Voice A/B (`.github/workflows/voice-test.yml`)
Push `ci/voice-test.txt` (or start it in the Actions tab): the opening ~100 words + question / reveal / verdict of
a production are rendered with 1 Kokoro `bm_george` 1.15, 2 Chatterbox `narrator`, 3 Chatterbox `default` into the
release `voice-test` (`voice-ab-1/2/3.mp4` + `voice-ab-report.json`: WER, liveliness, TTS seconds per audio second
= the CPU speed benchmark). The temporary specs exist only in the CI workspace.

Result of 15 Oct 2026 (Blockbuster opening): Kokoro `bm_george` 1.15 WER 3.1 %, liveliness 4.17 st, 0.8 s/s;
Chatterbox `narrator` WER 6.9 %, liveliness 5.19, 10.3 s/s; Chatterbox `default` WER 3.1 %, liveliness 5.39,
7.3 s/s. Winner and channel default: `{"engine": "chatterbox", "voice": "default", "reference": "default"}`.

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
"voice": {"engine": "chatterbox", "voice": "default", "reference": "default", "pace": 1.0, "exaggerationOffset": 0.2}
```

## Narration controls

- `[pause 0.5]` anywhere in `narration` inserts 0.5 s of silence. The marker is not spoken and never appears in
  captions or timing (`pipeline/tts.py`).
- `scenes[].voiceSpeed` (0.5-2.0) overrides `voice.speed` for one scene, e.g. slower for the verdict.

```json
{"id": "s17", "kind": "question", "narration": "So. [pause 0.6] Would you sign? [pause 0.4] Or would you pass?", "voiceSpeed": 0.95, ...}
```

## Add a voice

1. Read its MODEL_CARD on Hugging Face: dataset licence and what it was fine-tuned from.
2. Add it to `voices` in `brand/voices.json` with `path` (folder in rhasspy/piper-voices), `licence`, `dataset`,
   `modelCard` and `attribution` when the licence needs credit. Never add NC / ND / research-only voices.
