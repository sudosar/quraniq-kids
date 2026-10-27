/**
 * Quranic audio URLs — free, key-less, human recitation.
 *
 * Two public CDNs do the heavy lifting:
 *
 * 1. Word-by-word (WBW) clips from the Quran Foundation CDN
 *    (audio.qurancdn.com): one short MP3 per Qur'anic word, addressed
 *    by (surah, ayah, word index). A human reciter pronounces each
 *    word slowly and clearly — ideal for toddlers.
 *
 * 2. Whole-ayah recitation from the Islamic Network CDN
 *    (cdn.islamic.network, the AlQuran Cloud project): one MP3 per
 *    ayah, addressed by the ayah's GLOBAL number (1..6236), with a
 *    choice of reciters (default Mishary Alafasy).
 *
 * Anything not covered here falls back to generated clips
 * (lib/audioClips) and then to device TTS — see gameEngine.speakArabic.
 */

/** A (surah, ayah) pair, both 1-based. */
export interface AyahRef {
  surah: number;
  ayah: number;
}

/**
 * Parse an ayah reference in the shapes the curriculum uses:
 * '1:7', 'Al-Fatiha 1:2', 'Al-Baqarah 2:255'. Returns null when no
 * 'surah:ayah' pair is present.
 */
export function parseAyahRef(ref: string): AyahRef | null {
  const m = ref.match(/(\d{1,3})\s*:\s*(\d{1,3})/);
  if (!m) return null;
  const surah = Number(m[1]);
  const ayah = Number(m[2]);
  if (surah < 1 || surah > 114 || ayah < 1) return null;
  return { surah, ayah };
}

/** Number of ayahs in each surah, in order (the standard Tanzil counts). */
export const AYAH_COUNTS: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6,
];

/** Global ayah number (1..6236) used by the Islamic Network CDN. */
export function globalAyahNumber(ref: AyahRef): number {
  let n = ref.ayah;
  for (let s = 0; s < ref.surah - 1; s++) n += AYAH_COUNTS[s];
  return n;
}

const pad3 = (n: number) => String(n).padStart(3, '0');

/**
 * Human word-by-word clip for one word of an ayah.
 * `wordIndex` is 1-based within the ayah.
 */
export function wbwAudioUrl(ref: AyahRef, wordIndex: number): string {
  return `https://audio.qurancdn.com/wbw/${pad3(ref.surah)}_${pad3(ref.ayah)}_${pad3(wordIndex)}.mp3`;
}

/**
 * Human whole-ayah recitation (default: Mishary Alafasy, 128 kbps).
 * Foundation for the future listen-and-memorise surah track.
 */
export function ayahAudioUrl(
  ref: AyahRef,
  reciter: string = 'ar.alafasy',
  bitrate: number = 128,
): string {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalAyahNumber(ref)}.mp3`;
}

/**
 * Where each SentenceReading phrase starts inside its ayah, as a
 * 1-based word index. Verified against the Quran.com word list for
 * every phrase in the game (Oct 2026) — WBW word indices only line
 * up when this offset is applied, because some phrases begin
 * mid-ayah (e.g. 'وَلَا ٱلضَّآلِّينَ' is words 8-9 of 1:7).
 *
 * Key: `${ayahRef}|${firstWord}` using the game's own strings.
 */
export const PHRASE_WORD_OFFSETS: Record<string, number> = {
  "108:1|إِنَّآ": 1,
  "108:2|فَصَلِّ": 1,
  "112:1|قُلْ": 1,
  "112:4|وَلَمْ": 1,
  "113:1|قُلْ": 1,
  "1:1|بِسْمِ": 1,
  "1:2|رَبِّ": 3,
  "1:2|ٱلْحَمْدُ": 1,
  "1:3|ٱلرَّحْمَـٰنِ": 1,
  "1:4|مَـٰلِكِ": 1,
  "1:5|إِيَّاكَ": 1,
  "1:5|وَإِيَّاكَ": 3,
  "1:6|ٱهْدِنَا": 1,
  "1:7|صِرَٰطَ": 1,
  "1:7|غَيْرِ": 5,
  "1:7|وَلَا": 8,
  "2:2|ذَٰلِكَ": 1,
  "67:1|تَبَـٰرَكَ": 1,
  "96:2|خَلَقَ": 1
};

/**
 * WBW clip URL for the word at `indexInPhrase` (0-based) of a phrase
 * identified by its ayah ref ('1:7') and first word, or null when the
 * phrase is not in the verified offset table (caller falls back to
 * generated clips / TTS).
 */
export function phraseWordAudioUrl(
  ayahRef: string,
  firstWord: string,
  indexInPhrase: number,
): string | null {
  const ref = parseAyahRef(ayahRef);
  if (!ref) return null;
  const start = PHRASE_WORD_OFFSETS[`${ayahRef}|${firstWord}`];
  if (!start) return null;
  return wbwAudioUrl(ref, start + indexInPhrase);
}
