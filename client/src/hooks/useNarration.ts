/**
 * useNarration — speak short instructions aloud for non-reading toddlers.
 *
 * Auto-narrates the given phrase whenever it changes (e.g. when the game
 * screen advances), respecting the global voice-guide mute and the
 * browser autoplay policy. Exposes a `replay()` for a tap-to-hear-again
 * button and live `muted` state wired to the global toggle.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { narrate, isVoiceMuted, setVoiceMuted, cancelSpeech } from '@/lib/gameEngine';

const MUTE_EVENT = 'quraniq-voice-muted-changed';

interface UseNarrationOptions {
  /** Audio file to play instead of synthetic speech (future mascot VO). */
  audioUrl?: string;
  /** Auto-speak when the text changes. Default true. */
  auto?: boolean;
  /** Delay before auto-speaking, ms. Lets a screen settle first. */
  delay?: number;
}

export function useNarration(text: string, opts: UseNarrationOptions = {}) {
  const { audioUrl, auto = true, delay = 450 } = opts;
  const [muted, setMuted] = useState<boolean>(() => isVoiceMuted());
  const lastSpoken = useRef<string | null>(null);

  // Keep local mute state in sync with the global toggle.
  useEffect(() => {
    const handler = () => setMuted(isVoiceMuted());
    window.addEventListener(MUTE_EVENT, handler);
    return () => window.removeEventListener(MUTE_EVENT, handler);
  }, []);

  const speak = useCallback(() => {
    if (!text) return;
    narrate({ text, audioUrl });
    lastSpoken.current = text;
  }, [text, audioUrl]);

  // Auto-narrate on text change.
  useEffect(() => {
    if (!auto || !text || muted) return;
    if (lastSpoken.current === text) return;
    const timer = setTimeout(speak, delay);
    return () => clearTimeout(timer);
  }, [text, auto, muted, delay, speak]);

  // Stop talking when the screen unmounts.
  useEffect(() => () => cancelSpeech(), []);

  const toggleMute = useCallback(() => {
    const next = !isVoiceMuted();
    setVoiceMuted(next);
    setMuted(next);
  }, []);

  return { replay: speak, muted, toggleMute };
}
