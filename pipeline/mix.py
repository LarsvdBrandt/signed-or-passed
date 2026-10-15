"""Mix voice + music bed (ducked) + sfx + music stingers, then two-pass loudnorm to -14 LUFS / -1 dBTP.
Writes mix.wav per cut.

Sound effects come from scenes[].sfx (at the scene start + the house offset) and scenes[].sfxCues
([{sfx, atSec, gainDb}], atSec relative to the scene start), plus the brand intro / end card sounds.

Music (spec.music, docs/library/music.md):
  {mood, era?, source?: auto | generated | library | none, stingers?: true}
  generated  procedural bed from pipeline/musicgen.py (CC0), exactly as long as the cut (timing.json),
             seed = slug + cut so a re-render sounds the same
  library    first track of brand/music/licenses.csv with that mood, else a CC0 / public-domain recording from
             brand/music/manifest.csv (licence re-verified on Wikimedia Commons at render time), credited in the
             description; music.track picks one manifest file explicitly
  auto       licenses.csv track when one with that mood exists, else generated (default). The manifest recordings
             are opt-in only (source library / track): public-domain classical recordings can draw false Content ID
             claims, the generated beds cannot.
  none       no music and no stingers
Stingers (musicgen.stinger) play at question scenes and verdict scenes (signed / passed) unless stingers is false.

Sound dynamics (RETENTION-4b, docs/library/retention.md):
  scenes[].musicEnergy  low | mid | high | drop | stop, sticky until the next scene that sets one ('mid' before the
                        first). Generated beds re-arrange their layers (musicdyn.bed_energy: layers in/out, filter
                        sweep up, 'drop' = filtered pad then the groove slams back in, 'stop' = silence); library
                        tracks follow a gain curve (LIBRARY_ENERGY_GAIN). No musicEnergy anywhere = legacy sections.
  spec.sound            {autoRisers: true, revealPauseSec: 0.6, verdictImpact: true}: a 2 s riser that ends at every
                        question scene and right before the reveal (common.reveal_index), music + sfx silent for
                        revealPauseSec before the reveal (tts.py holds the previous scene that long), impact_boom on
                        the verdict (and a softer one on a separate reveal scene).
"""
import csv
import json
import re
import subprocess
import urllib.parse
from pathlib import Path

import musicdyn
import musicgen
import numpy as np
import soundfile as sf
from common import (BRAND_OUTRO_SFX, COLD_OPEN_SFX, MUSIC_ENERGIES, RISER_LEAD_SEC, brand_intro_sfx, reveal_index,
                    sound_opts, ROOT, SFX_OFFSETS, add_warning, cut_dir, cuts, fail, load_spec,
                    log, read_json, slug_arg, work_dir, write_json)
from fetch_assets import download
from retention import beat_sfx_events

TARGET_I = -14.0
TARGET_TP = -1.5  # a little headroom so the AAC encode stays below -1 dBTP
TARGET_LRA = 11.0
SFX_GAIN = 0.7
LIBRARY_MUSIC_GAIN = 0.22   # commercial-loudness tracks
GENERATED_MUSIC_GAIN = 0.6  # musicgen beds are normalised to -20 dBFS RMS
STINGER_GAIN = 0.4
LIBRARY_ENERGY_GAIN = {"low": 0.55, "mid": 0.8, "high": 1.0, "drop": 0.3, "stop": 0.0}
RISER_GAIN_DB = -4.0
IMPACT_GAIN_DB = -2.0
REVEAL_IMPACT_GAIN_DB = -6.0
SILENCE_GUARD_SEC = 0.25  # sfx that would still ring into the silence before the reveal are dropped too

# free-text moods of the other agents -> musicgen moods
MOOD_ALIASES = {
    "suspense": "tense", "suspenseful": "tense", "tension": "tense", "dark": "tense", "thriller": "tense",
    "neutral": "curious", "calm": "curious", "light": "curious", "documentary": "curious", "inquisitive": "curious",
    "hopeful": "upbeat", "happy": "playful", "fun": "playful", "quirky": "playful", "energetic": "upbeat",
    "optimistic": "upbeat", "victory": "triumphant", "heroic": "triumphant", "success": "triumphant",
    "sad": "somber", "sombre": "somber", "melancholy": "somber", "regret": "somber", "tragic": "somber",
    "dramatic": "epic", "cinematic": "epic", "grand": "epic", "mystery": "mysterious", "eerie": "mysterious",
}


def resolve_mood(mood):
    m = str(mood or "curious").strip().lower()
    m = MOOD_ALIASES.get(m, m)
    return m if m in musicgen.MOODS else "curious"


def library_track(slug, mood, required):
    path = ROOT / "brand" / "music" / "licenses.csv"
    rows = []
    if path.exists():
        with open(path, newline="", encoding="utf-8") as f:
            rows = [r for r in csv.DictReader(f) if (r.get("url") or "").strip()]
    match = [r for r in rows if (r.get("mood") or "").strip().lower() == (mood or "").strip().lower()]
    if not match:
        if not required:
            return None
        if not rows:
            add_warning(slug, "music.source is 'library' but brand/music/licenses.csv has no tracks: using a generated bed")
            return None
        add_warning(slug, f"no library track with mood '{mood}': using '{rows[0].get('title')}'")
        match = rows
    row = match[0]
    name = (row.get("file") or "").strip() or re.sub(r"[^A-Za-z0-9._-]", "_", row["url"].split("/")[-1])
    dest = ROOT / "build" / "music" / name
    if not dest.exists():
        download(row["url"].strip(), dest)
    return row, dest


def manifest_track(slug, mood, track=None):
    """A CC0 / PD recording from brand/music/manifest.csv, licence verified via the MediaWiki API, trimmed from
    its `start`. Returns (credit_row, wav_path) or None (with a warning) so the caller falls back to generated."""
    path = ROOT / "brand" / "music" / "manifest.csv"
    if not path.exists():
        return None
    with open(path, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("url") or "").strip()]
    if not rows:
        return None
    if track:
        t = str(track).strip().lower()
        match = [r for r in rows if t in ((r.get("file") or "").lower(), (r.get("file") or "").lower().rsplit(".", 1)[0],
                                           (r.get("title") or "").lower())]
        if not match:
            add_warning(slug, f"music.track '{track}' is not in brand/music/manifest.csv: using a generated bed")
            return None
    else:
        gm = resolve_mood(mood)
        match = [r for r in rows if (r.get("mood") or "").strip().lower() == gm]
        if not match:
            add_warning(slug, f"no manifest recording with mood '{gm}': using '{rows[0].get('title')}'")
            match = rows
    row = match[0]
    title = "File:" + urllib.parse.unquote(row["source_page"].split("/wiki/File:", 1)[-1]).replace("_", " ")
    try:
        from fetch_sfx import verify
        url, lic, _artist = verify(title)
    except Exception as e:  # licence rejected or Commons unreachable: never use an unverified file
        add_warning(slug, f"music recording '{row.get('file')}' not used ({e}): using a generated bed")
        return None
    raw = ROOT / "build" / "music" / ("raw-" + row["file"])
    dest = ROOT / "build" / "music" / (row["file"].rsplit(".", 1)[0] + ".wav")
    if not dest.exists():
        if not raw.exists():
            download(url, raw)
        start = float(row.get("start") or 0)
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{start:.2f}", "-i", str(raw),
                        "-af", "afade=t=in:d=1.5", "-ac", "2", "-ar", "48000", str(dest)], check=True)
    log(f"music: manifest recording {row['file']} ({lic}, verified on Commons)")
    credit = {"title": row.get("title"), "artist": row.get("author"), "license": row.get("licence"),
              "attribution_text": row.get("attribution"), "source": row.get("source_page"), "url": url,
              "file": row.get("file"), "mood": row.get("mood")}
    return credit, dest


def plan_music(slug, spec):
    """{kind: library|generated|none, ...} and music.json for metadata.py."""
    m = spec.get("music") or {}
    source = str(m.get("source") or "auto").lower()
    mood = m.get("mood")
    stingers = m.get("stingers", True) is not False
    if source == "none":
        write_json(work_dir(slug) / "music.json", {"kind": "none"})
        return {"kind": "none", "stingers": False}
    track = m.get("track")
    if track and source == "auto":
        source = "library"
    if source == "library":
        found = None if track else library_track(slug, mood, required=False)
        if not found:
            found = manifest_track(slug, mood, track)
        if not found and not track:
            found = library_track(slug, mood, required=True)
        if found:
            row, dest = found
            write_json(work_dir(slug) / "music.json", dict(row, kind="library"))
            return {"kind": "library", "path": dest, "stingers": stingers}
    if source == "auto":
        found = library_track(slug, mood, required=False)
        if found:
            row, dest = found
            write_json(work_dir(slug) / "music.json", dict(row, kind="library"))
            return {"kind": "library", "path": dest, "stingers": stingers}
    gmood = resolve_mood(mood)
    era = musicgen.resolve_era(m.get("era"))
    if mood and gmood != str(mood).strip().lower() and str(mood).strip().lower() not in MOOD_ALIASES:
        add_warning(slug, f"music mood '{mood}' is not a musicgen mood: using '{gmood}'")
    info = {"kind": "generated", "mood": gmood, "era": era, "generator": "pipeline/musicgen.py", "licence": "CC0-1.0"}
    write_json(work_dir(slug) / "music.json", info)
    return dict(info, stingers=stingers)


def energy_changes(cut, timing):
    """[(seconds, energy)] from scenes[].musicEnergy (sticky; 'mid' before the first one), or [] when no scene sets one."""
    by_id = {sc["id"]: sc for sc in cut["scenes"]}
    out = []
    for t in timing["scenes"]:
        e = (by_id.get(t["id"]) or {}).get("musicEnergy")
        if e in MUSIC_ENERGIES and (not out or out[-1][1] != e):
            out.append((float(t["start"]), e))
    if out and out[0][0] > 0:
        out.insert(0, (0.0, "mid"))
    return out


def music_for_cut(slug, cut, plan, total, energies=None):
    if plan["kind"] == "library":
        return plan["path"], LIBRARY_MUSIC_GAIN
    if plan["kind"] == "generated":
        path = cut_dir(slug, cut["name"]) / "music-bed.wav"
        seed = f"{slug}:{cut['name']}"
        if energies:
            x = musicdyn.bed_energy(plan["mood"], plan["era"], total + 0.5, seed=seed, changes=energies)
            how = "energy curve " + " ".join(f"{e}@{t:.1f}" for t, e in energies)
        else:
            x = musicgen.bed(plan["mood"], plan["era"], total + 0.5, seed=seed)
            how = "sections"
        musicgen.write_wav(path, x)
        log(f"music {cut['name']}: generated bed {plan['mood']} / {plan['era']} ({total:.1f} s, {how})")
        return path, GENERATED_MUSIC_GAIN
    return None, 0.0


def music_curve(kind, energies, silence):
    """Breakpoints (xs, ys) in seconds of the music gain: library energy levels and the silence before the reveal
    (silence = (start, end) or None)."""
    xs, ys = [0.0], [1.0]
    if kind == "library" and energies:
        prev = energies[0][1]
        xs, ys = [0.0], [LIBRARY_ENERGY_GAIN[prev]]
        for t, e in energies[1:]:
            t = max(t, xs[-1] + 0.001)
            xs += [t, t + musicdyn._gain_ramp(prev, e)]
            ys += [LIBRARY_ENERGY_GAIN[prev], LIBRARY_ENERGY_GAIN[e]]
            prev = e
    if not silence:
        return xs, ys
    a, b = silence
    mx, my = [max(0.0, a - 0.08), a, b, b + 0.04], [1.0, 0.0, 0.0, 1.0]  # fully silent from a to b
    ux = sorted(set(xs) | set(mx))
    uy = [float(np.interp(x, xs, ys)) * float(np.interp(x, mx, my, left=1.0, right=1.0)) for x in ux]
    return ux, uy


def gain_expr(xs, ys):
    """ffmpeg volume expression (eval=frame) of a piecewise-linear curve; None when it is 1 everywhere."""
    if all(abs(y - 1.0) < 1e-6 for y in ys):
        return None
    terms = [f"{ys[0]:.4f}"]
    for i in range(len(xs) - 1):
        dy = ys[i + 1] - ys[i]
        if abs(dy) < 1e-6:
            continue
        dx = max(0.001, xs[i + 1] - xs[i])
        terms.append(f"{dy:+.4f}*clip((t-{xs[i]:.3f})/{dx:.3f},0,1)")
    return "".join(terms)


def auto_sound_events(timing, opts):
    """(sfx name, seconds, gainDb, trim start) of the automatic risers and impacts, and the silence window (or None)."""
    scenes = timing["scenes"]
    ri = reveal_index(scenes)
    pause = float(timing.get("revealPauseSec") or 0.0) if ri is not None else 0.0
    silence = (scenes[ri]["start"] - pause, scenes[ri]["start"]) if ri is not None and pause > 0 else None
    intro_at, intro = float(timing.get("introAtSec") or 0), float(timing.get("introSec") or 0)
    events = []
    if opts.get("autoRisers", True):
        riser = ROOT / "build" / "sfx" / "riser.wav"
        trim = max(0.0, sf.info(str(riser)).duration - RISER_LEAD_SEC) if riser.exists() else 0.0
        for i, sc in enumerate(scenes):
            if sc.get("coldOpen") or not (sc["kind"] == "question" or i == ri):
                continue
            end = sc["start"] - (pause if i == ri else 0.0)
            st = end - RISER_LEAD_SEC
            if st < 0.5 or (intro > 0 and st < intro_at + intro and end > intro_at):
                continue
            events.append(("riser", st, RISER_GAIN_DB, trim))
    if opts.get("verdictImpact", True):
        for sc in scenes:
            if sc["kind"] == "verdict" and not sc.get("coldOpen"):
                events.append(("impact_boom", sc["start"], IMPACT_GAIN_DB, 0.0))
        if ri is not None and scenes[ri]["kind"] != "verdict":
            events.append(("impact_boom", scenes[ri]["start"], REVEAL_IMPACT_GAIN_DB, 0.0))
    return events, silence


def stinger_events(cut, timing):
    """(stinger name, seconds) at question and verdict scenes."""
    kinds = {sc["id"]: sc for sc in cut["scenes"]}
    out = []
    for t in timing["scenes"]:
        sc = kinds.get(t["id"])
        if not sc:
            continue
        if sc["kind"] == "question":
            out.append(("question", t["start"]))
        elif sc["kind"] == "verdict":
            v = str((sc.get("visual") or {}).get("verdict") or "").upper()
            if v == "PASSED":
                out.append(("passed", t["start"] + SFX_OFFSETS["stamp"]))
            elif v == "SIGNED":
                out.append(("signed", t["start"] + 0.3))
    return out


def stinger_file(name):
    p = ROOT / "build" / "music-stingers" / f"{name}.wav"
    if not p.exists():
        musicgen.write_wav(p, musicgen.stinger(name))
    return p


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
        if sc.get("coldOpen"):
            for name, anchor, off, gain in COLD_OPEN_SFX:
                events.append((name, (sc["start"] if anchor == "start" else sc["end"]) + off, gain))
    intro = float(timing.get("introSec") or 0)
    intro_at = float(timing.get("introAtSec") or 0)
    outro = float(timing.get("outroSec") or 0)
    if intro > 0:
        events += [(n, intro_at + off, 0.0) for n, off in brand_intro_sfx(intro) if off < intro]
    if outro > 0:
        events += [(n, total - outro + off, 0.0) for n, off in BRAND_OUTRO_SFX]
    return [(n, max(0.0, t), g) for n, t, g in events if t < total]


def mix_cut(slug, cut, plan):
    d = cut_dir(slug, cut["name"])
    timing = read_json(d / "timing.json")
    total = float(timing["totalSec"])
    energies = energy_changes(cut, timing)
    music, music_gain = music_for_cut(slug, cut, plan, total, energies)
    auto, silence = auto_sound_events(timing, plan.get("sound") or {})
    cues = {sc["id"]: sc.get("sfxCues") or [] for sc in cut["scenes"]}
    sfx_dir = ROOT / "build" / "sfx"
    inputs = ["-i", str(d / "voice.wav")]
    graph = [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={total},atrim=0:{total},asplit=2[vmix][vkey]"]
    mix_labels = ["[vmix]"]
    idx = 1
    events = []
    for name, at, gain_db in sfx_events(timing, cues):
        f = sfx_dir / f"{name}.wav"
        if not f.exists():
            fail(f"missing sfx {f}; run sfx.py --slug {slug} first")
        events.append((f, at, SFX_GAIN * (10 ** (gain_db / 20.0))))
    beats_path = d / "beats.json"
    beat_events = beat_sfx_events(read_json(beats_path), plan.get("sfxDensity")) if beats_path.exists() else []
    for name, at, gain_db in beat_events:
        f = sfx_dir / f"{name}.wav"
        if f.exists() and at < total:
            events.append((f, at, SFX_GAIN * (10 ** (gain_db / 20.0))))
    if beat_events:
        log(f"  {len(beat_events)} automatic beat sounds (sfxDensity {plan.get('sfxDensity') or 'mid'})")
    n_sting = 0
    if plan.get("stingers"):
        for name, at in stinger_events(cut, timing):
            if at < total:
                events.append((stinger_file(name), max(0.0, at), STINGER_GAIN))
                n_sting += 1
    if silence:
        a, b = silence[0] - SILENCE_GUARD_SEC, silence[1]
        before = len(events)
        events = [ev for ev in events if not (a <= ev[1] < b)]
        log(f"  silence before the reveal {silence[0]:.2f} -> {silence[1]:.2f} s ({before - len(events)} sfx dropped)")
    events = [(f, at, vol, 0.0) for f, at, vol in events]
    for name, at, gain_db, trim in auto:
        f = sfx_dir / f"{name}.wav"
        if f.exists() and 0 <= at < total:
            events.append((f, at, SFX_GAIN * (10 ** (gain_db / 20.0)), trim))
    if auto:
        log(f"  {len(auto)} automatic riser / impact sound(s)")
    # RETENTION-6: qa.py reports sfx/min from this list
    write_json(d / "sfx-events.json", sorted(({"sec": round(at, 3), "sfx": Path(str(f)).stem} for f, at, _v, _t in events),
                                             key=lambda e: e["sec"]))
    for f, at, vol, trim in events:
        ms = int(round(at * 1000))
        inputs += ["-i", str(f)]
        pre = f"atrim=start={trim:.3f},asetpts=PTS-STARTPTS," if trim > 0 else ""
        graph.append(f"[{idx}:a]{pre}aresample=48000,aformat=channel_layouts=stereo,volume={vol:.4f},adelay={ms}:all=1[s{idx}]")
        mix_labels.append(f"[s{idx}]")
        idx += 1
    if music:
        inputs += ["-stream_loop", "-1", "-i", str(music)]
        fade_st = max(0.0, total - 2.5)
        expr = gain_expr(*music_curve(plan["kind"], energies, silence))
        curve = f"volume='{expr}':eval=frame," if expr else ""
        graph.append(
            f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total},asetpts=N/SR/TB,volume={music_gain},"
            f"{curve}afade=t=in:d=1.5,afade=t=out:st={fade_st}:d=2.5[mus]")
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
    # loudnorm falls back to dynamic mode on peaky mixes and lets true peaks reach ~-1.4 dBTP, which the AAC encode
    # pushes over -1 dBTP (QA failed at -0.2). A 4x-oversampled limiter at -3 dBFS approximates a true-peak limiter:
    # measured -2.4 dBTP after AAC for ~0.15 LU of loudness.
    ln += ",aresample=192000,alimiter=limit=0.7079:level=0:attack=1:release=60:asc=1,aresample=48000"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(premix), "-af", ln,
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(out)])
    after = measure(out)
    log(f"mix {cut['name']}: {total:.2f}s, {idx - 1} extra input(s) ({n_sting} stinger(s)), music={plan['kind']}, "
        f"loudness {after['input_i']} LUFS, true peak {after['input_tp']} dBTP")


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    plan = {**plan_music(args.slug, spec), "sfxDensity": spec.get("sfxDensity") or "mid", "sound": sound_opts(spec)}
    for cut in cuts(spec):
        mix_cut(args.slug, cut, plan)


if __name__ == "__main__":
    main()
