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
 * Run: pnpm exec tsx scripts/list-audio-clips.ts > clips.json
 */
import { arabicLetters, practiceWords } from '../client/src/lib/curriculum';

const FATHA = '\u064E';
const KASRA = '\u0650';
const DAMMA = '\u064F';
const FATHATAN = '\u064B';
const KASRATAN = '\u064D';
const DAMMATAN = '\u064C';
const SUKOON = '\u0652';
const MARKS = [FATHA, KASRA, DAMMA, FATHATAN, KASRATAN, DAMMATAN, SUKOON];
const MADD = ['ا', 'و', 'ي'];

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
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

const clips = [...texts]
  .map(normalize)
  .filter(Boolean)
  .map((text, i) => ({ id: `clip-${String(i + 1).padStart(4, '0')}`, text }));

console.log(JSON.stringify(clips, null, 1));
