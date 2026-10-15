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

Long main cuts get a short silent gap for the brand sting right AFTER the hook (common.brand_intro_plan: after the
first scene that is not a cold open, or spec.brandIntro.after; 1.2 s by default) and OUTRO_SEC after the last scene
(end card); timing.json records introSec (sting length), introAtSec (where it starts) and outroSec.
RETENTION-4b: the scene before the reveal (common.reveal_index) holds spec.sound.revealPauseSec (default 0.6 s)
longer, so voice, music and sfx fall silent right before the reveal; timing.json records revealAtSec and
revealPauseSec.

VOICE-1..4 (docs/library/voices.md): engine 'chatterbox' = Resemble AI Chatterbox (MIT, original model with emotion
`exaggeration` + `cfg_weight`), zero-shot cloned from spec.voice.reference: 'narrator' (a lively ~13 s reading by
Kokoro bm_george, generated at render time and cached) or 'default' (the built-in Chatterbox voice). It runs in its
own venv (pipeline/requirements-chatterbox.txt, created on first use; SOP_CB_PYTHON overrides) through
pipeline/chatterbox_worker.py: pass 1 lays every cut out with placeholders to collect the sentences, the worker
generates them in N parallel shards (SOP_TTS_SHARDS, default 2 on >= 4 cores) into a cache keyed by text + settings
(on GitHub, render.yml first fans the clips out over several runners: `tts.py --slug S --shard i/n --export DIR`,
ci/tts-plan.py decides n; the render job downloads the clips into the cache),
every clip is checked with faster-whisper (bad takes are regenerated once with a lower exaggeration), pass 2 lays
the real clips out. A sentence that Chatterbox cannot produce is spoken by Kokoro (spec.voice.fallback, default
bm_george). Each sentence gets a delivery style (pipeline/delivery.py: inline tags, scenes[].delivery or
auto-delivery) that sets exaggeration / cfg_weight, a small speed factor and extra pauses. Voice QA (overall WER
and liveliness = F0 variation per minute) goes to build/<slug>/voice-qa.json for qa.py.

VOICE-8 channel tuning (delivery.CHANNEL_TUNING, overridable per spec): spec.voice.exaggerationOffset (+0.15) and
cfgOffset (-0.10, floor 0.25) shift every style, spec.voice.pauseScale (1.15) lengthens sentence gaps and style pauses.
VOICE-10a: Chatterbox clips are NEVER time-stretched by default (the 0.88 rubberband stretch of VOICE-8 smeared the
prosody): pace is 1.0 and an explicit spec.voice.pace is clamped to 0.97-1.0; style speed factors are ignored for
Chatterbox. Pace guard (VOICE-11: opt-in, only when spec.voice.targetWpm is set and pace / pauseScale are not): the
main cut is measured after generation and only the PAUSES are nudged (pauseScale 1.0-1.6) toward targetWpm.
VOICE-11 channel default (variant C of voice-test-2): no offsets, paragraphs on, pauses x1.15, natural speed.
VOICE-10b PARAGRAPHS (spec.voice.paragraphs, chatterbox only; default true since VOICE-11): Chatterbox speaks 1-4 consecutive sentences of a scene
(one thought, <= 45 words / 250 characters, same delivery family, no [pause] marker inside) in ONE call so the
intonation flows across sentences; the chunk takes the strongest delivery inside it. The worker transcribes the chunk
with faster-whisper word timestamps, aligns them to the known sentences and cuts the clip at the quietest point
between sentences; each sentence keeps its natural trailing pause (+ PARA_GAP x pauseScale), so timing.json stays
sentence-level (same format).
timing.json and voice-qa.json record the measured pace: wpm = words / speech time (first to last word of every scene,
pauses between sentences included; scene gaps, holds and the sting excluded), articulationWpm = words / clip time.
"""
import collections
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

import numpy as np
import soundfile as sf

from common import (DEFAULT_SPEED, END_TAIL, FIRST_LEAD, FPS, OUTRO_SEC, ROOT, SCENE_LEAD, SCENE_TAIL,
                    SENTENCE_GAP, VERDICT_MIN, brand_intro_plan, branded, cold_open, cut_dir, cuts, fail, load_spec, log, reveal_index,
                    slug_arg, sound_opts,
                    split_sentences, strip_emphasis, work_dir, write_json)
import delivery as dlv
import textnorm

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


def trim_bounds(a, thr=0.004, margin=0.03):
    """(first, last) sample of `a` that trim() would keep."""
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return 0, len(a)
    m = int(margin * SR)
    return max(0, idx[0] - m), min(len(a), idx[-1] + m)


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

    def synth(self, text, speed, d=None):
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

    def synth(self, text, speed, d=None):
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


CB_REQ = ROOT / "pipeline" / "requirements-chatterbox.txt"
CB_WORKER = ROOT / "pipeline" / "chatterbox_worker.py"
CB_VENV = Path(os.path.expanduser(os.environ.get("SOP_CB_VENV") or "~/.venvs/chatterbox"))
CB_TORCH = "torch==2.6.0 torchaudio==2.6.0"
TTS_CACHE = Path(os.path.expanduser("~/.cache/huggingface/sop-tts"))
CB_TAG = "chatterbox-0.1.2/v1"
PACE_FLOOR_CB = 0.97  # VOICE-10a: never stretch Chatterbox more than 3 %
PARA_GAP = 0.06  # VOICE-10b: extra silence after a sentence inside a paragraph clip (x pauseScale)
PARA_MAX_SENT, PARA_MAX_WORDS, PARA_MAX_CHARS = 4, 45, 250
ASR_MODEL = "base.en"
# Narrator reference (VOICE-2): our own lively text read by Kokoro bm_george; Chatterbox clones that timbre.
NARRATOR_TEXT = ("Fifty million dollars! Can you believe that? A tiny startup walks into the room, and the giant just "
                 "laughs. Big mistake. Huge! Because ten years later, everything had changed. So tell me. "
                 "Would you sign? Or would you pass?")
NARRATOR_VOICE, NARRATOR_SPEED = "bm_george", 1.1


TEMPO_USED = collections.Counter()
_RUBBERBAND = None


def _has_rubberband():
    global _RUBBERBAND
    if _RUBBERBAND is None:
        _RUBBERBAND = False
        if os.environ.get("SOP_TEMPO", "").lower() != "atempo":
            try:
                p = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True, timeout=30)
                _RUBBERBAND = bool(re.search(r"\brubberband\b", p.stdout or ""))
            except (OSError, subprocess.SubprocessError):
                _RUBBERBAND = False
    return _RUBBERBAND


def _ffmpeg_filter(a, flt):
    try:
        p = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1",
                            "-i", "pipe:0", "-filter:a", flt, "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                           input=a.astype(np.float32).tobytes(), capture_output=True)
    except OSError:
        return None
    if p.returncode != 0 or not p.stdout:
        return None
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def tempo(a, factor):
    """Time-stretch without changing the pitch; no-op for |factor - 1| < 1 %. Uses ffmpeg's rubberband filter
    (higher quality for speech) when this ffmpeg has it, else atempo (SOP_TEMPO=atempo forces atempo)."""
    if abs(factor - 1.0) < 0.01 or len(a) == 0:
        return a
    if _has_rubberband():
        out = _ffmpeg_filter(a, f"rubberband=tempo={factor:.4f}:pitchq=quality")
        if out is not None and len(out):
            TEMPO_USED["rubberband"] += 1
            return out
    out = _ffmpeg_filter(a, f"atempo={factor:.4f}")
    if out is not None and len(out):
        TEMPO_USED["atempo"] += 1
        return out
    TEMPO_USED["none"] += 1
    return a


def cb_python():
    """Python of the Chatterbox venv; created (CPU torch + pipeline/requirements-chatterbox.txt) on first use."""
    if os.environ.get("SOP_CB_PYTHON"):
        return os.environ["SOP_CB_PYTHON"]
    py = CB_VENV / "bin" / "python"
    stamp = CB_VENV / (".req-" + hashlib.sha1(CB_REQ.read_bytes()).hexdigest()[:12])
    if not stamp.exists():
        t0 = time.time()
        log(f"creating the Chatterbox venv in {CB_VENV} ...")
        subprocess.run([sys.executable, "-m", "venv", str(CB_VENV)], check=True)
        pip = [str(py), "-m", "pip", "install", "-q"]
        subprocess.run(pip + ["--upgrade", "pip"], check=True)
        subprocess.run(pip + ["--index-url", "https://download.pytorch.org/whl/cpu"] + CB_TORCH.split(), check=True)
        subprocess.run(pip + ["-r", str(CB_REQ)], check=True)
        stamp.touch()
        log(f"  Chatterbox venv ready in {time.time() - t0:.0f}s")
    return str(py)


def run_logged(cmd, prefix, env=None):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env, bufsize=1)

    def pump():
        for line in p.stdout:
            line = line.rstrip()
            if line and "it/s]" not in line and "s/it]" not in line:
                print(f"{prefix}{line}", flush=True)
    th = threading.Thread(target=pump, daemon=True)
    th.start()
    return p, th


class ChatterboxEngine:
    """Two-pass engine: while `recording` it only collects the clips it is asked for (returns placeholders);
    generate() renders them with the worker; afterwards synth() returns the cached clips."""
    name = "chatterbox"
    default_speed = 1.0
    uses_delivery = True

    def __init__(self, voice, speaker=None, settings=None, slug=""):
        self.settings = settings or {}
        self.reference = self.settings.get("reference") or "narrator"
        self.base_ex = self.settings.get("exaggeration")
        self.base_cfg = self.settings.get("cfgWeight")
        self.temperature = float(self.settings.get("temperature") or 0.8)
        # VOICE-8 channel tuning: offsets on top of every delivery style (spec.voice overrides, 0 = untuned)
        self.ex_off = float(self.settings.get("exaggerationOffset", dlv.CHANNEL_TUNING["exaggerationOffset"]))
        self.cfg_off = float(self.settings.get("cfgOffset", dlv.CHANNEL_TUNING["cfgOffset"]))
        self.fallback_voice = self.settings.get("fallback") or NARRATOR_VOICE
        self.slug = slug
        self.recording = True
        self.jobs = {}
        self.used = {}
        self.fallbacks = []
        self._kokoro = None
        self.ref_path = None
        self.ref_id = "default"

    def _settings(self, d):
        d = d or {"exaggeration": 0.5, "cfgWeight": 0.5, "speed": 1.0, "style": "calm"}
        ex = float(d["exaggeration"]) + self.ex_off
        if self.base_ex is not None:  # spec.voice.exaggeration shifts every style (0.5 = neutral)
            ex += float(self.base_ex) - 0.5
        ex = min(1.0, max(0.25, ex))
        cfg = float(d["cfgWeight"]) + self.cfg_off
        if self.base_cfg is not None:  # spec.voice.cfgWeight shifts every style (0.5 = neutral)
            cfg += float(self.base_cfg) - 0.5
        cfg = min(1.0, max(dlv.CFG_FLOOR if self.cfg_off < 0 else 0.1, cfg))
        return round(ex, 3), round(cfg, 3)

    def _key(self, text, ex, cfg):
        raw = json.dumps([CB_TAG, self.ref_id, text, ex, cfg, self.temperature], ensure_ascii=False)
        return hashlib.sha1(raw.encode()).hexdigest()[:20]

    def factor(self, speed=None):
        """VOICE-10a: Chatterbox is never time-stretched by scene voiceSpeed or style speed factors; only an
        explicit spec.voice.pace may slow it, by at most 3 % (clamped to 0.97-1.0)."""
        return min(1.0, max(PACE_FLOOR_CB, float(self.settings.get("pace") or 1.0)))

    def chunk_part(self, ch, speed):
        """VOICE-10b: (audio, first, last, dur) of sentence ch['pos'] of a paragraph clip."""
        texts, k = ch["texts"], ch["pos"]
        ex, cfg = self._settings(ch["d"])
        key = self._key("‖".join(texts), ex, cfg)
        path = TTS_CACHE / "chatterbox" / f"{key}.wav"
        factor = self.factor(speed)
        if self.recording:
            self.jobs[key] = {"id": key, "text": " ".join(texts), "expected": " ".join(texts), "sentences": texts,
                              "exaggeration": ex, "cfgWeight": cfg, "temperature": self.temperature,
                              "seed": int(key[:8], 16) % 100000, "out": str(path)}
            n = int(SR * max(0.4, 0.06 * len(texts[k]) / max(0.5, factor)))
            return np.zeros(n, dtype=np.float32), 0.0, n / SR, n / SR
        meta = Path(str(path) + ".json")
        if path.exists() and meta.exists():
            info = json.loads(meta.read_text())
            raw, sr = sf.read(str(path), dtype="float32")
            raw = np.asarray(raw).reshape(-1)
            cuts = info.get("cuts") or []
            if len(cuts) == len(texts) - 1 and len(raw) > sr * 0.15:
                self.used[key] = {"text": " ".join(texts), "paragraph": len(texts), **info}
                bounds = [0] + [int(c) for c in cuts] + [len(raw)]
                a = resample(raw[bounds[k]:bounds[k + 1]], sr)
                lo, hi = trim_bounds(a)
                # the natural pause between two sentences of the same scene is kept (the cut sits in its quietest
                # point; capped at 0.45 s per side); toward another scene the scene gap of layout() takes over
                hi = min(len(a), hi + int(0.45 * SR)) if ch.get("sameSceneNext") else hi
                lo = max(0, lo - int(0.45 * SR)) if ch.get("sameScenePrev") else lo
                a = a[lo:hi]
                a = tempo(a, factor)
                sp = (info.get("speech") or [None] * len(texts))[k]
                if sp:  # speech bounds of the sentence from the word timestamps (seconds in the raw clip)
                    first = max(0.0, (sp[0] * sr - bounds[k] - lo * sr / SR) / sr / factor)
                    last = min(len(a) / SR, max(first + 0.1, (sp[1] * sr - bounds[k] - lo * sr / SR) / sr / factor))
                else:
                    first, last = 0.0, len(a) / SR
                return a, first, last, len(a) / SR
        self.fallbacks.append(texts[k])
        log(f"  WARNING chatterbox paragraph clip missing -> Kokoro {self.fallback_voice}: {texts[k]!r}")
        a = self.kokoro().synth(texts[k], DEFAULT_SPEED)
        return a, 0.0, len(a) / SR, len(a) / SR

    def kokoro(self):
        if self._kokoro is None:
            self._kokoro = KokoroEngine(self.fallback_voice)
        return self._kokoro

    def synth(self, text, speed, d=None):
        ex, cfg = self._settings(d)
        key = self._key(text, ex, cfg)
        path = TTS_CACHE / "chatterbox" / f"{key}.wav"
        factor = self.factor(speed)
        if self.recording:
            self.jobs[key] = {"id": key, "text": text, "expected": text, "exaggeration": ex, "cfgWeight": cfg,
                              "temperature": self.temperature, "seed": int(key[:8], 16) % 100000, "out": str(path)}
            return np.zeros(int(SR * max(0.4, 0.06 * len(text) / max(0.5, factor))), dtype=np.float32)
        if path.exists():
            a, sr = sf.read(str(path), dtype="float32")
            a = trim(resample(np.asarray(a).reshape(-1), sr))
            if len(a) > SR * 0.15:
                meta = Path(str(path) + ".json")
                self.used[key] = {"text": text, **(json.loads(meta.read_text()) if meta.exists() else {})}
                return tempo(a, factor)
        self.fallbacks.append(text)
        log(f"  WARNING chatterbox clip missing -> Kokoro {self.fallback_voice}: {text!r}")
        return self.kokoro().synth(text, DEFAULT_SPEED * factor)

    def prepare_reference(self):
        if self.reference == "default":
            self.ref_path, self.ref_id = "default", "default"
            return
        if self.reference != "narrator":
            fail(f"voice.reference must be 'narrator' or 'default', not {self.reference!r}")
        rid = hashlib.sha1(f"{NARRATOR_VOICE}|{NARRATOR_SPEED}|{NARRATOR_TEXT}".encode()).hexdigest()[:12]
        cached = TTS_CACHE / f"narrator-ref-{rid}.wav"
        if not cached.exists():
            log(f"generating the narrator reference with Kokoro {NARRATOR_VOICE} ...")
            k = self.kokoro() if self.fallback_voice == NARRATOR_VOICE else KokoroEngine(NARRATOR_VOICE)
            parts = []
            for sent in split_sentences(NARRATOR_TEXT):
                parts += [k.synth(sent, NARRATOR_SPEED), np.zeros(int(0.22 * SR), dtype=np.float32)]
            cached.parent.mkdir(parents=True, exist_ok=True)
            sf.write(str(cached), np.concatenate(parts), SR, subtype="PCM_16")
        dest = ROOT / "brand" / "voices" / "narrator-ref.wav"  # generated at render time, never committed
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(cached, dest)
        self.ref_path, self.ref_id = str(cached), "narrator-" + rid

    @staticmethod
    def partition(jobs, n):
        """Deterministic split of the clips over n runner jobs (largest text first, least-loaded bucket)."""
        buckets, loads = [[] for _ in range(n)], [0] * n
        for j in sorted(jobs, key=lambda j: (-len(j["text"]), j["id"])):
            b = loads.index(min(loads))
            buckets[b].append(j)
            loads[b] += len(j["text"])
        return buckets

    def generate(self, shard=None):
        """shard=(i, n): CI fan-out (render.yml job 'tts'): generate only bucket i of n of all clips."""
        self.recording = False
        jobs = list(self.jobs.values())
        if shard:
            jobs = self.partition(jobs, shard[1])[shard[0]]
            log(f"chatterbox fan-out: shard {shard[0]}/{shard[1]} = {len(jobs)} of {len(self.jobs)} clips")
        todo = [j for j in jobs if not Path(j["out"]).exists()]
        log(f"chatterbox: {len(jobs)} clips, {len(todo)} to generate (cache {TTS_CACHE / 'chatterbox'})")
        if not todo:
            return
        try:
            py = cb_python()
        except Exception as e:  # noqa: BLE001
            log(f"  WARNING Chatterbox venv failed ({e}); every sentence falls back to Kokoro")
            return
        cores = os.cpu_count() or 2
        try:
            mem_gb = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2 ** 30
        except (ValueError, OSError):
            mem_gb = 8
        shards = int(os.environ.get("SOP_TTS_SHARDS") or (2 if cores >= 4 and mem_gb >= 12 else 1))
        shards = max(1, min(shards, len(todo)))
        threads = max(1, cores // shards)
        buckets = [[] for _ in range(shards)]
        loads = [0] * shards
        for j in sorted(todo, key=lambda j: -len(j["text"])):
            b = loads.index(min(loads))
            buckets[b].append(j)
            loads[b] += len(j["text"])
        wd = work_dir(self.slug)
        (TTS_CACHE / "chatterbox").mkdir(parents=True, exist_ok=True)
        procs = []
        t0 = time.time()
        for n, b in enumerate(buckets):
            jf = wd / f"cb-jobs-{n}.json"
            jf.write_text(json.dumps(b, ensure_ascii=False))
            env = dict(os.environ, OMP_NUM_THREADS=str(threads), MKL_NUM_THREADS=str(threads),
                       TOKENIZERS_PARALLELISM="false")
            procs.append(run_logged([py, str(CB_WORKER), "synth", "--jobs", str(jf), "--ref", self.ref_path,
                                     "--threads", str(threads), "--asr", ASR_MODEL], f"  [shard {n}] ", env))
        budget = float(os.environ.get("SOP_TTS_BUDGET_MIN") or 45) * 60
        for p, th in procs:
            try:
                p.wait(timeout=max(1, budget - (time.time() - t0)))
            except subprocess.TimeoutExpired:
                log("  WARNING Chatterbox TTS budget exceeded: stopping; missing clips fall back to Kokoro")
                p.kill()
            th.join(timeout=5)
        log(f"chatterbox: generated in {time.time() - t0:.0f}s with {shards} shard(s) x {threads} thread(s)")

    def report(self):
        clips = list(self.used.values())
        for c in clips:  # re-score cached clips with the current normaliser (pipeline/textnorm.py)
            if c.get("asr") is not None:
                c["wer"] = round(textnorm.wer(c["text"], c["asr"]), 3)
                c["cer"] = round(textnorm.cer(c["text"], c["asr"]), 3)
        words = [len(c["text"].split()) for c in clips]
        wers = [(c.get("wer") or 0.0) for c in clips]
        tot = sum(words) or 1
        bad = [{"text": c["text"], "wer": c.get("wer"), "cer": c.get("cer"), "asr": c.get("asr")} for c in clips
               if textnorm.bad_sentence(c["text"], c.get("asr"))]
        misheard = sum(1 for c in clips if (c.get("wer") or 0) > 0.30)
        return {"engine": "chatterbox", "reference": self.reference, "clips": len(clips),
                "exaggerationOffset": self.ex_off, "cfgOffset": self.cfg_off,
                "clipWer": round(sum(w * n for w, n in zip(wers, words)) / tot, 4),
                "retried": sum(1 for c in clips if c.get("retried")), "badSentences": bad, "misheardShortClips": misheard - len(bad),
                "fallbackSentences": sorted(set(self.fallbacks))}


def make_engine(engine, voice, speaker=None, settings=None, slug=""):
    if engine == "chatterbox":
        return ChatterboxEngine(voice, speaker, settings, slug)
    if engine == "piper":
        return PiperEngine(voice, speaker)
    if engine in ("kokoro", None, ""):
        return KokoroEngine(voice, speaker)
    fail(f"unknown TTS engine '{engine}' (kokoro | piper | chatterbox)")


def speak(engine, text, speed, d=None):
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
        a = engine.synth(part, speed, d) if d is not None else engine.synth(part, speed)
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


def spoken_text(text, d):
    """(TTS text, pause before) of one raw sentence with its delivery, as layout() speaks it."""
    if d is None:
        return text, 0.0
    spoken = dlv.strip_tags(text)
    if d["style"] == "punch":
        return dlv.punch_text(spoken)
    return spoken, 0.0


FAMILY = {"calm": "narr", "curious": "narr", "warm": "narr", "tense": "build", "build": "build",
          "excited": "peak", "punch": "peak", "somber": "somber"}


HARD_KINDS = {"chapter", "question", "reveal", "verdict", "lesson"}


def chunk_plan(scenes, deliveries, intro_after=None):
    """VOICE-10b: {(scene, sentence): {"texts", "pos", "d", "last", "sameScenePrev", "sameSceneNext"}} = which
    sentences Chatterbox speaks in one call. A chunk holds 2-4 consecutive sentences of the same delivery family
    (<= 45 words / 250 chars, no [pause] marker inside). It may run across scene boundaries (most scenes hold one
    sentence) but never into or out of a chapter / question / reveal / verdict / lesson scene, across the brand sting
    or a cold-open boundary; it takes the strongest delivery (highest exaggeration) inside it."""
    groups, cur = [], []

    def close():
        nonlocal cur
        if len(cur) >= 2:
            groups.append(cur)
        cur = []

    prev_scene = None
    for i, sc in enumerate(scenes):
        if prev_scene is not None and (sc.get("kind") in HARD_KINDS or prev_scene.get("kind") in HARD_KINDS
                                       or intro_after == i - 1 or cold_open(sc) != cold_open(prev_scene)):
            close()
        prev_scene = sc
        for j, raw in enumerate(split_sentences(sc["narration"])):
            d = (deliveries or {}).get((i, j))
            spoken, _ = spoken_text(raw, d)
            text = re.sub(r"\s+", " ", strip_emphasis(spoken)).strip()
            if not re.search(r"\w", text) or PAUSE_RE.search(spoken):
                close()
                continue
            fam = FAMILY.get((d or {}).get("style"), "narr")
            if cur and (fam != cur[0][4] or len(cur) >= PARA_MAX_SENT
                        or sum(len(x[2].split()) for x in cur) + len(text.split()) > PARA_MAX_WORDS
                        or sum(len(x[2]) + 1 for x in cur) + len(text) > PARA_MAX_CHARS):
                close()
            cur.append((i, j, text, d, fam))
    close()
    out = {}
    for g in groups:
        strongest = max((x[3] for x in g if x[3] is not None), key=lambda d: d["exaggeration"], default=None)
        for pos, (i, j, text, d, fam) in enumerate(g):
            out[(i, j)] = {"texts": [x[2] for x in g], "pos": pos, "d": strongest, "last": pos == len(g) - 1,
                           "sameScenePrev": pos > 0 and g[pos - 1][0] == i,
                           "sameSceneNext": pos < len(g) - 1 and g[pos + 1][0] == i}
    return out


def layout(engine, scenes, speed, intro=0.0, outro=0.0, intro_after=None, pause_before=None, deliveries=None,
           pace=1.0, pause_scale=1.0, chunks=None):
    """Scene timing. intro_after = index of the scene after which an `intro` s gap (brand sting) is inserted;
    None with intro > 0 = the gap comes first (legacy). pause_before = {scene index: seconds}: the previous scene
    holds that much longer (silence before the reveal). pace multiplies every clip's speed (VOICE-8), pause_scale
    every sentence gap and style pause."""
    gap = SENTENCE_GAP * pause_scale
    t = snap(intro) if intro_after is None else 0.0
    intro_at = 0.0
    out = []
    clips = []
    for i, sc in enumerate(scenes):
        p = float((pause_before or {}).get(i) or 0.0)
        if p > 0 and out and not (intro > 0 and intro_after == i - 1):
            t = snap(t + p)
            out[-1]["end"] = round(t, 3)
            log(f"  reveal pause      {p:.2f}s before {sc['id']}")
        start = t
        sp = float(sc.get("voiceSpeed") or speed) * pace
        cur = start + (FIRST_LEAD if i == 0 else SCENE_LEAD)
        sents = []
        for j, text in enumerate(split_sentences(sc["narration"])):
            d = (deliveries or {}).get((i, j))
            spoken, pb = spoken_text(text, d)
            cur += pb
            ch = (chunks or {}).get((i, j))
            if ch is not None:
                a, first, last, dur = engine.chunk_part(ch, sp)
            else:
                a, first, last, dur = speak(engine, spoken, sp, d)
            if first is None:  # only a pause
                cur += dur
                continue
            clips.append((cur, a))
            sents.append({"text": clean_text(text), "start": round(cur + first, 3), "end": round(cur + last, 3),
                          **({"delivery": d["style"]} if d is not None else {}),
                          **({"paragraph": True} if ch is not None else {})})
            # inside a paragraph clip the sentence keeps its natural trailing pause: only a small extra beat
            g = PARA_GAP * pause_scale if ch is not None and ch["sameSceneNext"] else gap
            cur += dur + g + (d["pauseAfter"] * pause_scale if d is not None else 0.0)
        voice_end = sents[-1]["end"] if sents else start
        end = max(voice_end, cur - gap if sents else cur) + SCENE_TAIL
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
            **({"coldOpen": True} if cold_open(sc) else {}),
        })
        log(f"  scene {sc['id']:<8} {sc['kind']:<12} {start:7.2f} -> {end:7.2f}{'  (cold open)' if cold_open(sc) else ''}")
        t = end
        if intro > 0 and intro_after == i:
            intro_at = t
            t = snap(t + intro)
            log(f"  brand sting       {intro_at:7.2f} -> {t:7.2f}")
    total = snap(t + outro)
    return out, clips, total, intro_at


def pace_stats(scenes):
    """Measured narration pace of a laid-out cut (VOICE-8 target 145-155 wpm)."""
    words = speech = artic = 0.0
    for sc in scenes:
        ss = sc.get("sentences") or []
        if not ss:
            continue
        words += sum(len(s["text"].split()) for s in ss)
        speech += max(0.0, ss[-1]["end"] - ss[0]["start"])
        artic += sum(max(0.0, s["end"] - s["start"]) for s in ss)
    return {"words": int(words), "speechSec": round(speech, 2), "wpm": round(60.0 * words / speech, 1) if speech else None,
            "articulationWpm": round(60.0 * words / artic, 1) if artic else None}


PAUSE_MIN, PAUSE_MAX = 1.0, 1.6


def calibrate_pauses(engine, spec, cut, speed, plan, pace, pause_scale, band, chunks=None):
    """VOICE-10a pace guard: re-measure the main cut's wpm with the real clips and nudge only the PAUSES
    (pauseScale 1.0-1.6) toward `band`; the voice itself is never stretched."""
    lo, hi = band
    intro_after, intro = brand_intro_plan(spec, cut)
    wpm = None
    for _ in range(3):
        scenes = layout(engine, cut["scenes"], speed, intro, 0.0, intro_after, None, plan, pace, pause_scale,
                        chunks)[0]
        ps = pace_stats(scenes)
        wpm = ps["wpm"]
        if not wpm or lo <= wpm <= hi or not ps["articulationWpm"]:
            break
        # wpm = words / (speech + pauses): solve for the pause time that hits the band centre
        words, artic = ps["words"], 60.0 * ps["words"] / ps["articulationWpm"]
        pauses = max(0.01, ps["speechSec"] - artic)
        want = max(0.0, 60.0 * words / ((lo + hi) / 2.0) - artic)
        new = round(min(PAUSE_MAX, max(PAUSE_MIN, pause_scale * want / pauses)), 3)
        log(f"pace guard: {wpm} wpm at pauses x{pause_scale} is outside {lo}-{hi} -> pauses x{new}")
        if abs(new - pause_scale) < 0.01:
            break
        pause_scale = new
    log(f"pace guard: pauses x{pause_scale} -> {wpm} wpm (target {lo}-{hi}; no time-stretch)")
    return pause_scale, wpm


def track_qa(slug, engine, engine_name, tuning=None):
    """VOICE-4: whole-track ASR (overall WER) + liveliness of the main cut, plus the per-clip Chatterbox checks."""
    d = cut_dir(slug, "main")
    timing = json.loads((d / "timing.json").read_text())
    text = " ".join(s["text"] for sc in timing["scenes"] for s in sc["sentences"])
    res = {"engine": engine_name}
    if hasattr(engine, "report"):
        res.update(engine.report())
    res["pace"] = {**pace_stats(timing["scenes"]), **(tuning or {}), "tempoFilter": dict(TEMPO_USED)}
    try:
        py = cb_python()
        tf = work_dir(slug) / "voice-text.txt"
        tf.write_text(text, encoding="utf-8")
        out = work_dir(slug) / "voice-track-qa.json"
        p, th = run_logged([py, str(CB_WORKER), "trackqa", "--wav", str(d / "voice.wav"), "--text", str(tf),
                            "--out", str(out), "--asr", ASR_MODEL], "  [voice-qa] ")
        p.wait(timeout=1200)
        th.join(timeout=5)
        if out.exists():
            res.update(json.loads(out.read_text()))
    except Exception as e:  # noqa: BLE001
        log(f"  WARNING voice QA failed: {e}")
        res["error"] = str(e)
    write_json(work_dir(slug) / "voice-qa.json", res)
    log(f"voice QA: WER {res.get('wer')} liveliness {(res.get('liveliness') or {}).get('mean')} st")


def export_shard(engine, shard, dest):
    """Copy the clips (+ .json QA info) of this fan-out shard to dest for upload as a workflow artifact."""
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for j in engine.partition(list(engine.jobs.values()), shard[1])[shard[0]]:
        for f in (Path(j["out"]), Path(j["out"] + ".json")):
            if f.exists():
                shutil.copyfile(f, dest / f.name)
                n += f.suffix == ".wav"
    log(f"chatterbox fan-out: exported {n} clip(s) to {dest}")


def parse_shard(text):
    """'i/n' -> (i, n) with 0 <= i < n, or None."""
    if not text:
        return None
    m = re.fullmatch(r"\s*(\d+)\s*/\s*(\d+)\s*", text)
    if not m or not 0 <= int(m.group(1)) < int(m.group(2)):
        fail(f"--shard must be i/n with 0 <= i < n, not {text!r}")
    return int(m.group(1)), int(m.group(2))


def main():
    args = slug_arg(lambda p: (p.add_argument("--shard", default="", help="i/n: only generate fan-out shard i of n "
                                              "(Chatterbox clips into the cache, no voice.wav)"),
                               p.add_argument("--export", default="", help="with --shard: copy the shard's clips here")))
    shard = parse_shard(args.shard)
    spec = load_spec(args.slug)
    v = spec["voice"]
    engine_name = v.get("engine") or "kokoro"
    voice = v.get("voice", "bm_george")
    engine = make_engine(engine_name, voice, v.get("speaker"), v, args.slug)
    speed = float(v.get("speed") or engine.default_speed)
    tuned = engine_name == "chatterbox"  # VOICE-8 channel tuning; other engines only when the spec sets it
    pace = float(v.get("pace") or (dlv.CHANNEL_TUNING["pace"] if tuned else 1.0))
    # VOICE-11: paragraph generation is the channel default for Chatterbox (spec.voice.paragraphs false opts out)
    paragraphs = tuned and bool(v.get("paragraphs", dlv.CHANNEL_TUNING["paragraphs"]))
    pause_scale = float(v.get("pauseScale") or (dlv.CHANNEL_TUNING["pauseScale"] if tuned else 1.0))
    band = [float(x) for x in (v.get("targetWpm") or [145, 155])]
    tuning = {"pace": pace, "pauseScale": pause_scale, "targetWpm": band, "paragraphs": paragraphs,
              "stretch": "none" if not tuned or abs(engine.factor() - 1.0) < 0.01 else "<=3%"}
    plans, chunks = {}, {}
    if getattr(engine, "uses_delivery", False):
        engine.prepare_reference()
        for cut in cuts(spec):  # pass 1: collect every clip of every cut (shorts reuse the main cut's clips)
            plans[cut["name"]] = dlv.plan(cut["scenes"], lambda sc: split_sentences(sc["narration"]),
                                          seed=f"{args.slug}/{cut['name']}")
            counts = collections.Counter(x["style"] for x in plans[cut["name"]].values())
            log(f"delivery {cut['name']}: " + ", ".join(f"{k} {n}" for k, n in sorted(counts.items())))
            if paragraphs:
                chunks[cut["name"]] = chunk_plan(cut["scenes"], plans[cut["name"]], brand_intro_plan(spec, cut)[0])
                log(f"paragraphs {cut['name']}: {len(chunks[cut['name']])} sentences in "
                    f"{sum(1 for c in chunks[cut['name']].values() if c['pos'] == 0)} paragraph clips")
            intro_after, intro = brand_intro_plan(spec, cut)
            layout(engine, cut["scenes"], speed, intro, 0.0, intro_after, None, plans[cut["name"]], pace, pause_scale,
                   chunks.get(cut["name"]))
        engine.generate(shard)
        if shard:
            if args.export:
                export_shard(engine, shard, args.export)
            return
    elif shard:
        log(f"engine {engine_name} needs no fan-out: nothing to do for shard {args.shard}")
        return
    # VOICE-11: the pace guard is opt-in (spec.voice.targetWpm); by default the natural Chatterbox speed + pauses x1.15
    guard = bool(v.get("targetWpm")) or dlv.CHANNEL_TUNING["paceGuard"]
    if tuned and guard and not v.get("pace") and not v.get("pauseScale") and plans:
        main_cut = cuts(spec)[0]
        pause_scale, measured = calibrate_pauses(engine, spec, main_cut, speed, plans.get(main_cut["name"]), pace,
                                                 pause_scale, band, chunks.get(main_cut["name"]))
        tuning.update({"pauseScale": pause_scale, "pauseScaleDefault": dlv.CHANNEL_TUNING["pauseScale"],
                       "calibratedWpm": measured})
    for cut in cuts(spec):
        intro_after, intro = brand_intro_plan(spec, cut)
        outro = OUTRO_SEC if branded(cut) else 0.0
        log(f"TTS {args.slug}/{cut['name']} engine={engine_name} voice={voice} speed={speed} sting={intro}s "
            f"(after scene #{intro_after}) outro={outro}s pace={pace} pauseScale={pause_scale}")
        ri = reveal_index(cut["scenes"])
        pause = sound_opts(spec)["revealPauseSec"] if ri else 0.0
        scenes, clips, total, intro_at = layout(engine, cut["scenes"], speed, intro, outro, intro_after,
                                                {ri: pause} if pause > 0 else None, plans.get(cut["name"]),
                                                pace, pause_scale, chunks.get(cut["name"]))
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
            "introSec": intro, "introAtSec": round(intro_at, 3), "outroSec": outro, "engine": engine_name, "voice": voice, "speed": speed,
            **({"revealAtSec": scenes[ri]["start"], "revealPauseSec": pause} if ri else {}),
            "pace": {**pace_stats(scenes), **tuning},
            "scenes": scenes,
        })
        ps = pace_stats(scenes)
        log(f"  total {total:.2f}s -> {d / 'voice.wav'}  ({ps['words']} words, {ps['wpm']} wpm, "
            f"articulation {ps['articulationWpm']} wpm, tempo {dict(TEMPO_USED)})")
    if engine_name == "chatterbox" or os.environ.get("SOP_VOICE_QA") == "1" or v.get("qa"):
        track_qa(args.slug, engine, engine_name, tuning)


if __name__ == "__main__":
    main()
