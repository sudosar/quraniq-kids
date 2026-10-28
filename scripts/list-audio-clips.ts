/**
 * list-audio-clips — enumerate every Arabic text that needs a
 * generated audio clip, as JSON on stdout.
 *
 * The app's spoken content is a CLOSED set, so clips are generated
 * once (see generate-audio.py) and shipped as static files:
 *   - each letter alone, with every harakah, and with madd blends
 *   - every word card and Qur'anic word in the curriculum
 *   - the practice words
 *
 * PRONUNCIATION OVERRIDES
 * Most vocabulary words are written in bare-consonant form so a
 * toddler can pick out the target letter ("جمل", "أسد"). Edge-TTS
 * given such a bare string has no vowel to read and guesses one —
 * wrongly ("جُمِل" for "جَمَل", issue #21). Those words therefore
 * carry an explicit vocalised form in client/src/lib/pronunciations.ts,
 * which this script emits as a "speak" field: the AUDIO is synthesised
 * from the vocalised form, while the clip manifest stays keyed by the
 * DISPLAYED text, so no caller in the app has to change.
 *
 * Run: pnpm exec tsx scripts/list-audio-clips.ts > clips.json
 */
import { arabicLetters, practiceWords } from '../client/src/lib/curriculum';
import { PRONUNCIATIONS } from '../client/src/lib/pronunciations';

const FATHA = '\u064E';
const KASRA = '\u0650';
const DAMMA = '\u064F';
const FATHATAN = '\u064B';
const KASRATAN = '\u064D';
const DAMMATAN = '\u064C';
const SUKOON = '\u0652';
const MARKS = [FATHA, KASRA, DAMMA, FATHATAN, KASRATAN, DAMMATAN, SUKOON];
const MADD = ['ا', 'و', 'ي'];

// Combining marks that make a word self-vocalised (i.e. not bare).
const HARAKAT = new Set([
  '\u064E', '\u0650', '\u064F', '\u064B', '\u064D', '\u064C',
  '\u0652', '\u0651', '\u0670',
]);

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** True when the text carries no harakah of its own. */
function isBare(text: string): boolean {
  return !Array.from(text).some((ch) => HARAKAT.has(ch));
}

/** The letters of a word, with harakat removed. */
function lettersOf(text: string): string {
  return Array.from(text)
    .filter((ch) => !HARAKAT.has(ch))
    .join('');
}

const texts = new Set<string>();

for (const letter of arabicLetters) {
  texts.add(letter.letter);
  for (const mark of MARKS) texts.add(letter.letter + mark);
  // Madd blends are letter + fatha + long-vowel letter (بَا، بُو، بِي).
  for (const madd of MADD) texts.add(letter.letter + FATHA + madd);
  for (const card of letter.wordCards) texts.add(card.word);
  for (const qw of letter.quranicWords) texts.add(qw.word);
}
for (const w of practiceWords) texts.add(w.word);

// The curriculum's vocabulary words — the ones that need a pronunciation
// decision (single letters and mark combinations do not).
const vocab = new Set<string>();
for (const letter of arabicLetters) {
  for (const card of letter.wordCards) vocab.add(card.word);
  for (const qw of letter.quranicWords) vocab.add(qw.word);
}
for (const w of practiceWords) vocab.add(w.word);

// Guard: a bare multi-letter word MUST have an explicit pronunciation,
// otherwise Edge-TTS guesses the vowel and ships it wrong.
const missing: string[] = [];
for (const word of vocab) {
  const bare = isBare(word) && Array.from(word).length > 1;
  if (bare && !PRONUNCIATIONS[word]) missing.push(word);
}
if (missing.length) {
  throw new Error(
    'Missing pronunciations in client/src/lib/pronunciations.ts for: ' +
      missing.sort().join(', '),
  );
}

// Guard: no stale pronunciation entries left behind.
const stale = Object.keys(PRONUNCIATIONS).filter((w) => !vocab.has(w));
if (stale.length) {
  throw new Error(
    'Stale pronunciations (not in the curriculum): ' + stale.sort().join(', '),
  );
}

// Guard: a pronunciation may only ADD harakat, never change the letters.
for (const [word, spoken] of Object.entries(PRONUNCIATIONS)) {
  if (lettersOf(spoken) !== lettersOf(word)) {
    throw new Error(
      `Pronunciation for "${word}" changes the letters ` +
        `(${lettersOf(spoken)} != ${lettersOf(word)})`,
    );
  }
}

const clips = [...texts]
  .map(normalize)
  .filter(Boolean)
  .map((text, i) => {
    const clip: { id: string; text: string; speak?: string } = {
      id: `clip-${String(i + 1).padStart(4, '0')}`,
      text,
    };
    const spoken = PRONUNCIATIONS[text];
    if (spoken && spoken !== text) clip.speak = spoken;
    return clip;
  });

console.log(JSON.stringify(clips, null, 1));
