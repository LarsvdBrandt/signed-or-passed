"""Compact, diff-friendly JSON formatting used for the schema and the sample spec: objects and arrays stay on one line
when they fit in WIDTH characters, otherwise they are split one item per line.
Usage: python pipeline/jsonfmt.py FILE [FILE ...]   (rewrites the files in place)
"""
import json
import sys

WIDTH = 118


def fmt(v, ind=0, keylen=0):
    c = json.dumps(v, ensure_ascii=False, separators=(", ", ": "))
    if len(c) + 2 * ind + keylen <= WIDTH or not isinstance(v, (dict, list)) or not v:
        return c
    pad = "  " * (ind + 1)
    if isinstance(v, dict):
        items = [pad + json.dumps(k, ensure_ascii=False) + ": " + fmt(x, ind + 1, len(k) + 4) for k, x in v.items()]
        return "{\n" + ",\n".join(items) + "\n" + "  " * ind + "}"
    return "[\n" + ",\n".join(pad + fmt(x, ind + 1) for x in v) + "\n" + "  " * ind + "]"


if __name__ == "__main__":
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        with open(path, "w", encoding="utf-8") as f:
            f.write(fmt(data) + "\n")
