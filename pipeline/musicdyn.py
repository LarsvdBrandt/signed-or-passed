"""Music dynamics (RETENTION-4b, docs/library/retention.md): a generated bed that follows scenes[].musicEnergy.

Uses the loops of pipeline/musicgen.py (same moods, eras, seeds, CC0 by construction). mix.py calls bed_energy()
when at least one scene of a cut sets musicEnergy; otherwise musicgen.bed() keeps its built-in sections.
"""
import numpy as np

from musicgen import LAYERS, MOODS, SR, compose_loop, lowpass, resolve_era, stable_seed

# RETENTION-4b: scenes[].musicEnergy -> (layer gains, brightness 0 = closed lowpass .. 1 = open, master gain)
ENERGY = {
    "low": ({"pad": 1.0, "arp": 0.8}, 0.4, 1.35),
    "mid": ({"pad": 1.0, "bass": 1.0, "arp": 1.0, "lead": 0.8}, 0.75, 1.0),
    "high": ({k: 1.0 for k in LAYERS}, 1.0, 1.1),
    "drop": ({"pad": 1.0}, 0.0, 1.4),
    "stop": ({}, 0.0, 0.0),
}
ENERGY_LP_HZ = 650.0


def _gain_ramp(a, b):
    """Seconds of the gain change from energy a to b: hard stop, slam back in after a drop, else a 0.4 s blend."""
    if b == "stop":
        return 0.12
    if a in ("drop", "stop") and b in ("mid", "high"):
        return 0.03
    return 0.4


def _bright_ramp(a, b):
    """Seconds of the filter move: slam open after a drop, a 1.5 s sweep up, 0.3 s down."""
    if a in ("drop", "stop"):
        return 0.03
    return 1.5 if ENERGY[b][1] > ENERGY[a][1] else 0.3


def _points(changes, n, value, ramp):
    """Breakpoints (xs, ys) in samples of a piecewise-linear envelope; changes = [(sample, energy)], first at 0."""
    xs, ys = [0.0], [value(changes[0][1])]
    prev = changes[0][1]
    for j, (s, e) in enumerate(changes[1:], start=1):
        nxt = changes[j + 1][0] if j + 1 < len(changes) else n
        r = max(1, min(int(ramp(prev, e) * SR), max(1, nxt - s - 1)))
        if s <= xs[-1]:
            s = xs[-1] + 1
        xs += [s, s + r]
        ys += [value(prev), value(e)]
        prev = e
    xs.append(max(n, xs[-1] + 1))
    ys.append(value(prev))
    return np.asarray(xs, dtype=np.float64), np.asarray(ys, dtype=np.float64)


def bed_energy(mood, era="modern", seconds=60.0, seed=None, changes=None):
    """A mood bed that follows an energy curve: changes = [(seconds, energy)] (energy in ENERGY), sorted.
    Layers fade in and out per energy, the filter sweeps open on the way up, 'drop' leaves a filtered pad and
    slams the full groove back in, 'stop' is silence. Same level reference as bed()."""
    if mood not in MOODS:
        raise ValueError(f"unknown mood {mood} (known: {', '.join(MOODS)})")
    era = resolve_era(era)
    seed = stable_seed(mood, era, seed if seed is not None else "default")
    lay = compose_loop(mood, era, seed)
    L = len(lay["pad"])
    lp = {k: lowpass(lay[k], ENERGY_LP_HZ) for k in LAYERS}
    full = sum(lay[k] for k in LAYERS)
    peak = float(np.max(np.abs(full))) or 1.0
    rms = float(np.sqrt(np.mean(full ** 2))) or 1.0
    g_norm = min(10 ** (-3.0 / 20) / peak, 10 ** (-20.0 / 20) / rms)
    n = max(1, int(seconds * SR))
    ch = sorted((max(0, int(round(float(t) * SR))), e) for t, e in (changes or [(0.0, "mid")]) if e in ENERGY)
    if not ch or ch[0][0] > 0:
        ch = [(0, "mid")] + ch
    bright = _points(ch, n, lambda e: ENERGY[e][1], _bright_ramp)
    master = _points(ch, n, lambda e: ENERGY[e][2], _gain_ramp)
    layer = {k: _points(ch, n, lambda e, k=k: ENERGY[e][0].get(k, 0.0), _gain_ramp) for k in LAYERS}
    out = np.zeros(n, dtype=np.float32)
    step = 10 * SR
    for a in range(0, n, step):
        b = min(n, a + step)
        idx = np.arange(a, b)
        li = idx % L
        w = np.interp(idx, *bright)
        seg = np.zeros(b - a)
        for k in LAYERS:
            g = np.interp(idx, *layer[k])
            if not g.any():
                continue
            seg += g * (w * lay[k][li] + (1.0 - w) * lp[k][li])
        out[a:b] = (seg * np.interp(idx, *master) * g_norm).astype(np.float32)
    fi = min(n, int(0.05 * SR))
    out[:fi] *= np.linspace(0.0, 1.0, fi, dtype=np.float32)
    fo = min(n, int(min(3.0, seconds * 0.2) * SR))
    if fo > 0:
        out[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)
    pk = float(np.max(np.abs(out))) if n else 0.0
    if pk > 0.95:
        out *= 0.95 / pk
    return out
