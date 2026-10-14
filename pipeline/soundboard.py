"""Render the procedural sound library and build the sound-board preview.

  python pipeline/soundboard.py --out build/sfx-lib --zip build/0000-sample/out/sfx-library.zip

Writes <out>/wav/*.wav and <out>/catalogue.json (pipeline/sfxlib.py), <out>/soundboard.wav (every sound in a row)
and <out>/soundboard-props.json (input props of the Remotion composition SoundBoard), plus an optional zip with all
WAVs, the catalogue and a licence note. CI muxes the SoundBoard render with soundboard.wav into sound-board.mp4.
"""
import argparse
import math
import zipfile
from pathlib import Path

import numpy as np
import soundfile as sf

import sfxlib
from common import ROOT, log, write_json

FPS = 30
LEAD = 0.8
GAP = 0.7
TAIL = 0.6

LICENCE_TXT = """Signed or Passed factory - procedural sound library

Every sound in this archive was synthesised from scratch by pipeline/sfxlib.py (numpy oscillators and noise,
fixed seeds). No recordings, samples or third-party material are used.

Licence: CC0 1.0 Universal (public domain dedication). Free for any use, including monetised YouTube videos.
No attribution required.
"""


def _abs(p):
    p = Path(p)
    return p if p.is_absolute() else ROOT / p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="build/sfx-lib")
    ap.add_argument("--zip", default="")
    a = ap.parse_args()
    out = _abs(a.out)
    out.mkdir(parents=True, exist_ok=True)

    rendered = sfxlib.render_all(out)
    sr = sfxlib.SR
    lead = np.zeros(int(LEAD * sr))
    parts = [lead]
    cursor = len(lead)
    items = []
    for entry, x in rendered:
        start = cursor
        parts.append(np.asarray(x, dtype=np.float64))
        cursor += len(x)
        end = cursor
        gap = np.zeros(int(GAP * sr))
        parts.append(gap)
        cursor += len(gap)
        items.append({
            "name": entry["name"],
            "category": entry["category"],
            "description": entry["description"],
            "startFrame": int(round(start / sr * FPS)),
            "endFrame": int(round(end / sr * FPS)),
        })
    parts.append(np.zeros(int(TAIL * sr)))
    board = np.concatenate(parts)
    sf.write(str(out / "soundboard.wav"), board.astype(np.float32), sr, subtype="PCM_16")

    spf = sr // FPS
    frames = int(math.ceil(len(board) / spf))
    env = []
    for i in range(frames):
        seg = board[i * spf:(i + 1) * spf]
        env.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    mx = max(env) if env and max(env) > 0 else 1.0
    env = [round(min(1.0, (v / mx) ** 0.6), 3) for v in env]
    write_json(out / "soundboard-props.json", {
        "fps": FPS,
        "totalFrames": frames,
        "title": "Sound library",
        "subtitle": f"{len(items)} procedural sound effects · CC0 · 48 kHz mono · pipeline/sfxlib.py",
        "items": items,
        "env": env,
    })
    log(f"sound board: {len(items)} sounds, {len(board) / sr:.1f} s, {frames} frames")

    if a.zip:
        z = _abs(a.zip)
        z.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for entry, _x in rendered:
                zf.write(out / entry["file"], arcname=entry["file"])
            zf.write(out / "catalogue.json", arcname="catalogue.json")
            zf.writestr("LICENCE.txt", LICENCE_TXT)
        log(f"zip -> {z}")


if __name__ == "__main__":
    main()
