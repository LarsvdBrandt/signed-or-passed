"""TTS: one clip per sentence, laid out per scene; writes voice.wav + timing.json per cut.

Engines (brand/voices.json, docs/library/voices.md):
  kokoro  spec.voice.voice = a Kokoro v1.0 voice id (bm_george, af_heart, ef_dora, ...)
  piper   spec.voice.voice = a Piper voice id listed in brand/voices.json (nl_BE-rdh-medium, ...); piper-tts is
          installed on first use and the model is downloaded from Hugging Face (rhasspy/piper-voices)

Narration controls: '[pause 0.5]' anywhere in a narration inserts 0.5 s of silence ('[PAUSE]' = 0.5 s; the marker is
never spoken and never shown in captions); '**word**' marks an emphasised word (the asterisks are stripped before TTS,
build_props turns it into a kinetic keyword); scenes[].voiceSpeed overrides spec.voice.speed for one scene.
Pace (RETENTION-5): default speed 1.15, every clip is trimmed of leading/trailing silence, 0.25 s between sentences,
0.35 s at scene boundaries (common.SCENE_TAIL + SCENE_LEAD); longer pauses only with [pause N].

Long main cuts get INTRO_SEC of silence before the first scene (brand intro sting) and OUTRO_SEC after the last
scene (end card); both are recorded in timing.json as introSec / outroSec.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from common import (DEFAULT_SPEED, END_TAIL, FIRST_LEAD, FPS, INTRO_SEC, OUTRO_SEC, ROOT, SCENE_LEAD, SCENE_TAIL,
                    SENTENCE_GAP, VERDICT_MIN, branded, cut_dir, cuts, fail, load_spec, log, slug_arg,
                    split_sentences, strip_emphasis, write_json)

SR = 24000
PAUSE_RE = re.compile(r"\[\s*pause(?:\s+([0-9]*\.?[0-9]+)\s*s?)?\s*\]", re.I)
PAUSE_SPLIT_RE = re.compile(r"\[\s*pause(?:\s+(?:[0-9]*\.?[0-9]+)\s*s?)?\s*\]", re.I)
BARE_PAUSE_SEC = 0.5
PIPER_PACKAGE = "piper-tts==1.3.0"
PIPER_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/{path}/{id}.onnx"
PIPER_CACHE = Path(os.path.expanduser("~/.cache/huggingface/piper"))


def catalogue():
    with open(ROOT / "brand" / "voices.json", encoding="utf-8") as f:
        return json.load(f)


def clean_text(text):
    """Narration without [pause N] markers (for captions and timing)."""
    return re.sub(r"\s+", " ", PAUSE_SPLIT_RE.sub(" ", strip_emphasis(text))).strip()


def to_numpy(audio):
    if audio is None:
        return None
    if hasattr(audio, "detach"):
        audio = audio.detach().cpu().numpy()
    return np.asarray(audio, dtype=np.float32).reshape(-1)


def trim(a, thr=0.004, margin=0.03):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    m = int(margin * SR)
    return a[max(0, idx[0] - m): min(len(a), idx[-1] + m)]


def resample(a, sr_from):
    if sr_from == SR or len(a) == 0:
        return a.astype(np.float32)
    n = int(round(len(a) * SR / float(sr_from)))
    x_old = np.arange(len(a), dtype=np.float64) / sr_from
    x_new = np.arange(n, dtype=np.float64) / SR
    return np.interp(x_new, x_old, a.astype(np.float64)).astype(np.float32)


class KokoroEngine:
    name = "kokoro"
    default_speed = DEFAULT_SPEED

    def __init__(self, voice, speaker=None):
        from kokoro import KPipeline  # heavy import, keep it here
        self.voice = voice
        self.pipe = KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M")

    def synth(self, text, speed):
        chunks = []
        for result in self.pipe(text, voice=self.voice, speed=speed, split_pattern=None):
            audio = getattr(result, "audio", None)
            if audio is None:
                try:
                    audio = result[2]
                except Exception:
                    audio = None
            a = to_numpy(audio)
            if a is not None and len(a):
                chunks.append(a)
        if not chunks:
            fail(f"Kokoro produced no audio for: {text!r}")
        return trim(np.concatenate(chunks))


def ensure_piper():
    try:
        import piper  # noqa: F401
    except ImportError:
        log(f"installing {PIPER_PACKAGE} ...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", PIPER_PACKAGE], check=True)


def download(url, dest):
    import requests
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    tmp.rename(dest)


class PiperEngine:
    name = "piper"
    default_speed = 1.0

    def __init__(self, voice, speaker=None):
        entry = next((v for v in catalogue()["voices"] if v["id"] == voice and v["engine"] == "piper"), None)
        if not entry:
            fail(f"Piper voice '{voice}' is not in brand/voices.json (only licence-checked voices may be used)")
        ensure_piper()
        from piper import PiperVoice
        model = PIPER_CACHE / f"{voice}.onnx"
        config = PIPER_CACHE / f"{voice}.onnx.json"
        url = PIPER_URL.format(path=entry["path"], id=voice)
        if not model.exists():
            log(f"downloading {url}")
            download(url, model)
        if not config.exists():
            download(url + ".json", config)
        self.voice = PiperVoice.load(str(model), config_path=str(config))
        self.speaker = speaker

    def synth(self, text, speed):
        from piper import SynthesisConfig
        cfg = SynthesisConfig(length_scale=1.0 / max(0.25, float(speed)))
        if self.speaker is not None:
            cfg.speaker_id = int(self.speaker)
        data = []
        sr = 22050
        for chunk in self.voice.synthesize(text, syn_config=cfg):
            sr = chunk.sample_rate
            data.append(chunk.audio_int16_bytes)
        if not data:
            fail(f"Piper produced no audio for: {text!r}")
        a = np.frombuffer(b"".join(data), dtype=np.int16).astype(np.float32) / 32768.0
        return trim(resample(a, sr))


def make_engine(engine, voice, speaker=None):
    if engine == "piper":
        return PiperEngine(voice, speaker)
    if engine in ("kokoro", None, ""):
        return KokoroEngine(voice, speaker)
    fail(f"unknown TTS engine '{engine}' (kokoro | piper)")


def speak(engine, text, speed):
    """Audio of one sentence with [pause N] markers turned into silence; (audio, offset of first sound, end of last sound)."""
    parts = PAUSE_RE.split(text)
    pieces = []
    t = 0.0
    first = last = None
    for j, part in enumerate(parts):
        if j % 2 == 1:
            n = int(float(part if part else BARE_PAUSE_SEC) * SR)
            pieces.append(np.zeros(n, dtype=np.float32))
            t += n / SR
            continue
        part = strip_emphasis(part or "").strip()
        if not re.search(r"\w", part):
            continue
        a = engine.synth(part, speed)
        if first is None:
            first = t
        pieces.append(a)
        t += len(a) / SR
        last = t
    if first is None:
        return np.zeros(int(t * SR), dtype=np.float32), None, None, t
    return np.concatenate(pieces), first, last, t


def snap(t):
    return round(t * FPS) / FPS


def layout(engine, scenes, speed, intro=0.0, outro=0.0):
    t = snap(intro)
    out = []
    clips = []
    for i, sc in enumerate(scenes):
        start = t
        sp = float(sc.get("voiceSpeed") or speed)
        cur = start + (FIRST_LEAD if i == 0 else SCENE_LEAD)
        sents = []
        for text in split_sentences(sc["narration"]):
            a, first, last, dur = speak(engine, text, sp)
            if first is None:  # only a pause
                cur += dur
                continue
            clips.append((cur, a))
            sents.append({"text": clean_text(text), "start": round(cur + first, 3), "end": round(cur + last, 3)})
            cur += dur + SENTENCE_GAP
        voice_end = sents[-1]["end"] if sents else start
        end = max(voice_end, cur - SENTENCE_GAP if sents else cur) + SCENE_TAIL
        if sc["kind"] == "question":
            end += float(sc["visual"].get("holdSec", 3))
        if sc["kind"] == "verdict":
            end = max(end, start + VERDICT_MIN)
        if sc.get("minDurationSec"):
            end = max(end, start + float(sc["minDurationSec"]))
        if i == len(scenes) - 1:
            end += END_TAIL
        end = snap(end)
        out.append({
            "id": sc["id"], "kind": sc["kind"], "start": round(start, 3), "end": round(end, 3),
            "voiceStart": sents[0]["start"] if sents else start, "voiceEnd": voice_end,
            "sfx": sc.get("sfx"), "sentences": sents,
        })
        log(f"  scene {sc['id']:<8} {sc['kind']:<12} {start:7.2f} -> {end:7.2f}")
        t = end
    total = snap(t + outro)
    return out, clips, total


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    v = spec["voice"]
    engine_name = v.get("engine") or "kokoro"
    voice = v.get("voice", "bm_george")
    engine = make_engine(engine_name, voice, v.get("speaker"))
    speed = float(v.get("speed") or engine.default_speed)
    for cut in cuts(spec):
        intro = INTRO_SEC if branded(cut) else 0.0
        outro = OUTRO_SEC if branded(cut) else 0.0
        log(f"TTS {args.slug}/{cut['name']} engine={engine_name} voice={voice} speed={speed} intro={intro}s outro={outro}s")
        scenes, clips, total = layout(engine, cut["scenes"], speed, intro, outro)
        buf = np.zeros(int(total * SR) + SR, dtype=np.float32)
        for start, a in clips:
            i = int(start * SR)
            buf[i:i + len(a)] += a[: max(0, len(buf) - i)]
        buf = buf[: int(round(total * SR))]
        peak = float(np.max(np.abs(buf))) if len(buf) else 0.0
        if peak > 0.99:
            buf = buf * (0.99 / peak)
        d = cut_dir(args.slug, cut["name"])
        sf.write(str(d / "voice.wav"), buf, SR, subtype="PCM_16")
        write_json(d / "timing.json", {
            "fps": FPS, "sampleRate": SR, "format": cut["format"], "totalSec": round(total, 3),
            "introSec": intro, "outroSec": outro, "engine": engine_name, "voice": voice, "speed": speed,
            "scenes": scenes,
        })
        log(f"  total {total:.2f}s -> {d / 'voice.wav'}")


if __name__ == "__main__":
    main()
