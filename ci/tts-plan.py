#!/usr/bin/env python3
"""Fan-out plan for the Chatterbox TTS (render.yml job 'tts').

Usage: python ci/tts-plan.py <slug> [<slug> ...]
Prints a JSON list [{"slug", "shard", "shards"}] with one entry per runner job for every production whose
spec.voice.engine is 'chatterbox' (other engines are fast enough on the render runner and get none).
Chatterbox runs at ~7-10 s of CPU time per second of speech on a GitHub runner (release 'voice-test', VOICE-5), so
a 9-minute narration is split over ~WORDS_PER_SHARD words per runner: each runner needs ~6-8 min plus setup, and
the render job then finds every clip in its cache. SOP_TTS_FANOUT_MAX caps the runners per production (default
12, free public-repo runners allow 20 concurrent jobs); SOP_TTS_FANOUT=0 disables the fan-out.
"""
import json
import math
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORDS_PER_SHARD = 150
TAG_RE = re.compile(r"\[[^\]]*\]")


def words(scenes):
    n = 0
    for sc in scenes or []:
        text = TAG_RE.sub(" ", str(sc.get("narration") or "")).replace("*", "")
        n += len(re.findall(r"\w+", text))
    return n


def plan(slug):
    try:
        spec = json.loads((ROOT / "productions" / slug / "spec.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"tts-plan: {slug}: cannot read spec ({e}); no fan-out", file=sys.stderr)
        return []
    voice = spec.get("voice") if isinstance(spec.get("voice"), dict) else {}
    if (voice.get("engine") or "kokoro") != "chatterbox":
        return []
    total = words(spec.get("scenes"))
    for s in spec.get("shorts") or []:
        total += words(s.get("scenes"))
    cap = max(1, int(os.environ.get("SOP_TTS_FANOUT_MAX") or 12))
    n = max(2, min(cap, math.ceil(total / WORDS_PER_SHARD)))
    print(f"tts-plan: {slug}: chatterbox, {total} words -> {n} runner(s)", file=sys.stderr)
    return [{"slug": slug, "shard": i, "shards": n} for i in range(n)]


def main():
    if os.environ.get("SOP_TTS_FANOUT") == "0":
        print("[]")
        return
    out = []
    for slug in sys.argv[1:]:
        out += plan(slug)
    print(json.dumps(out))


if __name__ == "__main__":
    main()
