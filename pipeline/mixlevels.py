"""MIX-1 channel mix levels (docs/library/sound.md#mix): stem loudness, voice-driven ducking, sfx calibration and
sfx thinning. Used by mix.py; qa.py reads the resulting build/<slug>/<cut>/mix-report.json.

Defaults ("voice is king", Lars 2026-10-16), all relative to the voice stem so they survive the final loudnorm:
  music open level  voice - 10 dB (about -24 LUFS in a -14 LUFS mix): section pauses, after the verdict, intro
  music under voice open - duckDb (8 dB): about -32 LUFS short-term while the voice speaks; ~-30 LUFS integrated
  ducking           150 ms attack (look-ahead, so the first syllable is never masked), 600 ms release; gaps in the
                    voice shorter than 0.8 s are bridged so the music only opens in real pauses
  sfx ceiling       momentary max of every sfx <= voice - 12 dB, transients (whoosh, pop, click ...) another 4 dB
                    lower, verdict / reveal accents (impact, stamp, pen) <= voice - 10 dB; never louder than the old
                    level - 7 dB; the sfx stem is ducked 3 dB under the voice as well
  thinning          at most sfxPerMin (7) sounds in any 60 s window, >= 1.2 s apart; the best ones win (verdict,
                    reveal, brand, question risers, numbers, section transitions); punch-in / punch-out / swap beats
                    have the lowest priority
spec.mix overrides: {voiceToMusicDb: 16, duckDb: 8, sfxBelowVoiceDb: 12, sfxPerMin: 7}
"""
import re
import subprocess

import numpy as np

SR = 48000
FRAME = 0.01  # envelope resolution (s)

MIX_DEFAULTS = {"voiceToMusicDb": 16.0, "duckDb": 8.0, "sfxBelowVoiceDb": 12.0, "sfxPerMin": 7}
MUSIC_OPEN_BELOW_VOICE_DB = 10.0   # unducked bed level relative to the voice (pauses, after the verdict)
MUSIC_MIN_OPEN_BELOW_VOICE_DB = 8.0
DUCK_ATTACK, DUCK_RELEASE, DUCK_BRIDGE = 0.15, 0.6, 0.8
SFX_DUCK_DB = 3.0
TRANSIENT_EXTRA_DB = 4.0
ACCENT_BELOW_VOICE_DB = 10.0
LEGACY_REDUCTION_DB = 7.0          # "6-8 dB quieter than now"
SFX_MIN_GAP_SEC = 1.2
SFX_WINDOW_SEC = 60.0
QA_VOICE_TO_MUSIC_DB = 14.0
QA_VOICE_TO_SFX_DB = 10.0

TRANSIENT_SFX = {"whoosh", "whoosh_fast", "whoosh_soft", "whoosh_long", "swoosh_up", "swoosh_down", "pop", "click",
                 "camera_shutter", "clock_tick", "page_flip", "paper", "boing", "sparkle", "notification_ding", "glitch"}
ACCENT_SFX = {"impact_boom", "stamp", "pen", "reveal_stinger", "cymbal_crash"}

# priorities for thinning (higher wins)
PRIO = {"brand": 100, "verdict": 95, "reveal": 90, "question": 80, "riser": 75, "coldopen": 65, "cue": 60,
        "number": 58, "scene": 55, "section": 50, "beat": 30, "punch": 10}
PUNCH_BEATS = {"punch-in", "punch-out", "swap", "whip"}
NUMBER_BEATS = {"counter", "keyword-number"}


def mix_opts(spec):
    m = spec.get("mix") if isinstance(spec.get("mix"), dict) else {}
    out = dict(MIX_DEFAULTS)
    for k, lo, hi in (("voiceToMusicDb", 8, 40), ("duckDb", 0, 20), ("sfxBelowVoiceDb", 6, 30), ("sfxPerMin", 1, 30)):
        try:
            if m.get(k) is not None:
                out[k] = max(lo, min(hi, float(m[k])))
        except (TypeError, ValueError):
            pass
    out["sfxPerMin"] = int(round(out["sfxPerMin"]))
    return out


def db(x):
    return 20.0 * np.log10(max(float(x), 1e-12))


def ebur128(path_or_array, sr=SR, tmp_dir=None):
    """{'I', 'M': [..], 'S': [..]} (LUFS, M/S every 0.1 s) via ffmpeg's BS.1770 meter."""
    tmp = None
    path = path_or_array
    if not isinstance(path_or_array, (str, bytes)) and not hasattr(path_or_array, "suffix"):
        import tempfile
        import soundfile as sf
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir=tmp_dir)  # /tmp may be a small tmpfs
        sf.write(tmp.name, np.asarray(path_or_array, dtype=np.float32), sr, subtype="FLOAT")
        path = tmp.name
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-v", "verbose", "-i", str(path), "-af",
                        "ebur128=framelog=verbose", "-f", "null", "-"], capture_output=True, text=True)
    if tmp is not None:
        import os
        os.unlink(tmp.name)
    ms, ss = [], []
    for line in p.stderr.splitlines():
        mm = re.search(r"t:\s*([0-9.]+).*?M:\s*(-?[0-9.]+|-inf|nan)\s+S:\s*(-?[0-9.]+|-inf|nan)", line)
        if mm:  # one line per 0.1 s; index by its time so the frames line up with the voice activity
            k = max(0, int(round(float(mm.group(1)) * 10)) - 1)
            while len(ms) <= k:
                ms.append(-120.0)
                ss.append(-120.0)
            ms[k], ss[k] = _num(mm.group(2)), _num(mm.group(3))
    summ = re.findall(r"I:\s*(-?[0-9.]+|-inf)\s*LUFS", p.stderr)
    return {"I": _num(summ[-1]) if summ else -70.0, "M": ms, "S": ss}


def _num(s):
    try:
        v = float(s)
        return v if np.isfinite(v) else -120.0
    except ValueError:
        return -120.0


def voice_activity(voice, sr=SR, bridge=DUCK_BRIDGE):
    """Boolean per FRAME: the voice speaks (RMS within 30 dB of its loud frames), gaps < bridge s filled."""
    mono = voice if voice.ndim == 1 else voice.mean(axis=1)
    hop = int(sr * FRAME)
    n = len(mono) // hop
    if n == 0:
        return np.zeros(0, bool)
    rms = np.sqrt(np.mean(mono[: n * hop].reshape(n, hop).astype(np.float64) ** 2, axis=1) + 1e-12)
    lvl = 20 * np.log10(rms)
    loud = np.percentile(lvl[lvl > -70], 95) if np.any(lvl > -70) else -20.0
    act = lvl > max(loud - 30.0, -55.0)
    # bridge short gaps
    gap_max = int(bridge / FRAME)
    i = 0
    idx = np.flatnonzero(act)
    if len(idx) > 1:
        gaps = np.diff(idx)
        for k in np.flatnonzero((gaps > 1) & (gaps <= gap_max)):
            act[idx[k]: idx[k + 1]] = True
    # drop isolated blips < 60 ms (clicks, breaths)
    d = np.diff(np.concatenate([[0], act.astype(np.int8), [0]]))
    starts, ends = np.flatnonzero(d == 1), np.flatnonzero(d == -1)
    for a, b in zip(starts, ends):
        if b - a < 6:
            act[a:b] = False
    return act


def duck_gain(active, depth_db, attack=DUCK_ATTACK, release=DUCK_RELEASE, n_samples=None, sr=SR):
    """Per-sample linear gain: 1 when the voice is silent, 10^(-depth/20) while it speaks. The attack ramp ends at
    the voice onset (look-ahead), the release starts when the voice stops."""
    if depth_db <= 0 or not len(active):
        return None
    floor = 10 ** (-depth_db / 20.0)
    target = np.where(active, 1.0, 0.0)  # 1 = ducked
    a_fr, r_fr = max(1, int(attack / FRAME)), max(1, int(release / FRAME))
    # look-ahead: shift the onsets earlier by the attack time
    ahead = target.copy()
    d = np.diff(np.concatenate([[0], active.astype(np.int8)]))
    for s in np.flatnonzero(d == 1):
        ahead[max(0, s - a_fr): s] = np.maximum(ahead[max(0, s - a_fr): s], np.linspace(0, 1, s - max(0, s - a_fr), endpoint=False))
    # release: one-pole-ish linear fall after the voice stops
    env = np.empty_like(ahead)
    cur = 0.0
    step_r = 1.0 / r_fr
    for i, v in enumerate(ahead):
        cur = v if v >= cur else max(v, cur - step_r)
        env[i] = cur
    g = 1.0 - env * (1.0 - floor)
    n = n_samples or len(g) * int(sr * FRAME)
    t_fr = (np.arange(len(g)) + 0.5) * FRAME
    t = np.arange(n) / sr
    return np.interp(t, t_fr, g).astype(np.float32)


def sfx_level_db(name, legacy_db, file_m_max, voice_i, opts):
    """Gain (dB) for one sfx event: the calibrated ceiling, never more than the legacy level - 7 dB."""
    below = ACCENT_BELOW_VOICE_DB if name in ACCENT_SFX else opts["sfxBelowVoiceDb"]
    if name in TRANSIENT_SFX:
        below += TRANSIENT_EXTRA_DB
    ceiling = (voice_i - below) - file_m_max
    return min(ceiling, legacy_db - LEGACY_REDUCTION_DB)


def thin(events, per_min, min_gap=SFX_MIN_GAP_SEC, window=SFX_WINDOW_SEC):
    """events: dicts with 'at', 'prio' (and 'exempt' for the brand sounds). Keeps at most per_min in any window,
    >= min_gap apart (exempt ones always stay); returns (kept, dropped) sorted by time."""
    order = sorted(events, key=lambda e: (-e["prio"], e["at"]))
    kept = []
    dropped = []
    for e in order:
        if e.get("exempt"):
            kept.append(e)
            continue
        if any(abs(k["at"] - e["at"]) < min_gap and not k.get("exempt") for k in kept):
            dropped.append(e)
            continue
        times = sorted([k["at"] for k in kept] + [e["at"]])
        ok = True
        for s in [t for t in times if e["at"] - window < t <= e["at"]]:
            if sum(1 for t in times if s <= t < s + window) > per_min:
                ok = False
                break
        if ok:
            kept.append(e)
        else:
            dropped.append(e)
    return sorted(kept, key=lambda e: e["at"]), sorted(dropped, key=lambda e: e["at"])


def short_term_stats(voice_meter, sfx_meter, music_meter, active_frames):
    """Short-term (3 s) and momentary (0.4 s) ratios. The voice reference is the median short-term loudness while
    it speaks; the sfx figure is the stem's loudest short-term / momentary value."""
    vs = np.array(voice_meter["S"])
    vm = np.array(voice_meter["M"])
    n = min(len(vs), len(active_frames) // 10 if len(active_frames) else 0)
    act100 = np.array([active_frames[i * 10:(i + 1) * 10].mean() > 0.5 for i in range(n)], bool) if n else np.zeros(0, bool)
    # frames before the 3 s / 0.4 s windows are full read -120 in ffmpeg: ignore anything below -70 LUFS
    sel_s, sel_m = act100 & (vs[:n] > -70), act100 & (vm[:n] > -70)
    ref_s = float(np.median(vs[:n][sel_s])) if sel_s.any() else float(voice_meter["I"])
    ref_m = float(np.median(vm[:n][sel_m])) if sel_m.any() else float(voice_meter["I"])
    sfx_s = max(sfx_meter["S"]) if sfx_meter["S"] else -120.0
    sfx_m = max(sfx_meter["M"]) if sfx_meter["M"] else -120.0
    mus_s = np.array(music_meter["S"]) if music_meter else np.zeros(0)
    k = min(len(mus_s), n)
    ok = mus_s[:k] > -70 if k else np.zeros(0, bool)
    under = float(np.median(mus_s[:k][act100[:k] & ok])) if k and (act100[:k] & ok).any() else None
    open_ = float(np.percentile(mus_s[:k][~act100[:k] & ok], 90)) if k and (~act100[:k] & ok).any() else None
    return {"voiceShortTermLufs": round(ref_s, 1), "voiceMomentaryLufs": round(ref_m, 1),
            "sfxMaxShortTermLufs": round(sfx_s, 1), "sfxMaxMomentaryLufs": round(sfx_m, 1),
            "voiceToSfxShortTermDb": round(ref_s - sfx_s, 1), "voiceToSfxMomentaryDb": round(ref_m - sfx_m, 1),
            "musicUnderVoiceShortTermLufs": None if under is None else round(under, 1),
            "musicOpenShortTermLufs": None if open_ is None else round(open_, 1)}
