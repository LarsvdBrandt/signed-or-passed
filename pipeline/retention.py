"""Retention helpers (docs/library/retention.md): visual beats and kinetic keywords for build_props.py.

beats    scenes[].beats [{at: seconds from the scene start OR a word/phrase of the narration (first occurrence),
         do: punch-in | punch-out | shake | flash | kinetic | pop | swap | counter | whip, ...}] -> each beat gets
         'frame' (relative to the scene start); beats whose word is not found are dropped with a warning.
keywords numbers, money amounts, years (automatic) and **emphasis** words (always) with absolute frames; the render
         shows them according to spec.captions.long (keywords | full | off).
"""
import re

from common import FPS, emphasis_phrases

BEAT_TYPES = ["punch-in", "punch-out", "shake", "flash", "kinetic", "pop", "swap", "counter", "whip"]
# scene kinds that already show their numbers big: no automatic number keywords there (emphasis still shows)
NO_AUTO_KEYWORD_KINDS = {"counter", "chart", "infographic", "split-flap", "kinetic-text", "title", "chapter", "growth",
                         "question", "verdict", "versus", "timeline", "document"}
NO_KEYWORD_KINDS = {"question", "verdict"}
SPELLED = {"one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
           "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty",
           "sixty", "seventy", "eighty", "ninety", "hundred", "a", "half"}
SCALE = {"thousand", "million", "billion", "trillion", "percent", "per", "cent", "dollars", "dollar", "pounds", "euros",
         "bucks", "%"}
BIG_SCALE = {"thousand", "million", "billion", "trillion", "percent"}
NUM_RE = re.compile(r"^[$€£]?\d[\d,]*(\.\d+)?(%|k|m|bn|b|x|s)?$", re.I)
MIN_GAP_SEC = 2.0
KEYWORD_MIN_SEC = 1.6
KEYWORD_MAX_SEC = 2.6


def norm(w):
    return re.sub(r"[^\w$€£%.']", "", w.lower()).strip(".'")


def find_phrase(words, phrase, start=0):
    """Index of the first word of phrase (case/punctuation-insensitive) in words[start:], or -1."""
    target = [norm(x) for x in phrase.split() if norm(x)]
    if not target:
        return -1
    keys = [norm(w["text"]) for w in words]
    for i in range(start, len(keys) - len(target) + 1):
        if keys[i:i + len(target)] == target:
            return i
    return -1


def resolve_beats(scene, words, frame, scene_start, warn):
    """words: this scene's words with absolute seconds. Returns the beats with 'frame' relative to the scene."""
    out = []
    for b in scene.get("beats") or []:
        at = b.get("at", 0)
        if isinstance(at, (int, float)):
            f = int(round(float(at) * FPS))
        else:
            i = find_phrase(words, str(at))
            if i < 0:
                warn(f"scene {scene['id']}: beat word '{at}' not found in the narration; beat dropped")
                continue
            f = frame(words[i]["start"]) - scene_start
        out.append({**b, "frame": max(0, f)})
    return sorted(out, key=lambda x: x["frame"])


def number_spans(words):
    """[(i, j)] word index ranges (inclusive) that read as a number, amount or year."""
    spans, i, n = [], 0, len(words)
    keys = [norm(w["text"]) for w in words]
    while i < n:
        k = keys[i]
        if NUM_RE.match(k):
            j = i
            while j + 1 < n and keys[j + 1] in SCALE:
                j += 1
            digits = re.sub(r"\D", "", k)
            big = j > i or any(c in k for c in "$€£%") or len(digits) >= 2
            if big:
                spans.append((i, j))
            i = j + 1
            continue
        if k in SPELLED and k not in ("a", "half"):
            j = i
            while j + 1 < n and keys[j + 1] in SPELLED:
                j += 1
            if j + 1 < n and keys[j + 1] in BIG_SCALE:
                j += 1
                while j + 1 < n and keys[j + 1] in SCALE:
                    j += 1
                spans.append((i, j))
            i = j + 1
            continue
        i += 1
    return spans


def clean_display(words):
    text = " ".join(w["text"] for w in words)
    return re.sub(r"[,;:.!?\"]+$", "", text).strip(" \"'")


def scene_keywords(scene, words, frame, scene_end_frame):
    """Keyword candidates of one scene (absolute frames): emphasis first, then numbers."""
    kind = scene.get("kind")
    if kind in NO_KEYWORD_KINDS or not words:
        return []
    res, used = [], set()
    pos = 0
    for ph in emphasis_phrases(scene.get("narration")):
        i = find_phrase(words, ph, pos)
        if i < 0:
            i = find_phrase(words, ph)
        if i < 0:
            continue
        j = i + len(ph.split()) - 1
        pos = j + 1
        used.update(range(i, j + 1))
        res.append({"text": clean_display(words[i:j + 1]), "kind": "emphasis", "i": i, "j": j})
    if kind not in NO_AUTO_KEYWORD_KINDS:
        for i, j in number_spans(words):
            if used.intersection(range(i, j + 1)):
                continue
            res.append({"text": clean_display(words[i:j + 1]), "kind": "number", "i": i, "j": j})
    out = []
    for r in res:
        start = frame(words[r["i"]]["start"])
        end = max(start + int(KEYWORD_MIN_SEC * FPS), frame(words[r["j"]]["end"]) + int(0.6 * FPS))
        end = min(end, start + int(KEYWORD_MAX_SEC * FPS), scene_end_frame)
        if end - start >= 12:
            out.append({"text": r["text"], "kind": r["kind"], "startFrame": start, "endFrame": end,
                        "sceneId": scene["id"]})
    return out


def space_keywords(items):
    """Sort, drop automatic numbers closer than MIN_GAP_SEC to a kept keyword, and cut overlaps."""
    items = sorted(items, key=lambda k: (k["startFrame"], k["kind"] != "emphasis"))
    kept = []
    for k in items:
        if kept and k["kind"] == "number" and k["startFrame"] - kept[-1]["startFrame"] < MIN_GAP_SEC * FPS:
            continue
        if kept and k["kind"] == "emphasis" and kept[-1]["kind"] == "number" and \
                k["startFrame"] - kept[-1]["startFrame"] < MIN_GAP_SEC * FPS:
            kept.pop()
        kept.append(k)
    for a, b in zip(kept, kept[1:]):
        a["endFrame"] = min(a["endFrame"], b["startFrame"])
    return [k for k in kept if k["endFrame"] - k["startFrame"] >= 10]


# Automatic beat sounds (RETENTION-4): which sfxlib sound plays on which beat, per spec.sfxDensity.
BEAT_SFX = {"punch-in": "whoosh_fast", "punch-out": "whoosh_soft", "whip": "whoosh_fast", "shake": "impact_boom",
            "flash": "camera_shutter", "kinetic": "pop", "pop": "pop", "swap": "whoosh_soft", "counter": "clock_tick",
            "keyword-emphasis": "pop", "keyword-number": "click"}
DENSITY_SETS = {
    "low": {"punch-in", "whip", "shake", "kinetic", "keyword-emphasis"},
    "mid": {"punch-in", "punch-out", "whip", "shake", "flash", "kinetic", "pop", "swap", "counter", "keyword-emphasis"},
    "high": set(BEAT_SFX),
}
BEAT_SFX_GAIN_DB = -12.0  # relative to a normal scene sfx: sits well under the voice
MIN_SFX_GAP_SEC = 0.35


def beat_sfx_events(beat_log, density="mid"):
    """(name, seconds, gainDb) for the beats / keywords of one cut (build/<slug>/<cut>/beats.json)."""
    allowed = DENSITY_SETS.get(density or "mid", DENSITY_SETS["mid"])
    out, last = [], -10.0
    for b in sorted(beat_log, key=lambda x: x["sec"]):
        if "sfx" in b:
            name = b["sfx"]
        else:
            name = BEAT_SFX.get(b.get("do")) if b.get("do") in allowed else None
        if not name or b["sec"] - last < MIN_SFX_GAP_SEC:
            continue
        out.append((name, b["sec"], BEAT_SFX_GAIN_DB))
        last = b["sec"]
    return out


def beat_sfx_names(spec):
    """Every sound the automatic beat sounds of this spec may need (for sfx.py)."""
    names = {b["sfx"] for cut_scenes in [spec.get("scenes") or []] + [s.get("scenes") or [] for s in spec.get("shorts") or []]
             for sc in cut_scenes for b in sc.get("beats") or [] if b.get("sfx")}
    allowed = DENSITY_SETS.get(spec.get("sfxDensity") or "mid", DENSITY_SETS["mid"])
    return names | {BEAT_SFX[k] for k in allowed}
