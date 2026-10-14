"""Shared helpers for the Signed or Passed pipeline."""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
USER_AGENT = "SignedOrPassedFactory/1.0 (https://github.com/LarsvdBrandt/signed-or-passed)"

# Timing layout (seconds)
FIRST_LEAD = 0.6
SCENE_LEAD = 0.35
SENTENCE_GAP = 0.25
SCENE_TAIL = 0.45
END_TAIL = 0.8
VERDICT_MIN = 2.8

# Default narration speed (Kokoro), used when spec.voice.speed is missing.
DEFAULT_SPEED = 1.1

# Brand intro sting and end card: long videos, main cut only (render/src/components/brand.tsx).
INTRO_SEC = 3.0
OUTRO_SEC = 6.0
# (sfx, seconds from video start). Must match INTRO_PEN_FRAME / INTRO_STAMP_IMPACT in brand.tsx.
BRAND_INTRO_SFX = [("pen", 0.2), ("stamp", 1.667)]
# (sfx, seconds from the start of the end card)
BRAND_OUTRO_SFX = [("paper", 0.0)]

# When the sound effect plays, relative to the scene start (must match render/src/constants.ts)
SFX_OFFSETS = {"pen": 0.5, "stamp": 0.62, "paper": 0.0, "whoosh": 0.0}

SIZES = {"long": (1920, 1080), "short": (1080, 1920)}


def log(msg):
    print(msg, flush=True)


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def slug_arg(extra=None):
    p = argparse.ArgumentParser()
    p.add_argument("--slug", required=True)
    if extra:
        extra(p)
    return p.parse_args()


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def spec_path(slug):
    return ROOT / "productions" / slug / "spec.json"


def load_spec(slug):
    p = spec_path(slug)
    if not p.exists():
        fail(f"spec not found: {p}")
    return read_json(p)


def work_dir(slug):
    d = ROOT / "build" / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def out_dir(slug):
    d = ROOT / "build" / slug / "out"
    d.mkdir(parents=True, exist_ok=True)
    return d


def cut_dir(slug, cut_name):
    d = ROOT / "build" / slug / cut_name
    d.mkdir(parents=True, exist_ok=True)
    return d


def cuts(spec):
    """The main video plus one cut per short."""
    res = [{"name": "main", "format": spec["format"], "scenes": spec["scenes"]}]
    for s in spec.get("shorts") or []:
        res.append({"name": f"short-{s['id']}", "format": "short", "scenes": s["scenes"]})
    return res


def branded(cut):
    """True when this cut gets the brand intro sting and end card (long main video only)."""
    return cut["name"] == "main" and cut["format"] == "long"


def is_test(slug):
    return slug.startswith("0000-")


def split_sentences(text):
    parts = re.split(r"(?<=[.!?])\s+", (text or "").strip())
    return [p.strip() for p in parts if p.strip()]


def add_warning(slug, msg):
    p = work_dir(slug) / "warnings.json"
    items = read_json(p) if p.exists() else []
    if msg not in items:
        items.append(msg)
    write_json(p, items)
    log(f"WARNING: {msg}")


def warnings(slug):
    p = work_dir(slug) / "warnings.json"
    return read_json(p) if p.exists() else []


def fmt_ts(sec):
    sec = int(round(sec))
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"
