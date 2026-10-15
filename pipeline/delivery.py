"""Sentence-level voice delivery (VOICE-3, docs/library/voices.md).

Every sentence of a narration gets a delivery STYLE that tts.py maps to engine settings (Chatterbox: emotion
`exaggeration` + `cfg_weight`; all engines: a small speed factor and extra pauses):

  calm     exag 0.35  cfg 0.50              neutral narration
  curious  exag 0.50  cfg 0.50              questions, set-up
  tense    exag 0.55  cfg 0.45              stakes, the question itself
  build    exag 0.50 -> 0.80 cfg 0.40 +4%   rising across consecutive sentences toward a number / reveal
  excited  exag 0.85  cfg 0.30 +3%          big numbers, wins
  punch    exag 0.75  cfg 0.35              key line: a short pause BEFORE the key number/word, longer pause after
  somber   exag 0.40  cfg 0.55 -6%          collapse, bankruptcy, failure
  warm     exag 0.45  cfg 0.50 -2%          the lesson

Where it comes from (first match wins):
  (a) an inline tag in the sentence, e.g. "[build] And the price? [punch] Fifty million dollars." (tags are stripped
      before TTS and captions: common.strip_emphasis removes them everywhere),
  (b) scenes[].delivery (default for the untagged sentences of that scene),
  (c) AUTO-DELIVERY: hook -> punch; big money/number sentences -> punch (excited when a punch was just used);
      the 2 sentences leading up to such a peak, a reveal or a question -> build; question scene -> curious, its
      question sentence -> tense; reveal scene -> punch; collapse words -> somber; lesson scene -> warm; everything
      else alternates curious / calm.
Micro-prosody: every sentence gets a seeded +-5% speed and +-0.04 exaggeration variation, so no two sentences sound
identical, and the result is reproducible for the same spec.

VOICE-8 channel tuning (Lars 2026-10-15: "more emotion, more human, slightly slower"): the table above is the BASE;
tts.py's Chatterbox engine adds CHANNEL_TUNING on top unless spec.voice overrides it: exaggeration +0.15 (cap 1.0),
cfg_weight -0.10 (floor 0.25) = more expressive, more deliberate pacing (Chatterbox's own guidance), sentence gaps
and style pauses x1.15 and a 0.25 s punch beat. VOICE-10a: NO time-stretch (pace 1.0; the style speed factors above
apply to Kokoro/Piper only, Chatterbox is never stretched).
Target: 145-155 spoken words per minute (tts.py reports the measured wpm).
"""
import hashlib
import random
import re

STYLES = {
    #          exaggeration, cfgWeight, speed factor, pause after (s)
    "calm":    (0.35, 0.50, 1.00, 0.00),
    "curious": (0.50, 0.50, 1.00, 0.00),
    "tense":   (0.55, 0.45, 1.00, 0.05),
    "build":   (0.50, 0.40, 1.04, 0.00),
    "excited": (0.85, 0.30, 1.03, 0.10),
    "punch":   (0.75, 0.35, 1.00, 0.20),
    "somber":  (0.40, 0.55, 0.94, 0.10),
    "warm":    (0.45, 0.50, 0.98, 0.05),
}
STYLE_NAMES = tuple(STYLES)
TAG_RE = re.compile(r"\[\s*(" + "|".join(STYLE_NAMES) + r")\s*\]\s*", re.I)
PUNCH_PAUSE_SEC = 0.25
# VOICE-8 channel defaults for engine chatterbox (spec.voice.exaggerationOffset / cfgOffset / pace / pauseScale)
# VOICE-10a (Lars 2026-10-15 19:20 "worse, more static"): no time-stretch any more: pace 1.0 (an explicit
# spec.voice.pace is clamped to 0.97-1.0); "slightly slower" comes from pauses (pauseScale) and cfg_weight only.
CHANNEL_TUNING = {"exaggerationOffset": 0.15, "cfgOffset": -0.10, "pace": 1.0, "pauseScale": 1.15}
CFG_FLOOR = 0.25

BIG_RE = re.compile(
    r"\$\s?\d|\b\d[\d,.]*\s*(?:%|percent|million|billion|trillion)\b|"
    r"\b(?:millions?|billions?|trillions?)\b|\bpercent\b", re.I)
NUMBER_WORD_RE = re.compile(
    r"\b(?:\$?\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|"
    r"fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion)\b", re.I)
SOMBER_RE = re.compile(
    r"\b(?:bankrupt\w*|collapse\w*|went under|shut down|shut its doors|closed (?:its|their|the) doors|lay ?offs?|"
    r"laid off|debt|died|death|failed|failure|ruin\w*|fired|lost everything|last store|liquidat\w*)\b", re.I)


def tags_of(text):
    return [m.lower() for m in TAG_RE.findall(text or "")]


def strip_tags(text):
    return TAG_RE.sub("", text or "")


def _seed(*parts):
    return int(hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:8], 16)


def _is_big(text):
    return bool(BIG_RE.search(text or ""))


def _key_index(words):
    """Index of the key number/word of a punch line: the first **emphasis** word, else the first number word."""
    for i, w in enumerate(words):
        if w.startswith("**"):
            return i
    for i, w in enumerate(words):
        if NUMBER_WORD_RE.fullmatch(re.sub(r"[^\w$,.]", "", w).strip(",.")):
            return i
    return None


MARKER_RE = re.compile(r"\[[^\]]*\]")  # [pause N] markers and [style] tags: never part of the punch logic


def punch_text(text):
    """TTS text of a punch line with a short dramatic beat before the key number/word ('The price was, fifty million.').
    Returns (text, pauseBeforeSec): when the key word opens the sentence the pause goes before the whole clip.
    [pause N] markers are kept intact (a comma inside '[pause 1]' made Chatterbox say 'pause, one'); a key word right
    after a marker already has its beat."""
    markers = []

    def keep(m):
        markers.append(m.group(0))
        return f" \x00{len(markers) - 1}\x00 "
    words = MARKER_RE.sub(keep, text).split()
    spoken = [i for i, w in enumerate(words) if not w.startswith("\x00")]
    kk = _key_index([words[i] for i in spoken])

    def restore(ws):
        return re.sub(r"\s+", " ", re.sub(r"\x00(\d+)\x00", lambda m: markers[int(m.group(1))], " ".join(ws))).strip()
    if kk is None or kk == 0:
        return restore(words), PUNCH_PAUSE_SEC
    k = spoken[kk]
    prev = words[k - 1]
    if prev.startswith("\x00") or prev.endswith((",", ".", "?", "!", ":", ";", "...")):
        return restore(words), 0.0
    words[k - 1] = prev + ","  # Chatterbox turns '...' into ', ' anyway: a comma is its natural short beat
    return restore(words), 0.0


def plan(scenes, sentences_of, seed="", hook=True):
    """Delivery for every sentence of a cut.

    scenes        the cut's spec scenes (kind, delivery, narration ...)
    sentences_of  function(scene) -> list of raw sentences (still with tags and [pause] markers)
    Returns {(scene index, sentence index): {style, source, exaggeration, cfgWeight, speed, pauseBefore, pauseAfter}}.
    """
    flat = []  # (si, ji, raw sentence, scene)
    for si, sc in enumerate(scenes):
        for ji, raw in enumerate(sentences_of(sc)):
            flat.append((si, ji, raw, sc))
    styles = [None] * len(flat)
    source = [None] * len(flat)
    # (a) inline tags, (b) scene default
    for n, (si, ji, raw, sc) in enumerate(flat):
        t = tags_of(raw)
        if t:
            styles[n], source[n] = t[-1], "tag"
        elif sc.get("delivery") in STYLES:
            styles[n], source[n] = sc["delivery"], "scene"
    # (c) auto: peaks first
    peaks = set()
    last_punch = last_peak = -99
    big_peaks = set()
    first_spoken = next((n for n, f in enumerate(flat) if re.search(r"\w", strip_tags(f[2]))), None)
    for n, (si, ji, raw, sc) in enumerate(flat):
        kind = sc.get("kind")
        text = strip_tags(raw)
        if styles[n] is not None:
            if styles[n] == "punch":
                last_punch = n
            if styles[n] in ("punch", "excited"):
                peaks.add(n)
                big_peaks.add(n)
                last_peak = n
            continue
        if hook and n == first_spoken:
            styles[n], source[n] = "punch", "auto:hook"
            big_peaks.add(n)
        elif kind in ("reveal", "verdict") and ji == 0:
            styles[n], source[n] = "punch", f"auto:{kind}"
            big_peaks.add(n)
        elif _is_big(text) and not SOMBER_RE.search(text) and n - last_peak >= 3:
            # a big number: punch, or excited when a punch was used shortly before; numbers right after a
            # peak stay neutral so the narration does not shout all the time
            styles[n], source[n] = ("punch" if n - last_punch >= 6 else "excited"), "auto:number"
        else:
            continue
        if styles[n] == "punch":
            last_punch = n
        last_peak = n
        peaks.add(n)
    # build-ups into peaks, reveals and questions
    targets = set(peaks)
    for n, (si, ji, raw, sc) in enumerate(flat):
        if sc.get("kind") == "question" and "?" in raw and styles[n] is None:
            styles[n], source[n] = "tense", "auto:question"
            targets.add(n)
            big_peaks.add(n)
    for p in sorted(targets):
        for back in ((1, 2) if p in big_peaks else (1,)):
            m = p - back
            if m < 0 or styles[m] is not None or m in targets:
                continue
            if flat[m][3].get("kind") in ("lesson", "chapter") or SOMBER_RE.search(flat[m][2]):
                continue
            styles[m], source[m] = "build", "auto:build"
    # the rest
    alt = 0
    for n, (si, ji, raw, sc) in enumerate(flat):
        if styles[n] is not None:
            continue
        kind = sc.get("kind")
        text = strip_tags(raw)
        if SOMBER_RE.search(text):
            styles[n] = "somber"
        elif kind == "lesson":
            styles[n] = "warm"
        elif kind == "question":
            styles[n] = "curious"
        elif text.rstrip().endswith("?"):
            styles[n] = "curious"
        else:
            styles[n] = ("curious", "calm")[alt % 2]
            alt += 1
        source[n] = "auto"
    # settings: build ramps across each run of consecutive build sentences
    out = {}
    n = 0
    while n < len(flat):
        st = styles[n]
        run = 1
        if st == "build":
            while n + run < len(flat) and styles[n + run] == "build":
                run += 1
        for r in range(run):
            m = n + r
            si, ji, raw, sc = flat[m]
            ex, cfg, spd, after = STYLES[styles[m]]
            if styles[m] == "build":
                ex = 0.5 + 0.3 * ((r + 1) / run if run > 1 else 0.5)
                spd = 1.02 + 0.03 * (r / max(1, run - 1))
            rnd = random.Random(_seed(seed, si, ji, raw))
            ex = min(1.0, max(0.25, ex + rnd.uniform(-0.04, 0.04)))
            spd = spd * (1.0 + rnd.uniform(-0.05, 0.05))
            out[(si, ji)] = {
                "style": styles[m], "source": source[m], "exaggeration": round(ex, 3), "cfgWeight": cfg,
                "speed": round(spd, 3), "pauseBefore": 0.0, "pauseAfter": after,
            }
        n += run
    return out
