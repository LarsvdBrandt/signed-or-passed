# Voice library

Catalogue: `brand/voices.json` (id, engine, language, gender, grade, licence, attribution). Listen to every voice in
`voice-samples.mp4` / `voice-samples.zip` (release `library`, built by `pipeline/voice_samples.py`).

## Engines

| engine | model | licence | notes |
|---|---|---|---|
| `kokoro` (default) | hexgrad/Kokoro-82M v1.0 | Apache-2.0 | English (US `a*`, UK `b*`), Spanish `e*`, French `f*`, Hindi `h*`, Italian `i*`, Brazilian Portuguese `p*`. Japanese / Mandarin voices need misaki[ja]/[zh] and are not installed. Default speed 1.1. |
| `piper` | rhasspy/piper-voices (ONNX) | per voice (below) | Installed on first use (`piper-tts==1.3.0`), model cached in `~/.cache/huggingface/piper`. Default speed 1.0. Only voices listed in `brand/voices.json` are accepted. |

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
