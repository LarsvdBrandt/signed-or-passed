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
MIX-2 (default since 2026-10-16): generated music is the documentary underscore of pipeline/underscore.py (own score,
sampled GM instruments of the MIT FluidR3_GM soundfont, per-section arrangements, returning motif) in music.style
underscore | rhythmic | cinematic; music.style classic (or a missing soundfont) = the old musicgen beds.

Sound dynamics (RETENTION-4b, docs/library/retention.md):
  scenes[].musicEnergy  low | mid | high | drop | stop, sticky until the next scene that sets one ('mid' before the
                        first). Generated beds re-arrange their layers (musicdyn.bed_energy: layers in/out, filter
                        sweep up, 'drop' = filtered pad then the groove slams back in, 'stop' = silence); library
                        tracks follow a gain curve (LIBRARY_ENERGY_GAIN). No musicEnergy anywhere = legacy sections.
  spec.sound            {autoRisers: true, revealPauseSec: 0.6, verdictImpact: true}: a 2 s riser that ends at every
                        question scene and right before the reveal (common.reveal_index), music + sfx silent for
                        revealPauseSec before the reveal (tts.py holds the previous scene that long), impact_boom on
                        the verdict (and a softer one on a separate reveal scene).
  VOICE-12              every section pause of timing.json (breaths of kind 'section') gets a soft house whoosh on
                        the visual cut (unless another sound lands within 0.5 s) and a gentle music swell (~+2.6 dB).

MIX-1 levels (pipeline/mixlevels.py, docs/library/sound.md#mix, spec.mix): the cut is built from three stems
  voice (untouched), music (open level voice - 10 dB, ducked 8 dB while the voice speaks with a 150 ms look-ahead
  attack and 600 ms release, closed loop to voice-to-music 16 dB integrated) and sfx (thinned to <= 7 per minute,
  every sound calibrated to <= voice - 12 dB momentary, transients -4 dB more, ducked 3 dB under the voice), summed
  and loudness-normalised as before. Per stem LUFS and the ratios go to build/<slug>/<cut>/mix-report.json (qa.py).
"""
import csv
import json
import re
import subprocess
import urllib.parse
from pathlib import Path

import mixlevels as ml
import musicdyn
import musicgen
import numpy as np
import underscore
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
SECTION_WHOOSH_GAIN_DB = -9.0  # VOICE-12: soft transition sound in the pause between story sections
SECTION_SWELL = 1.35           # VOICE-12: music gain (~+2.6 dB) during a section pause, on top of the ducking release
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
    style = str(m.get("style") or "underscore").strip().lower()
    if style not in underscore.STYLES + ("classic",):
        add_warning(slug, f"music.style '{style}' is unknown: using 'underscore'")
        style = "underscore"
    info = {"kind": "generated", "mood": gmood, "era": era, "style": style, "licence": "CC0-1.0",
            "generator": "pipeline/musicgen.py" if style == "classic" else "pipeline/underscore.py"}
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


def underscore_bed(slug, cut, plan, timing, path):
    """MIX-2: the documentary underscore (pipeline/underscore.py) rendered with the FluidR3_GM soundfont + room/EQ;
    False (with a warning) when the soundfont or tinysoundfont is missing, so the caller uses musicgen."""
    try:
        x, info = underscore.bed(timing, plan["mood"], f"{slug}:{cut['name']}", plan.get("style") or "underscore",
                                 spec_scenes=cut["scenes"])
    except ImportError as e:
        add_warning(slug, f"underscore needs tinysoundfont ({e}): using the classic generated bed")
        return False
    if x is None:
        add_warning(slug, "no General MIDI soundfont (fluid-soundfont-gm) found: using the classic generated bed")
        return False
    dry = path.with_name("music-bed-dry.wav")
    sf.write(str(dry), x, underscore.SR, subtype="FLOAT")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(dry), "-af", underscore.POST_FILTER,
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(path)])
    dry.unlink(missing_ok=True)
    mj = work_dir(slug) / "music.json"
    m = read_json(mj) if mj.exists() else {}
    m.setdefault("cuts", {})[cut["name"]] = {k: v for k, v in info.items() if k != "sections"}
    m["soundfont"] = "FluidR3_GM by Frank Wen (MIT licence)" if "FluidR3" in info["soundfont"] else info["soundfont"]
    write_json(mj, m)
    write_json(path.with_name("underscore.json"), info)
    log(f"music {cut['name']}: underscore {info['style']} {info['bpm']} BPM in {info['key']}"
        f"{' minor' if info['minor'] else ''}, {len(info['sections'])} phrases, {info['notes']} notes ({info['soundfont']})")
    return True


def music_for_cut(slug, cut, plan, total, energies=None, timing=None):
    """(path, legacy gain, underscore?) of the music bed of one cut."""
    if plan["kind"] == "library":
        return plan["path"], LIBRARY_MUSIC_GAIN, False
    if plan["kind"] == "generated":
        path = cut_dir(slug, cut["name"]) / "music-bed.wav"
        seed = f"{slug}:{cut['name']}"
        if plan.get("style", "underscore") != "classic" and timing and underscore_bed(slug, cut, plan, timing, path):
            return path, GENERATED_MUSIC_GAIN, True
        if energies:
            x = musicdyn.bed_energy(plan["mood"], plan["era"], total + 0.5, seed=seed, changes=energies)
            how = "energy curve " + " ".join(f"{e}@{t:.1f}" for t, e in energies)
        else:
            x = musicgen.bed(plan["mood"], plan["era"], total + 0.5, seed=seed)
            how = "sections"
        musicgen.write_wav(path, x)
        log(f"music {cut['name']}: generated bed {plan['mood']} / {plan['era']} ({total:.1f} s, {how})")
        return path, GENERATED_MUSIC_GAIN, False
    return None, 0.0, False


def section_breaths(timing):
    """VOICE-12: the section pauses of a cut [(start, end, scene start)] (timing.json breaths of kind 'section')."""
    starts = {sc["id"]: float(sc["start"]) for sc in timing.get("scenes") or []}
    return [(float(b["at"]), float(b["at"]) + float(b["sec"]), starts.get(b["sceneId"], float(b["at"])))
            for b in timing.get("breaths") or [] if b.get("kind") == "section" and b.get("cut")]


def swell_curve(xs, ys, swells):
    """Multiply the curve (xs, ys) by a gentle swell (SECTION_SWELL) over every (start, end) window."""
    for a, b in swells:
        if b - a < 0.6:
            continue
        mx, my = [a, a + 0.35, b - 0.25, b + 0.05], [1.0, SECTION_SWELL, SECTION_SWELL, 1.0]
        ux = sorted(set(xs) | set(mx))
        ys = [float(np.interp(x, xs, ys)) * float(np.interp(x, mx, my, left=1.0, right=1.0)) for x in ux]
        xs = ux
    return xs, ys


def music_curve(kind, energies, silence, swells=None):
    """Breakpoints (xs, ys) in seconds of the music gain: library energy levels, VOICE-12 section swells and the
    silence before the reveal (silence = (start, end) or None)."""
    xs, ys = [0.0], [1.0]
    if kind == "library" and energies:
        prev = energies[0][1]
        xs, ys = [0.0], [LIBRARY_ENERGY_GAIN[prev]]
        for t, e in energies[1:]:
            t = max(t, xs[-1] + 0.001)
            xs += [t, t + musicdyn._gain_ramp(prev, e)]
            ys += [LIBRARY_ENERGY_GAIN[prev], LIBRARY_ENERGY_GAIN[e]]
            prev = e
    if swells:
        xs, ys = swell_curve(xs, ys, [w for w in swells if not (silence and w[0] < silence[1] and w[1] > silence[0])])
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


def ffwav(inputs, graph, label, out):
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-filter_complex", ";".join(graph),
         "-map", label, "-ar", str(ml.SR), "-ac", "2", "-c:a", "pcm_f32le", str(out)])
    x, _sr = sf.read(str(out), dtype="float32", always_2d=True)
    return x


def fit(x, n):
    """Stereo float32 array of exactly n samples."""
    if len(x) >= n:
        return x[:n]
    return np.concatenate([x, np.zeros((n - len(x), x.shape[1]), np.float32)])


def sfx_file_level(f):
    """Momentary max loudness (LUFS) of one sfx file as it enters the mix (48 kHz stereo), cached."""
    cache_path = ROOT / "build" / "sfx" / "levels.json"
    cache = read_json(cache_path) if cache_path.exists() else {}
    st = Path(f).stat()
    key = f"{Path(f).name}:{st.st_size}:{int(st.st_mtime)}"
    if key not in cache:
        tmp = Path(f).parent / ".lvl.wav"
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(f), "-af",
                        "aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=0.6", str(tmp)], check=True)
        m = ml.ebur128(tmp)
        tmp.unlink()
        cache[key] = max(m["M"]) if m["M"] else m["I"]
        write_json(cache_path, cache)
    return float(cache[key])


def tagged_events(timing, cut, plan, sfx_dir, slug):
    """Every candidate sound effect as {name, file, at, legacyDb, trim, kind, prio, exempt}."""
    cues = {sc["id"]: sc.get("sfxCues") or [] for sc in cut["scenes"]}
    total = float(timing["totalSec"])
    kinds = {sc["id"]: sc.get("kind") for sc in timing["scenes"]}
    ri = reveal_index(timing["scenes"])
    reveal_id = timing["scenes"][ri]["id"] if ri is not None else None
    base = 20.0 * np.log10(SFX_GAIN)
    ev = []

    def add(name, at, gain_db, kind, trim=0.0, required=True):
        f = sfx_dir / f"{name}.wav"
        if not f.exists():
            if required:
                fail(f"missing sfx {f}; run sfx.py --slug {slug} first")
            return
        if 0 <= at < total:
            ev.append({"name": name, "file": f, "at": max(0.0, at), "legacyDb": base + gain_db, "trim": trim,
                       "kind": kind, "prio": ml.PRIO[kind], "exempt": kind == "brand"})

    def scene_kind(sid):
        k = kinds.get(sid)
        return "verdict" if k == "verdict" else "reveal" if (k == "reveal" or sid == reveal_id) else \
            "question" if k == "question" else "scene"

    for sc in timing["scenes"]:
        if sc.get("sfx"):
            add(sc["sfx"], sc["start"] + SFX_OFFSETS.get(sc["sfx"], 0.0), 0.0, scene_kind(sc["id"]))
        for cue in cues.get(sc["id"]) or []:
            if cue.get("sfx"):
                k = scene_kind(sc["id"])
                add(cue["sfx"], sc["start"] + float(cue.get("atSec") or 0.0), float(cue.get("gainDb") or 0.0),
                    k if k != "scene" else "cue")
        if sc.get("coldOpen"):
            for name, anchor, off, gain in COLD_OPEN_SFX:
                add(name, (sc["start"] if anchor == "start" else sc["end"]) + off, gain, "coldopen")
    intro, intro_at = float(timing.get("introSec") or 0), float(timing.get("introAtSec") or 0)
    outro = float(timing.get("outroSec") or 0)
    if intro > 0:
        for n, off in brand_intro_sfx(intro):
            if off < intro:
                add(n, intro_at + off, 0.0, "brand")
    if outro > 0:
        for n, off in BRAND_OUTRO_SFX:
            add(n, total - outro + off, 0.0, "brand")
    d = cut_dir(slug, cut["name"])
    beats = read_json(d / "beats.json") if (d / "beats.json").exists() else []
    do_at = {round(float(b["sec"]), 3): b for b in beats}
    for name, at, gain_db in beat_sfx_events(beats, plan.get("sfxDensity")):
        b = do_at.get(round(float(at), 3)) or {}
        k = "cue" if b.get("sfx") else "punch" if b.get("do") in ml.PUNCH_BEATS else \
            "number" if b.get("do") in ml.NUMBER_BEATS else "beat"
        add(name, at, gain_db, k, required=False)
    whoosh = sfx_dir / "whoosh.wav"
    for a, b, cut_at in section_breaths(timing):  # VOICE-12: a soft whoosh on the visual cut inside every section pause
        if whoosh.exists() and not any(abs(e["at"] - cut_at) < 0.5 for e in ev):
            add("whoosh", cut_at - 0.25, SECTION_WHOOSH_GAIN_DB, "section")
    auto, silence = auto_sound_events(timing, plan.get("sound") or {})
    if silence:
        a, b = silence[0] - SILENCE_GUARD_SEC, silence[1]
        ev = [e for e in ev if not (a <= e["at"] < b)]
    for name, at, gain_db, trim in auto:
        k = "riser" if name == "riser" else ("verdict" if gain_db == IMPACT_GAIN_DB else "reveal")
        add(name, at, gain_db, k, trim=trim, required=False)
    return ev, silence


def mix_cut(slug, cut, plan):
    d = cut_dir(slug, cut["name"])
    timing = read_json(d / "timing.json")
    total = float(timing["totalSec"])
    n = int(round(total * ml.SR))
    opts = plan.get("mix") or dict(ml.MIX_DEFAULTS)
    energies = energy_changes(cut, timing)
    sfx_dir = ROOT / "build" / "sfx"

    # 1. voice stem (unchanged voice, 48 kHz stereo) + where it speaks
    voice = fit(ffwav(["-i", str(d / "voice.wav")],
                      [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={total},atrim=0:{total}[v]"],
                      "[v]", d / "stem-voice.wav"), n)
    active = ml.voice_activity(voice)
    v_meter = ml.ebur128(d / "stem-voice.wav")
    v_i = v_meter["I"]

    # 2. sfx: candidates -> thinning -> calibrated levels -> stem (ducked 3 dB under the voice)
    cands, silence = tagged_events(timing, cut, plan, sfx_dir, slug)
    kept, dropped = ml.thin(cands, opts["sfxPerMin"])
    inputs, graph, labels = [], [], []
    for i, e in enumerate(kept):
        gdb = ml.sfx_level_db(e["name"], e["legacyDb"], sfx_file_level(e["file"]), v_i, opts)
        e["gainDb"] = round(gdb, 1)
        inputs += ["-i", str(e["file"])]
        pre = f"atrim=start={e['trim']:.3f},asetpts=PTS-STARTPTS," if e["trim"] > 0 else ""
        graph.append(f"[{i}:a]{pre}aresample=48000,aformat=channel_layouts=stereo,volume={10 ** (gdb / 20):.5f},"
                     f"adelay={int(round(e['at'] * 1000))}:all=1[s{i}]")
        labels.append(f"[s{i}]")
    if kept:
        graph.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad=whole_dur={total},atrim=0:{total}[sx]"
                     if len(labels) > 1 else f"[s0]apad=whole_dur={total},atrim=0:{total}[sx]")
        sfx = fit(ffwav(inputs, graph, "[sx]", d / "stem-sfx.wav"), n)
        g = ml.duck_gain(active, ml.SFX_DUCK_DB, attack=0.05, release=0.3, n_samples=n)
        if g is not None:
            sfx *= g[:, None]
    else:
        sfx = np.zeros((n, 2), np.float32)
    log(f"  sfx: {len(cands)} candidates -> {len(kept)} kept ({len(dropped)} thinned, max {opts['sfxPerMin']}/min)")
    write_json(d / "sfx-events.json", [{"sec": round(e["at"], 3), "sfx": e["name"], "kind": e["kind"], "gainDb": e["gainDb"]}
                                       for e in kept])

    # 3. music: bed (+ stingers) -> open level voice-10 dB -> ducked under the voice -> closed-loop voice-to-music
    music_path, _legacy_gain, scored = music_for_cut(slug, cut, plan, total, energies, timing)
    music = None
    # the underscore plays its own question tick, reveal hit and verdict stinger: no musicgen stingers on top
    stingers = [(stinger_file(nm), at) for nm, at in stinger_events(cut, timing)] if plan.get("stingers") and not scored else []
    stingers = [(f, at) for f, at in stingers if at < total]
    sections = section_breaths(timing)
    if music_path:
        fade_st = max(0.0, total - 2.5)
        expr = gain_expr(*music_curve(plan["kind"], energies, silence, [(a, b) for a, b, _c in sections]))
        curve = f"volume='{expr}':eval=frame," if expr else ""
        inputs = ["-stream_loop", "-1", "-i", str(music_path)]
        graph = [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total},asetpts=N/SR/TB,"
                 f"{curve}afade=t=in:d=1.5,afade=t=out:st={fade_st}:d=2.5[bed]"]
        bed = fit(ffwav(inputs, graph, "[bed]", d / "stem-music-raw.wav"), n)
        b_i = ml.ebur128(d / "stem-music-raw.wav")["I"]
        music = bed * np.float32(10 ** (((v_i - ml.MUSIC_OPEN_BELOW_VOICE_DB) - b_i) / 20.0))
        if stingers:  # stingers sit at the open music level (they play into pauses / the verdict)
            inputs, graph, labels = [], [], []
            for i, (f, at) in enumerate(stingers):
                inputs += ["-i", str(f)]
                graph.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={STINGER_GAIN / GENERATED_MUSIC_GAIN:.4f},"
                             f"adelay={int(round(max(0.0, at) * 1000))}:all=1[t{i}]")
                labels.append(f"[t{i}]")
            graph.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad=whole_dur={total},atrim=0:{total}[st]"
                         if len(labels) > 1 else f"[t0]apad=whole_dur={total},atrim=0:{total}[st]")
            st = fit(ffwav(inputs, graph, "[st]", d / "stem-stingers.wav"), n)
            music += st * np.float32(10 ** (((v_i - ml.MUSIC_OPEN_BELOW_VOICE_DB) - b_i) / 20.0))
        g = ml.duck_gain(active, opts["duckDb"], n_samples=n)
        if g is not None:
            music *= g[:, None]
        if silence:
            a, b = int(max(0.0, silence[0] - 0.08) * ml.SR), int(silence[1] * ml.SR)
            music[a:b] = 0.0
        m_i = ml.ebur128(music, tmp_dir=d)["I"]
        corr = float(np.clip((v_i - m_i) - opts["voiceToMusicDb"], -20.0,
                             ml.MUSIC_OPEN_BELOW_VOICE_DB - ml.MUSIC_MIN_OPEN_BELOW_VOICE_DB))
        music *= np.float32(10 ** (corr / 20.0))
        log(f"  music: open level voice-{ml.MUSIC_OPEN_BELOW_VOICE_DB:.0f} dB, ducked {opts['duckDb']:.0f} dB under the voice, "
            f"correction {corr:+.1f} dB, {len(stingers)} stinger(s)")
    if silence:
        a, b = int(max(0.0, silence[0] - 0.08) * ml.SR), int(silence[1] * ml.SR)
        sfx[a:b] = 0.0

    # 4. premix = voice + music + sfx, then two-pass loudnorm + true-peak limiter (unchanged)
    pre = voice + sfx + (music if music is not None else 0.0)
    premix = d / "premix.wav"
    sf.write(str(premix), pre, ml.SR, subtype="FLOAT")
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
    gain = float(after["input_i"]) - float(m["input_i"])  # the (linear) loudnorm gain applied to every stem

    # 5. MIX-1 report: stem loudness at the final scale and the voice-to-music / voice-to-sfx ratios
    s_meter = ml.ebur128(sfx, tmp_dir=d) if kept else {"I": -120.0, "M": [], "S": []}
    mu_meter = ml.ebur128(music, tmp_dir=d) if music is not None else None
    stats = ml.short_term_stats(v_meter, s_meter, mu_meter, active)
    for k in list(stats):
        if k.endswith("Lufs") and stats[k] is not None:
            stats[k] = round(stats[k] + gain, 1)
    rep = {"voiceLufs": round(v_i + gain, 1), "musicLufs": None if mu_meter is None else round(mu_meter["I"] + gain, 1),
           "sfxLufs": round(s_meter["I"] + gain, 1) if kept else None, "mixLufs": float(after["input_i"]),
           "truePeakDb": float(after["input_tp"]),
           "voiceToMusicDb": None if mu_meter is None else round(v_i - mu_meter["I"], 1),
           "voiceToSfxDb": round(v_i - s_meter["I"], 1) if kept else None, **stats,
           "sfxCount": len(kept), "sfxCandidates": len(cands), "sfxThinned": len(dropped),
           "sfxPerMin": round(len(kept) / max(total / 60.0, 1e-6), 1), "settings": opts,
           "music": plan["kind"], "stingers": len(stingers), "speechPct": round(100.0 * float(active.mean()), 1)}
    write_json(d / "mix-report.json", rep)
    for p in ("stem-music-raw.wav", "stem-stingers.wav", "stem-voice.wav"):
        (d / p).unlink(missing_ok=True)
    if music is not None:  # final stems at premix scale, kept for listening boards (MIX-3) and debugging
        sf.write(str(d / "stem-music.wav"), music, ml.SR, subtype="PCM_16")
    sf.write(str(d / "stem-sfx.wav"), sfx, ml.SR, subtype="PCM_16")
    log(f"mix {cut['name']}: {total:.2f}s, {len(kept)} sfx, music={plan['kind']}, loudness {after['input_i']} LUFS, "
        f"true peak {after['input_tp']} dBTP; voice {rep['voiceLufs']} / music {rep['musicLufs']} / sfx {rep['sfxLufs']} LUFS, "
        f"voice-music {rep['voiceToMusicDb']} dB, voice-sfx short-term {rep['voiceToSfxShortTermDb']} dB")


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    plan = {**plan_music(args.slug, spec), "sfxDensity": spec.get("sfxDensity") or "mid", "sound": sound_opts(spec),
            "mix": ml.mix_opts(spec)}
    for cut in cuts(spec):
        mix_cut(args.slug, cut, plan)


if __name__ == "__main__":
    main()
