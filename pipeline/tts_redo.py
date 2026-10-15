"""VOICE-13 deep retry, cache side: drop every cached Chatterbox clip that the ASR still judges bad
(textnorm.bad_sentence on its stored transcript) and that has not had the deep retry yet (`deepRetry` missing in its
.json). tts.py then generates it again and pipeline/chatterbox_worker.py gives short clips (<= 4 words) a careful
ASR (padding + beam 5) and up to 4 takes. Clips made by the new worker carry deepRetry and are never dropped again,
so this runs at most once per clip. Called by render.yml before the TTS fan-out and before the render.

  python pipeline/tts_redo.py [--cache DIR] [--dry-run]
"""
import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import textnorm  # noqa: E402  (standard library only)

CACHE = Path(os.path.expanduser("~/.cache/huggingface/sop-tts/chatterbox"))


def stale(info):
    if info.get("deepRetry") or info.get("asr") is None:
        return False
    text = " ".join(info.get("sentences") or []) or info.get("text") or info.get("expected")
    if not text:
        return False
    return textnorm.bad_sentence(text, info["asr"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=str(CACHE))
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    cache = Path(a.cache)
    if not cache.is_dir():
        print(f"tts_redo: no Chatterbox cache at {cache}: nothing to do")
        return 0
    dropped = []
    for meta in sorted(cache.glob("*.wav.json")):
        try:
            info = json.loads(meta.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if stale(info):
            wav = meta.with_suffix("")  # x.wav.json -> x.wav
            dropped.append(f"{wav.name}: heard {info.get('asr')!r}")
            if not a.dry_run:
                for f in (wav, meta):
                    f.unlink(missing_ok=True)
    print(f"tts_redo: {len(dropped)} bad cached clip(s) {'would be ' if a.dry_run else ''}dropped for a deep retry")
    for d in dropped:
        print("  " + d)
    return 0


if __name__ == "__main__":
    sys.exit(main())
