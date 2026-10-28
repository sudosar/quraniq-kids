/**
 * Generated Arabic clips (Edge-TTS neural voice, generated once and
 * shipped as static files — see scripts/generate-audio.py).
 *
 * The clip set is closed: every letter sound, harakat syllable, madd
 * blend, word card and Qur'anic word in the curriculum gets one small
 * MP3 under public/audio/clips/. This module resolves an Arabic text
 * to its clip URL; texts without a clip return undefined and callers
 * fall back (human Qur'an CDN audio where available, then device TTS).
 */
import { AUDIO_CLIPS } from './audioClips.generated';

/**
 * Normalise Arabic text for clip lookup. Must mirror the normaliser
 * in scripts/generate-audio.py: trim and collapse whitespace.
 */
export function normalizeArabicText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Clip URL for an Arabic text, or undefined when no clip exists. */
export function clipUrlForText(text: string): string | undefined {
  const path = AUDIO_CLIPS[normalizeArabicText(text)];
  if (!path) return undefined;
  const base = import.meta.env.BASE_URL || '/';
  // Manifest paths are relative to public/audio/ (files ship under
  // /audio/clips/...), so the audio/ segment belongs in the URL.
  return `${base.replace(/\/?$/, '/')}audio/${path}`;
}
