"""Voice library board (VOICES-2): one sample sentence per voice of brand/voices.json.

  python pipeline/voice_samples.py --out build/voice-lib [--zip build/0000-sample/out/voice-samples.zip] [--only kokoro|piper]

Writes <out>/wav/<voice>.wav, <out>/catalogue.json, <out>/board.wav and <out>/board-props.json (input props of the
Remotion composition SoundBoard; CI muxes it into voice-samples.mp4). A voice that fails is skipped and listed in
catalogue.json 'failed' (the board still renders). Exits non-zero only when no voice worked.
"""
import argparse
import math
import sys
import traceback
import zipfile
from pathlib import Path

import numpy as np
import soundfile as sf

import tts
from common import ROOT, log, write_json

FPS = 30
SR = tts.SR


def _abs(p):
    p = Path(p)
    return p if p.is_absolute() else ROOT / p


def sample_text(cat, v):
    lang = v["lang"].split("-")[0]
    tpl = cat["samples"].get(lang) or cat["samples"]["en"]
    name = v["id"].split("_", 1)[-1].split("-")[1] if v["engine"] == "piper" else v["id"].split("_", 1)[-1]
    return tpl.replace("{name}", name.replace("_", " ").title())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="build/voice-lib")
    ap.add_argument("--zip", default="")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    out = _abs(a.out)
    (out / "wav").mkdir(parents=True, exist_ok=True)
    cat = tts.catalogue()
    voices = [v for v in cat["voices"] if not a.only or v["engine"] == a.only]
    engines = {}
    entries, failed = [], []
    for v in voices:
        try:
            key = (v["engine"], v["id"][0] if v["engine"] == "kokoro" else v["id"])
            if v["engine"] == "kokoro":
                if key not in engines:
                    engines[key] = tts.KokoroEngine(v["id"])
                eng = engines[key]
                eng.voice = v["id"]
            else:
                eng = tts.PiperEngine(v["id"], 0 if v.get("speakers") else None)
            text = sample_text(cat, v)
            speed = eng.default_speed
            audio = eng.synth(text, speed)
            f = f"wav/{v['id']}.wav"
            sf.write(str(out / f), audio, SR, subtype="PCM_16")
            entries.append({"name": v["id"], "category": f"{v['engine']} · {v['lang']}",
                            "description": f"{text}  [{v.get('gender', '?')}, grade {v.get('grade', '-')}]",
                            "file": f, "licence": v.get("licence", ""), "attribution": v.get("attribution", "")})
            log(f"voice {v['id']}: {len(audio) / SR:.1f} s")
        except BaseException as e:  # SystemExit from fail() included: skip the voice, keep going
            traceback.print_exc()
            failed.append({"id": v["id"], "error": f"{type(e).__name__}: {e}"[:300]})
            log(f"voice {v['id']}: FAILED ({e})")
    write_json(out / "catalogue.json", {"sampleRate": SR, "voices": entries, "failed": failed})
    if not entries:
        sys.exit("no voice could be synthesised")

    lead, gap, tail = 0.8, 0.7, 0.6
    parts = [np.zeros(int(lead * SR), dtype=np.float32)]
    cursor = len(parts[0])
    items = []
    for e in entries:
        x, _sr = sf.read(str(out / e["file"]), dtype="float32")
        if x.ndim > 1:
            x = x.mean(axis=1)
        start = cursor
        parts.append(x)
        cursor += len(x)
        items.append({"name": e["name"], "category": e["category"], "description": e["description"], "file": e["file"],
                      "credit": e["licence"], "startFrame": int(round(start / SR * FPS)),
                      "endFrame": int(round(cursor / SR * FPS))})
        g = np.zeros(int(gap * SR), dtype=np.float32)
        parts.append(g)
        cursor += len(g)
    parts.append(np.zeros(int(tail * SR), dtype=np.float32))
    board = np.concatenate(parts)
    peak = float(np.max(np.abs(board))) or 1.0
    board = (board * min(1.0, 0.9 / peak)).astype(np.float32)
    sf.write(str(out / "board.wav"), board, SR, subtype="PCM_16")
    spf = SR // FPS
    frames = int(math.ceil(len(board) / spf))
    env = []
    for i in range(frames):
        seg = board[i * spf:(i + 1) * spf].astype(np.float64)
        env.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    mx = max(env) if env and max(env) > 0 else 1.0
    env = [round(min(1.0, (v / mx) ** 0.6), 3) for v in env]
    n_k = sum(1 for e in entries if e["category"].startswith("kokoro"))
    write_json(out / "board-props.json", {
        "fps": FPS, "totalFrames": frames, "title": "Voice library",
        "subtitle": f"{n_k} Kokoro + {len(entries) - n_k} Piper voices - licence-checked (brand/voices.json)",
        "items": items, "env": env,
    })
    log(f"voice board: {len(entries)} voices ({len(failed)} failed), {len(board) / SR:.1f} s -> {out}")
    if a.zip:
        z = _abs(a.zip)
        z.parent.mkdir(parents=True, exist_ok=True)
        lines = ["Signed or Passed factory - voice samples", "",
                 "Generated with Kokoro-82M (Apache-2.0) and Piper voices whose training data is CC0, public domain or",
                 "CC BY 4.0 (see brand/voices.json). Voices with an attribution line need that credit in the description.", ""]
        lines += [f"{e['name']}: {e['licence']}" + (f" - {e['attribution']}" if e["attribution"] else "") for e in entries]
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for e in entries:
                zf.write(out / e["file"], arcname=e["file"])
            zf.write(out / "catalogue.json", arcname="catalogue.json")
            zf.write(ROOT / "brand" / "voices.json", arcname="voices.json")
            zf.writestr("LICENCES.txt", "\n".join(lines) + "\n")
        log(f"zip -> {z}")


if __name__ == "__main__":
    main()
