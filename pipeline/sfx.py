"""Sound effects for a production, generated procedurally (no licences needed).

  python pipeline/sfx.py                 # the four house sounds only (pen, stamp, paper, whoosh)
  python pipeline/sfx.py --slug <slug>   # house sounds + every pipeline/sfxlib.py sound the spec uses

A spec can use any sfxlib name in scenes[].sfx and scenes[].sfxCues[].sfx (see docs/library/sound-usage.md).
Everything is written to build/sfx/<name>.wav, where mix.py picks it up.
"""
import argparse
import subprocess

import numpy as np
import soundfile as sf

from common import COLD_OPEN_SFX, ROOT, cuts, fail, load_spec, log
from retention import beat_sfx_names

# expression, duration, extra filter. No commas inside expressions (filtergraph separator).
SFX = {
    "pen": ("0.35*(2*random(0)-1)*(0.55+0.45*sin(2*PI*11*t))*(1-exp(-30*t))*exp(-0.8*t)", 1.1,
            "highpass=f=2500,lowpass=f=8000,afade=t=out:st=0.85:d=0.25"),
    "stamp": ("0.9*sin(2*PI*(55+60*exp(-25*t))*t)*exp(-9*t)+0.5*(2*random(0)-1)*exp(-45*t)", 0.7,
              "lowpass=f=3000,afade=t=out:st=0.5:d=0.2"),
    "paper": ("0.45*(2*random(0)-1)*sin(PI*t/0.45)*sin(PI*t/0.45)", 0.45,
              "highpass=f=1200,lowpass=f=7000"),
    "whoosh": ("0.7*(2*random(0)-1)*sin(PI*t/0.7)*sin(PI*t/0.7)*sin(PI*t/0.7)", 0.7,
               "highpass=f=300,lowpass=f=1800"),
}


def used_sfx(spec):
    """Every sound name a spec uses (scene sfx and sfxCues, main video and shorts)."""
    names = set()
    for cut in cuts(spec):
        for sc in cut["scenes"]:
            if sc.get("sfx"):
                names.add(sc["sfx"])
            for cue in sc.get("sfxCues") or []:
                if cue.get("sfx"):
                    names.add(cue["sfx"])
    names |= beat_sfx_names(spec)  # automatic beat sounds (pipeline/retention.py)
    if any(sc.get("coldOpen") for cut in cuts(spec) for sc in cut["scenes"]):
        names |= {n for n, *_ in COLD_OPEN_SFX}  # cold-open whooshes (RETENTION-3)
    return sorted(names)


def house(d):
    for name, (expr, dur, flt) in SFX.items():
        dest = d / f"{name}.wav"
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", f"aevalsrc=exprs='{expr}':s=48000:d={dur}",
            "-af", flt, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", str(dest),
        ]
        subprocess.run(cmd, check=True)
        log(f"sfx {name} -> {dest.relative_to(ROOT)}")


def library(d, names):
    import sfxlib  # numpy synthesis, see pipeline/sfxlib.py

    for name in names:
        if name in SFX:
            continue
        if name not in sfxlib.SOUNDS:
            fail(f"unknown sfx '{name}': use pen/stamp/paper/whoosh or a name from `python pipeline/sfxlib.py --list`")
        x = sfxlib.generate(name)
        dest = d / f"{name}.wav"
        sf.write(str(dest), np.asarray(x, dtype=np.float32), sfxlib.SR, subtype="PCM_16")
        log(f"sfx {name} (library, {len(x) / sfxlib.SR:.2f}s) -> {dest.relative_to(ROOT)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", default=None)
    a = ap.parse_args()
    d = ROOT / "build" / "sfx"
    d.mkdir(parents=True, exist_ok=True)
    house(d)
    if a.slug:
        library(d, used_sfx(load_spec(a.slug)))


if __name__ == "__main__":
    main()
