"""VOICE-5 voice A/B helper for ci/render-voice-test.sh (.github/workflows/voice-test.yml).

  python ci/voice-ab.py specs  [--source <slug>] [--words 115]
      Builds productions/0000-voice-ab-<n>/spec.json (NOT committed: CI workspace only) from the first scenes of a
      real production (~--words narrated words, cold opens included, no shorts) followed by its first question,
      reveal and verdict scenes (the build-up / payoff moments; the spec contract needs question + verdict),
      with one voice variant each:
        1 kokoro bm_george 1.15 (+ voice QA)   2 chatterbox, reference narrator   3 chatterbox, reference default
      Narration, visuals, sources and assets are copied unchanged; only the voice block differs.
  python ci/voice-ab.py report --out <dir>
      Collects build/0000-voice-ab-<n>/voice-qa.json, the TTS wall time (build/voice-ab-<n>.tts-sec) and the voice
      length (timing.json) into <dir>/voice-ab-report.json: WER, liveliness, TTS seconds per audio second.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "2026-10-15-blockbuster-passes-on-netflix"
VARIANTS = [
    {"n": 1, "label": "Kokoro bm_george 1.15 (current voice)",
     "voice": {"engine": "kokoro", "voice": "bm_george", "speed": 1.15, "qa": True}},
    {"n": 2, "label": "Chatterbox, cloned narrator reference (Kokoro bm_george timbre)",
     "voice": {"engine": "chatterbox", "voice": "narrator", "reference": "narrator"}},
    {"n": 3, "label": "Chatterbox, built-in default voice",
     "voice": {"engine": "chatterbox", "voice": "default", "reference": "default"}},
]


def words(text):
    return len(re.sub(r"\[[^\]]*\]|\*\*", " ", text).split())


def specs(args):
    src = json.loads((ROOT / "productions" / args.source / "spec.json").read_text(encoding="utf-8"))
    scenes, n = [], 0
    for sc in src["scenes"]:
        if n >= args.words and scenes:
            break
        scenes.append(sc)
        n += words(sc.get("narration", ""))
    for kind in ("question", "reveal", "verdict"):
        extra = next((sc for sc in src["scenes"] if sc["kind"] == kind and not sc.get("coldOpen")), None)
        if extra is not None and extra not in scenes:
            scenes.append(extra)
            n += words(extra.get("narration", ""))
    base = {k: v for k, v in src.items() if k not in ("shorts", "nextTeaser")}
    base["scenes"] = scenes
    used = {sc["visual"].get("assetId") for sc in scenes} - {None}
    base["assets"] = [a for a in src.get("assets") or [] if a["id"] in used]
    for v in VARIANTS:
        slug = f"0000-voice-ab-{v['n']}"
        spec = dict(base, slug=slug, voice=v["voice"])
        d = ROOT / "productions" / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "spec.json").write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"{slug}: {len(scenes)} scenes, {n} words, voice {json.dumps(v['voice'])}")


def report(args):
    out = Path(args.out)
    rows = []
    for v in VARIANTS:
        slug = f"0000-voice-ab-{v['n']}"
        qa_p = ROOT / "build" / slug / "voice-qa.json"
        qa = json.loads(qa_p.read_text()) if qa_p.exists() else {}
        timing_p = ROOT / "build" / slug / "main" / "timing.json"
        timing = json.loads(timing_p.read_text()) if timing_p.exists() else {}
        voice_sec = sum(s["end"] - s["start"] for sc in timing.get("scenes", []) for s in sc.get("sentences", []))
        tts_p = ROOT / "build" / f"voice-ab-{v['n']}.tts-sec"
        tts_sec = float(tts_p.read_text().strip()) if tts_p.exists() else None
        gen_p = ROOT / "build" / f"voice-ab-{v['n']}.gen-sec"
        gen_sec = float(gen_p.read_text().strip()) if gen_p.exists() and gen_p.read_text().strip() else None
        rows.append({
            "variant": v["n"], "label": v["label"], "voice": v["voice"], "file": f"voice-ab-{v['n']}.mp4",
            "wer": qa.get("wer"), "clipWer": qa.get("clipWer"), "liveliness": (qa.get("liveliness") or {}).get("mean"),
            "livelinessPerMinute": (qa.get("liveliness") or {}).get("perMinute"),
            "fallbackSentences": len(qa.get("fallbackSentences") or []), "badSentences": len(qa.get("badSentences") or []),
            "retried": qa.get("retried"), "voiceSec": round(voice_sec, 1), "totalSec": timing.get("totalSec"),
            "ttsWallSec": tts_sec, "chatterboxGenerateSec": gen_sec,
            "ttsSecPerAudioSec": round((gen_sec or tts_sec) / voice_sec, 2) if voice_sec and (gen_sec or tts_sec) else None,
            "error": qa.get("error"),
        })
    for r in rows:
        if r["ttsSecPerAudioSec"]:
            # a 9-minute video has ~460 s of voice
            r["estimatedTtsMinFor9MinVideo"] = round(r["ttsSecPerAudioSec"] * 460 / 60, 1)
    res = {"source": SOURCE, "variants": rows,
           "note": "liveliness = std of F0 in semitones (higher = more melodic, less monotone); WER via faster-whisper base.en"}
    out.mkdir(parents=True, exist_ok=True)
    (out / "voice-ab-report.json").write_text(json.dumps(res, indent=2) + "\n")
    print(json.dumps(res, indent=2))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("specs")
    s.add_argument("--source", default=SOURCE)
    s.add_argument("--words", type=int, default=100)
    r = sub.add_parser("report")
    r.add_argument("--out", required=True)
    a = ap.parse_args()
    specs(a) if a.cmd == "specs" else report(a)


if __name__ == "__main__":
    sys.exit(main())
