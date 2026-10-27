#!/usr/bin/env python3
"""
generate-audio — create the Edge-TTS clip set for QuranIQ Kids.

Reads the clip list from list-audio-clips.ts (JSON), synthesises one
MP3 per text with a Microsoft neural Arabic voice (via the free
edge-tts library), writes them under client/public/audio/clips/, and
regenerates client/src/lib/audioClips.generated.ts so the app can
resolve text -> clip.

Normally run by the "Generate audio clips" GitHub Actions workflow;
can also run locally:  pip install edge-tts
  pnpm exec tsx scripts/list-audio-clips.ts > clips.json
  python3 scripts/generate-audio.py --clips clips.json

Existing non-empty MP3s are skipped, so re-runs are resumable.
"""
import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "client" / "public" / "audio" / "clips"
MANIFEST_TS = ROOT / "client" / "src" / "lib" / "audioClips.generated.ts"


def normalize(text: str) -> str:
    """Mirror normalizeArabicText in client/src/lib/audioClips.ts."""
    return re.sub(r"\s+", " ", text.strip())


async def synth(clip: dict, voice: str, rate: str, sem: asyncio.Semaphore) -> bool:
    out = OUT_DIR / f"{clip['id']}.mp3"
    if out.exists() and out.stat().st_size > 0:
        return True
    async with sem:
        for attempt in (1, 2):
            try:
                await edge_tts.Communicate(clip["text"], voice, rate=rate).save(str(out))
                if out.exists() and out.stat().st_size > 0:
                    return True
            except Exception as exc:  # noqa: BLE001 - report and retry once
                print(f"  attempt {attempt} failed for {clip['id']} ({clip['text']}): {exc}", file=sys.stderr)
    return False


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", required=True, help="JSON clip list from list-audio-clips.ts")
    ap.add_argument("--voice", default="ar-SA-ZariyahNeural",
                    help="Edge-TTS voice (default: ar-SA-ZariyahNeural; ar-SA-HamedNeural is the male option)")
    ap.add_argument("--rate", default="-15%", help="Speaking rate, slowed for toddlers (default -15%%)")
    args = ap.parse_args()

    clips = json.loads(Path(args.clips).read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*(synth(c, args.voice, args.rate, sem) for c in clips))
    ok = {c["id"]: c for c, good in zip(clips, results) if good}
    failed = [c["id"] for c, good in zip(clips, results) if not good]
    print(f"clips: {len(ok)}/{len(clips)} ok, {len(failed)} failed")

    lines = [
        "/**",
        " * GENERATED FILE — do not edit by hand.",
        " *",
        f" * Produced by scripts/generate-audio.py with Edge-TTS voice",
        f" * {args.voice} at rate {args.rate}. Keys are normalised Arabic",
        " * texts (see normalizeArabicText in audioClips.ts); values are",
        " * clip paths relative to the app base URL.",
        " */",
        "export const AUDIO_CLIPS: Record<string, string> = {",
    ]
    for clip in clips:
        if clip["id"] in ok:
            key = json.dumps(normalize(clip["text"]), ensure_ascii=False)
            lines.append(f"  {key}: \"audio/clips/{clip['id']}.mp3\",")
    lines.append("};")
    lines.append("")
    MANIFEST_TS.write_text("\n".join(lines), encoding="utf-8")
    print(f"manifest written: {MANIFEST_TS} ({len(ok)} entries)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
