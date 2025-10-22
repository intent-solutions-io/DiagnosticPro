#!/usr/bin/env python3
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
golden_files = sorted((ROOT / "tests" / "golden").glob("*.json"))

status = 0

for path in golden_files:
    text = path.read_text(encoding="utf-8")
    chars = len(text)
    estimated_pages = math.ceil(chars / 3000) if chars else 0

    if "mock_H" in path.name:
        limit = 6
    else:
        limit = 4

    if estimated_pages > limit:
        print(f"FAIL page_estimator: {path.name} => {estimated_pages} pages (limit {limit})", file=sys.stderr)
        status = 1

sys.exit(status)
