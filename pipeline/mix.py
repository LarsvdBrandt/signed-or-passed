"""Mix voice + music bed (ducked) + sfx, then two-pass loudnorm to -14 LUFS / -1 dBTP. Writes mix.wav per cut.

Sound effects come from scenes[].sfx (at the scene start + the house offset) and scenes[].sfxCues
([{sfx, atSec, gainDb}], atSec relative to the scene start), plus the brand intro / end card sounds.
"""
import csv
import json
import re
import subprocess

from common import (BRAND_INTRO_SFX, BRAND_OUTRO_SFX, ROOT, SFX_OFFSETS, add_warning, cut_dir, cuts, fail, load_spec,
                    log, read_json, slug_arg, work_dir, write_json)
from fetch_assets import download

TARGET_I = -14.0
TARGET_TP = -1.5  # a little headroom so the AAC encode stays below -1 dBTP
TARGET_LRA = 11.0
SFX_GAIN = 0.7


def pick_music(slug, mood):
    path = ROOT / "brand" / "music" / "licenses.csv"
    rows = []
    if path.exists():
        with open(path, newline="", encoding="utf-8") as f:
            rows = [r for r in csv.DictReader(f) if (r.get("url") or "").strip()]
    if not rows:
        add_warning(slug, "brand/music/licenses.csv has no tracks: rendered without music")
        return None
    match = [r for r in rows if (r.get("mood") or "").strip().lower() == (mood or "").strip().lower()]
    if not match:
        add_warning(slug, f"no music track with mood '{mood}': using '{rows[0].get('title')}'")
    row = (match or rows)[0]
    name = (row.get("file") or "").strip() or re.sub(r"[^A-Za-z0-9._-]", "_", row["url"].split("/")[-1])
    dest = ROOT / "build" / "music" / name
    if not dest.exists():
        download(row["url"].strip(), dest)
    write_json(work_dir(slug) / "music.json", row)
    return dest


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(p.stderr[-4000:])
        fail(f"ffmpeg failed: {' '.join(cmd[:6])} ...")
    return p


def measure(path):
    p = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
             f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    if not m:
        fail("could not parse loudnorm output")
    return json.loads(m.group(0))


def sfx_events(timing, cues=None):
    """(name, seconds, gainDb) for every sound effect: scene sfx, scene sfxCues, brand intro / end card sounds."""
    cues = cues or {}
    total = float(timing["totalSec"])
    events = []
    for sc in timing["scenes"]:
        name = sc.get("sfx")
        if name:
            events.append((name, sc["start"] + SFX_OFFSETS.get(name, 0.0), 0.0))
        for cue in cues.get(sc["id"]) or []:
            if not cue.get("sfx"):
                continue
            events.append((cue["sfx"], sc["start"] + float(cue.get("atSec") or 0.0), float(cue.get("gainDb") or 0.0)))
    intro = float(timing.get("introSec") or 0)
    outro = float(timing.get("outroSec") or 0)
    if intro > 0:
        events += [(n, off, 0.0) for n, off in BRAND_INTRO_SFX if off < intro]
    if outro > 0:
        events += [(n, total - outro + off, 0.0) for n, off in BRAND_OUTRO_SFX]
    return [(n, max(0.0, t), g) for n, t, g in events if t < total]


def mix_cut(slug, cut, music):
    d = cut_dir(slug, cut["name"])
    timing = read_json(d / "timing.json")
    total = timing["totalSec"]
    cues = {sc["id"]: sc.get("sfxCues") or [] for sc in cut["scenes"]}
    sfx_dir = ROOT / "build" / "sfx"
    inputs = ["-i", str(d / "voice.wav")]
    graph = [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={total},atrim=0:{total},asplit=2[vmix][vkey]"]
    mix_labels = ["[vmix]"]
    idx = 1
    for name, at, gain_db in sfx_events(timing, cues):
        f = sfx_dir / f"{name}.wav"
        if not f.exists():
            fail(f"missing sfx {f}; run sfx.py --slug {slug} first")
        ms = int(round(at * 1000))
        vol = SFX_GAIN * (10 ** (gain_db / 20.0))
        inputs += ["-i", str(f)]
        graph.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume={vol:.4f},adelay={ms}:all=1[s{idx}]")
        mix_labels.append(f"[s{idx}]")
        idx += 1
    if music:
        inputs += ["-stream_loop", "-1", "-i", str(music)]
        fade_st = max(0.0, total - 2.5)
        graph.append(
            f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total},asetpts=N/SR/TB,volume=0.22,"
            f"afade=t=in:d=1.5,afade=t=out:st={fade_st}:d=2.5[mus]")
        graph.append("[mus][vkey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck]")
        mix_labels.append("[duck]")
        idx += 1
    else:
        graph.append("[vkey]anullsink")
    graph.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0:duration=first,atrim=0:{total}[pre]")
    premix = d / "premix.wav"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-filter_complex", ";".join(graph),
         "-map", "[pre]", "-ar", "48000", "-c:a", "pcm_s16le", str(premix)])
    m = measure(premix)
    ln = (f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:measured_I={m['input_i']}:"
          f"measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
          f"offset={m['target_offset']}:linear=true")
    out = d / "mix.wav"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(premix), "-af", ln,
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(out)])
    after = measure(out)
    log(f"mix {cut['name']}: {total:.2f}s, {idx - 1} extra input(s), music={'yes' if music else 'no'}, "
        f"loudness {after['input_i']} LUFS, true peak {after['input_tp']} dBTP")


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    music = pick_music(args.slug, (spec.get("music") or {}).get("mood"))
    for cut in cuts(spec):
        mix_cut(args.slug, cut, music)


if __name__ == "__main__":
    main()
