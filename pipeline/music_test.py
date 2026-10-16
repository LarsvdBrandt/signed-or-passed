"""MIX-3 listening board: 4 music styles under the same 60 s of a rendered production, at the MIX-1 levels.

python pipeline/music_test.py --slug <slug> [--out DIR]   (after mix.py and the render of video.mp4)
Window: from 40 s before the question (pressure) to 20 s after it (question, silence, reveal, aftermath start);
the voice, sfx and timing of that window are cut from the real main cut, then every style is mixed by mix.mix_cut:
  A classic     the old musicgen generator at the new levels
  B underscore  the documentary underscore (channel default)
  C rhythmic    B with more drums
  D cinematic   B with more strings, slower
Writes music-test-<X>-<style>.mp3 / .mp4 (the video segment of video.mp4 with that mix) and music-test.json (the
mix-report numbers per style) to build/<slug>/out/music-test (ci/render-slug.sh publishes them to release
'music-test' when ci/music-test.txt lists the slug).
"""
import json
import shutil
import subprocess
from pathlib import Path

import mix
from common import cut_dir, cuts, load_spec, log, out_dir, read_json, slug_arg, write_json

STYLES = [("A", "classic"), ("B", "underscore"), ("C", "rhythmic"), ("D", "cinematic")]
WINDOW_SEC, LEAD_SEC = 60.0, 40.0


def window(timing):
    scenes = timing["scenes"]
    q = next((s for s in scenes if s.get("kind") == "question" and not s.get("coldOpen")), None)
    total = float(timing["totalSec"])
    anchor = float(q["start"]) if q else total / 2
    start = max(0.0, min(anchor - LEAD_SEC, total - WINDOW_SEC))
    return start, min(total, start + WINDOW_SEC)


def clip_timing(timing, a, b):
    """timing.json of the window [a, b], shifted to start at 0 (no intro / outro in the window)."""
    sc = []
    for s in timing["scenes"]:
        st, en = float(s["start"]), float(s["end"])
        if en <= a or st >= b:
            continue
        sc.append(dict(s, start=max(0.0, st - a), end=min(b, en) - a))
    t = {k: v for k, v in timing.items() if k not in ("scenes", "breaths", "introSec", "introAtSec", "outroSec")}
    t.update(scenes=sc, totalSec=b - a,
             breaths=[dict(x, at=float(x["at"]) - a) for x in timing.get("breaths") or [] if a <= float(x["at"]) < b])
    if timing.get("revealAtSec") is not None:
        t["revealAtSec"] = float(timing["revealAtSec"]) - a
    return t


def run(cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def main():
    args = slug_arg(lambda p: p.add_argument("--out", default=None))
    slug = args.slug
    spec = load_spec(slug)
    main_cut = next(c for c in cuts(spec) if c["name"] == "main")
    src = cut_dir(slug, "main")
    timing = read_json(src / "timing.json")
    a, b = window(timing)
    out = out_dir(slug) / "music-test" if not args.out else Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    video = out_dir(slug) / "video.mp4"
    if (src.parent / "music.json").exists():  # plan_music / mix_cut rewrite music.json: keep the production's own
        shutil.copy(src.parent / "music.json", src.parent / "music.json.bak")
    base = {**mix.plan_music(slug, dict(spec, music=dict(spec.get("music") or {}, source="generated"))),
            "sfxDensity": spec.get("sfxDensity") or "mid", "sound": mix.sound_opts(spec), "mix": mix.ml.mix_opts(spec)}
    results = {"slug": slug, "windowSec": [round(a, 2), round(b, 2)], "styles": {}}
    orig_bed = mix.underscore.bed

    def main_seed_bed(timing_, mood, _seed, *rest, **kw):  # B/C/D share the key and tempo of the production's bed
        return orig_bed(timing_, mood, f"{slug}:main", *rest, **kw)

    mix.underscore.bed = main_seed_bed
    for letter, style in STYLES:
        name = f"musictest-{style}"
        d = cut_dir(slug, name)
        write_json(d / "timing.json", clip_timing(timing, a, b))
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}",
             "-i", str(src / "voice.wav"), str(d / "voice.wav")])
        if (src / "beats.json").exists():
            write_json(d / "beats.json", [dict(x, sec=float(x["sec"]) - a) for x in read_json(src / "beats.json")
                                          if a <= float(x["sec"]) < b])
        cut = dict(main_cut, name=name)
        mix.mix_cut(slug, cut, dict(base, style=style, stingers=base.get("stingers", True)))
        stem = f"music-test-{letter}-{style}"
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(d / "mix.wav"), "-c:a", "libmp3lame",
             "-b:a", "192k", str(out / f"{stem}.mp3")])
        if video.exists():
            run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}",
                 "-i", str(video), "-i", str(d / "mix.wav"), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264",
                 "-preset", "veryfast", "-crf", "22", "-c:a", "aac", "-b:a", "192k", "-shortest",
                 "-movflags", "+faststart", str(out / f"{stem}.mp4")])
        rep = read_json(d / "mix-report.json")
        u = read_json(d / "underscore.json") if (d / "underscore.json").exists() else {}
        results["styles"][letter] = {"style": style, "bpm": u.get("bpm"), "key": u.get("key"),
                                     **{k: rep.get(k) for k in ("voiceToMusicDb", "voiceToSfxShortTermDb", "musicLufs",
                                                                "musicUnderVoiceShortTermLufs", "musicOpenShortTermLufs",
                                                                "mixLufs", "truePeakDb")}}
        log(f"music test {letter} {style}: voice-music {rep.get('voiceToMusicDb')} dB, music {rep.get('musicLufs')} LUFS")
    bak = src.parent / "music.json.bak"
    if bak.exists():
        shutil.move(bak, src.parent / "music.json")  # metadata.py keeps the production's own music info
    write_json(out / "music-test.json", results)
    print(json.dumps(results, indent=1))


if __name__ == "__main__":
    main()
