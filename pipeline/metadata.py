"""Final YouTube metadata: description with chapters, sources, credits and synthetic-voice disclosure."""
import re

from common import (ROOT, add_warning, cut_dir, cuts, fmt_ts, is_test, load_spec, log, out_dir, read_json, slug_arg,
                    work_dir, write_json)

KEY_KINDS = {"title", "question", "reveal", "verdict", "lesson", "evidence", "timeline", "map", "chapter"}
MIN_CHAPTER = 10.0


MAX_LABEL_WORDS = 6
MAX_LABEL_CHARS = 60
SOURCES_HEADING = re.compile(r"^\s*sources\s*:?\s*$", re.I | re.M)


def clean_label(text):
    """Plain-text chapter label: no markdown emphasis / code / [tags], one line, at most MAX_LABEL_CHARS."""
    t = re.sub(r"\[[^\]]*\]", " ", str(text or ""))
    t = re.sub(r"(\*\*|__|\*|`|~~)", "", t)
    t = re.sub(r"^\s*#+\s*", "", t)
    t = " ".join(t.split())
    if len(t) > MAX_LABEL_CHARS:
        t = t[:MAX_LABEL_CHARS].rsplit(" ", 1)[0]
    return t.rstrip(".,;:!-–— ")


def narration_label(narration):
    """Whole leading sentences while they fit in MAX_LABEL_WORDS words, else the first words."""
    text = " ".join(re.sub(r"\[[^\]]*\]", " ", narration or "").split())
    sentences = [x for x in re.split(r"(?<=[.!?])\s+", text) if x]
    out = []
    for sent in sentences:
        if len(out) + len(sent.split()) > MAX_LABEL_WORDS:
            break
        out += sent.split()
    if not out:
        out = text.split()[:MAX_LABEL_WORDS]
    return " ".join(out)


def label_for(sc):
    return clean_label(raw_label(sc)) or "Chapter"


def raw_label(sc):
    v, k = sc["visual"], sc["kind"]
    if sc.get("onScreenText"):
        return sc["onScreenText"]
    if k == "title":
        return v.get("title") or "Intro"
    if k == "chapter" and v.get("title"):
        return v["title"]
    fixed = {"question": "Would you sign?", "reveal": "What happened", "verdict": "The verdict", "lesson": "The lesson"}
    if k in fixed:
        return fixed[k]
    return narration_label(sc["narration"])


def chapters(scenes, timing):
    t_by = {s["id"]: s for s in timing["scenes"]}
    total = timing["totalSec"]

    def build(only_key):
        ch = [(0.0, label_for(scenes[0]))]
        for sc in scenes[1:]:
            if only_key and sc["kind"] not in KEY_KINDS:
                continue
            st = t_by[sc["id"]]["start"]
            if st - ch[-1][0] >= MIN_CHAPTER and total - st >= MIN_CHAPTER:
                ch.append((st, label_for(sc)))
        return ch

    ch = build(True)
    if len(ch) < 3:
        ch = build(False)
    return ch if len(ch) >= 3 else []


def music_credit(slug):
    """Credit line for a library track; generated (musicgen, CC0) and no music need none."""
    music_path = work_dir(slug) / "music.json"
    if not music_path.exists():
        return ""
    m = read_json(music_path)
    if m.get("kind") in ("generated", "none"):
        return ""
    return (m.get("attribution_text") or "").strip() or f"{m.get('title')} by {m.get('artist')} ({m.get('license')})"


def voice_credit(spec):
    """Attribution for voices trained on CC BY data (brand/voices.json 'attribution')."""
    v = spec.get("voice") or {}
    path = ROOT / "brand" / "voices.json"
    if not path.exists():
        return ""
    for entry in read_json(path).get("voices") or []:
        if entry.get("id") == v.get("voice") and entry.get("engine") == (v.get("engine") or "kokoro"):
            return (entry.get("attribution") or "").strip()
    return ""


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    md = spec["metadata"]
    timing = read_json(cut_dir(args.slug, "main") / "timing.json")
    ch = chapters(spec["scenes"], timing)
    if not ch:
        add_warning(args.slug, "video too short for >= 3 chapters of >= 10 s: no chapters in description")

    parts = [md["description"].strip()]
    if ch:
        parts.append("Chapters\n" + "\n".join(f"{fmt_ts(t)} {label}" for t, label in ch))
    sources = spec.get("sources") or []
    if sources and SOURCES_HEADING.search(md["description"]):
        log("metadata: description already has a Sources block; not appending the spec sources again")
    elif sources:
        parts.append("Sources\n" + "\n".join(f"- {s['title']}: {s['url']}" for s in sources))
    assets_path = work_dir(args.slug) / "assets.json"
    assets = read_json(assets_path) if assets_path.exists() else {}
    if assets:
        parts.append("Image credits\n" + "\n".join(
            f"- {a['attribution']} ({a['license']}) {a.get('sourcePage', '')}".rstrip() for a in assets.values()))
    credit = music_credit(args.slug)
    if credit:
        parts.append("Music\n" + credit)
    vcredit = voice_credit(spec)
    if vcredit:
        parts.append("Voice\n" + vcredit)
    parts.append("Illustrations, music and sound effects: Signed or Passed, unless credited above. People are shown as "
                 "faceless figures; no real likenesses or logos are used.\nNarrated with a synthetic voice.")
    description = "\n\n".join(parts)
    if len(description) > 5000:
        add_warning(args.slug, f"description is {len(description)} chars; truncated to 5000")
        description = description[:4990] + "..."

    tags, used = [], 0
    for t in md.get("tags") or []:
        if used + len(t) + 1 > 480:
            break
        tags.append(t)
        used += len(t) + 1

    shorts = []
    short_desc = md["description"].strip() + (f"\n\n{vcredit}" if vcredit else "") + "\n\nNarrated with a synthetic voice.\n#shorts"
    for cut in cuts(spec)[1:]:
        shorts.append({
            "id": cut["name"].replace("short-", "", 1),
            "file": f"{cut['name']}.mp4",
            "captions": f"{cut['name']}.srt",
            "title": (md["title"][:90] + " #shorts"),
            "description": short_desc,
        })

    meta = {
        "slug": args.slug,
        "test": is_test(args.slug),
        "title": md["title"],
        "titleAlternatives": md.get("titleAlternatives") or [],
        "description": description,
        "tags": tags,
        "categoryId": md.get("categoryId", "27"),
        "containsSyntheticMedia": bool(md.get("containsSyntheticMedia", False)),
        "madeForKids": False,
        "defaultLanguage": "en",
        "chapters": [{"start": round(t, 2), "timestamp": fmt_ts(t), "title": label} for t, label in ch],
        "durationSec": timing["totalSec"],
        "shorts": shorts,
    }
    write_json(out_dir(args.slug) / "metadata.json", meta)
    log(f"metadata: {len(ch)} chapters, {len(description)} chars description, {len(shorts)} short(s)")


if __name__ == "__main__":
    main()
