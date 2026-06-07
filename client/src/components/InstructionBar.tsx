/**
 * InstructionBar — the mascot speaks each screen's instruction aloud.
 *
 * Toddlers can't read, so every game screen shows Hilal with the
 * instruction text AND narrates it automatically (respecting the global
 * voice-guide mute). A speaker button replays it; a small mute toggle
 * lets a grown-up silence the voice for the whole app.
 *
 * Rendering this once in the game shell (LetterPlay / SkillPlay) gives
 * every game spoken instructions from a single place.
 */

import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useNarration } from '@/hooks/useNarration';

const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

interface InstructionBarProps {
  /** The kid-facing instruction to show and speak. */
  text: string;
  /** Optional recorded clip to play instead of synthetic speech. */
  audioUrl?: string;
}

export default function InstructionBar({ text, audioUrl }: InstructionBarProps) {
  const { replay, muted, toggleMute } = useNarration(text, { audioUrl });

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {/* Mascot — bobs gently, tap to hear the instruction again */}
      <motion.button
        onClick={replay}
        aria-label="Hear the instruction again"
        className="flex-shrink-0"
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <img src={MASCOT} alt="Hilal" className="w-11 h-11 drop-shadow" />
      </motion.button>

      {/* Spoken instruction */}
      <motion.div
        key={text}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm border border-amber-100"
      >
        <p className="text-sm md:text-base text-gray-700 font-medium leading-snug" style={{ fontFamily: 'var(--font-body)' }}>
          {text}
        </p>
      </motion.div>

      {/* Replay + mute controls */}
      <button
        onClick={replay}
        aria-label="Play instruction"
        className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
      >
        <span className="text-lg">🔊</span>
      </button>
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Turn voice guide on' : 'Turn voice guide off'}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        {muted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-teal-600" />}
      </button>
    </div>
  );
}
