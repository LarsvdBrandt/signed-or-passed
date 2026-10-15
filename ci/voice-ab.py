"""Voice listening tests for ci/render-voice-test.sh (.github/workflows/voice-test.yml).

  python ci/voice-ab.py specs  [--set ab|vt2] [--source <slug>] [--words 100]
      Builds productions/0000-voice-ab-<n>/spec.json (NOT committed: CI workspace only) with one voice variant each;
      narration, visuals, sources and assets are copied unchanged from a real production, only the voice differs.
      Prints the variant ids (one per line, prefixed 'VARIANT ') for the shell loop.
        set ab  (VOICE-5): the first ~--words narrated words + the first question / reveal / verdict scenes,
                variants 1 Kokoro bm_george 1.15, 2 Chatterbox narrator reference, 3 Chatterbox default voice
        set vt2 (VOICE-10c, release 'voice-test-2'): a fixed ~70 s Blockbuster excerpt (hook + promise m001-m008,
                the build-up to the $50M and the punch m028-m034, question m060, verdict m120), variants
                A Kokoro bm_george 1.15 (v2) | B Chatterbox default, no stretch, sentence by sentence, moderate |
                C like B, PARAGRAPHS | D like C with more emotion (exag 0.65, cfg 0.4) | E like C, temperature 0.9
  python ci/voice-ab.py report --out <dir> [--set ab|vt2]
      Collects build/0000-voice-ab-<n>/voice-qa.json (+ utmos.json), the TTS wall time (build/voice-ab-<n>.tts-sec)
      and timing.json into <dir>/voice-ab-report.json (set ab) or <dir>/voice-test-2-report.json (set vt2):
      WER, liveliness, wpm, UTMOS naturalness, TTS seconds per audio second.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "2026-10-15-blockbuster-passes-on-netflix"
# moderate, untuned Chatterbox (VOICE-3 delivery styles only, no VOICE-8 offsets, no stretch)
_MOD = {"engine": "chatterbox", "voice": "default", "reference": "default", "exaggerationOffset": 0, "cfgOffset": 0,
        "pace": 1.0, "pauseScale": 1.15}
SETS = {
    "ab": {"report": "voice-ab-report.json", "variants": [
        {"n": "1", "label": "Kokoro bm_george 1.15 (current voice)",
         "voice": {"engine": "kokoro", "voice": "bm_george", "speed": 1.15, "qa": True}},
        {"n": "2", "label": "Chatterbox, cloned narrator reference (Kokoro bm_george timbre)",
         "voice": {"engine": "chatterbox", "voice": "narrator", "reference": "narrator"}},
        {"n": "3", "label": "Chatterbox, built-in default voice",
         "voice": {"engine": "chatterbox", "voice": "default", "reference": "default"}},
    ]},
    "vt2": {"report": "voice-test-2-report.json",
            "scenes": ["m001", "m002", "m003", "m004", "m005", "m006", "m007", "m008",
                       "m028", "m029", "m030", "m031", "m032", "m033", "m034", "m060", "m120"],
            "variants": [
        {"n": "A", "name": "A-kokoro-george", "label": "A: Kokoro bm_george 1.15 (the v2 voice)",
         "voice": {"engine": "kokoro", "voice": "bm_george", "speed": 1.15, "qa": True}},
        {"n": "B", "name": "B-chatterbox-sentences", "label": "B: Chatterbox default, no stretch, sentence by sentence, "
         "moderate (exag 0.5 base, cfg 0.5, VOICE-3 delivery)", "voice": dict(_MOD)},
        {"n": "C", "name": "C-chatterbox-paragraphs", "label": "C: like B, but PARAGRAPHS (2-4 sentences per call)",
         "voice": dict(_MOD, paragraphs=True)},
        {"n": "D", "name": "D-paragraphs-emotion", "label": "D: like C, more emotion (exag 0.65 base, cfg 0.4)",
         "voice": dict(_MOD, paragraphs=True, exaggeration=0.65, cfgWeight=0.4)},
        {"n": "E", "name": "E-paragraphs-temp09", "label": "E: like C, temperature 0.9 (+ per-clip seed variation)",
         "voice": dict(_MOD, paragraphs=True, temperature=0.9)},
    ]},
}


def words(text):
    return len(re.sub(r"\[[^\]]*\]|\*\*", " ", text).split())


def specs(args):
    cfg = SETS[args.set]
    src = json.loads((ROOT / "productions" / args.source / "spec.json").read_text(encoding="utf-8"))
    if cfg.get("scenes"):
        by_id = {sc["id"]: sc for sc in src["scenes"]}
        scenes = [by_id[i] for i in cfg["scenes"] if i in by_id]
        n = sum(words(sc.get("narration", "")) for sc in scenes)
    else:
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
    for v in cfg["variants"]:
        slug = f"0000-voice-ab-{v['n'].lower()}"
        spec = dict(base, slug=slug, voice=v["voice"])
        d = ROOT / "productions" / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "spec.json").write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"{slug}: {len(scenes)} scenes, {n} words, voice {json.dumps(v['voice'])}", file=sys.stderr)
        print(f"VARIANT {v['n'].lower()} {v.get('name') or 'voice-ab-' + v['n']}")


def report(args):
    cfg = SETS[args.set]
    out = Path(args.out)
    rows = []
    for v in cfg["variants"]:
        slug = f"0000-voice-ab-{v['n'].lower()}"
        name = v.get("name") or f"voice-ab-{v['n']}"
        rd = lambda p: json.loads(p.read_text()) if p.exists() else {}  # noqa: E731
        qa = rd(ROOT / "build" / slug / "voice-qa.json")
        timing = rd(ROOT / "build" / slug / "main" / "timing.json")
        mos = rd(ROOT / "build" / slug / "utmos.json")
        voice_sec = sum(s["end"] - s["start"] for sc in timing.get("scenes", []) for s in sc.get("sentences", []))
        tts_p = ROOT / "build" / f"voice-ab-{v['n'].lower()}.tts-sec"
        tts_sec = float(tts_p.read_text().strip()) if tts_p.exists() else None
        gen_p = ROOT / "build" / f"voice-ab-{v['n'].lower()}.gen-sec"
        gen_sec = float(gen_p.read_text().strip()) if gen_p.exists() and gen_p.read_text().strip() else None
        pace = timing.get("pace") or {}
        n_words = pace.get("words")
        total = timing.get("totalSec")
        rows.append({
            "variant": v["n"], "label": v["label"], "voice": v["voice"],
            "files": [f"{name}.mp3", f"{name}.mp4"] if args.set != "ab" else [f"{name}.mp4"],
            "wer": qa.get("wer"), "clipWer": qa.get("clipWer"), "liveliness": (qa.get("liveliness") or {}).get("mean"),
            "livelinessPerMinute": (qa.get("liveliness") or {}).get("perMinute"),
            "utmos": mos.get("mean"), "utmosWindows": mos.get("windows"),
            "wpm": pace.get("wpm"), "articulationWpm": pace.get("articulationWpm"),
            "narrationWpm": round(60.0 * n_words / total, 1) if n_words and total else None,
            "paragraphClips": sum(1 for sc in timing.get("scenes", []) for s in sc.get("sentences", []) if s.get("paragraph")),
            "stretch": pace.get("stretch"), "pauseScale": pace.get("pauseScale"),
            "fallbackSentences": len(qa.get("fallbackSentences") or []), "badSentences": len(qa.get("badSentences") or []),
            "retried": qa.get("retried"), "voiceSec": round(voice_sec, 1), "totalSec": total,
            "ttsWallSec": tts_sec, "chatterboxGenerateSec": gen_sec,
            "ttsSecPerAudioSec": round((gen_sec or tts_sec) / voice_sec, 2) if voice_sec and (gen_sec or tts_sec) else None,
            "error": qa.get("error"),
        })
    for r in rows:
        if r["ttsSecPerAudioSec"]:
            r["estimatedTtsMinFor9MinVideo"] = round(r["ttsSecPerAudioSec"] * 460 / 60, 1)  # ~460 s of voice
    res = {"set": args.set, "source": SOURCE, "variants": rows,
           "note": "liveliness = std of F0 in semitones (higher = more melodic); WER via faster-whisper base.en; "
                   "utmos = UTMOS22 strong naturalness MOS prediction (1-5, tarepan/SpeechMOS v1.2.0, MIT) averaged "
                   "over ~8 s windows of the dry voice; wpm = in-scene rate, narrationWpm = words / whole cut. "
                   "Every MP3/MP4 starts with a 1 s gap (short beep + silence)."}
    out.mkdir(parents=True, exist_ok=True)
    (out / cfg["report"]).write_text(json.dumps(res, indent=2) + "\n")
    print(json.dumps(res, indent=2))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("specs")
    s.add_argument("--set", default="ab", choices=sorted(SETS))
    s.add_argument("--source", default=SOURCE)
    s.add_argument("--words", type=int, default=100)
    r = sub.add_parser("report")
    r.add_argument("--out", required=True)
    r.add_argument("--set", default="ab", choices=sorted(SETS))
    a = ap.parse_args()
    specs(a) if a.cmd == "specs" else report(a)


if __name__ == "__main__":
    sys.exit(main())
