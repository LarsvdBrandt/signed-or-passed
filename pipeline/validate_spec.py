"""Validate productions/<slug>/spec.json against schema/spec.schema.json plus semantic checks."""
from jsonschema import Draft202012Validator

from common import ROOT, cuts, fail, load_spec, log, read_json, slug_arg, strip_emphasis
from sfx import SFX
from sfxlib import SOUNDS

KNOWN_SFX = set(SFX) | set(SOUNDS)
# infographic types that show no data and therefore need no sourceId (diagrams)
NO_SOURCE_INFOGRAPHICS = {"org-chart", "family-tree", "flow"}


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    schema = read_json(ROOT / "schema" / "spec.schema.json")
    validator = Draft202012Validator(schema)
    errors = []
    for e in sorted(validator.iter_errors(spec), key=lambda e: list(e.absolute_path)):
        path = "/".join(str(p) for p in e.absolute_path) or "(root)"
        errors.append(f"schema: {path}: {e.message}")

    if not errors:
        if spec["slug"] != args.slug:
            errors.append(f"slug '{spec['slug']}' does not match folder '{args.slug}'")
        source_ids = {s["id"] for s in spec.get("sources") or []}
        asset_ids = {a["id"] for a in spec.get("assets") or []}
        bi = spec.get("brandIntro")
        if isinstance(bi, dict) and bi.get("after"):
            main_ids = {sc["id"] for sc in spec.get("scenes") or []}
            if bi["after"] not in main_ids:
                errors.append(f"brandIntro.after: no scene '{bi['after']}' in the main video")
        for cut in cuts(spec):
            seen = set()
            for sc in cut["scenes"]:
                where = f"{cut['name']}/{sc['id']}"
                if sc["id"] in seen:
                    errors.append(f"{where}: duplicate scene id")
                seen.add(sc["id"])
                for nm in [sc.get("sfx")] + [c.get("sfx") for c in sc.get("sfxCues") or []]:
                    if nm and nm not in KNOWN_SFX:
                        errors.append(f"{where}: unknown sfx '{nm}' (house: pen/stamp/paper/whoosh, or a name from "
                                      f"`python pipeline/sfxlib.py --list`)")
                spoken = strip_emphasis(sc.get("narration")).lower()
                for b in sc.get("beats") or []:
                    if isinstance(b.get("at"), str) and b["at"].lower().strip() not in spoken:
                        log(f"  WARNING {where}: beat word '{b['at']}' does not occur in the narration (beat dropped)")
                if sc.get("narration", "").count("**") % 2:
                    errors.append(f"{where}: unbalanced '**' emphasis markers in the narration")
                v = sc["visual"]
                sid = v.get("sourceId")
                needs_source = sc["kind"] in ("chart", "counter", "quote") or (
                    sc["kind"] == "infographic" and v.get("type") not in NO_SOURCE_INFOGRAPHICS)
                if needs_source and sid not in source_ids:
                    errors.append(f"{where}: sourceId '{sid}' not found in sources")
                elif sid and sid not in source_ids:
                    errors.append(f"{where}: sourceId '{sid}' not found in sources")
                if sc["kind"] == "evidence" and v.get("assetId") not in asset_ids:
                    errors.append(f"{where}: assetId '{v.get('assetId')}' not found in assets")
                if sc["kind"] == "map":
                    labels = [p["label"] for p in v.get("pins", [])]
                    for a in v.get("arrows") or []:
                        for end in (a["from"], a["to"]):
                            ok = (isinstance(end, int) and 0 <= end < len(labels)) or end in labels
                            if not ok:
                                errors.append(f"{where}: arrow end '{end}' is not a pin label or index")
            kinds = [s["kind"] for s in cut["scenes"]]
            if cut["name"] == "main":
                if "question" not in kinds:
                    errors.append("main: a question scene is required")
                if "verdict" not in kinds:
                    errors.append("main: a verdict scene is required")
                verdicts = [s["visual"]["verdict"] for s in cut["scenes"] if s["kind"] == "verdict"]
                if verdicts and verdicts[-1] != spec["verdict"]:
                    errors.append(f"main: last verdict scene ({verdicts[-1]}) differs from spec.verdict ({spec['verdict']})")

    if errors:
        for e in errors:
            log(f"  - {e}")
        fail(f"spec {args.slug} is invalid ({len(errors)} problem(s))")
    log(f"spec {args.slug} is valid: {len(spec['scenes'])} scenes, {len(spec.get('shorts') or [])} short(s)")


if __name__ == "__main__":
    main()
