"""Chatterbox TTS worker (VOICE-1/VOICE-4). Runs inside the separate Chatterbox venv (pipeline/requirements-chatterbox.txt,
created by tts.py on first use), never imported by the main pipeline.

  python chatterbox_worker.py synth --jobs jobs.json --ref narrator-ref.wav --threads 2 [--asr base.en]
      jobs.json = [{"id", "text", "expected", "exaggeration", "cfgWeight", "temperature", "seed", "out",
                    "sentences" (VOICE-10b paragraph clip: its sentences -> .json gets "cuts" + "speech")}]
      Writes every job's WAV (24 kHz mono float) to `out` (skipped when it exists = cache hit) and `out`.json with
      {wer, asr, retried, exaggeration, seconds}. With --asr every clip is transcribed (faster-whisper, CPU int8) and a
      clip with WER > 0.30 is generated once more with a lower exaggeration / other seed; the better take is kept.
  python chatterbox_worker.py utmos --wav voice.wav --out utmos.json
      UTMOS22 naturalness MOS prediction (VOICE-10c listening test; tarepan/SpeechMOS via torch.hub, MIT).
  python chatterbox_worker.py liveliness --wav voice.wav --out liveliness.json
      Pitch variation (std of F0 in semitones, librosa.pyin) per minute = 'voice liveliness'.
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import textnorm  # noqa: E402  (standard library only, shared with tts.py)

RETRY_WER = 0.30
SR_ASR = 16000

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen " \
       "seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def num_words(n):
    n = int(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + num_words(n % 100))
    for div, name in ((10 ** 12, "trillion"), (10 ** 9, "billion"), (10 ** 6, "million"), (1000, "thousand")):
        if n >= div:
            return num_words(n // div) + " " + name + ("" if n % div == 0 else " " + num_words(n % div))
    return str(n)


def year_words(n):
    n = int(n)
    if 2000 <= n <= 2009:
        return num_words(n)
    hi, lo = divmod(n, 100)
    return num_words(hi) + (" hundred" if lo == 0 else (" oh " + ONES[lo] if lo < 10 else " " + num_words(lo)))


def normalise(text):
    """Canonical tokens for WER (pipeline/textnorm.py: spelled-out and digit numbers compare equal)."""
    return textnorm.canon(text)


def wer(ref, hyp):
    return textnorm.wer(ref, hyp)


def load_asr(name):
    from faster_whisper import WhisperModel
    return WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=max(1, int(os.environ.get("OMP_NUM_THREADS", "2"))))


def transcribe(asr, wav, sr, words=False):
    """ASR text; with words=True (text, [(word, start, end)])."""
    import numpy as np
    import librosa
    a = librosa.resample(np.asarray(wav, dtype=np.float32), orig_sr=sr, target_sr=SR_ASR) if sr != SR_ASR else wav
    segs, _ = asr.transcribe(a, language="en", beam_size=1, vad_filter=False, condition_on_previous_text=False,
                             word_timestamps=words)
    segs = list(segs)
    text = " ".join(s.text.strip() for s in segs).strip()
    if not words:
        return text
    return text, [(w.word, float(w.start), float(w.end)) for s in segs for w in (s.words or [])]


def _toks(text):
    return re.findall(r"[a-z0-9']+", (text or "").lower().replace("’", "'"))


def sentence_cuts(sentences, words, audio, sr):
    """VOICE-10b: split a paragraph clip into its sentences. The ASR word timestamps are aligned to the known
    sentence words (difflib); every cut goes to the quietest 20 ms inside the gap between two sentences (proportional
    estimate +-0.4 s when the alignment has no anchor). Returns (cuts in samples, [[start, end] s per sentence])."""
    import difflib
    import numpy as np
    ref = [(t, si) for si, s in enumerate(sentences) for t in _toks(s)]
    hyp = [(t, ws, we) for (w, ws, we) in words for t in _toks(w)]
    span = [[None, None] for _ in sentences]
    sm = difflib.SequenceMatcher(None, [r[0] for r in ref], [h[0] for h in hyp], autojunk=False)
    for a0, b0, n in sm.get_matching_blocks():
        for k in range(n):
            si = ref[a0 + k][1]
            _, ws, we = hyp[b0 + k]
            span[si][0] = ws if span[si][0] is None else min(span[si][0], ws)
            span[si][1] = we if span[si][1] is None else max(span[si][1], we)
    dur = len(audio) / sr
    chars = [max(1, len(s)) for s in sentences]
    hop, win = int(0.005 * sr), int(0.02 * sr)
    sq = np.asarray(audio, dtype=np.float64) ** 2
    csum = np.concatenate([[0.0], np.cumsum(sq)])
    cuts, prev = [], 0
    for k in range(len(sentences) - 1):
        est = dur * sum(chars[:k + 1]) / sum(chars)
        lo_t, hi_t = span[k][1], span[k + 1][0]
        if lo_t is not None and hi_t is not None and hi_t > lo_t - 0.15:
            lo_t, hi_t = min(lo_t, hi_t) - 0.05, max(lo_t, hi_t) + 0.05
        elif lo_t is not None:
            lo_t, hi_t = lo_t - 0.05, lo_t + 0.6
        elif hi_t is not None:
            lo_t, hi_t = hi_t - 0.6, hi_t + 0.05
        else:
            lo_t, hi_t = est - 0.4, est + 0.4
        a = max(prev + win, int(lo_t * sr))
        b = min(len(audio) - win, int(hi_t * sr))
        if b <= a:
            c = min(len(audio) - 1, max(prev + 1, int(est * sr)))
        else:
            starts = np.arange(a, b, hop)
            energy = csum[starts + win] - csum[starts]
            c = int(starts[int(np.argmin(energy))] + win // 2)
        cuts.append(c)
        prev = c
    speech = [[round(s[0], 3), round(s[1], 3)] if s[0] is not None else None for s in span]
    return cuts, speech


def synth(args):
    import numpy as np
    import soundfile as sf
    import torch
    torch.set_num_threads(args.threads)
    from chatterbox.tts import ChatterboxTTS
    jobs = json.load(open(args.jobs, encoding="utf-8"))
    todo = [j for j in jobs if not Path(j["out"]).exists()]
    print(f"[chatterbox] {len(jobs)} jobs, {len(todo)} to generate, threads={args.threads}", flush=True)
    if not todo:
        return
    t0 = time.time()
    model = ChatterboxTTS.from_pretrained(device="cpu")
    if args.ref and args.ref != "default":  # 'default' = the built-in Chatterbox voice (conds.pt)
        model.prepare_conditionals(args.ref, exaggeration=0.5)
    asr = load_asr(args.asr) if args.asr else None
    print(f"[chatterbox] models loaded in {time.time() - t0:.0f}s", flush=True)
    audio_sec = 0.0
    for n, j in enumerate(todo):
        t1 = time.time()
        takes = []
        tries = [(j["exaggeration"], j["cfgWeight"], j.get("seed", 0))]
        if asr:
            tries.append((max(0.25, j["exaggeration"] - 0.2), max(0.5, j["cfgWeight"]), j.get("seed", 0) + 7919))
        for k, (ex, cfg, seed) in enumerate(tries):
            torch.manual_seed(int(seed))
            try:
                wav = model.generate(j["text"], exaggeration=float(ex), cfg_weight=float(cfg),
                                     temperature=float(j.get("temperature", 0.8)))
                a = wav.squeeze(0).numpy().astype(np.float32)
            except Exception as e:  # noqa: BLE001
                print(f"[chatterbox] job {j['id']} try {k + 1} failed: {e}", flush=True)
                continue
            words = None
            if asr and j.get("sentences"):
                hyp, words = transcribe(asr, a, model.sr, words=True)
            else:
                hyp = transcribe(asr, a, model.sr) if asr else None
            w = wer(j.get("expected") or j["text"], hyp) if asr else None
            takes.append((w if w is not None else 0.0, k, a, hyp, ex, words))
            if w is None or not textnorm.bad_sentence(j.get("expected") or j["text"], hyp, RETRY_WER):
                break
            print(f"[chatterbox] job {j['id']} WER {w:.2f} -> retry: {hyp!r}", flush=True)
        if not takes:
            continue
        w, k, a, hyp, ex, words = min(takes, key=lambda x: (x[0], x[1]))
        out = Path(j["out"])
        out.parent.mkdir(parents=True, exist_ok=True)
        sf.write(str(out) + ".tmp.wav", a, model.sr, subtype="FLOAT")
        os.replace(str(out) + ".tmp.wav", out)
        info = {"wer": None if w is None or not asr else round(w, 3), "asr": hyp, "retried": len(takes) > 1 or k > 0,
                "exaggeration": ex, "seconds": round(len(a) / model.sr, 2), "sr": model.sr}
        if j.get("sentences"):  # VOICE-10b paragraph clip: where to cut it into its sentences
            if words is None and len(j["sentences"]) > 1 and asr is None:
                words = []
            cuts, speech = sentence_cuts(j["sentences"], words or [], a, model.sr)
            info.update({"sentences": j["sentences"], "cuts": cuts, "speech": speech})
        json.dump(info, open(str(out) + ".json", "w", encoding="utf-8"))
        audio_sec += len(a) / model.sr
        el = time.time() - t1
        print(f"[chatterbox] {n + 1}/{len(todo)} {j['id']} {len(a) / model.sr:.1f}s audio in {el:.1f}s"
              f"{'' if w is None else f' WER {w:.2f}'}", flush=True)
    print(f"[chatterbox] done: {audio_sec:.0f}s audio in {time.time() - t0:.0f}s", flush=True)


def pitch_variation(y, sr=16000):
    import numpy as np
    import librosa
    hop = 320
    f0, voiced, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=1024, hop_length=hop)
    per_min = []
    frames_per_min = int(60 * sr / hop)
    for i in range(0, len(f0), frames_per_min):
        seg = f0[i:i + frames_per_min]
        seg = seg[~np.isnan(seg)]
        if len(seg) < 50:
            continue
        st = 12 * np.log2(seg / np.median(seg))
        per_min.append(round(float(np.std(st)), 2))
    allv = f0[~np.isnan(f0)]
    overall = float(np.std(12 * np.log2(allv / np.median(allv)))) if len(allv) else 0.0
    return {"metric": "std of F0 in semitones (librosa.pyin)", "overall": round(overall, 2),
            "perMinute": per_min, "mean": round(float(np.mean(per_min)), 2) if per_min else 0.0}


def liveliness(args):
    import librosa
    y, _ = librosa.load(args.wav, sr=16000, mono=True)
    res = pitch_variation(y)
    json.dump(res, open(args.out, "w"), indent=1)
    print(f"[liveliness] {res['mean']} st (per minute {res['perMinute']})", flush=True)


def trackqa(args):
    """Overall WER of the whole voice track vs. the narration + liveliness (any engine)."""
    import librosa
    t0 = time.time()
    y, _ = librosa.load(args.wav, sr=SR_ASR, mono=True)
    text = open(args.text, encoding="utf-8").read()
    asr = load_asr(args.asr or "base.en")
    segs, _ = asr.transcribe(y, language="en", beam_size=1, vad_filter=True)
    hyp = " ".join(s.text.strip() for s in segs)
    res = {"wer": round(wer(text, hyp), 4), "asrModel": args.asr or "base.en", "words": len(normalise(text)),
           "liveliness": pitch_variation(y), "seconds": round(len(y) / SR_ASR, 1)}
    json.dump(res, open(args.out, "w"), indent=1)
    print(f"[trackqa] WER {res['wer']:.3f}, liveliness {res['liveliness']['mean']} st, {time.time() - t0:.0f}s",
          flush=True)


UTMOS_HUB = "tarepan/SpeechMOS:v1.2.0"  # MIT (UTMOS22 strong learner weights: MIT, sarulab-speech/UTMOS22)


def utmos(args):
    """VOICE-10c naturalness proxy: UTMOS22 strong MOS prediction (1-5) averaged over ~8 s windows of a voice track
    (silences between sentences are kept; windows with almost no speech are skipped). CPU, a few seconds a minute."""
    import numpy as np
    import librosa
    import torch
    torch.set_num_threads(max(1, int(os.environ.get("OMP_NUM_THREADS", "2"))))
    y, _ = librosa.load(args.wav, sr=16000, mono=True)
    predictor = torch.hub.load(UTMOS_HUB, "utmos22_strong", trust_repo=True)
    win = 8 * 16000
    scores = []
    for i in range(0, max(1, len(y) - win // 4), win):
        seg = y[i:i + win]
        if len(seg) < 2 * 16000 or float(np.mean(np.abs(seg) > 0.01)) < 0.25:
            continue
        with torch.no_grad():
            scores.append(round(float(predictor(torch.from_numpy(seg).unsqueeze(0), 16000)[0]), 3))
    res = {"metric": "UTMOS22 strong (predicted naturalness MOS 1-5)", "model": UTMOS_HUB,
           "mean": round(float(np.mean(scores)), 3) if scores else None, "windows": scores}
    json.dump(res, open(args.out, "w"), indent=1)
    print(f"[utmos] {res['mean']} over {len(scores)} windows", flush=True)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("synth")
    s.add_argument("--jobs", required=True)
    s.add_argument("--ref", required=True)
    s.add_argument("--threads", type=int, default=4)
    s.add_argument("--asr", default="")
    lv = sub.add_parser("liveliness")
    lv.add_argument("--wav", required=True)
    lv.add_argument("--out", required=True)
    tq = sub.add_parser("trackqa")
    tq.add_argument("--wav", required=True)
    tq.add_argument("--text", required=True)
    tq.add_argument("--out", required=True)
    tq.add_argument("--asr", default="base.en")
    um = sub.add_parser("utmos")
    um.add_argument("--wav", required=True)
    um.add_argument("--out", required=True)
    w = sub.add_parser("wer")
    w.add_argument("ref")
    w.add_argument("hyp")
    a = ap.parse_args()
    if a.cmd == "synth":
        synth(a)
    elif a.cmd == "liveliness":
        liveliness(a)
    elif a.cmd == "trackqa":
        trackqa(a)
    elif a.cmd == "utmos":
        utmos(a)
    else:
        print(wer(a.ref, a.hyp), normalise(a.ref), normalise(a.hyp))


if __name__ == "__main__":
    sys.exit(main())
