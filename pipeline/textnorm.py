"""Text normalisation for the voice QA (ASR word error rate), shared by tts.py and chatterbox_worker.py.

Standard library only: chatterbox_worker.py runs in its own venv and imports this file from the same directory.

The ASR (faster-whisper) writes numbers as digits ('$82.5 million', '23rd of September 2010') while the narration
spells them out ('eighty-two and a half million', 'twenty-third of September, two thousand and ten'). Both sides are
therefore mapped to ONE canonical form before they are compared:
  - lower case, **emphasis**, [pause N] markers and [style] tags removed, punctuation dropped, hyphens split;
  - every number phrase becomes digits: 'eighty two and a half million' -> 82500000, '$82.5 million' -> 82500000,
    'nineteen ninety-seven' -> 1997, 'two thousand and ten' -> 2010, 'two point five' -> 2.5,
    'twenty-third' / '23rd' -> 23ord, 'the nineties' / '90s' -> 90s;
  - '<n> dollars <m>' -> n.m ('nineteen dollars ninety-five' == '$19.95'); the words dollar(s)/cents are dropped
    (the narration often leaves the currency implicit); '%' -> percent, '&' -> and.

wer(ref, hyp)  word error rate on the canonical tokens.
cer(ref, hyp)  character error rate on the canonical text without spaces (robust for 2-4 word sentences:
               'lifer' vs 'life-er', 'DVDs' vs 'TVTs').
bad_sentence(ref, hyp)  the per-clip QA verdict: WER > 0.30 AND (CER > 0.20, or >= 6 words, or the ASR heard at
               least two words fewer = a cut-off / skipped phrase). Short sentences with one misheard word no longer
               fail the render; garbled, truncated or hallucinated clips still do.
"""
import re

UNITS = {w: i for i, w in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen "
    "seventeen eighteen nineteen".split())}
TENS = {w: 10 * i for i, w in enumerate("_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()) if i >= 2}
TENS_PLURAL = {w + "s": v for w, v in ((w[:-1] + "ie" if w.endswith("y") else w, v) for w, v in TENS.items())}
SCALES = {"thousand": 10 ** 3, "million": 10 ** 6, "billion": 10 ** 9, "trillion": 10 ** 12}
ORDINALS = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8,
            "ninth": 9, "tenth": 10, "eleventh": 11, "twelfth": 12, "thirteenth": 13, "fourteenth": 14,
            "fifteenth": 15, "sixteenth": 16, "seventeenth": 17, "eighteenth": 18, "nineteenth": 19,
            "twentieth": 20, "thirtieth": 30, "fortieth": 40, "fiftieth": 50, "sixtieth": 60, "seventieth": 70,
            "eightieth": 80, "ninetieth": 90}
NUM_RE = re.compile(r"^\d+(?:\.\d+)?$")
ORD_RE = re.compile(r"^(\d+)(?:st|nd|rd|th)$")
DECADE_RE = re.compile(r"^(\d+)s$")
DROP = {"dollar", "dollars", "cent", "cents"}


def _is_numword(t):
    return t in UNITS or t in TENS or t in ORDINALS or t in TENS_PLURAL or t == "hundred" or t in SCALES


def _fmt(v):
    if abs(v - round(v)) < 1e-9:
        return str(int(round(v)))
    return f"{v:.6f}".rstrip("0").rstrip(".")


def _parse(tok, i):
    """One number phrase from tok[i]: (next index, canonical token) or (i, None)."""
    n = len(tok)
    total, group, seen, last, suffix = 0.0, 0.0, False, i, ""
    year_done = False
    while i < n:
        t = tok[i]
        nxt = tok[i + 1] if i + 1 < n else ""
        if NUM_RE.match(t):
            if seen:
                break
            group, seen = float(t), True
            i += 1
            last = i
            continue
        m = ORD_RE.match(t) or DECADE_RE.match(t)
        if m:
            if seen:
                break
            group, seen, suffix = float(m.group(1)), True, ("ord" if ORD_RE.match(t) else "s")
            i += 1
            last = i
            break
        if t == "a" and not seen and nxt in SCALES or (t == "a" and not seen and nxt == "hundred"):
            group, seen = 1.0, True
            i += 1
            continue
        if t == "and" and seen:
            if _is_numword(nxt) or (nxt == "a" and i + 2 < n and tok[i + 2] == "half"):
                i += 1
                continue
            break
        if t == "a" and seen and nxt == "half":
            group += 0.5
            i += 2
            last = i
            continue
        if t == "point" and seen and nxt in UNITS and UNITS[nxt] < 10:
            digits = ""
            i += 1
            while i < n and tok[i] in UNITS and UNITS[tok[i]] < 10:
                digits += str(UNITS[tok[i]])
                i += 1
            group += float("0." + digits)
            last = i
            continue
        if t == "oh" and seen and 10 <= group <= 99 and total == 0 and nxt in UNITS and UNITS[nxt] < 10:
            group = group * 100 + UNITS[nxt]
            year_done = True
            i += 2
            last = i
            continue
        if t in UNITS or t in TENS or t in ORDINALS or t in TENS_PLURAL:
            v = UNITS.get(t, TENS.get(t, ORDINALS.get(t, TENS_PLURAL.get(t))))
            small = group % 100
            if not seen or (group % 1 == 0 and small == 0 and not year_done):
                group += v
            elif small % 10 == 0 and small >= 20 and v < 10 and group % 1 == 0:
                group += v
            elif 10 <= group <= 99 and total == 0 and v >= 10 and not year_done:
                group = group * 100 + v  # 'nineteen ninety' -> 1990, 'twenty ten' -> 2010
            else:
                break
            seen = True
            i += 1
            last = i
            if t in ORDINALS or t in TENS_PLURAL:
                suffix = "ord" if t in ORDINALS else "s"
                break
            continue
        if t == "hundred" and seen:
            group = (group or 1) * 100
            i += 1
            last = i
            continue
        if t in SCALES and seen:
            total += (group or 1) * SCALES[t]
            group = 0.0
            i += 1
            last = i
            continue
        break
    if not seen:
        return last, None
    return last, _fmt(total + group) + suffix


def canon(text):
    """Canonical token list of a narration sentence or an ASR transcript."""
    t = (text or "").lower().replace("**", "")
    t = re.sub(r"\[[^\]]*\]", " ", t)
    t = t.replace("%", " percent ").replace("&", " and ")
    t = re.sub(r"\$\s?(\d[\d,]*(?:\.\d+)?)\s*(thousand|million|billion|trillion)?",
               lambda m: f" {m.group(1)} {m.group(2) or ''} dollars ", t)
    t = re.sub(r"(?<=\d),(?=\d{3}\b)", "", t)
    t = re.sub(r"(?<=\d),(?=\d{3}\b)", "", t)
    t = t.replace("'", "").replace("’", "")
    t = re.sub(r"(?<!\d)\.|\.(?!\d)", " ", t)
    t = re.sub(r"[^a-z0-9. ]+", " ", t)
    tok = t.split()
    out, i = [], 0
    while i < len(tok):
        j, num = _parse(tok, i)
        if num is not None and j > i:
            out.append(num)
            i = j
        else:
            out.append(tok[i])
            i += 1
    s = " ".join(out)
    s = re.sub(r"\b(\d+) dollars? (\d{1,2})\b(?! ?(?:dollars?|percent|\d))", r"\1.\2", s)
    s = re.sub(r"\b(\d+)\.(\d)0\b", r"\1.\2", s)
    return [w for w in s.split() if w not in DROP]


def _edits(r, h):
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)]


def wer(ref, hyp):
    r, h = canon(ref), canon(hyp)
    if not r:
        return 0.0 if not h else 1.0
    return _edits(r, h) / len(r)


def cer(ref, hyp):
    r, h = "".join(canon(ref)), "".join(canon(hyp))
    if not r:
        return 0.0 if not h else 1.0
    return _edits(r, h) / len(r)


def bad_sentence(ref, hyp, limit=0.30):
    """Per-clip QA verdict (see the module doc)."""
    if hyp is None:
        return False
    r, h = canon(ref), canon(hyp)
    w = wer(ref, hyp)
    if w <= limit:
        return False
    return cer(ref, hyp) > 0.20 or len(r) >= 6 or len(h) < len(r) - 1


if __name__ == "__main__":
    import sys
    a, b = sys.argv[1], sys.argv[2]
    print(canon(a), canon(b), round(wer(a, b), 3), round(cer(a, b), 3), bad_sentence(a, b))
