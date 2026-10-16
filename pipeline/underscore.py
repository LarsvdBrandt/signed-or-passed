"""MIX-2 documentary underscore (docs/library/music.md#underscore): our own score, played by sampled General MIDI
instruments (TinySoundFont via the `tinysoundfont` wheel, MIT) from the FluidR3_GM soundfont (MIT, Frank Wen; Ubuntu
package fluid-soundfont-gm). Own composition + permissive samples = safe for monetised YouTube, no Content ID.

Instead of a loop, every story section gets its own arrangement that evolves:
  scene      soft piano arpeggios + warm pad, the motif on celesta
  pressure   pizzicato ostinato + sustained low strings + timpani / low toms, building with every section
             (synth-bass pulse and hats join at level 2-3)
  freeze     suspended chord in strings + pad, a soft tick on every beat (the question)
  reveal     a hit (timpani, low strings, piano octave, cymbal) right after the silence, then a decaying chord
  aftermath  full and rhythmic: light modern drums, finger bass, harp plucks, string chords, the motif on horn
  verdict    stinger: brass + timpani + the motif, then a held chord
  lesson     warm piano chords + pad, the motif resolves to the tonic
Tempo 90-110 BPM and the key come from the seed (slug + cut); keys change between sections (pressure lifts, the
aftermath turns to the relative major); a fixed 4-note 'Signed or Passed' motif returns in every video; velocity and
timing are humanised. Styles: underscore (B, default), rhythmic (C: more drums), cinematic (D: more strings, slower).
"""
import hashlib
import os
import random
from pathlib import Path

import numpy as np

SR = 48000
SOUNDFONT_PATHS = [os.environ.get("SOUNDFONT") or "", "/usr/share/sounds/sf2/FluidR3_GM.sf2",
                   "/usr/share/soundfonts/FluidR3_GM.sf2", "build/soundfonts/FluidR3_GM.sf2"]
STYLES = ("underscore", "rhythmic", "cinematic")
MINOR_MOODS = {"tense", "somber", "mysterious", "epic"}

# GM programs (bank 0) and channels
CH = {"piano": (0, 0), "pad": (1, 89), "strings": (2, 48), "pizz": (3, 45), "bass": (4, 33), "synbass": (5, 38),
      "celesta": (6, 8), "harp": (7, 46), "horn": (8, 60), "timp": (10, 47), "cello": (11, 42), "brass": (12, 61)}
DRUMS = 9
KICK, SNARE, SIDESTICK, HAT, RIDE, CRASH, LOWTOM, FLOORTOM, WOODBLOCK = 36, 38, 37, 42, 51, 49, 45, 41, 76

# progressions: (root semitones from the tonic, quality) per bar
PROG_MINOR = [[(0, "m"), (8, "M"), (3, "M"), (10, "M")], [(0, "m"), (5, "m"), (8, "M"), (7, "M")],
              [(0, "m"), (10, "M"), (8, "M"), (10, "M")], [(0, "m"), (3, "M"), (5, "m"), (8, "M")]]
PROG_MAJOR = [[(0, "M"), (7, "M"), (9, "m"), (5, "M")], [(0, "M"), (9, "m"), (5, "M"), (7, "M")],
              [(5, "M"), (0, "M"), (7, "M"), (9, "m")], [(0, "M"), (4, "m"), (5, "M"), (7, "M")]]
QUAL = {"M": (0, 4, 7), "m": (0, 3, 7), "sus2": (0, 2, 7), "sus4": (0, 5, 7)}
# the channel motif: degrees as semitones from the tonic, durations in beats (5-1-3-2 in minor)
MOTIF = [(-5, 1.0), (0, 1.0), (3, 1.5), (2, 2.5)]
MOTIF_MAJOR = [(-5, 1.0), (0, 1.0), (4, 1.5), (2, 2.5)]


def find_soundfont():
    for p in SOUNDFONT_PATHS:
        if p and Path(p).exists():
            return str(p)
    return None


class Score:
    def __init__(self, seed):
        self.ev = []  # (t, order, kind, ch, key, vel)
        self.rng = random.Random(seed)

    def note(self, ch, key, t, dur, vel, jitter=0.012):
        if key < 0 or key > 127 or dur <= 0:
            return
        t = max(0.0, t + self.rng.uniform(-jitter, jitter))
        vel = int(max(1, min(127, vel + self.rng.randint(-6, 6))))
        self.ev.append((t, 1, "on", ch, key, vel))
        self.ev.append((t + dur, 0, "off", ch, key, 0))


def chord_keys(tonic, root, qual, octave):
    base = 12 * octave + (tonic + root) % 12
    return [base + i for i in QUAL[qual]]


PHRASE_SEC = 32.0  # long sections are split into phrases of about this length (or at story-section flags)
ENERGY_LEVEL = {"low": 1, "mid": 2, "high": 3}


def roles_from_timing(timing, spec_scenes=None):
    """[(start, end, role, level)] for one cut from timing.json scenes (kind) and the spec scenes (section flags,
    musicEnergy); long sections are split into phrases that vary (see compose)."""
    flags = {sc.get("id"): sc for sc in spec_scenes or []}
    scenes = [dict(s, section=s.get("section") or (flags.get(s["id"]) or {}).get("section"),
                   musicEnergy=(flags.get(s["id"]) or {}).get("musicEnergy")) for s in timing["scenes"]]
    total = float(timing["totalSec"])
    if not scenes:
        return [(0.0, total, "scene", 1)]
    q = next((i for i, s in enumerate(scenes) if s.get("kind") == "question" and not s.get("coldOpen")), None)
    r = next((i for i, s in enumerate(scenes) if s.get("kind") == "reveal" and not s.get("coldOpen")), None)
    v = next((i for i, s in enumerate(scenes) if s.get("kind") == "verdict" and not s.get("coldOpen")), None)
    if r is None:
        r = v
    out = []

    def add(a, b, role, level=1):
        a, b = float(a), float(b)
        if b - a > 0.3:
            out.append((a, b, role, level))

    pre_end = float(scenes[q]["start"]) if q is not None else float(scenes[r]["start"]) if r is not None else total
    # story sections before the question: scene boundaries where a scene opens a new section
    bounds = [0.0] + [float(s["start"]) for s in scenes if s.get("section") and 0 < float(s["start"]) < pre_end - 4]
    bounds = sorted(set(bounds)) + [pre_end]
    if len(bounds) == 2 and pre_end > 40:  # no section flags: thirds
        bounds = [0.0, pre_end * 0.35, pre_end * 0.7, pre_end]
    n = len(bounds) - 1
    for i in range(n):
        if i == 0:
            add(bounds[0], bounds[1], "scene", 1)
        else:
            add(bounds[i], bounds[i + 1], "pressure", min(3, 1 + (2 * i) // max(1, n - 1)) if n > 2 else 2)
    if q is not None:
        q_end = float(scenes[r]["start"]) if r is not None else float(scenes[q]["end"])
        add(scenes[q]["start"], q_end, "freeze")
    if r is not None:
        r_start = float(scenes[r]["start"])
        v_start = float(scenes[v]["start"]) if v is not None and v != r else None
        if v_start is not None and v_start > r_start:
            add(r_start, r_start + min(3.0, v_start - r_start), "reveal")
            add(r_start + min(3.0, v_start - r_start), v_start, "aftermath", 2)
            add(v_start, min(total, v_start + 5.0), "verdict")
            add(min(total, v_start + 5.0), total, "lesson")
        else:
            add(r_start, min(total, r_start + 5.0), "verdict")
            add(min(total, r_start + 5.0), total, "lesson")
    elif q is None:
        add(pre_end, total, "lesson")
    return subdivide(out, scenes)


def subdivide(sections, scenes):
    """Split scene / pressure / aftermath / lesson sections longer than 1.5 phrases at story-section flags, else
    every ~PHRASE_SEC; each phrase gets a variant index and the musicEnergy of its first scene (low/mid/high set the
    level, drop = breakdown, stop = silence)."""
    starts = [(float(s["start"]), s) for s in scenes]
    out = []
    for a, b, role, level in sections:
        cuts_at = [a]
        if role in ("scene", "pressure", "aftermath", "lesson") and b - a > 1.5 * PHRASE_SEC:
            inner = [t for t, s in starts if s.get("section") and a + 12 < t < b - 12]
            pts = sorted(set(inner))
            seg = [a] + pts + [b]
            for x, y in zip(seg[:-1], seg[1:]):  # long stretches between flags are cut into phrases too
                k = max(1, int(round((y - x) / PHRASE_SEC)))
                cuts_at += [x + (y - x) * j / k for j in range(1, k)] + ([y] if y < b else [])
        cuts_at = sorted(set(cuts_at)) + [b]
        for v, (x, y) in enumerate(zip(cuts_at[:-1], cuts_at[1:])):
            if y - x < 0.3:
                continue
            first = next((s for t, s in starts if x - 0.01 <= t < y), None)
            energy = (first or {}).get("musicEnergy")
            out.append((x, y, role, level, v, energy))
    return out


def compose(sections, mood, seed, style="underscore"):
    rng = random.Random(seed)
    minor = mood in MINOR_MOODS
    bpm = 90 + rng.randint(0, 20)
    if style == "cinematic":
        bpm = max(84, bpm - 10)
    beat = 60.0 / bpm
    bar = 4 * beat
    home = rng.choice([2, 4, 5, 7, 9, 0])  # D E F G A C
    progs = PROG_MINOR if minor else PROG_MAJOR
    motif = MOTIF if minor else MOTIF_MAJOR
    sc = Score(seed)
    key = home
    pressure_lift = 0
    for si, (a, b, role, level, var, energy) in enumerate(sections):
        if energy == "stop":
            continue
        if energy in ENERGY_LEVEL and role in ("scene", "pressure", "aftermath"):
            level = ENERGY_LEVEL[energy]
        elif role == "aftermath":
            level = [2, 1, 3, 2][var % 4]  # groove, breakdown, full, groove
        elif role == "pressure":
            level = min(3, level + (var % 2))
        if energy == "drop":
            level = 0
        # key per section
        if role == "pressure":
            pressure_lift = min(4, pressure_lift + rng.choice([1, 2]))
            key = (home + pressure_lift) % 12
        elif role in ("freeze", "reveal"):
            key = (home + pressure_lift) % 12
        elif role == "aftermath":
            key = (home + (3 if minor else 5) + [0, 0, 2, -2][var % 4]) % 12
        elif role in ("verdict", "lesson"):
            key = home
        else:
            key = home
        prog = rng.choice(progs)
        is_minor = minor and role not in ("aftermath",)
        if role == "lesson" and minor:
            prog = [(8, "M"), (3, "M"), (10, "M"), (0, "m")]
        nbars = max(1, int(np.ceil((b - a) / bar)))
        for k in range(nbars):
            t0 = a + k * bar
            if t0 >= b - 0.05:
                break
            root, qual = prog[k % len(prog)]
            if not is_minor and qual == "m" and root == 0:
                qual = "M"
            dur = min(bar, b - t0)
            _bar(sc, role, level, style, key, root, qual, t0, dur, beat, k, rng)
        if (role in ("scene", "aftermath", "lesson") and var % 2 == 0 and level > 0) or (
                role == "pressure" and si + 1 < len(sections) and sections[si + 1][2] == "freeze"):
            inst = {"scene": "celesta" if var % 4 == 0 else "piano", "aftermath": "horn" if var % 4 == 0 else "brass",
                    "lesson": "piano", "pressure": "strings"}[role]
            _motif(sc, inst, key, motif, a + (bar if role != "lesson" else 2 * bar), beat, b,
                   vel=70 if role != "aftermath" else 78, octave=5 if inst in ("celesta", "piano") else 4,
                   resolve=role == "lesson")
        if role == "verdict":
            _motif(sc, "brass", key, motif, a + 0.25, beat * 0.5, b, vel=88, octave=4)
    return sc, bpm, home


def _motif(sc, inst, key, motif, t, beat, end, vel=70, octave=5, resolve=False):
    ch = CH[inst][0]
    notes = list(motif)
    if resolve:
        notes = notes[:-1] + [(0, notes[-1][1])]
    for semi, beats in notes:
        if t >= end - 0.2:
            return
        sc.note(ch, 12 * octave + key + semi, t, beats * beat * 0.95, vel, jitter=0.006)
        t += beats * beat


def _bar(sc, role, level, style, key, root, qual, t0, dur, beat, k, rng):
    ch = lambda n: CH[n][0]  # noqa: E731
    tri3 = chord_keys(key, root, qual, 4)
    tri2 = chord_keys(key, root, qual, 3)
    bass = 12 * 2 + (key + root) % 12
    steps = int(round(dur / (beat / 2)))
    if level == 0:  # musicEnergy 'drop': breakdown, pad + one soft piano chord
        for n in tri2:
            sc.note(ch("pad"), n, t0, dur, 40)
        if k % 2 == 0:
            for n in tri3:
                sc.note(ch("piano"), n, t0, dur, 36)
        return
    if role == "scene":
        sc.note(ch("pad"), tri2[0], t0, dur, 42)
        sc.note(ch("pad"), tri2[2], t0, dur, 38)
        arp = [tri3[0], tri3[1], tri3[2], tri3[1] + 12 - 12, tri3[0] + 12, tri3[2], tri3[1], tri3[2]]
        for i in range(steps):
            sc.note(ch("piano"), arp[i % 8], t0 + i * beat / 2, beat * 0.9, 52 if i % 4 else 60)
        sc.note(ch("cello"), bass + 12, t0, dur, 40)
    elif role == "pressure":
        strings_vel = 44 + 8 * level
        for n in tri2:
            sc.note(ch("strings"), n, t0, dur, strings_vel)
        sc.note(ch("cello"), bass + 12, t0, dur, 46 + 6 * level)
        osc = [tri3[0], tri3[2], tri3[1], tri3[2]]
        sub = 2 if level < 3 else 4
        for i in range(int(round(dur / (beat / sub)))):
            sc.note(ch("pizz"), osc[i % 4], t0 + i * beat / sub, beat / sub * 0.8, 50 + 6 * level + (8 if i % sub == 0 else 0))
        sc.note(ch("timp"), bass + 12, t0, beat, 60 + 8 * level)
        if level >= 2 or style == "rhythmic":
            for i in range(steps):
                sc.note(ch("synbass"), bass + 12, t0 + i * beat / 2, beat * 0.4, 50 + 5 * level)
            for i in range(4):
                sc.note(DRUMS, LOWTOM if i % 2 == 0 else FLOORTOM, t0 + i * beat, 0.2, 42 + 6 * level)
        if level >= 3 or style == "rhythmic":
            for i in range(steps):
                sc.note(DRUMS, HAT, t0 + i * beat / 2, 0.1, 34 + (10 if i % 2 else 0))
            sc.note(DRUMS, KICK, t0, 0.2, 60)
            sc.note(DRUMS, KICK, t0 + 2 * beat, 0.2, 54)
    elif role == "freeze":
        sus = chord_keys(key, 0, "sus4" if k % 2 == 0 else "sus2", 3)
        for n in sus:
            sc.note(ch("strings"), n, t0, dur, 50)
            sc.note(ch("pad"), n + 12, t0, dur, 36)
        for i in range(int(round(dur / beat))):
            sc.note(DRUMS, WOODBLOCK if i % 4 else SIDESTICK, t0 + i * beat, 0.08, 46, jitter=0.002)
    elif role == "reveal":
        if k == 0:
            sc.note(ch("timp"), bass + 12, t0, 2.5, 110, jitter=0)
            sc.note(DRUMS, CRASH, t0, 2.5, 80, jitter=0)
            sc.note(ch("piano"), bass + 12, t0, 2.5, 96, jitter=0)
            sc.note(ch("piano"), bass + 24, t0, 2.5, 90, jitter=0)
            for n in tri2:
                sc.note(ch("strings"), n, t0, dur, 74, jitter=0)
                sc.note(ch("brass"), n, t0, 1.2, 82, jitter=0)
        else:
            for n in tri2:
                sc.note(ch("strings"), n, t0, dur, 50)
    elif role == "aftermath" and level == 1:  # breakdown inside the aftermath: no drums, long bass, harp, strings
        for n in tri2:
            sc.note(ch("strings"), n, t0, dur, 52)
        sc.note(ch("bass"), bass, t0, dur, 62)
        for i in range(steps // 2):
            sc.note(ch("harp"), [tri3[0], tri3[1], tri3[2], tri3[1]][i % 4], t0 + i * beat, beat * 0.9, 54)
        sc.note(ch("piano"), tri3[2] + 12, t0, beat * 2, 44)
    elif role == "aftermath":
        drums = (1.0 if style != "cinematic" else 0.6) * (1.12 if level >= 3 else 1.0)
        for n in tri2:
            sc.note(ch("strings"), n, t0, dur, 56 if style != "cinematic" else 66)
        for i in range(steps):
            sc.note(ch("bass"), bass + (12 if i % 4 == 3 else 0), t0 + i * beat / 2, beat * 0.45, 70)
            arp = [tri3[0], tri3[2], tri3[1] + 12, tri3[2]]
            sc.note(ch("harp"), arp[i % 4], t0 + i * beat / 2, beat * 0.6, 58)
            sc.note(DRUMS, HAT, t0 + i * beat / 2, 0.08, int((38 + (12 if i % 2 else 0)) * drums))
        for i in range(4):
            if i in (0, 2):
                sc.note(DRUMS, KICK, t0 + i * beat, 0.2, int(76 * drums))
            else:
                sc.note(DRUMS, SNARE if style == "rhythmic" else SIDESTICK, t0 + i * beat, 0.2, int(60 * drums))
        if style == "rhythmic" or level >= 3:
            sc.note(DRUMS, KICK, t0 + 2.5 * beat, 0.2, 60)
        if level >= 3:
            sc.note(DRUMS, RIDE, t0 + beat, 0.3, 44)
            sc.note(DRUMS, RIDE, t0 + 3 * beat, 0.3, 44)
            if k % 4 == 0:
                sc.note(DRUMS, CRASH, t0, 1.5, 52)
        if style == "cinematic":
            sc.note(ch("timp"), bass + 12, t0, beat, 70)
            sc.note(ch("cello"), bass + 12, t0, dur, 64)
    elif role == "verdict":
        if k == 0:
            sc.note(ch("timp"), bass + 12, t0, 2.0, 104, jitter=0)
            sc.note(DRUMS, CRASH, t0, 2.0, 70, jitter=0)
        for n in tri2:
            sc.note(ch("strings"), n, t0, dur, 62)
            sc.note(ch("pad"), n + 12, t0, dur, 40)
    elif role == "lesson":
        for n in tri3:
            sc.note(ch("piano"), n, t0, beat * 2, 48)
            sc.note(ch("piano"), n, t0 + 2 * beat, beat * 2, 42)
        sc.note(ch("piano"), bass + 12, t0, dur, 50)
        sc.note(ch("pad"), tri2[0], t0, dur, 36)
        sc.note(ch("pad"), tri2[2], t0, dur, 32)


def render(sc, total, soundfont):
    import tinysoundfont as tsf
    synth = tsf.Synth(samplerate=SR, gain=-6)
    sfid = synth.sfload(soundfont)
    for name, (c, prog) in CH.items():
        synth.program_select(c, sfid, 0, prog)
    synth.program_select(DRUMS, sfid, 128, 0, True)
    n = int(total * SR) + SR
    out = np.zeros((n, 2), np.float32)
    pos = 0
    for t, _o, kind, c, key, vel in sorted(sc.ev, key=lambda e: (e[0], e[1])):
        s = min(n, int(t * SR))
        if s > pos:
            out[pos:s] = np.frombuffer(synth.generate(s - pos), dtype=np.float32).reshape(-1, 2)
            pos = s
        if kind == "on":
            synth.noteon(c, key, vel)
        else:
            synth.noteoff(c, key)
    if pos < n:
        out[pos:] = np.frombuffer(synth.generate(n - pos), dtype=np.float32).reshape(-1, 2)
    return out[: int(total * SR)]


def bed(timing, mood, seed, style="underscore", soundfont=None, spec_scenes=None):
    """Stereo float32 underscore for one cut (48 kHz), dry; mix.py adds room + EQ. None when no soundfont."""
    soundfont = soundfont or find_soundfont()
    if not soundfont:
        return None, None
    style = style if style in STYLES else "underscore"
    h = int(hashlib.sha1(str(seed).encode()).hexdigest()[:8], 16)
    sections = roles_from_timing(timing, spec_scenes)
    sc, bpm, home = compose(sections, mood, h, style)
    x = render(sc, float(timing["totalSec"]) + 0.5, soundfont)
    info = {"bpm": bpm, "key": ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"][home],
            "minor": mood in MINOR_MOODS, "style": style, "soundfont": Path(soundfont).name, "notes": len(sc.ev) // 2,
            "sections": [{"start": round(a, 2), "end": round(b, 2), "role": r, "level": lv, "variant": v, "energy": e}
                         for a, b, r, lv, v, e in sections]}
    return x, info


# room + EQ applied by ffmpeg after rendering (mix.py): high-pass, a little low-mid cut, two short reflections
POST_FILTER = ("highpass=f=45,equalizer=f=280:t=q:w=1.1:g=-2.5,equalizer=f=3200:t=q:w=1.0:g=1.5,"
               "aecho=0.85:0.55:47|83:0.22|0.14,alimiter=limit=0.9:level=0")
