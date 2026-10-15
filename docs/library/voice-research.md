# Voice research: more human, still free (VOICE-10d, 2026-10-15)

Question from Lars (via the Architect): which free, commercially licensed TTS models sound more human than the current
Chatterbox for long-form narration, what hardware do they need, and can a free GPU (Kaggle / Colab) run them from
GitHub Actions? **No implementation yet**: this page is the decision basis. Licences were checked on the project pages
on 2026-10-15; check them again before adopting a model (they change).

## Why v4 sounded worse (and what VOICE-10a/b changed)

1. **Time-stretch.** The VOICE-8 pace guard slowed Chatterbox with rubberband down to 0.88 (12 %). A stretch that
   large smears the prosody and makes the voice drone. VOICE-10a: Chatterbox is no longer stretched by default
   (pace 1.0, explicit values clamped to 0.97-1.0); the pace guard now only lengthens the pauses (pauseScale 1.0-1.6).
2. **Sentence-by-sentence generation.** Each sentence started from a fresh, neutral intonation: it sounded like a
   list being read out. VOICE-10b `voice.paragraphs`: 2-4 sentences of one thought per Chatterbox call, cut back into
   sentences with faster-whisper word timestamps (timing.json keeps its format).
3. **High exaggeration + low cfg** can flatten into a monotone "performance" voice; the listening test
   (`voice-test-2`, variants B-E) compares moderate and stronger settings.
4. The liveliness metric (F0 variation) went *up* while Lars heard it get worse: pitch movement is not naturalness.
   `voice-test-2` therefore also reports UTMOS (a learned naturalness MOS predictor, see below) and Lars's ear decides.

## Candidates

| Model | Licence (weights) | Size / hardware | Long-form narration | Verdict |
|---|---|---|---|---|
| **Chatterbox (original, current)** | MIT | 0.5B; CPU works (~7-10 s per audio second on a 4-core runner) | good, sentence-level emotion via `exaggeration` | baseline |
| **Chatterbox Turbo** (Resemble AI, Dec 2025) | MIT | 350M, single-step decoder: much faster, CPU feasible | English only; native paralinguistic tags `[laugh]`, `[chuckle]`, `[cough]` ...; zero-shot cloning | **best next step on CPU**: drop-in for our worker (same package family) |
| **VoxCPM2** (OpenBMB, Apr 2026) | Apache-2.0 (code + weights, no field-of-use rider) | 2B, ~8 GB VRAM; RTF ~0.3 on an RTX 4090 (a T4 is ~3-4x slower); 48 kHz | infers prosody from context ("content-matched delivery"), voice design + cloning, 30 languages | **best candidate on a free GPU**; not yet independently ranked |
| Kokoro v1.0 (current fallback, v2 voice) | Apache-2.0 | 82M, CPU | very clean but even/neutral tone ("static") | keep as fallback |
| Dia (Nari Labs) | Apache-2.0 | 1.6B, GPU ~10 GB | built for two-speaker dialogue, non-verbal tags; less stable for one narrator | possible, not first choice |
| Orpheus TTS (Canopy Labs) | code Apache-2.0, weights derived from Llama-3.2-3B (Llama licence obligations) | 3B, GPU | very human, emotion tags | **unclear licence chain**: excluded by our rules |
| Higgs Audio v2 (Boson AI) | Boson Higgs Audio 2 Community Licence (Llama-3 based, conditions + user cap) | 3B+, GPU | very expressive | **not MIT/Apache**: excluded |
| IndexTTS-2 (bilibili) | bilibili Model Use Licence; commercial use needs written authorisation (2.5 reportedly looser: re-check) | 1.5B, GPU | strong emotion control | **excluded** (licence) |
| VibeVoice (Microsoft) | released MIT, then withdrawn by Microsoft (research-only stance, 7B pulled) | 1.5B / 7B, GPU | made for 90-min long-form | **excluded** (unclear status) |
| StyleTTS2 | code MIT; pre-trained LibriTTS weights carry a disclosure condition | small, CPU/GPU | Kokoro is its successor | no gain over Kokoro |

Note: every Chatterbox output (original and Turbo) carries Resemble's inaudible PerTh watermark; this is allowed on
YouTube and already true today.

## Free GPU from GitHub Actions

- **Kaggle notebooks**: ~30 GPU hours per week (floating quota, 12 h per session), P100 16 GB or 2x T4 16 GB, phone
  verification needed. A GitHub Actions job can `kaggle kernels push` a small kernel (with `enable_gpu: true` and
  internet on) that clones this repo, generates the narration clips for one spec and saves them as kernel output; the
  workflow polls `kaggle kernels status` and fetches them with `kaggle kernels output` into the TTS cache, exactly like
  the current fan-out artifacts. Needs one GitHub secret (`KAGGLE_API_TOKEN`, or `KAGGLE_USERNAME` + `KAGGLE_KEY`)
  that Lars creates on kaggle.com. Cost: free; queueing can add minutes, so the CPU Chatterbox path stays as the
  automatic fallback.
- **Budget**: a 10-minute video has ~8 minutes of voice. VoxCPM2 on a T4 at RTF ~1 = ~10-15 min GPU per video incl.
  model load: 30 h/week covers well over 50 videos a week.
- **Google Colab**: free tier has no API to start notebooks headless from CI and disconnects idle sessions; not
  suitable for automation.

## Recommendation

1. Let Lars pick from `voice-test-2` (A Kokoro, B-E Chatterbox without stretch; C-E paragraph generation). If one of
   C-E is good enough, make it the default (`voice.paragraphs: true` + its settings) - no new infrastructure.
2. If none is good enough: **next CPU step = Chatterbox Turbo** (MIT, faster, paragraph-friendly, paralinguistic
   tags for the occasional chuckle/breath) as a listening-test variant - cheap to try, no new accounts.
3. **GPU route = VoxCPM2 (Apache-2.0) on Kaggle** via `kaggle kernels push` from GitHub Actions, with Lars's Kaggle
   API token as a GitHub secret and the CPU path as fallback. Stays free (30 GPU h/week).
4. Excluded for licence reasons: Orpheus, Higgs Audio v2, IndexTTS-2, VibeVoice.

Sources: github.com/resemble-ai/chatterbox, huggingface.co/openbmb/VoxCPM2, github.com/OpenBMB/VoxCPM,
github.com/canopyai/Orpheus-TTS, huggingface.co/bosonai/higgs-audio-v2-generation-3B-base (LICENSE),
github.com/index-tts/index-tts (LICENSE, issues #228/#464), huggingface.co/microsoft/VibeVoice-1.5B,
kaggle.com/product-feedback/173129 (GPU quota), github.com/Kaggle/kaggle-cli/issues/821,
github.com/tarepan/SpeechMOS (UTMOS, MIT).
