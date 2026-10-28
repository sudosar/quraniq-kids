#!/usr/bin/env python3
"""
generate-audio — create the Edge-TTS clip set for QuranIQ Kids.

Recipe (ear-validated by the project owner, Oct 2026):
  Microsoft Edge neural voices mangle a LONE short syllable — isolated
  letter+harakah strings come out as pseudo-words or flattened tanween
  ("ra-un ra-un ra-un"). But when the same syllable is spoken TWICE
  ("رَ رَ"), the voice articulates it properly. So:
    - syllable clips (a letter alone, with a harakah, or with madd):
      synthesise the text DOUBLED at a slowed rate, then trim the
      audio to the FIRST articulation.
    - word clips (anything longer): synthesise single-pass — Edge
      renders real words correctly.
  Voice: ar-SA-HamedNeural (clearer than the female voices on the
  doubled-syllable tests; the owner also preferred its cleanliness).

Reads the clip list from list-audio-clips.ts (JSON), writes one MP3
per text under client/public/audio/clips/, and regenerates
client/src/lib/audioClips.generated.ts so the app can resolve
text -> clip.

Normally run by the "Generate audio clips" GitHub Actions workflow;
can also run locally:  pip install edge-tts   (ffmpeg must be present)
  pnpm exec tsx scripts/list-audio-clips.ts > clips.json
  python3 scripts/generate-audio.py --clips clips.json

Existing non-empty MP3s are skipped, so re-runs are resumable.
Failed clips are reported and counted; the run exits non-zero if any
clip could not be produced, so a silent/blank clip never ships.
"""
import argparse
import array
import asyncio
import json
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "client" / "public" / "audio" / "clips"
MANIFEST_TS = ROOT / "client" / "src" / "lib" / "audioClips.generated.ts"
TMP_DIR = ROOT / ".audio-tmp"

VOICE_DEFAULT = "ar-SA-HamedNeural"
RATE_SYLLABLE = "-25%"
RATE_WORD = "-15%"

# Combining marks used by the clip list (harakat + tanween + sukoon).
# Arabic names of the letters (mirrors nameAr in lib/curriculum.ts).
# Bare-letter clips speak the NAME: a doubled+trimmed lone letter
# fragments the name ("jeem" was cut to a "jay"-sounding stub), because
# name pronunciations have internal energy dips the trimmer mistakes
# for the gap between articulations. Names are ordinary words to the
# synthesiser, so they take the single-pass word path.
LETTER_NAMES = {
    "ا": "ألف", "ب": "باء", "ت": "تاء", "ث": "ثاء", "ج": "جيم",
    "ح": "حاء", "خ": "خاء", "د": "دال", "ذ": "ذال", "ر": "راء",
    "ز": "زاي", "س": "سين", "ش": "شين", "ص": "صاد", "ض": "ضاد",
    "ط": "طاء", "ظ": "ظاء", "ع": "عين", "غ": "غين", "ف": "فاء",
    "ق": "قاف", "ك": "كاف", "ل": "لام", "م": "ميم", "ن": "نون",
    "ه": "هاء", "و": "واو", "ي": "ياء",
}

MARKS = set("ًٌٍَُِّْٰ")


def normalize(text: str) -> str:
    """Mirror normalizeArabicText in client/src/lib/audioClips.ts."""
    return re.sub(r"\s+", " ", text.strip())


def is_syllable(text: str) -> bool:
    """A lone letter form: bare letter, letter+mark, or letter+fatha+madd.

    These are the texts Edge mangles when spoken once. Anything with a
    space or more than 3 codepoints is treated as a word (single-pass).
    The doubled+trim treatment is harmless for short words too: the
    first articulation of "X X" is still just "X".
    """
    if " " in text:
        return False
    chars = list(text)
    if len(chars) == 1:
        return True
    if len(chars) == 2:
        return chars[1] in MARKS or chars[1] in "اوي"
    if len(chars) == 3:
        return chars[1] in MARKS and chars[2] in "اوي"
    return False


def first_region_cut(wav_path: Path) -> tuple[int, int]:
    """Return (start_sample, end_sample) of the first speech region.

    Pure-stdlib energy scan over 10 ms windows: speech starts at the
    first window above 12% of peak RMS; the region ends where energy
    stays below that threshold for >=100 ms (the gap between the two
    articulations of a doubled syllable). Falls back to the whole file
    when no clean gap is found.
    """
    with wave.open(str(wav_path), "rb") as w:
        sr = w.getframerate()
        raw = w.readframes(w.getnframes())
    samples = array.array("h")
    samples.frombytes(raw)
    win = max(1, int(sr * 0.01))
    n_win = len(samples) // win
    rms = []
    peak = 0.0
    for i in range(n_win):
        chunk = samples[i * win:(i + 1) * win]
        val = (sum(s * s for s in chunk) / len(chunk)) ** 0.5 if chunk else 0.0
        rms.append(val)
        peak = max(peak, val)
    if peak == 0:
        raise ValueError("synthesised audio is silent")
    thr = peak * 0.12
    onset = next((i for i, v in enumerate(rms) if v > thr), 0)
    gap = 0
    end_win = n_win
    for i in range(onset, n_win):
        if rms[i] > thr:
            gap = 0
        else:
            gap += 1
            if gap >= 10:
                end_win = i - 10
                break
    start = max(0, onset * win - int(sr * 0.02))
    end = min(len(samples), end_win * win + int(sr * 0.01))
    return start, end


def trim_to_first_syllable(src_mp3: Path, dst_mp3: Path) -> None:
    """Decode, cut to the first articulation with a 40 ms fade-out."""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    wav_path = TMP_DIR / (src_mp3.stem + ".wav")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(src_mp3),
         "-ar", "16000", "-ac", "1", str(wav_path)],
        check=True,
    )
    start, end = first_region_cut(wav_path)
    with wave.open(str(wav_path), "rb") as w:
        sr = w.getframerate()
        raw = w.readframes(w.getnframes())
    samples = array.array("h")
    samples.frombytes(raw)
    seg = samples[start:end]
    fade = int(sr * 0.04)
    if len(seg) > fade:
        for i in range(fade):
            idx = len(seg) - fade + i
            seg[idx] = int(seg[idx] * (1 - i / fade))
    cut_wav = TMP_DIR / (src_mp3.stem + ".cut.wav")
    with wave.open(str(cut_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(seg.tobytes())
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(cut_wav),
         "-ar", "44100", "-ac", "1", "-b:a", "96k", str(dst_mp3)],
        check=True,
    )
    wav_path.unlink(missing_ok=True)
    cut_wav.unlink(missing_ok=True)


def peak_normalise(mp3: Path) -> None:
    """Boost near-silent clips (e.g. sukoon forms the voice whispers).

    If the peak amplitude is under 0.10, re-encode with gain so the
    peak reaches ~0.89. Normal clips are left untouched.
    """
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    wav_path = TMP_DIR / (mp3.stem + ".peak.wav")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(mp3),
         "-ar", "16000", "-ac", "1", str(wav_path)],
        check=True,
    )
    with wave.open(str(wav_path), "rb") as w:
        raw = w.readframes(w.getnframes())
    wav_path.unlink(missing_ok=True)
    samples = array.array("h")
    samples.frombytes(raw)
    if not samples:
        raise ValueError("empty audio")
    peak = max(abs(s) for s in samples) / 32768.0
    if peak >= 0.10:
        return
    import math
    gain_db = 20 * math.log10(0.89 / max(peak, 1e-4))
    boosted = TMP_DIR / (mp3.stem + ".boost.mp3")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(mp3),
         "-af", f"volume={gain_db:.1f}dB",
         "-ar", "44100", "-ac", "1", "-b:a", "96k", str(boosted)],
        check=True,
    )
    shutil.move(str(boosted), str(mp3))


async def synth(clip: dict, voice: str, sem: asyncio.Semaphore) -> bool:
    out = OUT_DIR / f"{clip['id']}.mp3"
    text = clip["text"]
    name = LETTER_NAMES.get(text)
    # Bare letters always regenerate: their recipe changed (name-word
    # instead of doubled+trimmed), so a stale fragment must not be
    # kept just because the file exists.
    if name is None and out.exists() and out.stat().st_size > 0:
        return True
    if name is not None:
        syllable = False
        speak = name
    else:
        syllable = is_syllable(text)
        speak = f"{text} {text}" if syllable else text
    rate = RATE_SYLLABLE if syllable else RATE_WORD
    async with sem:
        for attempt in (1, 2):
            try:
                raw_mp3 = TMP_DIR / f"{clip['id']}.raw.mp3"
                TMP_DIR.mkdir(parents=True, exist_ok=True)
                await edge_tts.Communicate(speak, voice, rate=rate).save(str(raw_mp3))
                if syllable:
                    trim_to_first_syllable(raw_mp3, out)
                else:
                    shutil.move(str(raw_mp3), str(out))
                peak_normalise(out)
                raw_mp3.unlink(missing_ok=True)
                if out.exists() and out.stat().st_size > 0:
                    return True
            except Exception as exc:  # noqa: BLE001 - report and retry once
                print(f"  attempt {attempt} failed for {clip['id']} ({text}): {exc}",
                      file=sys.stderr)
    return False


def write_manifest(clips: list) -> None:
    lines = [
        "// GENERATED by scripts/generate-audio.py — do not edit by hand.",
        "// Maps each normalised Arabic text to its pre-generated clip file.",
        "export const AUDIO_CLIPS: Record<string, string> = {",
    ]
    for clip in clips:
        key = json.dumps(normalize(clip["text"]), ensure_ascii=False)
        lines.append(f"  {key}: \"clips/{clip['id']}.mp3\",")
    lines.append("};")
    lines.append("")
    MANIFEST_TS.write_text("\n".join(lines), encoding="utf-8")


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", required=True, help="JSON clip list from list-audio-clips.ts")
    ap.add_argument("--voice", default=VOICE_DEFAULT,
                    help=f"Edge-TTS voice (default: {VOICE_DEFAULT})")
    ap.add_argument("--rate", default=None,
                    help="Accepted for compatibility; rates are set per clip kind.")
    args = ap.parse_args()

    if shutil.which("ffmpeg") is None:
        print("ffmpeg is required for syllable trimming", file=sys.stderr)
        return 2

    clips = json.loads(Path(args.clips).read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*(synth(c, args.voice, sem) for c in clips))
    write_manifest(clips)
    failed = [c["id"] for c, ok in zip(clips, results) if not ok]
    print(f"done: {sum(results)}/{len(clips)} clips ok; manifest regenerated")
    if failed:
        print(f"FAILED clips: {', '.join(failed)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
