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

Word clips, November 2026 (issues #38–#42 — Baqara heard as "bakar",
Batta as "bat", Bismi as "bism", Billahi as "billa", Ba'di as "baad"):
  the live files are exactly what Hamed produces (fresh synthesis is
  waveform-identical), so regenerating with the same recipe changes
  nothing. The cause is the VOICE, in two parts, both verified by
  unbiased transcription (Whisper) and waveform measurement:
    - Hamed swallows a word-final short vowel — and for ta-marbuta
      words the whole final syllable ("baqara" -> "baqar", "batta" ->
      "bat"). Zariyah renders those finals in full ("baqara", and
      Batta's speech is 2.6x longer), so WORD clips use Zariyah.
    - NEITHER voice pronounces an utterance-final case vowel
      (i'rab): "bismi" -> "bism", "ba'di" -> "ba'd" at every rate,
      because the engine applies Arabic pausal rules in isolation.
      But mid-phrase the vowel IS pronounced ("bismi hadha" transcribes
      as "bismi"), so words ending in a short vowel / tanwin are
      synthesised as "WORD <carrier>" and cut at the closure dip
      before the carrier's onset, which keeps the final vowel while
      the carrier itself is trimmed away and never ships. The carrier
      must start with a stop consonant (here "بَاب", "door"): its
      silent closure is the dip the cutter looks for. Doubling the
      word itself does NOT work ("baqara baqara" still drops the
      vowel), and the WordBoundary end offset alone is too early —
      the vowel straddles it, so the cut is found by energy, with the
      boundary only as the search start.
  Syllables and bare-letter names stay on Hamed: that choice was
  ear-validated for them, and the word-voice change must not
  regress it.

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
from datetime import datetime, timezone
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "client" / "public" / "audio" / "clips"
MANIFEST_TS = ROOT / "client" / "src" / "lib" / "audioClips.generated.ts"
# Records the text each clip was synthesised from, so a later run can
# tell "already generated" from "generated from a stale source" and
# re-synthesise only the clips whose pronunciation changed.
SOURCES_JSON = ROOT / "client" / "src" / "lib" / "audioClips.sources.json"
TMP_DIR = ROOT / ".audio-tmp"

VOICE_DEFAULT = "ar-SA-HamedNeural"
RATE_SYLLABLE = "-25%"
RATE_WORD = "-15%"

# Word clips use Zariyah: Hamed drops word-final short vowels (Nov 2026,
# issues #38-#42). Syllables and bare-letter names stay on --voice.
WORD_VOICE_DEFAULT = "ar-SA-ZariyahNeural"
# Carrier word for final-vowel words (see header): synthesise
# "WORD <CARRIER_WORD>" so the word's final vowel is mid-phrase, then
# cut at the closure dip before the carrier's onset. Must start with a
# stop consonant — its silent closure is what the cutter finds.
CARRIER_WORD = "بَاب"

# Short vowels and tanwin: the marks whose sound is a word-final vowel.
# Shadda, sukoon and dagger-alif end the word on a consonant, so they
# do NOT trigger the carrier treatment.
CARRIER_MARKS = set("ًٌٍَُِ")


def needs_carrier(speak: str) -> bool:
    """True when a word clip needs the carrier treatment.

    The word's final sound must be a short vowel (or tanwin) on a real
    consonant: the engine drops exactly that in pause, and only a
    following word keeps it audible. Ta-marbuta words (final letter ة)
    are excluded — Zariyah already renders their final vowel in full,
    and the carrier does not help them ("baqara hadha" still comes out
    "baqar"). Words ending on a consonant, sukoon, shadda or madd
    letter have no final vowel to lose, so they take the plain path.
    """
    chars = list(speak)
    if not chars or chars[-1] not in CARRIER_MARKS:
        return False
    letters = [c for c in chars if c not in MARKS]
    return bool(letters) and letters[-1] != "ة"


def _rms_20ms(samples: "array.array[int]", sr: int) -> tuple[int, list[float]]:
    """20 ms RMS windows over mono 16-bit samples."""
    win = max(1, int(sr * 0.02))
    n_win = len(samples) // win
    rms = []
    for i in range(n_win):
        chunk = samples[i * win:(i + 1) * win]
        rms.append((sum(s * s for s in chunk) / len(chunk)) ** 0.5 if chunk else 0.0)
    return win, rms


def carrier_cut_points(wav_path: Path, first_end_ms: float) -> tuple[int, int]:
    """(start_sample, end_sample) isolating the first word of a carrier phrase.

    Start is the speech onset (as in first_region_cut). End is the
    centre of the carrier's silent closure: scan forward from the first
    word's WordBoundary end for the first 20 ms window under 30% of peak
    whose energy more than doubles 60 ms later (the carrier's onset
    burst). The WordBoundary end alone is too early — the final vowel
    straddles it, so the cut is found by energy, with the boundary only
    as the search start. Falls back to the whole file when no dip is
    found.
    """
    with wave.open(str(wav_path), "rb") as w:
        sr = w.getframerate()
        raw = w.readframes(w.getnframes())
    samples = array.array("h")
    samples.frombytes(raw)
    win, rms = _rms_20ms(samples, sr)
    peak = max(rms) if rms else 0.0
    if peak == 0:
        raise ValueError("synthesised audio is silent")
    thr = peak * 0.12
    onset = next((i for i, v in enumerate(rms) if v > thr), 0)
    start = max(0, onset * win - int(sr * 0.02))
    # Search from the WordBoundary end, up to 300 ms forward.
    search_from = int(first_end_ms * sr / 1000.0) // win
    search_to = search_from + int(0.300 * sr) // win
    dip = None
    for i in range(search_from, min(search_to, len(rms) - 3)):
        if rms[i] < peak * 0.30 and rms[i + 3] > 2 * max(rms[i], 1e-9):
            dip = i
            break
    if dip is None:
        return start, len(samples)
    end = dip * win + win // 2
    return start, min(end, len(samples))


def trim_carrier_word(src_mp3: Path, dst_mp3: Path, first_end_ms: float) -> None:
    """Decode, cut to the first word of a carrier phrase, 40 ms fade-out."""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    wav_path = TMP_DIR / (src_mp3.stem + ".wav")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(src_mp3),
         "-ar", "16000", "-ac", "1", str(wav_path)],
        check=True,
    )
    start, end = carrier_cut_points(wav_path, first_end_ms)
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


async def synth_carrier_word(clip: dict, voice: str, sem: asyncio.Semaphore) -> tuple[bool, float]:
    """Synthesise "WORD <carrier>" and return (ok, first_word_end_ms).

    Streams the phrase with WordBoundary events so the first word's
    end offset is known; the caller then cuts at the carrier's closure
    dip via trim_carrier_word. Returns (False, 0.0) on failure.
    """
    from edge_tts import Communicate

    text = source_text(clip)
    phrase = f"{text} {CARRIER_WORD}"
    raw_mp3 = TMP_DIR / f"{clip['id']}.raw.mp3"
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    first_end_ms = 0.0
    async with sem:
        for attempt in (1, 2):
            try:
                comm = Communicate(phrase, voice, rate=RATE_WORD,
                                   boundary="WordBoundary")
                audio = bytearray()
                first_end_ms = 0.0
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        # Flat dict: offset/duration in 100 ns ticks,
                        # text is the word. The first word's end is the
                        # boundary whose text is the word itself.
                        if first_end_ms == 0.0 and chunk["text"] == text:
                            first_end_ms = (
                                chunk["offset"] + chunk["duration"]
                            ) / 10000.0
                if not audio:
                    raise ValueError("synthesised audio is empty")
                if first_end_ms == 0.0:
                    # No WordBoundary for the word: the cut would have
                    # no search start, so fail loudly instead of
                    # shipping the carrier word.
                    raise ValueError("no WordBoundary event for the word")
                raw_mp3.write_bytes(bytes(audio))
                return True, first_end_ms
            except Exception as exc:  # noqa: BLE001 - report and retry once
                print(f"  carrier attempt {attempt} failed for {clip['id']} "
                      f"({text}): {exc}", file=sys.stderr)
    return False, 0.0

# Combining marks used by the clip list (harakat + tanween + sukoon).
# Arabic names of the letters (mirrors nameAr in lib/curriculum.ts).
# Bare-letter clips speak the NAME: a doubled+trimmed lone letter
# fragments the name ("jeem" was cut to a "jay"-sounding stub), because
# name pronunciations have internal energy dips the trimmer mistakes
# for the gap between articulations. Names are ordinary words to the
# synthesiser, so they take the single-pass word path.
LETTER_NAMES = {
    # Alif is vocalised WITH sukun: bare "ألف" is also the word for
    # "thousand" and Edge reads it as "alf", not the letter name
    # "alif". "أَلِفْ" decodes unambiguously as the name (verified
    # by unbiased transcription, 30 Oct 2026).
    "ا": "أَلِفْ", "ب": "باء", "ت": "تاء", "ث": "ثاء", "ج": "جيم",
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


def source_text(clip: dict) -> str:
    """The text Edge-TTS is asked to speak for this clip.

    For most clips that is the displayed text. For bare-consonant
    vocabulary words it is the explicitly vocalised form from
    client/src/lib/pronunciations.ts ("speak"), because Edge-TTS
    cannot guess a vowel from a bare skeleton and guesses it wrong
    (issue #21). The manifest still keys the clip by the DISPLAYED
    text, so the app is unaffected.
    """
    return clip.get("speak") or clip["text"]


def load_sources() -> dict:
    """Previously recorded synthesis sources, id -> recipe.

    A recipe is {"speak": text, "voice": voice, "carrier": bool}.
    Older files recorded a plain string (the speak text); synth()
    treats those as Hamed with no carrier.
    """
    if not SOURCES_JSON.exists():
        return {}
    try:
        data = json.loads(SOURCES_JSON.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def recipe_for(clip: dict, voice: str, word_voice: str) -> dict:
    """The synthesis recipe for this clip, for provenance comparison.

    "speak" is the undoubled source text (the doubling of syllables is
    a synthesis detail, not a recipe change — recording it doubled
    would churn all ~300 syllable clips). Syllables and bare-letter
    names use --voice; word clips use the word voice, with the carrier
    flag for final-vowel words.
    """
    text = clip["text"]
    spoken = source_text(clip)
    if LETTER_NAMES.get(text) is not None or is_syllable(text):
        return {"speak": spoken, "voice": voice, "carrier": False}
    return {"speak": spoken, "voice": word_voice,
            "carrier": needs_carrier(spoken)}


async def synth(clip: dict, voice: str, word_voice: str, sem: asyncio.Semaphore,
                sources: dict | None = None) -> bool:
    out = OUT_DIR / f"{clip['id']}.mp3"
    text = clip["text"]
    spoken = source_text(clip)
    name = LETTER_NAMES.get(text)
    recipe = recipe_for(clip, voice, word_voice)

    if out.exists() and out.stat().st_size > 0:
        if name is not None:
            # Bare letters always regenerate: their recipe changed
            # (name-word instead of doubled+trimmed), so a stale
            # fragment must not be kept just because the file exists.
            print(f"  re-synthesising {clip['id']} (bare letter)", file=sys.stderr)
            out.unlink()
        else:
            recorded_raw = (sources or {}).get(clip["id"])
            if recorded_raw is None:
                if is_syllable(text) and spoken == text:
                    return True  # synthesised from the displayed text — keep it
                # No provenance recorded for this clip: an explicit
                # pronunciation override may have been made from the
                # bare form, and a word clip may still be Hamed.
                print(f"  re-synthesising {clip['id']} ({clip['text']}): "
                      f"unknown source -> {spoken!r}", file=sys.stderr)
                out.unlink()
            else:
                recorded = ({"speak": recorded_raw, "voice": VOICE_DEFAULT,
                             "carrier": False}
                            if isinstance(recorded_raw, str) else recorded_raw)
                if recorded == recipe:
                    return True
                # The recorded recipe changed, so a corrected
                # pronunciation actually replaces the old audio.
                print(f"  re-synthesising {clip['id']} ({clip['text']}): "
                      f"{recorded!r} -> {recipe!r}", file=sys.stderr)
                out.unlink()

    if name is not None:
        syllable = False
        speak = name
        voice_use = voice
    else:
        syllable = is_syllable(text)
        if syllable:
            speak = f"{spoken} {spoken}"
            voice_use = voice
        elif recipe["carrier"]:
            ok, first_end_ms = await synth_carrier_word(clip, word_voice, sem)
            if not ok:
                return False
            raw_mp3 = TMP_DIR / f"{clip['id']}.raw.mp3"
            trim_carrier_word(raw_mp3, out, first_end_ms)
            peak_normalise(out)
            raw_mp3.unlink(missing_ok=True)
            if out.exists() and out.stat().st_size > 0:
                return True
            return False
        else:
            speak = spoken
            voice_use = word_voice
    rate = RATE_SYLLABLE if syllable else RATE_WORD
    async with sem:
        for attempt in (1, 2):
            try:
                raw_mp3 = TMP_DIR / f"{clip['id']}.raw.mp3"
                TMP_DIR.mkdir(parents=True, exist_ok=True)
                await edge_tts.Communicate(speak, voice_use, rate=rate).save(str(raw_mp3))
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
    # AUDIO_VERSION changes on every generation run (UTC timestamp of the
    # run). Clip URLs carry it as ?v= (see audioClips.ts), so a new
    # generation forces a fresh fetch everywhere — Cloudflare edge,
    # browser cache — with no manual purge. This is the Sabaq ?v= pattern
    # (app.v4.js/styles.css): unversioned clip filenames served stale
    # for up to the 4h edge TTL after regen run #6 (Nov 2026), and the
    # "verified live" check passed only because it hit an edge that had
    # already fetched the new files.
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    lines = [
        "// GENERATED by scripts/generate-audio.py — do not edit by hand.",
        "// Maps each normalised Arabic text to its pre-generated clip file.",
        "// AUDIO_VERSION changes on every generation run; clip URLs carry",
        "// it as ?v= so a new generation forces a fresh fetch everywhere.",
        f"export const AUDIO_VERSION = \"{version}\";",
        "export const AUDIO_CLIPS: Record<string, string> = {",
    ]
    for clip in clips:
        key = json.dumps(normalize(clip["text"]), ensure_ascii=False)
        lines.append(f"  {key}: \"clips/{clip['id']}.mp3\",")
    lines.append("};")
    lines.append("")
    MANIFEST_TS.write_text("\n".join(lines), encoding="utf-8")


def write_sources(clips: list, voice: str, word_voice: str) -> None:
    """Record the synthesis recipe of every clip, for the next run."""
    sources = {clip["id"]: recipe_for(clip, voice, word_voice) for clip in clips}
    SOURCES_JSON.write_text(
        json.dumps(sources, ensure_ascii=False, indent=1, sort_keys=True) + "\n",
        encoding="utf-8",
    )


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", required=True, help="JSON clip list from list-audio-clips.ts")
    ap.add_argument("--voice", default=VOICE_DEFAULT,
                    help=f"Edge-TTS voice for syllables and bare-letter names "
                         f"(default: {VOICE_DEFAULT})")
    ap.add_argument("--word-voice", default=WORD_VOICE_DEFAULT,
                    help=f"Edge-TTS voice for word clips (default: {WORD_VOICE_DEFAULT})")
    ap.add_argument("--rate", default=None,
                    help="Accepted for compatibility; rates are set per clip kind.")
    args = ap.parse_args()

    if shutil.which("ffmpeg") is None:
        print("ffmpeg is required for syllable trimming", file=sys.stderr)
        return 2

    clips = json.loads(Path(args.clips).read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    sources = load_sources()
    results = await asyncio.gather(
        *(synth(c, args.voice, args.word_voice, sem, sources) for c in clips))
    write_manifest(clips)
    write_sources(clips, args.voice, args.word_voice)
    failed = [c["id"] for c, ok in zip(clips, results) if not ok]
    print(f"done: {sum(results)}/{len(clips)} clips ok; manifest regenerated")
    if failed:
        print(f"FAILED clips: {', '.join(failed)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
