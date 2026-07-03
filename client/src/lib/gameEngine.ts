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
  | 'harakat'         // Teach fatha/kasra/damma recitation + quiz
  | 'combine-letters' // Blend letter sounds together (ba + a = baa)
  | 'word-building'   // Build Quranic words from syllable blends
  | 'sentence-reading' // Read Quranic phrases word by word
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
  { type: 'harakat', title: 'Letter Sounds', description: 'Learn fatha, kasra & damma!', icon: '🎵', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'combine-letters', title: 'Combine Letters', description: 'Blend sounds together!', icon: '🔗', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'word-building', title: 'Build Words', description: 'Build Quranic words from syllables!', icon: '🏗️', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'sentence-reading', title: 'Read the Quran', description: 'Read Quranic phrases word by word!', icon: '📖', difficulty: 1, requiresDistractors: false, minDistractors: 0 },
  { type: 'catch-game', title: 'Letter Catch', description: 'Catch the falling letters!', icon: '🎪', difficulty: 2, requiresDistractors: true, minDistractors: 2 },
  { type: 'memory-match', title: 'Memory Match', description: 'Find the matching pairs!', icon: '🃏', difficulty: 2, requiresDistractors: true, minDistractors: 2 },
];

/**
 * READING_GAMES — lookup map for the reading-progression skill lessons.
 * SkillPlay uses this to find the GameConfig for harakat, combine-letters, etc.
 */
export const READING_GAMES: Record<string, GameConfig> = Object.fromEntries(
  allGames
    .filter(g => ['harakat', 'combine-letters', 'word-building', 'sentence-reading'].includes(g.type))
    .map(g => [g.type, g])
);

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

// ============================================================
// SOUND UTILITIES
// ============================================================

/**
 * Robust Arabic speech synthesis that handles Chrome desktop quirks:
 * 
 * Chrome desktop issues:
 * 1. Voices load asynchronously — getVoices() returns [] until onvoiceschanged fires
 * 2. speechSynthesis.speak() requires a user gesture (click/tap) to work
 * 3. Chrome has a bug where speech gets "stuck" — cancel() + small delay fixes it
 * 4. If speak() is called without user gesture, it silently fails AND can block future calls
 * 
 * Our solution:
 * - Always cancel before speaking (clears stuck state)
 * - Add a small delay after cancel before speaking (Chrome needs this)
 * - Track whether user has interacted (for auto-play decisions)
 * - Use onvoiceschanged to cache the Arabic voice
 * - Fallback: speak without explicit voice if no Arabic voice found
 */

// Track user interaction for autoplay decisions
let userHasInteracted = false;

// Cache for Arabic voice lookup
let cachedArabicVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function markUserInteraction() {
  userHasInteracted = true;
}

// Listen for any user interaction to unlock audio
if (typeof window !== 'undefined') {
  const interactionEvents = ['click', 'touchstart', 'keydown'];
  const handler = () => {
    markUserInteraction();
    // Remove listeners after first interaction
    interactionEvents.forEach(evt => window.removeEventListener(evt, handler));
  };
  interactionEvents.forEach(evt => window.addEventListener(evt, handler, { once: false, passive: true }));
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

function getArabicVoice(): SpeechSynthesisVoice | null {
  if (cachedArabicVoice) return cachedArabicVoice;
  const voices = loadVoices();
  if (voices.length === 0) return null;
  voicesLoaded = true;
  // Try to find an Arabic voice, preferring ar-SA, then any ar-*
  cachedArabicVoice = voices.find(v => v.lang === 'ar-SA') 
    || voices.find(v => v.lang.startsWith('ar'))
    || null;
  return cachedArabicVoice;
}

// Ensure voices are loaded (Chrome loads them asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Listen for voices to become available
  window.speechSynthesis.onvoiceschanged = () => {
    cachedArabicVoice = null;
    voicesLoaded = false;
    getArabicVoice();
  };
  // Trigger initial load attempt
  getArabicVoice();
}

/**
 * Check if the user has interacted with the page (needed for autoplay)
 */
export function hasUserInteracted(): boolean {
  return userHasInteracted;
}

// ============================================================
// NARRATION (English voice guide for non-reading toddlers)
// ============================================================
//
// Toddlers (ages 2-6) cannot read on-screen instructions. Every game
// screen should SPEAK its instruction aloud. This layer narrates short
// English phrases ("Tap the letter to hear it!") using the Web Speech
// API. It is designed to be drop-in replaceable with recorded mascot
// voice-over later: pass an `audioUrl` to `narrate()` and it will play
// the recording instead of the synthetic voice.
//
// A global mute (the "voice guide" toggle) is persisted to localStorage
// so a parent can turn the talking on/off once for the whole app.
const NARRATION_MUTE_KEY = 'quraniq-kids-voice-muted';
let cachedEnglishVoice: SpeechSynthesisVoice | null = null;
function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedEnglishVoice) return cachedEnglishVoice;
  const voices = loadVoices();
  if (voices.length === 0) return null;
  // Prefer a clear, kid-friendly English voice; fall back to any en-*.
  cachedEnglishVoice =
    voices.find(v => /en-US/i.test(v.lang) && /female|samantha|zira|google us english/i.test(v.name)) ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null;
  return cachedEnglishVoice;
}
/** Whether the parent has muted the spoken voice guide. */
export function isVoiceMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(NARRATION_MUTE_KEY) === '1';
  } catch {
    return false;
  }
}
/** Mute / unmute the spoken voice guide. Broadcasts a change event so toggles update. */
export function setVoiceMuted(muted: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NARRATION_MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (muted) cancelSpeech();
  window.dispatchEvent(new CustomEvent('quraniq-voice-muted-changed', { detail: muted }));
}
/** Stop any in-progress speech immediately. */
export function cancelSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
/**
 * Check if English narration (voice guide) is currently in progress.
 * Used to queue Arabic speech so it doesn't interrupt mascot instructions.
 */
export function isEnglishSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis;
  return synth.speaking;
}
/**
 * Speak a short English instruction aloud (the "voice guide").
 * No-ops if the user hasn't interacted yet (autoplay policy) or if muted.
 * Returns true if speech was attempted.
 */
export function speakEnglish(text: string, rate: number = 0.95): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (isVoiceMuted()) return false;
  if (!userHasInteracted) return false;
  const synth = window.speechSynthesis;
  // Only cancel Arabic speech — don't interrupt other English narration mid-sentence
  synth.cancel();
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate; // slightly slow & clear for little ones
    utterance.pitch = 1.15;
    utterance.volume = 1.0;
    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;
    synth.resume();
    synth.speak(utterance);
  }, 50);
  return true;
}
/**
 * Narrate an instruction. Prefers a recorded audio clip when provided
 * (drop-in path for professional mascot voice-over); otherwise falls
 * back to synthetic English speech. Respects the global mute.
 */
export function narrate(opts: { text: string; audioUrl?: string; rate?: number }): void {
  if (isVoiceMuted()) return;
  if (opts.audioUrl) {
    try {
      const audio = new Audio(opts.audioUrl);
      audio.play().catch(() => {
        // Autoplay blocked or file missing — fall back to TTS.
        speakEnglish(opts.text, opts.rate);
      });
      return;
    } catch {
      /* fall through to TTS */
    }
  }
  speakEnglish(opts.text, opts.rate);
}
/**
 * Speak Arabic text using the Web Speech API.
 * Handles Chrome desktop quirks with cancel-before-speak pattern.
 */
export function speakArabic(text: string, rate: number = 0.8) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  const synth = window.speechSynthesis;
  
  // Helper: speak the Arabic text. Handles voice loading quirks.
  const doSpeak = () => {
    // Chrome fix: cancel any pending/stuck speech first
    synth.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = rate;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      const arabicVoice = getArabicVoice();
      if (arabicVoice) utterance.voice = arabicVoice;
      synth.resume();
      synth.speak(utterance);
      // Safety: keep synthesis resumed in case Chrome pauses long utterances
      const resumeInterval = setInterval(() => {
        if (!synth.speaking) {
          clearInterval(resumeInterval);
        } else {
          synth.resume();
        }
      }, 5000);
      setTimeout(() => clearInterval(resumeInterval), 10000);
    }, 50); // 50ms delay after cancel — enough for Chrome to reset
  };
  // If English narration (voice guide) is in progress, don't interrupt it.
  // Queue Arabic speech to fire after the English finishes (up to 3s).
  if (synth.speaking) {
    let waited = 0;
    const checkInterval = setInterval(() => {
      waited += 100;
      if (!synth.speaking || waited >= 3000) {
        clearInterval(checkInterval);
        doSpeak();
      }
    }, 100);
  } else {
    doSpeak();
  }
}

/**
 * Speak Arabic text, but only if user has already interacted.
 * Use this for auto-play scenarios (e.g., letter reveal animation).
 * Returns true if speech was attempted, false if blocked.
 */
export function speakArabicIfAllowed(text: string, rate: number = 0.8): boolean {
  if (!userHasInteracted) {
    return false;
  }
  speakArabic(text, rate);
  return true;
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
