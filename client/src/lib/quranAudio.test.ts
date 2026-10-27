import { describe, it, expect } from 'vitest';
import {
  parseAyahRef,
  globalAyahNumber,
  wbwAudioUrl,
  ayahAudioUrl,
  phraseWordAudioUrl,
  AYAH_COUNTS,
} from './quranAudio';

describe('quranAudio', () => {
  it('parses ayah refs in the shapes the curriculum uses', () => {
    expect(parseAyahRef('1:7')).toEqual({ surah: 1, ayah: 7 });
    expect(parseAyahRef('Al-Fatiha 1:2')).toEqual({ surah: 1, ayah: 2 });
    expect(parseAyahRef('Al-Baqarah 2:255')).toEqual({ surah: 2, ayah: 255 });
    expect(parseAyahRef('Al-Fatiha')).toBeNull();
    expect(parseAyahRef('999:1')).toBeNull();
  });

  it('ayah counts sum to the full 6236 ayahs', () => {
    expect(AYAH_COUNTS).toHaveLength(114);
    expect(AYAH_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236);
  });

  it('computes global ayah numbers (Ayat al-Kursi 2:255 = 262 is the CDN doc example)', () => {
    expect(globalAyahNumber({ surah: 1, ayah: 1 })).toBe(1);
    expect(globalAyahNumber({ surah: 2, ayah: 255 })).toBe(262);
    expect(globalAyahNumber({ surah: 114, ayah: 6 })).toBe(6236);
  });

  it('builds word-by-word CDN URLs with zero-padded parts', () => {
    expect(wbwAudioUrl({ surah: 1, ayah: 1 }, 1)).toBe(
      'https://audio.qurancdn.com/wbw/001_001_001.mp3',
    );
    expect(wbwAudioUrl({ surah: 2, ayah: 2 }, 5)).toBe(
      'https://audio.qurancdn.com/wbw/002_002_005.mp3',
    );
  });

  it('builds whole-ayah recitation URLs from the global number', () => {
    expect(ayahAudioUrl({ surah: 1, ayah: 1 })).toBe(
      'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',
    );
    expect(ayahAudioUrl({ surah: 2, ayah: 255 })).toBe(
      'https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3',
    );
  });

  it('applies verified phrase offsets and refuses unverified phrases', () => {
    // 'وَلَا' starts at word 8 of 1:7; the phrase's second word is word 9.
    expect(phraseWordAudioUrl('1:7', 'وَلَا', 1)).toBe(
      'https://audio.qurancdn.com/wbw/001_007_009.mp3',
    );
    // Ayah-initial phrase: no shift.
    expect(phraseWordAudioUrl('1:1', 'بِسْمِ', 0)).toBe(
      'https://audio.qurancdn.com/wbw/001_001_001.mp3',
    );
    // Not in the verified table -> null, so callers fall back safely.
    expect(phraseWordAudioUrl('36:58', 'سَلَـٰمٌ', 0)).toBeNull();
    expect(phraseWordAudioUrl('not a ref', 'x', 0)).toBeNull();
  });
});
