"""Generate the four house sound effects procedurally with ffmpeg (no licences needed)."""
import subprocess

from common import ROOT, log

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


def main():
    d = ROOT / "build" / "sfx"
    d.mkdir(parents=True, exist_ok=True)
    for name, (expr, dur, flt) in SFX.items():
        dest = d / f"{name}.wav"
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", f"aevalsrc=exprs='{expr}':s=48000:d={dur}",
            "-af", flt, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", str(dest),
        ]
        subprocess.run(cmd, check=True)
        log(f"sfx {name} -> {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
