#!/usr/bin/env python3
"""
generate-audio — create the Arabic clip set for QuranIQ Kids.

Engine: Google Translate TTS (the voice behind Google Translate's
listen button), chosen Oct 2026 after ear + transcription testing:
Microsoft Edge-TTS's Arabic voices — all six tested — mangle
isolated letter + harakat strings (بَ بِ بُ came out as pseudo-words),
while Google's voice renders the three syllables distinctly and
pronounces curriculum words correctly. It is a single fixed voice;
there is no voice/rate selection (the endpoint ignores speed hints).

Reads the clip list from list-audio-clips.ts (JSON), fetches one MP3
per text, writes them under client/public/audio/clips/, and
regenerates client/src/lib/audioClips.generated.ts so the app can
resolve text -> clip.

Normally run by the "Generate audio clips" GitHub Actions workflow;
can also run locally with nothing but Python 3:
  pnpm exec tsx scripts/list-audio-clips.ts > clips.json
  python3 scripts/generate-audio.py --clips clips.json

Existing non-empty MP3s are skipped, so re-runs are resumable.
Requests are throttled and retried — the endpoint is unofficial and
rate-sensitive; a full 459-clip run takes a few minutes.
"""
import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "client" / "public" / "audio" / "clips"
MANIFEST_TS = ROOT / "client" / "src" / "lib" / "audioClips.generated.ts"
ENDPOINT = "https://translate.google.com/translate_tts"
HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}


def normalize(text: str) -> str:
    """Mirror normalizeArabicText in client/src/lib/audioClips.ts."""
    return re.sub(r"\s+", " ", text.strip())


def fetch_mp3(text: str) -> bytes:
    q = urllib.parse.quote(text)
    url = f"{ENDPOINT}?ie=UTF-8&q={q}&tl=ar&client=tw-ob"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    # Sanity: a real MP3 starts with an ID3 tag or an MPEG frame sync.
    if len(data) < 1000 or not (data[:3] == b"ID3" or data[0] == 0xFF):
        raise ValueError(f"suspicious payload ({len(data)} bytes)")
    return data


def synth(clip: dict, delay: float) -> bool:
    out = OUT_DIR / f"{clip['id']}.mp3"
    if out.exists() and out.stat().st_size > 0:
        return True
    for attempt in (1, 2, 3):
        try:
            out.write_bytes(fetch_mp3(clip["text"]))
            time.sleep(delay)
            return True
        except Exception as exc:  # noqa: BLE001 - report and back off
            print(f"  attempt {attempt} failed for {clip['id']} ({clip['text']}): {exc}", file=sys.stderr)
            time.sleep(2 * attempt)
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", required=True, help="JSON clip list from list-audio-clips.ts")
    ap.add_argument("--delay", type=float, default=0.2, help="Seconds between requests (default 0.2)")
    # Legacy flags from the Edge-TTS version, accepted and ignored so
    # an older workflow dispatch cannot break on them.
    ap.add_argument("--voice", default=None, help=argparse.SUPPRESS)
    ap.add_argument("--rate", default=None, help=argparse.SUPPRESS)
    args = ap.parse_args()
    if args.voice or args.rate:
        print("note: --voice/--rate are ignored — Google TTS has a single Arabic voice", file=sys.stderr)

    clips = json.loads(Path(args.clips).read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok, failed = {}, []
    for i, clip in enumerate(clips, 1):
        if synth(clip, args.delay):
            ok[clip["id"]] = clip
        else:
            failed.append(clip["id"])
        if i % 50 == 0:
            print(f"  progress: {i}/{len(clips)}")
    print(f"clips: {len(ok)}/{len(clips)} ok, {len(failed)} failed")

    lines = [
        "/**",
        " * GENERATED FILE — do not edit by hand.",
        " *",
        " * Produced by scripts/generate-audio.py with Google Translate",
        " * TTS (Arabic). Keys are normalised Arabic texts (see",
        " * normalizeArabicText in audioClips.ts); values are clip paths",
        " * relative to the app base URL.",
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
    raise SystemExit(main())
