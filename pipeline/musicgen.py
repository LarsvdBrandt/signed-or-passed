"""Procedural music library (MUSIC-1). Pure numpy synthesis, fixed seeds: CC0 by construction (no samples, no
recordings, no third-party material).

  python pipeline/musicgen.py bed --mood tense [--era modern] [--seconds 90] [--seed my-slug] --out bed.wav
  python pipeline/musicgen.py stinger --name signed --out signed.wav
  python pipeline/musicgen.py library --out build/music-lib [--zip build/0000-sample/out/music-library.zip]
  python pipeline/musicgen.py --list

A bed is built from one 8-bar loop per layer (pad, bass, arp, lead, drums); every layer is rendered circularly
(notes, filter and reverb wrap around) so it tiles without clicks. The bed arranges the layers in sections
(intro, full, break, ...) with short gain ramps, so a 10-minute bed costs the same as one loop. Length comes from
the caller (mix.py uses timing.json). Moods: see MOODS; era flavours change the lead instrument, swing and kit.

library writes <out>/wav/*.wav, <out>/catalogue.json, <out>/board.wav and <out>/board-props.json (input props of the
Remotion composition SoundBoard; CI muxes it into music-board.mp4) and optionally a zip with LICENCE.txt.
"""
import argparse
import hashlib
import math
import sys
import zipfile
from pathlib import Path

import numpy as np
import soundfile as sf

from common import ROOT, log, write_json

SR = 48000
FPS = 30

SCALES = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
    "lydian": [0, 2, 4, 6, 7, 9, 11],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "harmonic": [0, 2, 3, 5, 7, 8, 11],
}

# prog = scale degrees (0-based), one chord per bar
MOODS = {
    "tense": {"bpm": 96, "root": 45, "scale": "phrygian", "prog": [0, 0, 1, 0], "pad": "dark", "bass": "pulse8",
              "arp": "sparse", "melody": False, "drums": "heartbeat", "bright": 1200,
              "desc": "low drone, ticking pulse, phrygian half-step"},
    "curious": {"bpm": 104, "root": 50, "scale": "dorian", "prog": [0, 3, 0, 4], "pad": "soft", "bass": "bounce",
                "arp": "up8", "melody": True, "drums": "light", "bright": 2600,
                "desc": "light plucks, bouncing bass, dorian"},
    "triumphant": {"bpm": 112, "root": 48, "scale": "major", "prog": [0, 4, 5, 3], "pad": "brass", "bass": "root8",
                   "arp": None, "melody": True, "drums": "march", "bright": 4200,
                   "desc": "brassy chords, march snare, I-V-vi-IV"},
    "somber": {"bpm": 68, "root": 45, "scale": "minor", "prog": [0, 5, 3, 4], "pad": "soft", "bass": "long",
               "arp": "sparse", "melody": True, "drums": None, "bright": 1500,
               "desc": "slow minor keys and strings, no drums"},
    "playful": {"bpm": 126, "root": 53, "scale": "major", "prog": [0, 3, 4, 0], "pad": None, "bass": "bounce",
                "arp": "up8", "melody": True, "drums": "light", "bright": 3800,
                "desc": "staccato plucks, bouncing bass, claps"},
    "epic": {"bpm": 84, "root": 43, "scale": "minor", "prog": [0, 5, 2, 6], "pad": "big", "bass": "pulse8",
             "arp": None, "melody": True, "drums": "epic", "bright": 3200,
             "desc": "big minor chords, war toms, i-VI-III-VII"},
    "mysterious": {"bpm": 80, "root": 47, "scale": "harmonic", "prog": [0, 1, 0, 5], "pad": "dark", "bass": "long",
                   "arp": "sparse", "melody": False, "drums": "shaker", "bright": 1800,
                   "desc": "harmonic-minor bells over a dark pad"},
    "upbeat": {"bpm": 120, "root": 52, "scale": "mixolydian", "prog": [0, 6, 3, 0], "pad": "soft", "bass": "root8",
               "arp": "up16", "melody": True, "drums": "four", "bright": 5000,
               "desc": "four-on-the-floor, 16th arps, mixolydian"},
}

ERAS = {
    "modern": {"lead": "pluck", "swing": 0.0, "kit": "standard", "desc": "clean plucks, standard kit"},
    "baroque": {"lead": "harpsichord", "swing": 0.0, "kit": "timpani", "desc": "harpsichord, timpani instead of drums"},
    "jazz-age": {"lead": "piano", "swing": 0.33, "kit": "brush", "desc": "swung piano, brushes"},
    "fifties": {"lead": "organ", "swing": 0.2, "kit": "standard", "desc": "organ, light swing"},
    "eighties": {"lead": "synth", "swing": 0.0, "kit": "gated", "desc": "square synth, gated snare"},
    "future": {"lead": "bell", "swing": 0.0, "kit": "trap", "desc": "glassy bells, rolling hats"},
}

ERA_ALIASES = {
    "ancient": "baroque", "medieval": "baroque", "1600s": "baroque", "golden-age": "baroque",
    "victorian": "jazz-age", "industrial": "jazz-age", "1900s": "jazz-age", "1920s": "jazz-age", "1930s": "jazz-age",
    "1950s": "fifties", "1960s": "fifties", "1970s": "eighties", "1980s": "eighties", "1990s": "eighties",
    "2000s": "modern", "2010s": "modern", "2020s": "modern", "contemporary": "modern",
}

DRUM_PATTERNS = {
    "four": {"kick": [0, 4, 8, 12], "clap": [4, 12], "hat": [2, 6, 10, 14]},
    "march": {"kick": [0, 8], "snare": [4, 12, 14]},
    "light": {"kick": [0, 10], "clap": [4, 12], "hat": [2, 6, 10, 14]},
    "heartbeat": {"kick": [0, 3], "tick": [0, 4, 8, 12]},
    "epic": {"kick": [0, 8], "tom": [0, 3, 6, 10, 12, 14]},
    "shaker": {"kick": [0], "shaker": [0, 2, 4, 6, 8, 10, 12, 14]},
}

STINGERS = {
    "reveal": "noise riser into a major hit (before a reveal)",
    "signed": "rising major arpeggio + bell chord (SIGNED verdict)",
    "passed": "low minor brass hit, timpani, falling tone (PASSED verdict)",
    "question": "unresolved sus4 swell with two ticks (question scene)",
}

LAYERS = ("pad", "bass", "arp", "lead", "drums")
ALL = set(LAYERS)
SECTIONS = [
    ("intro", {"pad", "bass"}),
    ("full", ALL),
    ("full", ALL),
    ("break", {"pad", "arp", "lead"}),
    ("groove", {"pad", "bass", "arp", "drums"}),
    ("full", ALL),
]


def stable_seed(*parts):
    return int(hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:8], 16)


def resolve_era(era):
    e = str(era or "modern").lower()
    e = ERA_ALIASES.get(e, e)
    return e if e in ERAS else "modern"


# ------------------------------------------------------------------ synthesis primitives

def _t(n):
    return np.arange(n, dtype=np.float64) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def osc(kind, f, n, harmonics=24):
    t = _t(n)
    if kind == "sine":
        return np.sin(2 * np.pi * f * t)
    kmax = max(1, min(harmonics, int(SR / 2 / max(f, 1.0)) - 1))
    out = np.zeros(n)
    if kind == "saw":
        for k in range(1, kmax + 1):
            out += np.sin(2 * np.pi * k * f * t) / k
        return out * 0.55
    if kind == "square":
        for k in range(1, kmax + 1, 2):
            out += np.sin(2 * np.pi * k * f * t) / k
        return out * 0.8
    if kind == "tri":
        for i, k in enumerate(range(1, kmax + 1, 2)):
            out += ((-1) ** i) * np.sin(2 * np.pi * k * f * t) / (k * k)
        return out * 0.8
    raise ValueError(kind)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.full(n, float(s))
    na = min(n, max(1, int(a * SR)))
    e[:na] = np.linspace(0.0, 1.0, na, endpoint=False)
    nd = max(1, int(d * SR))
    d_end = min(n, na + nd)
    if d_end > na:
        e[na:d_end] = np.linspace(1.0, s, d_end - na, endpoint=False)
    nr = max(1, int(r * SR))
    if nr < n:
        e[n - nr:] *= np.linspace(1.0, 0.0, nr)
    else:
        e *= np.linspace(1.0, 0.0, n)
    return e


def decay(n, rate):
    return np.exp(-_t(n) * rate)


def declick(x, ms=3.0):
    k = min(len(x), max(1, int(ms / 1000 * SR)))
    x[:k] *= np.linspace(0.0, 1.0, k)
    x[-k:] *= np.linspace(1.0, 0.0, k)
    return x


def inst(name, m, dur):
    n = max(64, int(dur * SR))
    f = mtof(m)
    if name == "pad-soft":
        x = (osc("tri", f, n) + 0.4 * osc("sine", f * 2.0, n)) * adsr(n, min(0.6, dur * 0.3), 0.2, 0.8, min(0.8, dur * 0.3))
    elif name == "pad-dark":
        x = (osc("saw", f, n, 6) + osc("saw", f * 1.004, n, 6)) * 0.5 * adsr(n, min(0.9, dur * 0.4), 0.3, 0.85, min(0.9, dur * 0.3))
    elif name == "pad-big":
        x = (osc("saw", f, n, 20) + osc("saw", f * 1.003, n, 20) + 0.5 * osc("saw", f / 2, n, 20)) * 0.4 * adsr(n, 0.25, 0.3, 0.85, min(0.6, dur * 0.3))
    elif name == "pad-brass":
        x = osc("saw", f, n, 16) * adsr(n, 0.06, 0.2, 0.75, 0.15)
    elif name == "bass":
        x = (osc("tri", f, n) + 0.6 * osc("sine", f, n)) * adsr(n, 0.005, 0.1, 0.8, 0.06)
    elif name == "pluck":
        x = osc("saw", f, n, 18) * decay(n, 7.0)
    elif name == "harpsichord":
        x = (0.6 * osc("saw", f, n, 30) + 0.3 * osc("saw", f * 2, n, 15)) * decay(n, 5.0)
    elif name == "piano":
        x = (osc("sine", f, n) + 0.5 * osc("sine", f * 2, n) * decay(n, 2.0) + 0.25 * osc("sine", f * 3, n) * decay(n, 4.0)) * decay(n, 2.2)
    elif name == "organ":
        x = (osc("sine", f, n) + 0.6 * osc("sine", f * 2, n) + 0.4 * osc("sine", f * 3, n) + 0.25 * osc("sine", f * 4, n)) * 0.6 * adsr(n, 0.01, 0.05, 0.9, 0.05)
    elif name == "synth":
        x = osc("square", f, n, 12) * 0.7 * adsr(n, 0.005, 0.15, 0.6, 0.1)
    elif name == "bell":
        x = np.zeros(n)
        for ratio, amp, rate in ((1.0, 1.0, 1.6), (2.76, 0.5, 2.4), (5.4, 0.25, 3.5), (8.93, 0.12, 5.0)):
            if f * ratio < SR / 2 - 100:
                x += amp * osc("sine", f * ratio, n) * decay(n, rate)
        x *= 0.6
    else:
        raise ValueError(f"unknown instrument {name}")
    return declick(x)


def kick(gain=1.0, dur=0.45):
    n = int(dur * SR)
    t = _t(n)
    f = 45 + 80 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    return declick(x * gain, 1)


def tom(freq=90.0, dur=0.6):
    n = int(dur * SR)
    t = _t(n)
    f = freq * (1 + 0.5 * np.exp(-t * 20))
    return declick(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6), 1)


def bright_noise(rng, n):
    w = rng.uniform(-1, 1, n + 1)
    return np.diff(w) * 0.5


def snare(rng, gated=False):
    n = int((0.32 if gated else 0.25) * SR)
    t = _t(n)
    noise = bright_noise(rng, n) * (np.exp(-t * 4) if gated else np.exp(-t * 18)) * 0.8
    tone = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 25) * 0.4
    return declick(noise + tone, 1)


def brush(rng):
    n = int(0.3 * SR)
    t = _t(n)
    x = rng.uniform(-1, 1, n) * np.minimum(1.0, t / 0.03) * np.exp(-t * 9) * 0.35
    return declick(x, 1)


def hat(rng, length=0.06):
    n = int(length * SR)
    return declick(bright_noise(rng, n) * np.exp(-_t(n) * (60 if length < 0.1 else 10)) * 0.7, 1)


def clap(rng):
    n = int(0.22 * SR)
    x = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        k = int(off * SR)
        m = n - k
        x[k:] += bright_noise(rng, m) * np.exp(-_t(m) * (60 if off < 0.02 else 14))
    return declick(x * 0.6, 1)


def tick():
    n = int(0.03 * SR)
    return declick(np.sin(2 * np.pi * 2500 * _t(n)) * np.exp(-_t(n) * 120), 0.5)


def add(buf, start, sig, gain=1.0, circular=True):
    L = len(buf)
    n = len(sig)
    if circular:
        start = int(start) % L
        if n > L:
            sig = sig[:L]
            n = L
        end = start + n
        if end <= L:
            buf[start:end] += sig * gain
        else:
            k = L - start
            buf[start:] += sig[:k] * gain
            buf[:end - L] += sig[k:] * gain
    else:
        start = int(start)
        if start >= L:
            return
        m = min(n, L - start)
        buf[start:start + m] += sig[:m] * gain


def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1.0 / SR)
    X *= 1.0 / np.sqrt(1.0 + (fr / float(cutoff)) ** 4)
    return np.fft.irfft(X, n=len(x))


def reverb(x, rng, seconds=1.8, wet=0.2, circular=True):
    n_ir = int(seconds * SR)
    ir = rng.standard_normal(n_ir) * np.exp(-_t(n_ir) * (6.9 / seconds))
    ir = lowpass(ir, 4500)
    ir /= max(1e-9, float(np.sqrt(np.sum(ir ** 2))))
    if circular:
        N = len(x)
        h = np.zeros(N)
        k = min(N, n_ir)
        h[:k] = ir[:k]
        y = np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(h), n=N)
        return x + wet * y
    N = len(x) + n_ir
    xp = np.zeros(N)
    xp[:len(x)] = x
    y = np.fft.irfft(np.fft.rfft(xp) * np.fft.rfft(ir, N), n=N)
    return xp + wet * y


# ------------------------------------------------------------------ composition

def compose_loop(mood, era, seed, bars=8):
    """One loop per layer (dict layer -> float64 array), every layer tiles seamlessly."""
    M = MOODS[mood]
    E = ERAS[resolve_era(era)]
    rng = np.random.default_rng(seed)
    beat = 60.0 / M["bpm"]
    step = beat / 4.0
    L = int(round(bars * 4 * beat * SR))
    scale = SCALES[M["scale"]]
    root = M["root"]
    prog = M["prog"]
    swing = E["swing"]
    lead_inst = E["lead"]
    bar_len = 4 * beat
    lay = {k: np.zeros(L) for k in LAYERS}

    def deg(d, octave=0):
        o, i = divmod(int(d), 7)
        return root + 12 * (o + octave) + scale[i]

    def chord(d):
        return [deg(d), deg(d + 2), deg(d + 4)]

    def at(bar, s16):
        t = (bar * 16 + s16) * step
        if s16 % 4 == 2:
            t += swing * step
        return int(round(t * SR))

    for b in range(bars):
        d = prog[b % len(prog)]
        ch = chord(d)
        if M["pad"]:
            for m in ch:
                add(lay["pad"], at(b, 0), inst("pad-" + M["pad"], m + 12, bar_len * 1.05), 0.16)
        r = deg(d, -1)
        pat = M["bass"]
        if pat == "pulse8":
            for s in range(0, 16, 2):
                add(lay["bass"], at(b, s), inst("bass", r, step * 1.8), 0.3)
        elif pat == "root8":
            for s in range(0, 16, 2):
                add(lay["bass"], at(b, s), inst("bass", r + (12 if s in (6, 14) else 0), step * 1.8), 0.34 if s in (0, 8) else 0.26)
        elif pat == "bounce":
            for s, iv in zip((0, 4, 8, 12), (0, 7, 12, 7)):
                add(lay["bass"], at(b, s), inst("bass", r + iv, step * 3.2), 0.32)
        elif pat == "long":
            add(lay["bass"], at(b, 0), inst("bass", r, bar_len * 0.98), 0.3)
        pool = [m + 12 for m in ch] + [ch[0] + 24]
        arp = M["arp"]
        if arp == "up8":
            for i, s in enumerate(range(0, 16, 2)):
                add(lay["arp"], at(b, s), inst(lead_inst, pool[i % len(pool)], step * 2.5), 0.12)
        elif arp == "up16":
            for s in range(16):
                add(lay["arp"], at(b, s), inst(lead_inst, pool[s % len(pool)], step * 1.6), 0.08)
        elif arp == "sparse":
            for s in range(0, 16, 2):
                if rng.random() < 0.35:
                    m = pool[int(rng.integers(len(pool)))] + 12
                    add(lay["arp"], at(b, s), inst("bell" if lead_inst == "pluck" else lead_inst, m, beat * 1.5), 0.09)

    if M["melody"]:
        motif = [None if rng.random() < 0.45 else int(rng.integers(0, 5)) for _ in range(16)]
        offsets = [0, 2, 4, 5, 7]
        for b in range(bars):
            d = prog[b % len(prog)]
            for j in range(8):
                v = motif[(b % 2) * 8 + j]
                if v is None:
                    continue
                vv = (v + (1 if b >= bars - 2 else 0)) % len(offsets)
                m = deg(d + offsets[vv], 1)
                add(lay["lead"], at(b, j * 2), inst(lead_inst, m, step * 2.6), 0.13)

    pat = M["drums"]
    if pat:
        P = DRUM_PATTERNS[pat]
        kit = E["kit"]
        dr = lay["drums"]
        for b in range(bars):
            for s in P.get("kick", []):
                if kit == "timpani":
                    add(dr, at(b, s), tom(65.0 if s == 0 else 82.0), 0.45)
                else:
                    add(dr, at(b, s), kick(), 0.35 if pat == "heartbeat" else 0.5)
            if kit != "timpani":
                for s in P.get("snare", []):
                    sig = brush(rng) if kit == "brush" else snare(rng, gated=(kit == "gated"))
                    add(dr, at(b, s), sig, 0.28)
                for s in P.get("clap", []):
                    sig = brush(rng) if kit == "brush" else (snare(rng, gated=True) if kit == "gated" else clap(rng))
                    add(dr, at(b, s), sig, 0.24)
                for s in P.get("hat", []):
                    add(dr, at(b, s), hat(rng), 0.16)
                if kit == "trap" and b % 2 == 1:
                    for s in range(12, 16):
                        add(dr, at(b, s), hat(rng), 0.1)
                        add(dr, at(b, s) + int(step * SR / 2), hat(rng), 0.08)
                if pat == "march" and b % 4 == 3:
                    for s in range(12, 16):
                        for half in (0, 1):
                            add(dr, at(b, s) + half * int(step * SR / 2), snare(rng), 0.14)
            for s in P.get("tick", []):
                add(dr, at(b, s), tick(), 0.12)
            for i, s in enumerate(P.get("tom", [])):
                add(dr, at(b, s), tom(110.0 - 12.0 * (i % 3)), 0.32)
            for s in P.get("shaker", []):
                add(dr, at(b, s), hat(rng), 0.06)

    bright = M["bright"]
    rv = np.random.default_rng(seed + 1)
    lay["pad"] = reverb(lowpass(lay["pad"], bright), rv, 2.2, 0.25)
    lay["bass"] = lowpass(lay["bass"], 900)
    lay["arp"] = reverb(lowpass(lay["arp"], bright * 1.3), rv, 1.6, 0.22)
    lay["lead"] = reverb(lowpass(lay["lead"], bright * 1.5), rv, 1.6, 0.2)
    lay["drums"] = reverb(lay["drums"], rv, 0.9, 0.08)
    return lay


def bed(mood, era="modern", seconds=60.0, seed=None, intro=True):
    """A mood bed of the given length (float32 mono, 48 kHz), arranged in sections, faded out at the end."""
    if mood not in MOODS:
        raise ValueError(f"unknown mood {mood} (known: {', '.join(MOODS)})")
    era = resolve_era(era)
    seed = stable_seed(mood, era, seed if seed is not None else "default")
    lay = compose_loop(mood, era, seed)
    L = len(lay["pad"])
    total = max(1, int(seconds * SR))
    n_sec = int(math.ceil(total / L))
    plan = list(SECTIONS) if intro else list(SECTIONS[1:])
    seq = [plan[0]] + [plan[1:][(i - 1) % len(plan[1:])] for i in range(1, n_sec)] if len(plan) > 1 else plan * n_sec
    ramp = min(L, int(0.4 * SR))
    prev = {k: 0.0 for k in LAYERS}
    parts = []
    for _name, mask in seq[:n_sec]:
        seg = np.zeros(L)
        for k in LAYERS:
            g = 1.0 if k in mask else 0.0
            p = prev[k]
            if g == 0.0 and p == 0.0:
                continue
            if g == p:
                seg += lay[k] * g
            else:
                env = np.full(L, g)
                env[:ramp] = np.linspace(p, g, ramp)
                seg += lay[k] * env
            prev[k] = g
        parts.append(seg.astype(np.float32))
    x = np.concatenate(parts)[:total]
    fi = min(len(x), int(0.05 * SR))
    x[:fi] *= np.linspace(0.0, 1.0, fi, dtype=np.float32)
    fo = min(len(x), int(min(3.0, seconds * 0.2) * SR))
    if fo > 0:
        x[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)
    return normalise(x)


def normalise(x, peak_db=-3.0, rms_db=-20.0):
    x = np.asarray(x, dtype=np.float32)
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    rms = float(np.sqrt(np.mean(x.astype(np.float64) ** 2))) if len(x) else 0.0
    if peak <= 1e-9 or rms <= 1e-9:
        return x
    g = min(10 ** (peak_db / 20) / peak, 10 ** (rms_db / 20) / rms)
    return (x * g).astype(np.float32)


def stinger(name, seed=7):
    if name not in STINGERS:
        raise ValueError(f"unknown stinger {name} (known: {', '.join(STINGERS)})")
    rng = np.random.default_rng(stable_seed("stinger", name, seed))
    n = int(3.2 * SR)
    x = np.zeros(n)
    if name == "reveal":
        rl = int(1.5 * SR)
        t = _t(rl)
        chunks = 6
        cl = rl // chunks
        for c in range(chunks):
            seg = rng.uniform(-1, 1, cl)
            seg = lowpass(seg, 400 * (c + 1) ** 1.6)
            add(x, c * cl, seg * ((c + 1) / chunks) ** 2 * 0.5, circular=False)
        sweep = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / 1.5)) / SR) * (t / 1.5) ** 2 * 0.25
        add(x, 0, sweep, circular=False)
        hit = int(1.5 * SR)
        add(x, hit, kick(), 0.8, circular=False)
        for m in (60, 64, 67, 72):
            add(x, hit, inst("pad-brass", m, 0.7), 0.2, circular=False)
        add(x, hit, inst("bell", 84, 1.5), 0.25, circular=False)
    elif name == "signed":
        for i, m in enumerate((60, 64, 67, 72, 76)):
            add(x, int(i * 0.09 * SR), inst("pluck", m, 0.6), 0.3, circular=False)
        for m in (72, 76, 79):
            add(x, int(0.5 * SR), inst("bell", m, 2.2), 0.22, circular=False)
        for m in (48, 55, 60, 64):
            add(x, int(0.45 * SR), inst("pad-soft", m, 1.8), 0.16, circular=False)
    elif name == "passed":
        for m in (36, 43, 48, 51):
            add(x, 0, inst("pad-big", m, 0.9), 0.22, circular=False)
        add(x, 0, tom(70.0, 1.2), 0.6, circular=False)
        add(x, 0, kick(), 0.6, circular=False)
        fl = int(0.9 * SR)
        t = _t(fl)
        fall = np.sin(2 * np.pi * np.cumsum(300 * (60 / 300) ** (t / 0.9)) / SR) * np.exp(-t * 2.5) * 0.3
        add(x, int(0.1 * SR), declick(fall), circular=False)
    elif name == "question":
        for m in (57, 62, 64):
            sig = inst("pad-soft", m, 2.2) * np.minimum(1.0, _t(int(2.2 * SR)) / 1.2)
            add(x, 0, sig, 0.2, circular=False)
        add(x, int(0.3 * SR), tick(), 0.4, circular=False)
        add(x, int(0.8 * SR), tick(), 0.4, circular=False)
        add(x, int(1.6 * SR), inst("bell", 76, 1.4), 0.2, circular=False)
    y = reverb(x, rng, 1.6, 0.3, circular=False)[: int(4.0 * SR)]
    fo = int(0.3 * SR)
    y[-fo:] *= np.linspace(1.0, 0.0, fo)
    return normalise(y, peak_db=-1.0, rms_db=-14.0)


def write_wav(path, x):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.asarray(x, dtype=np.float32), SR, subtype="PCM_16")


# ------------------------------------------------------------------ library + board

LICENCE_TXT = """Signed or Passed factory - music library

Every file in this archive was synthesised from scratch by pipeline/musicgen.py (numpy oscillators, noise and
fixed seeds). No samples, loops, recordings or third-party material are used, so nothing can match a Content ID
reference of someone else's recording.
Licence: CC0 1.0 Universal (public domain dedication). No attribution required. Free for any use, including
monetised YouTube videos.
"""


def _abs(p):
    p = Path(p)
    return p if p.is_absolute() else ROOT / p


def library(out, zip_path=""):
    out = _abs(out)
    (out / "wav").mkdir(parents=True, exist_ok=True)
    entries = []
    for mood, M in MOODS.items():
        f = f"wav/bed-{mood}.wav"
        write_wav(out / f, bed(mood, "modern", 24.0, seed="library", intro=False))
        entries.append({"name": mood, "category": "bed", "description": f"{M['desc']} - {M['bpm']} bpm", "file": f,
                        "mood": mood, "era": "modern"})
    for era, E in ERAS.items():
        if era == "modern":
            continue
        f = f"wav/era-curious-{era}.wav"
        write_wav(out / f, bed("curious", era, 16.0, seed="library", intro=False))
        entries.append({"name": f"curious / {era}", "category": "era", "description": E["desc"], "file": f,
                        "mood": "curious", "era": era})
    for name, desc in STINGERS.items():
        f = f"wav/stinger-{name}.wav"
        write_wav(out / f, stinger(name))
        entries.append({"name": name, "category": "stinger", "description": desc, "file": f})
    write_json(out / "catalogue.json", {"sampleRate": SR, "licence": "CC0-1.0", "generator": "pipeline/musicgen.py",
                                        "moods": list(MOODS), "eras": list(ERAS), "eraAliases": ERA_ALIASES,
                                        "stingers": list(STINGERS), "files": entries})

    lead, gap, tail = 0.8, 0.8, 0.6
    parts = [np.zeros(int(lead * SR), dtype=np.float32)]
    cursor = len(parts[0])
    items = []
    for e in entries:
        x, _sr = sf.read(str(out / e["file"]), dtype="float32")
        start = cursor
        parts.append(x)
        cursor += len(x)
        items.append({"name": e["name"], "category": e["category"], "description": e["description"], "file": e["file"],
                      "credit": "procedural - CC0 - pipeline/musicgen.py",
                      "startFrame": int(round(start / SR * FPS)), "endFrame": int(round(cursor / SR * FPS))})
        g = np.zeros(int(gap * SR), dtype=np.float32)
        parts.append(g)
        cursor += len(g)
    parts.append(np.zeros(int(tail * SR), dtype=np.float32))
    board = np.concatenate(parts)
    sf.write(str(out / "board.wav"), board, SR, subtype="PCM_16")
    spf = SR // FPS
    frames = int(math.ceil(len(board) / spf))
    env = []
    for i in range(frames):
        seg = board[i * spf:(i + 1) * spf].astype(np.float64)
        env.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    mx = max(env) if env and max(env) > 0 else 1.0
    env = [round(min(1.0, (v / mx) ** 0.6), 3) for v in env]
    n_beds = sum(1 for e in entries if e["category"] == "bed")
    n_eras = sum(1 for e in entries if e["category"] == "era")
    write_json(out / "board-props.json", {
        "fps": FPS, "totalFrames": frames, "title": "Music library",
        "subtitle": f"{n_beds} mood beds + {n_eras} era flavours + {len(STINGERS)} stingers - procedural, CC0 - 48 kHz mono",
        "items": items, "env": env,
    })
    log(f"music library: {len(entries)} files, board {len(board) / SR:.1f} s ({frames} frames) -> {out}")
    if zip_path:
        z = _abs(zip_path)
        z.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for e in entries:
                zf.write(out / e["file"], arcname=e["file"])
            zf.write(out / "catalogue.json", arcname="catalogue.json")
            zf.writestr("LICENCE.txt", LICENCE_TXT)
        log(f"zip -> {z}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", nargs="?", choices=["bed", "stinger", "library"])
    ap.add_argument("--mood", default="curious")
    ap.add_argument("--era", default="modern")
    ap.add_argument("--seconds", type=float, default=60.0)
    ap.add_argument("--seed", default=None)
    ap.add_argument("--name", default="signed")
    ap.add_argument("--out", default="")
    ap.add_argument("--zip", default="")
    ap.add_argument("--no-intro", action="store_true")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    if a.list or not a.cmd:
        print("moods:", ", ".join(f"{k} ({v['bpm']} bpm: {v['desc']})" for k, v in MOODS.items()))
        print("eras:", ", ".join(ERAS), "| aliases:", ", ".join(f"{k}->{v}" for k, v in ERA_ALIASES.items()))
        print("stingers:", ", ".join(STINGERS))
        return
    if a.cmd == "library":
        library(a.out or "build/music-lib", a.zip)
        return
    if not a.out:
        sys.exit("--out is required")
    if a.cmd == "bed":
        write_wav(_abs(a.out), bed(a.mood, a.era, a.seconds, a.seed, intro=not a.no_intro))
    else:
        write_wav(_abs(a.out), stinger(a.name))
    log(f"{a.cmd} -> {a.out}")


if __name__ == "__main__":
    main()
