"""Kokoro TTS: one clip per sentence, laid out per scene; writes voice.wav + timing.json per cut.

Long main cuts get INTRO_SEC of silence before the first scene (brand intro sting) and OUTRO_SEC after the last
scene (end card); both are recorded in timing.json as introSec / outroSec.
"""
import numpy as np
import soundfile as sf

from common import (DEFAULT_SPEED, END_TAIL, FIRST_LEAD, FPS, INTRO_SEC, OUTRO_SEC, SCENE_LEAD, SCENE_TAIL,
                    SENTENCE_GAP, VERDICT_MIN, branded, cut_dir, cuts, fail, load_spec, log, slug_arg,
                    split_sentences, write_json)

SR = 24000


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


def synth(pipe, text, voice, speed):
    chunks = []
    for result in pipe(text, voice=voice, speed=speed, split_pattern=None):
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


def snap(t):
    return round(t * FPS) / FPS


def layout(pipe, scenes, voice, speed, intro=0.0, outro=0.0):
    t = snap(intro)
    out = []
    clips = []
    for i, sc in enumerate(scenes):
        start = t
        cur = start + (FIRST_LEAD if i == 0 else SCENE_LEAD)
        sents = []
        for text in split_sentences(sc["narration"]):
            a = synth(pipe, text, voice, speed)
            dur = len(a) / SR
            sents.append({"text": text, "start": round(cur, 3), "end": round(cur + dur, 3)})
            clips.append((cur, a))
            cur += dur + SENTENCE_GAP
        voice_end = sents[-1]["end"] if sents else start
        end = voice_end + SCENE_TAIL
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
    voice = v.get("voice", "bm_george")
    speed = float(v.get("speed", DEFAULT_SPEED))
    from kokoro import KPipeline  # heavy import, keep it here

    pipe = KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M")
    for cut in cuts(spec):
        intro = INTRO_SEC if branded(cut) else 0.0
        outro = OUTRO_SEC if branded(cut) else 0.0
        log(f"TTS {args.slug}/{cut['name']} voice={voice} speed={speed} intro={intro}s outro={outro}s")
        scenes, clips, total = layout(pipe, cut["scenes"], voice, speed, intro, outro)
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
            "introSec": intro, "outroSec": outro, "speed": speed, "scenes": scenes,
        })
        log(f"  total {total:.2f}s -> {d / 'voice.wav'}")


if __name__ == "__main__":
    main()
