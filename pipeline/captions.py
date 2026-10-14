"""captions.srt plus word timings (words.json) per cut, derived from the sentence timings."""
import shutil

from common import cut_dir, cuts, load_spec, log, out_dir, read_json, slug_arg, write_json

MAX_CUE_CHARS = 84
LINE_CHARS = 42


def word_timings(sentence):
    words = sentence["text"].split()
    if not words:
        return []
    weights = [len(w) + 2 for w in words]
    total = float(sum(weights))
    span = sentence["end"] - sentence["start"]
    t = sentence["start"]
    res = []
    for w, wt in zip(words, weights):
        d = span * wt / total
        res.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return res


def srt_time(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def wrap(text):
    if len(text) <= LINE_CHARS:
        return text
    words = text.split()
    best, line = None, ""
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = abs(len(a) - len(b))
        if best is None or score < best[0]:
            best = (score, a, b)
    return f"{best[1]}\n{best[2]}" if best else text


def cues_for(sentence_words):
    cues, cur = [], []
    for w in sentence_words:
        if cur and len(" ".join(x["text"] for x in cur + [w])) > MAX_CUE_CHARS:
            cues.append(cur)
            cur = []
        cur.append(w)
    if cur:
        cues.append(cur)
    return [{"start": c[0]["start"], "end": c[-1]["end"], "text": " ".join(x["text"] for x in c)} for c in cues]


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    out = out_dir(args.slug)
    for cut in cuts(spec):
        d = cut_dir(args.slug, cut["name"])
        timing = read_json(d / "timing.json")
        words, cues = [], []
        for sc in timing["scenes"]:
            for s in sc["sentences"]:
                ws = word_timings(s)
                for w in ws:
                    w["sceneId"] = sc["id"]
                words.extend(ws)
                cues.extend(cues_for(ws))
        lines = []
        for i, c in enumerate(cues, 1):
            lines += [str(i), f"{srt_time(c['start'])} --> {srt_time(c['end'])}", wrap(c["text"]), ""]
        (d / "captions.srt").write_text("\n".join(lines), encoding="utf-8")
        write_json(d / "words.json", words)
        target = out / ("captions.srt" if cut["name"] == "main" else f"{cut['name']}.srt")
        shutil.copyfile(d / "captions.srt", target)
        log(f"captions {cut['name']}: {len(cues)} cues, {len(words)} words -> {target.name}")


if __name__ == "__main__":
    main()
