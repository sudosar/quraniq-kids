#!/usr/bin/env python3
"""Insert the bug-reporter reverse-proxy handles into the kids.sabaq.net
site block of a Caddyfile — only on an exact, unambiguous match.

Usage: caddy_patch.py <Caddyfile path>
Exit codes: 0 patched, 4 already present, 3 no safe patch point (no changes).
"""
import re
import sys

MARKER = "127.0.0.1:8791"
INSERT = (
    "\thandle /api/bug-report {\n"
    "\t\treverse_proxy 127.0.0.1:8791\n"
    "\t}\n"
    "\thandle /api/bug-shot/* {\n"
    "\t\treverse_proxy 127.0.0.1:8791\n"
    "\t}\n"
    "\thandle /api/bug-health {\n"
    "\t\treverse_proxy 127.0.0.1:8791\n"
    "\t}\n"
)


def main() -> int:
    path = sys.argv[1]
    lines = open(path, encoding="utf-8").read().splitlines(keepends=True)

    # Find the site block whose header mentions kids.sabaq.net.
    start = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if "kids.sabaq.net" in stripped and stripped.endswith("{"):
            start = i
            break
    if start is None:
        print("NO_MATCH: no kids.sabaq.net site block found")
        return 3

    # Brace-balance to the block's closing line.
    depth = 0
    end = None
    for i in range(start, len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if i > start and depth == 0:
            end = i
            break
    if end is None:
        print("NO_MATCH: unbalanced block")
        return 3

    block = "".join(lines[start:end + 1])
    if MARKER in block:
        print("ALREADY: bug-reporter handles present")
        return 4

    lines[end:end] = [INSERT]
    open(path, "w", encoding="utf-8").write("".join(lines))
    print(f"PATCHED: inserted handles before line {end + 1}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
