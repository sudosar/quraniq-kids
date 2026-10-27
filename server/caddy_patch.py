#!/usr/bin/env python3
"""Patch the kids.sabaq.net site block in a Caddyfile for the bug reporter.

Two changes, both only on an exact structural match:
  1. Insert reverse-proxy `handle` blocks for /api/bug-report,
     /api/bug-shot/* and /api/bug-health (to 127.0.0.1:8791).
  2. Move the block's TOP-LEVEL try_files / file_server directives
     (the SPA fallback) into a trailing catch-all `handle { ... }`.
     Without this, Caddy runs the top-level rewrite before the API
     handles and /api/* gets swallowed by the SPA fallback.

Usage: caddy_patch.py <Caddyfile path>
Exit codes: 0 patched, 4 already correct, 3 no safe patch point (no changes).
"""
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


def block_bounds(lines):
    """(start, end) line indices of the kids.sabaq.net site block."""
    start = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if "kids.sabaq.net" in stripped and stripped.endswith("{"):
            start = i
            break
    if start is None:
        return None
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if i > start and depth == 0:
            return start, i
    return None


def depths(lines, start, end):
    """Brace depth at the START of each line, relative to the block (=1 inside)."""
    out = {}
    depth = 0
    for i in range(start, end + 1):
        out[i] = depth
        depth += lines[i].count("{") - lines[i].count("}")
    return out


def main() -> int:
    path = sys.argv[1]
    lines = open(path, encoding="utf-8").read().splitlines(keepends=True)
    bounds = block_bounds(lines)
    if bounds is None:
        print("NO_MATCH: no kids.sabaq.net site block found")
        return 3
    start, end = bounds
    changed = False

    # 1) API handles.
    if MARKER not in "".join(lines[start:end + 1]):
        lines[end:end] = [INSERT]
        end += 1
        changed = True
        print("PATCHED: inserted API handles")

    # 2) Wrap top-level SPA fallback directives into a catch-all handle.
    d = depths(lines, start, end)
    groups = []  # (first_idx, last_idx) of depth-1 try_files / file_server
    i = start + 1
    while i < end:
        if d.get(i) == 1:
            stripped = lines[i].strip()
            if stripped.startswith("try_files") or stripped.startswith("file_server"):
                j = i
                bal = lines[i].count("{") - lines[i].count("}")
                while bal > 0 and j + 1 < end:
                    j += 1
                    bal += lines[j].count("{") - lines[j].count("}")
                groups.append((i, j))
                i = j + 1
                continue
        i += 1

    if groups:
        moved = []
        for a, b in reversed(groups):
            moved = lines[a:b + 1] + moved
            del lines[a:b + 1]
            end -= (b + 1 - a)
        wrapped = ["\thandle {\n"]
        for ln in moved:
            wrapped.append("\t" + ln if ln.strip() else ln)
        wrapped.append("\t}\n")
        lines[end:end] = wrapped
        changed = True
        print(f"PATCHED: wrapped {len(moved)} fallback line(s) into catch-all handle")

    if not changed:
        print("ALREADY: API handles present and fallback already wrapped")
        return 4
    open(path, "w", encoding="utf-8").write("".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
