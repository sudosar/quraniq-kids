/**
 * QuranIQ Kids - Game Engine
 * 
 * PROGRESSIVE LEARNING DESIGN:
 * 
 * For the FIRST letter ever (Alif, no prior knowledge):
 *   1. Letter Intro — Meet the letter with animation and sound
 *   2. Word Cards — Show Arabic words starting with this letter + emoji pictures
 *   3. Tracing — Trace the letter shape
 *   4. Find in Word — Spot the letter highlighted in Quranic words
 *   5. Drag to Match — Drag the letter to its matching picture (solo, just 1 target)
 *   6. Bubble Pop (solo) — Only this letter in different sizes/colors, no distractors
 * 
 * For letters when child knows 1-2 previous letters:
 *   1. Letter Intro
 *   2. Word Cards
 *   3. Tracing
 *   4. Find in Word
 *   5. Drag to Match — Drag letter to correct picture among distractors
 *   6. Letter Slot — Fill in the missing letter in a word
 *   7. Bubble Pop — with 1-2 known distractors
 *   8. Sound Match — pick from this letter + known ones
 * 
 * For letters when child knows 3+ previous letters:
 *   1. Letter Intro
 *   2. Word Cards
 *   3. Tracing
 *   4. Find in Word
 *   5. Drag to Match — Drag letter to correct picture among distractors
 *   6. Letter Slot — Fill in the missing letter in a word
 *   7. Sort Letters — Sort letters into correct baskets
 *   8. Bubble Pop — with known distractors
 *   9. Sound Match — pick from known letters
 *   10. Catch Game — catch this letter, avoid known ones
 *   11. Memory Match — match this letter + a few known ones
 */

export type GameType = 
  | 'letter-intro'    // Animated letter reveal with sound
  | 'word-cards'      // Show words starting with this letter + pictures
  | 'tracing'         // Trace the letter with guided path + particles
  | 'find-in-word'    // Spot the letter in Quranic words
  | 'drag-to-match'   // Drag the letter to its matching picture
  | 'letter-slot'     // Drag correct letter into blank in a word
  | 'sort-letters'    // Sort letters into correct baskets
  | 'bubble-pop'      // Pop the correct letter among floating bubbles
  | 'sound-match'     // Hear a sound, pick the right letter
  | 'catch-game'      // Letters fall, catch the correct one
  | 'memory-match'    // Flip cards to match letter pairs

export interface GameConfig {
  type: GameType;
  title: string;
  description: string;
  icon: string;
  difficulty: number;
  requiresDistractors: boolean; // whether this game needs other letters
  minDistractors: number;       // minimum known letters needed
}

// All possible games in progressive order
const allGames: GameConfig[] = [
  { type: 'letter-intro', title: 'Meet the Letter', description: 'See and hear the letter come alive!', icon: '✨', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'word-cards', title: 'Word Time', description: 'See words that start with this letter!', icon: '🖼️', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'tracing', title: 'Trace It', description: 'Draw the letter with sparkles!', icon: '✏️', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'find-in-word', title: 'Find the Letter', description: 'Spot the letter in Quranic words!', icon: '🔍', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'drag-to-match', title: 'Match the Picture', description: 'Drag the letter to its picture!', icon: '🎯', difficulty: 1, requiresDistractors: false, minDistractors: 0 }, // works solo or with distractors
  { type: 'letter-slot', title: 'Complete the Word', description: 'Fill in the missing letter!', icon: '🧩', difficulty: 2, requiresDistractors: true, minDistractors: 1 },
  { type: 'sort-letters', title: 'Sort Letters', description: 'Put letters in the right basket!', icon: '🧺', difficulty: 2, requiresDistractors: true, minDistractors: 1 },
  { type: 'bubble-pop', title: 'Bubble Pop', description: 'Pop the right letter bubbles!', icon: '🫧', difficulty: 1, requiresDistractors: false, minDistractors: 0 }, // works with or without distractors
  { type: 'sound-match', title: 'Sound Match', description: 'Which letter makes this sound?', icon: '🔊', difficulty: 2, requiresDistractors: true, minDistractors: 1 },
  { type: 'catch-game', title: 'Letter Catch', description: 'Catch the falling letters!', icon: '🎪', difficulty: 2, requiresDistractors: true, minDistractors: 2 },
  { type: 'memory-match', title: 'Memory Match', description: 'Find the matching pairs!', icon: '🃏', difficulty: 2, requiresDistractors: true, minDistractors: 2 },
];

/**
 * Get the appropriate game sequence based on how many letters the child already knows.
 * This is the core progressive logic.
 */
export function getProgressiveGameSequence(availableDistractorCount: number): GameConfig[] {
  const sequence: GameConfig[] = [];
  
  for (const game of allGames) {
    if (!game.requiresDistractors) {
      // Always include games that don't need distractors
      sequence.push(game);
    } else if (availableDistractorCount >= game.minDistractors) {
      // Only include distractor games if child knows enough letters
      sequence.push(game);
    }
  }
  
  return sequence;
}

// Sound utilities
export function speakArabic(text: string, rate: number = 0.8) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = rate;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
}

export function playCorrectSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) { /* ignore audio errors */ }
}

export function playWrongSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) { /* ignore audio errors */ }
}

export function playPopSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) { /* ignore audio errors */ }
}

export function playCelebrationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 587.33, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.3);
      osc.start(audioCtx.currentTime + i * 0.1);
      osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
    });
  } catch (e) { /* ignore audio errors */ }
}

// Shuffle utility
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random items from array excluding specific ones
export function getRandomDistractors<T>(pool: T[], exclude: T[], count: number): T[] {
  const available = pool.filter(item => !exclude.includes(item));
  return shuffleArray(available).slice(0, count);
}
