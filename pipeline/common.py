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
# RETENTION-5 pace: inter-sentence pause 0.25 s, scene boundary SCENE_TAIL + SCENE_LEAD = 0.35 s
FIRST_LEAD = 0.3
SCENE_LEAD = 0.2
SENTENCE_GAP = 0.25
SCENE_TAIL = 0.15
END_TAIL = 0.8
VERDICT_MIN = 2.8

# Default narration speed (Kokoro), used when spec.voice.speed is missing.
DEFAULT_SPEED = 1.15

# Brand intro sting and end card: long videos, main cut only (render/src/components/brand.tsx).
# RETENTION-3: the sting is short (spec.brandIntro.durationSec, default 1.2 s, 0.6..1.5 s) and plays right AFTER the
# hook (the first scene that is not a cold open, or spec.brandIntro.after), never before it.
INTRO_SEC = 3.0  # full-length sting (previews); BRAND_INTRO_SFX is timed for this length
BRAND_INTRO_DEFAULT_SEC = 1.2
BRAND_INTRO_MIN_SEC = 0.6
BRAND_INTRO_MAX_SEC = 1.5
OUTRO_SEC = 6.0
# (sfx, seconds from the start of a 3 s sting). Must match INTRO_PEN_FRAME / INTRO_STAMP_IMPACT in brand.tsx;
# a shorter sting is compressed the same way (brand_intro_sfx / introTiming in brand.tsx).
BRAND_INTRO_SFX = [("pen", 0.2), ("stamp", 1.667)]
# Cold open (scenes[].coldOpen, RETENTION-3): (sfx, "start" | "end" of the scene, offset sec, gainDb)
COLD_OPEN_SFX = [("whoosh_fast", "start", 0.0, -4.0), ("whoosh_long", "end", -0.55, -3.0)]
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


def cold_open(sc):
    """The cold-open settings of a scene (scenes[].coldOpen: true | {style, label, ...}) as a dict, or None."""
    c = sc.get("coldOpen")
    if not c:
        return None
    return {} if c is True else dict(c)


def brand_intro_plan(spec, cut):
    """(index of the scene after which the sting plays, duration sec) for a cut; (None, 0.0) = no sting.

    spec.brandIntro: false = no sting; {after: sceneId} = after that scene; {durationSec} = 0.6..1.5 s (default 1.2).
    Default position: right after the first scene that is not a cold open (the hook).
    """
    if not branded(cut):
        return None, 0.0
    bi = spec.get("brandIntro")
    if bi is False or (isinstance(bi, dict) and bi.get("enabled") is False):
        return None, 0.0
    bi = bi if isinstance(bi, dict) else {}
    dur = float(bi.get("durationSec") or BRAND_INTRO_DEFAULT_SEC)
    dur = max(BRAND_INTRO_MIN_SEC, min(BRAND_INTRO_MAX_SEC, dur))
    scenes = cut["scenes"]
    if not scenes:
        return None, 0.0
    after = bi.get("after")
    if after:
        for i, sc in enumerate(scenes):
            if sc["id"] == after:
                return i, dur
        fail(f"brandIntro.after: no scene '{after}' in {cut['name']}")
    for i, sc in enumerate(scenes):
        if not cold_open(sc):
            return i, dur
    return len(scenes) - 1, dur


def brand_intro_sfx(duration):
    """(sfx, seconds from the start of the sting) for a sting of this length (compressed like brand.tsx)."""
    k = min(1.0, float(duration) / INTRO_SEC)
    return [(n, round(round(t * 30 * k) / 30, 3)) for n, t in BRAND_INTRO_SFX]


def is_test(slug):
    return slug.startswith("0000-")


# '**word**' in a narration = an emphasised word: spoken normally, shown as a big kinetic keyword (RETENTION-1)
EMPHASIS_RE = re.compile(r"\*\*(.+?)\*\*")


def strip_emphasis(text):
    return (text or "").replace("**", "")


def emphasis_phrases(text):
    return [m.strip() for m in EMPHASIS_RE.findall(text or "") if m.strip()]


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
