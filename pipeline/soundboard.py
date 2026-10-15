"""Render the procedural sound library and build the sound-board preview.

  python pipeline/soundboard.py --out build/sfx-lib --zip build/0000-sample/out/sfx-library.zip \
      [--recorded build/sfx-lib/recorded-catalogue.json]

Writes <out>/wav/*.wav and <out>/catalogue.json (pipeline/sfxlib.py), <out>/soundboard.wav (every sound in a row)
and <out>/soundboard-props.json (input props of the Remotion composition SoundBoard), plus an optional zip with all
WAVs, the catalogue and a licence note. With --recorded, the CC0 / PD recordings fetched by pipeline/fetch_sfx.py
(<out>/recorded/*.wav) are appended to the board and the zip (folder recorded/ + CREDITS.txt).
CI muxes the SoundBoard render with soundboard.wav into sound-board.mp4.
"""
import argparse
import math
import zipfile
from pathlib import Path

import numpy as np
import soundfile as sf

import sfxlib
from common import ROOT, log, read_json, write_json

FPS = 30
LEAD = 0.8
GAP = 0.7
TAIL = 0.6

LICENCE_TXT = """Signed or Passed factory - sound library

wav/       Every sound in this folder was synthesised from scratch by pipeline/sfxlib.py (numpy oscillators and
           noise, fixed seeds). No recordings, samples or third-party material are used.
           Licence: CC0 1.0 Universal (public domain dedication). No attribution required.

recorded/  Real recordings from Wikimedia Commons that are CC0 or Public Domain (licence verified live via the
           MediaWiki API by pipeline/fetch_sfx.py). See recorded/CREDITS.txt and recorded-catalogue.json.

Everything in this archive is free for any use, including monetised YouTube videos.
"""


def _abs(p):
    p = Path(p)
    return p if p.is_absolute() else ROOT / p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="build/sfx-lib")
    ap.add_argument("--zip", default="")
    ap.add_argument("--recorded", default="", help="recorded-catalogue.json written by pipeline/fetch_sfx.py")
    a = ap.parse_args()
    out = _abs(a.out)
    out.mkdir(parents=True, exist_ok=True)

    rendered = sfxlib.render_all(out)
    sr = sfxlib.SR
    board_items = []
    for entry, x in rendered:
        meta = dict(entry)
        meta["credit"] = "procedural - CC0 - pipeline/sfxlib.py"
        board_items.append((meta, np.asarray(x, dtype=np.float64)))

    recorded = []
    cat_path = _abs(a.recorded) if a.recorded else None
    if cat_path is not None and cat_path.exists():
        cat = read_json(cat_path)
        for e in cat.get("sounds", []):
            p = out / e["file"]
            if not p.exists():
                log(f"WARNING: recorded sound missing: {p}")
                continue
            x, file_sr = sf.read(str(p), dtype="float64")
            if x.ndim > 1:
                x = x.mean(axis=1)
            if file_sr != sr:
                log(f"WARNING: {p} has {file_sr} Hz, expected {sr}; skipped")
                continue
            meta = dict(e)
            meta["credit"] = f"{e.get('author', '?')} - {e.get('licence', '?')} - Wikimedia Commons"
            board_items.append((meta, x))
            recorded.append(e)
    elif a.recorded:
        log(f"WARNING: no recorded catalogue at {cat_path}; board has procedural sounds only")

    lead = np.zeros(int(LEAD * sr))
    parts = [lead]
    cursor = len(lead)
    items = []
    for meta, x in board_items:
        start = cursor
        parts.append(x)
        cursor += len(x)
        end = cursor
        gap = np.zeros(int(GAP * sr))
        parts.append(gap)
        cursor += len(gap)
        items.append({
            "name": meta["name"],
            "category": meta.get("category", ""),
            "description": meta.get("description", ""),
            "file": meta.get("file", f"wav/{meta['name']}.wav"),
            "credit": meta.get("credit", ""),
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
    subtitle = f"{len(rendered)} procedural sounds (CC0)"
    if recorded:
        subtitle += f" + {len(recorded)} recordings (CC0 / PD, Wikimedia Commons)"
    subtitle += " - 48 kHz mono"
    write_json(out / "soundboard-props.json", {
        "fps": FPS,
        "totalFrames": frames,
        "title": "Sound library",
        "subtitle": subtitle,
        "items": items,
        "env": env,
    })
    log(f"sound board: {len(items)} sounds ({len(recorded)} recorded), {len(board) / sr:.1f} s, {frames} frames")

    if a.zip:
        z = _abs(a.zip)
        z.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for entry, _x in rendered:
                zf.write(out / entry["file"], arcname=entry["file"])
            zf.write(out / "catalogue.json", arcname="catalogue.json")
            for e in recorded:
                zf.write(out / e["file"], arcname=e["file"])
            if recorded:
                zf.write(cat_path, arcname="recorded-catalogue.json")
                credits = out / "recorded" / "CREDITS.txt"
                if credits.exists():
                    zf.write(credits, arcname="recorded/CREDITS.txt")
            zf.writestr("LICENCE.txt", LICENCE_TXT)
        log(f"zip -> {z}")


if __name__ == "__main__":
    main()
