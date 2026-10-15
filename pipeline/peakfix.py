"""True-peak guard after the AAC mux: python pipeline/peakfix.py VIDEO.mp4 MIX.wav

mix.py limits the mix to about -3 dBTP, but the AAC encode can overshoot hard transients by 2-3 dB, and by a
different amount on every run (the sample measured -1.17, -1.0 and -0.43 dBTP for the same mix). When the muxed
audio is above PEAK_MAX, the audio is re-encoded from MIX.wav through a stricter 4x-oversampled limiter (-4.5 dBFS,
then 1 dB lower per retry): only the peaks are touched, so the loudness stays at about -14 LUFS (a plain gain cut cost
0.9 LU). The video stream is copied, nothing is re-rendered.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

PEAK_MAX = -1.2     # dBTP after AAC (QA allows -0.7)
LIMITS_DB = (-4.5, -5.5, -6.5)  # limiter ceilings per attempt


def true_peak(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af",
                        "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_tp\"[^{}]*\}", p.stderr, re.S)
    return float(json.loads(m.group(0))["input_tp"]) if m else None


def main():
    video, mix = Path(sys.argv[1]), Path(sys.argv[2])
    tp = true_peak(video)
    if tp is None:
        print(f"peakfix {video.name}: true peak not measurable, left as is")
        return
    if tp <= PEAK_MAX:
        print(f"peakfix {video.name}: true peak {tp:.2f} dBTP, ok")
        return
    for ceiling in LIMITS_DB:
        tmp = video.with_name(video.stem + ".peakfix.mp4")
        lim = 10 ** (ceiling / 20.0)
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(video), "-i", str(mix),
                        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af",
                        f"aresample=192000,alimiter=limit={lim:.4f}:level=0:attack=0.5:release=50:asc=1,aresample=48000",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(tmp)],
                       check=True)
        new = true_peak(tmp)
        print(f"peakfix {video.name}: true peak {tp:.2f} dBTP -> {new} dBTP (limiter {ceiling} dBFS)")
        tmp.replace(video)
        if new is None or new <= PEAK_MAX:
            break


if __name__ == "__main__":
    main()
