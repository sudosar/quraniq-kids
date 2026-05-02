/**
 * QuranIQ Kids - Quranic Qaida Curriculum Data
 * 
 * Design: Celestial Garden theme
 * Progressive learning from individual letters to connected reading
 * 
 * KEY PRINCIPLE: A child should NEVER be tested on letters they haven't learned yet.
 * Distractors come ONLY from previously mastered letters.
 */

export interface WordCard {
  word: string;         // Arabic word
  transliteration: string;
  meaning: string;
  emoji: string;        // visual representation for toddlers
  letterHighlightIndex: number[]; // indices of the target letter in the word
  position?: 'beginning' | 'middle' | 'end'; // where the letter appears in the word
}

export interface QuranicWord {
  word: string;         // Arabic word from Quran
  surah: string;        // Surah name
  meaning: string;
  letterHighlightIndex: number[]; // indices of the target letter
}

export interface ArabicLetter {
  id: number;
  letter: string;
  name: string;
  nameAr: string;
  transliteration: string;
  sound: string;
  group: string;
  color: string;
  wordCards: WordCard[];       // Words featuring this letter in various positions
  quranicWords: QuranicWord[]; // Quranic words featuring this letter
}

export interface Lesson {
  id: number;
  title: string;
  titleAr: string;
  description: string;
  level: number;
  type: 'letters' | 'harakat' | 'tanween' | 'madd' | 'sukoon' | 'practice';
  letters?: number[];
  unlockAfter?: number;
  icon: string;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  color: string;
  lessons: number[];
}

// All 28 Arabic Letters with word cards and Quranic words
export const arabicLetters: ArabicLetter[] = [
  {
    id: 1, letter: 'ا', name: 'Alif', nameAr: 'ألف', transliteration: 'a',
    sound: 'ah (like "a" in "father")', group: 'throat', color: '#0D7377',
    wordCards: [
      { word: 'أسد', transliteration: 'Asad', meaning: 'Lion', emoji: '🦁', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'سماء', transliteration: 'Samaa', meaning: 'Sky', emoji: '🌤️', letterHighlightIndex: [3], position: 'end' },
      { word: 'قائد', transliteration: 'Qaaid', meaning: 'Leader', emoji: '👨‍✈️', letterHighlightIndex: [1], position: 'middle' },
    ],
    quranicWords: [
      { word: 'ٱللَّه', surah: 'Al-Fatiha', meaning: 'Allah (God)', letterHighlightIndex: [0] },
      { word: 'ٱلْحَمْدُ', surah: 'Al-Fatiha', meaning: 'All praise', letterHighlightIndex: [0] },
      { word: 'إِيَّاكَ', surah: 'Al-Fatiha', meaning: 'You alone', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 2, letter: 'ب', name: 'Ba', nameAr: 'باء', transliteration: 'b',
    sound: 'b (like "b" in "boy")', group: 'lips', color: '#F5A623',
    wordCards: [
      { word: 'بقرة', transliteration: 'Baqara', meaning: 'Cow', emoji: '🐄', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'كتاب', transliteration: 'Kitaab', meaning: 'Book', emoji: '📖', letterHighlightIndex: [3], position: 'end' },
      { word: 'جبل', transliteration: 'Jabal', meaning: 'Mountain', emoji: '⛰️', letterHighlightIndex: [1], position: 'middle' },
    ],
    quranicWords: [
      { word: 'بِسْمِ', surah: 'Al-Fatiha', meaning: 'In the name of', letterHighlightIndex: [0] },
      { word: 'بِٱللَّهِ', surah: 'Al-Fatiha', meaning: 'of Allah', letterHighlightIndex: [0] },
      { word: 'بَعْدِ', surah: 'Al-Baqarah', meaning: 'After', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 3, letter: 'ت', name: 'Ta', nameAr: 'تاء', transliteration: 't',
    sound: 't (like "t" in "top")', group: 'tongue-tip', color: '#E8567F',
    wordCards: [
      { word: 'تفاح', transliteration: 'Tuffah', meaning: 'Apple', emoji: '🍎', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'كتب', transliteration: 'Kutub', meaning: 'Books', emoji: '📚', letterHighlightIndex: [1], position: 'middle' },
      { word: 'بيت', transliteration: 'Bayt', meaning: 'House', emoji: '🏠', letterHighlightIndex: [2], position: 'end' },
    ],
    quranicWords: [
      { word: 'تَبَارَكَ', surah: 'Al-Mulk', meaning: 'Blessed is', letterHighlightIndex: [0] },
      { word: 'تَوَّابٌ', surah: 'Al-Baqarah', meaning: 'Accepting repentance', letterHighlightIndex: [0] },
      { word: 'تَعْبُدُونَ', surah: 'Al-Baqarah', meaning: 'You worship', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 4, letter: 'ث', name: 'Tha', nameAr: 'ثاء', transliteration: 'th',
    sound: 'th (like "th" in "think")', group: 'tongue-tip', color: '#6B8E23',
    wordCards: [
      { word: 'ثعلب', transliteration: 'Thalab', meaning: 'Fox', emoji: '🦊', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'أثاث', transliteration: 'Athaath', meaning: 'Furniture', emoji: '🪑', letterHighlightIndex: [1], position: 'middle' },
      { word: 'حديث', transliteration: 'Hadeeth', meaning: 'Speech', emoji: '💬', letterHighlightIndex: [3], position: 'end' },
    ],
    quranicWords: [
      { word: 'ثُمَّ', surah: 'Al-Baqarah', meaning: 'Then', letterHighlightIndex: [0] },
      { word: 'ثَمَرَات', surah: 'Al-Baqarah', meaning: 'Fruits', letterHighlightIndex: [0] },
      { word: 'ثَلَاثَة', surah: 'Al-Kahf', meaning: 'Three', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 5, letter: 'ج', name: 'Jeem', nameAr: 'جيم', transliteration: 'j',
    sound: 'j (like "j" in "jump")', group: 'middle-tongue', color: '#9B59B6',
    wordCards: [
      { word: 'جمل', transliteration: 'Jamal', meaning: 'Camel', emoji: '🐪', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'نجم', transliteration: 'Najm', meaning: 'Star', emoji: '⭐', letterHighlightIndex: [1], position: 'middle' },
      { word: 'ثلج', transliteration: 'Thalj', meaning: 'Snow', emoji: '❄️', letterHighlightIndex: [2], position: 'end' },
    ],
    quranicWords: [
      { word: 'جَنَّة', surah: 'Al-Baqarah', meaning: 'Paradise', letterHighlightIndex: [0] },
      { word: 'جَعَلَ', surah: 'Al-Baqarah', meaning: 'He made', letterHighlightIndex: [0] },
      { word: 'جَاءَ', surah: 'An-Nasr', meaning: 'Came', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 6, letter: 'ح', name: 'Ha', nameAr: 'حاء', transliteration: 'ḥ',
    sound: 'h (breathy, from throat)', group: 'throat', color: '#3498DB',
    wordCards: [
      { word: 'حصان', transliteration: 'Hisan', meaning: 'Horse', emoji: '🐴', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'بحر', transliteration: 'Bahr', meaning: 'Sea', emoji: '🌊', letterHighlightIndex: [1], position: 'middle' },
      { word: 'ملح', transliteration: 'Milh', meaning: 'Salt', emoji: '🧂', letterHighlightIndex: [2], position: 'end' },
    ],
    quranicWords: [
      { word: 'حَمْدُ', surah: 'Al-Fatiha', meaning: 'Praise', letterHighlightIndex: [0] },
      { word: 'حَكِيم', surah: 'Al-Baqarah', meaning: 'Wise', letterHighlightIndex: [0] },
      { word: 'حَقّ', surah: 'Al-Baqarah', meaning: 'Truth', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 7, letter: 'خ', name: 'Kha', nameAr: 'خاء', transliteration: 'kh',
    sound: 'kh (like clearing throat gently)', group: 'throat', color: '#E67E22',
    wordCards: [
      { word: 'خروف', transliteration: 'Kharoof', meaning: 'Sheep', emoji: '🐑', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'نخل', transliteration: 'Nakhl', meaning: 'Palm tree', emoji: '🌴', letterHighlightIndex: [1], position: 'middle' },
      { word: 'طبخ', transliteration: 'Tabkh', meaning: 'Cooking', emoji: '🍳', letterHighlightIndex: [2], position: 'end' },
    ],
    quranicWords: [
      { word: 'خَلَقَ', surah: 'Al-Alaq', meaning: 'Created', letterHighlightIndex: [0] },
      { word: 'خَيْر', surah: 'Al-Baqarah', meaning: 'Good', letterHighlightIndex: [0] },
      { word: 'خَاشِعِينَ', surah: 'Al-Baqarah', meaning: 'Humble ones', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 8, letter: 'د', name: 'Dal', nameAr: 'دال', transliteration: 'd',
    sound: 'd (like "d" in "door")', group: 'tongue-tip', color: '#1ABC9C',
    wordCards: [
      { word: 'دب', transliteration: 'Dubb', meaning: 'Bear', emoji: '🐻', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'مدرسة', transliteration: 'Madrasa', meaning: 'School', emoji: '🏫', letterHighlightIndex: [1], position: 'middle' },
      { word: 'أسد', transliteration: 'Asad', meaning: 'Lion', emoji: '🦁', letterHighlightIndex: [2], position: 'end' },
    ],
    quranicWords: [
      { word: 'دِين', surah: 'Al-Fatiha', meaning: 'Religion/Way', letterHighlightIndex: [0] },
      { word: 'دُعَاء', surah: 'Al-Baqarah', meaning: 'Supplication', letterHighlightIndex: [0] },
      { word: 'دَرَجَات', surah: 'Al-Baqarah', meaning: 'Degrees', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 9, letter: 'ذ', name: 'Dhal', nameAr: 'ذال', transliteration: 'dh',
    sound: 'dh (like "th" in "this")', group: 'tongue-tip', color: '#F39C12',
    wordCards: [
      { word: 'ذئب', transliteration: 'Dhiʾb', meaning: 'Wolf', emoji: '🐺', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'لذيذ', transliteration: 'Ladheedh', meaning: 'Delicious', emoji: '😋', letterHighlightIndex: [1], position: 'middle' },
      { word: 'تلميذ', transliteration: 'Tilmeedh', meaning: 'Student', emoji: '👨‍🎓', letterHighlightIndex: [4], position: 'end' },
    ],
    quranicWords: [
      { word: 'ذَلِكَ', surah: 'Al-Baqarah', meaning: 'That', letterHighlightIndex: [0] },
      { word: 'ذِكْر', surah: 'Al-Baqarah', meaning: 'Remembrance', letterHighlightIndex: [0] },
      { word: 'ذُنُوب', surah: 'Aal-Imran', meaning: 'Sins', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 10, letter: 'ر', name: 'Ra', nameAr: 'راء', transliteration: 'r',
    sound: 'r (rolled, like Spanish "r")', group: 'tongue-tip', color: '#E74C3C',
    wordCards: [
      { word: 'رمان', transliteration: 'Rumman', meaning: 'Pomegranate', emoji: '🍎', letterHighlightIndex: [0], position: 'beginning' },
      { word: 'شجرة', transliteration: 'Shajara', meaning: 'Tree', emoji: '🌳', letterHighlightIndex: [2], position: 'middle' },
      { word: 'قمر', transliteration: 'Qamar', meaning: 'Moon', emoji: '🌙', letterHighlightIndex: [2], position: 'end' },
    ],
    quranicWords: [
      { word: 'رَبِّ', surah: 'Al-Fatiha', meaning: 'Lord', letterHighlightIndex: [0] },
      { word: 'رَحْمَن', surah: 'Al-Fatiha', meaning: 'Most Merciful', letterHighlightIndex: [0] },
      { word: 'رَحِيم', surah: 'Al-Fatiha', meaning: 'Most Compassionate', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 11, letter: 'ز', name: 'Zay', nameAr: 'زاي', transliteration: 'z',
    sound: 'z (like "z" in "zoo")', group: 'tongue-tip', color: '#2ECC71',
    wordCards: [
      { word: 'زرافة', transliteration: 'Zarafa', meaning: 'Giraffe', emoji: '🦒', letterHighlightIndex: [0] },
      { word: 'زهرة', transliteration: 'Zahra', meaning: 'Flower', emoji: '🌺', letterHighlightIndex: [0] },
      { word: 'زيتون', transliteration: 'Zaytoon', meaning: 'Olive', emoji: '🫒', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'زَيْتُونَة', surah: 'An-Nur', meaning: 'Olive tree', letterHighlightIndex: [0] },
      { word: 'زَكَاة', surah: 'Al-Baqarah', meaning: 'Charity', letterHighlightIndex: [0] },
      { word: 'زُيِّنَ', surah: 'Al-Baqarah', meaning: 'Beautified', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 12, letter: 'س', name: 'Seen', nameAr: 'سين', transliteration: 's',
    sound: 's (like "s" in "sun")', group: 'tongue-tip', color: '#0D7377',
    wordCards: [
      { word: 'سمكة', transliteration: 'Samaka', meaning: 'Fish', emoji: '🐟', letterHighlightIndex: [0] },
      { word: 'سلحفاة', transliteration: 'Sulahfa', meaning: 'Turtle', emoji: '🐢', letterHighlightIndex: [0] },
      { word: 'سيارة', transliteration: 'Sayyara', meaning: 'Car', emoji: '🚗', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'سَمَاء', surah: 'Al-Baqarah', meaning: 'Sky', letterHighlightIndex: [0] },
      { word: 'سَلَام', surah: 'Ya-Sin', meaning: 'Peace', letterHighlightIndex: [0] },
      { word: 'سَبِيل', surah: 'Al-Baqarah', meaning: 'Path', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 13, letter: 'ش', name: 'Sheen', nameAr: 'شين', transliteration: 'sh',
    sound: 'sh (like "sh" in "ship")', group: 'middle-tongue', color: '#8E44AD',
    wordCards: [
      { word: 'شمس', transliteration: 'Shams', meaning: 'Sun', emoji: '☀️', letterHighlightIndex: [0] },
      { word: 'شجرة', transliteration: 'Shajara', meaning: 'Tree', emoji: '🌳', letterHighlightIndex: [0] },
      { word: 'شاي', transliteration: 'Shay', meaning: 'Tea', emoji: '🍵', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'شَهْر', surah: 'Al-Baqarah', meaning: 'Month', letterHighlightIndex: [0] },
      { word: 'شَيْء', surah: 'Al-Baqarah', meaning: 'Thing', letterHighlightIndex: [0] },
      { word: 'شَكُور', surah: 'Fatir', meaning: 'Grateful', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 14, letter: 'ص', name: 'Sad', nameAr: 'صاد', transliteration: 'ṣ',
    sound: 's (heavy/emphatic "s")', group: 'tongue-tip', color: '#D35400',
    wordCards: [
      { word: 'صقر', transliteration: 'Saqr', meaning: 'Falcon', emoji: '🦅', letterHighlightIndex: [0] },
      { word: 'صحراء', transliteration: 'Sahra', meaning: 'Desert', emoji: '🏜️', letterHighlightIndex: [0] },
      { word: 'صابون', transliteration: 'Saboon', meaning: 'Soap', emoji: '🧼', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'صِرَاط', surah: 'Al-Fatiha', meaning: 'Path', letterHighlightIndex: [0] },
      { word: 'صَالِحَات', surah: 'Al-Baqarah', meaning: 'Good deeds', letterHighlightIndex: [0] },
      { word: 'صَبَرُوا', surah: 'Al-Baqarah', meaning: 'They were patient', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 15, letter: 'ض', name: 'Dad', nameAr: 'ضاد', transliteration: 'ḍ',
    sound: 'd (heavy/emphatic "d")', group: 'tongue-side', color: '#16A085',
    wordCards: [
      { word: 'ضفدع', transliteration: 'Difda', meaning: 'Frog', emoji: '🐸', letterHighlightIndex: [0] },
      { word: 'ضوء', transliteration: 'Dawʾ', meaning: 'Light', emoji: '💡', letterHighlightIndex: [0] },
      { word: 'ضيف', transliteration: 'Dayf', meaning: 'Guest', emoji: '🧑', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'ضَلَّ', surah: 'Al-Baqarah', meaning: 'Went astray', letterHighlightIndex: [0] },
      { word: 'ضَرَبَ', surah: 'Al-Baqarah', meaning: 'Struck/Gave example', letterHighlightIndex: [0] },
      { word: 'أَرْض', surah: 'Al-Baqarah', meaning: 'Earth', letterHighlightIndex: [3] },
    ],
  },
  {
    id: 16, letter: 'ط', name: 'Taa', nameAr: 'طاء', transliteration: 'ṭ',
    sound: 't (heavy/emphatic "t")', group: 'tongue-tip', color: '#2980B9',
    wordCards: [
      { word: 'طائر', transliteration: 'Taʾir', meaning: 'Bird', emoji: '🐦', letterHighlightIndex: [0] },
      { word: 'طبل', transliteration: 'Tabl', meaning: 'Drum', emoji: '🥁', letterHighlightIndex: [0] },
      { word: 'طماطم', transliteration: 'Tamatim', meaning: 'Tomato', emoji: '🍅', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'طَيِّبَات', surah: 'Al-Baqarah', meaning: 'Good things', letterHighlightIndex: [0] },
      { word: 'طَهُور', surah: 'Al-Furqan', meaning: 'Purifying', letterHighlightIndex: [0] },
      { word: 'صِرَاطَ', surah: 'Al-Fatiha', meaning: 'The path', letterHighlightIndex: [3] },
    ],
  },
  {
    id: 17, letter: 'ظ', name: 'Dhaa', nameAr: 'ظاء', transliteration: 'ẓ',
    sound: 'dh (heavy/emphatic "dh")', group: 'tongue-tip', color: '#C0392B',
    wordCards: [
      { word: 'ظرف', transliteration: 'Dharf', meaning: 'Envelope', emoji: '✉️', letterHighlightIndex: [0] },
      { word: 'ظل', transliteration: 'Dhill', meaning: 'Shadow', emoji: '🌑', letterHighlightIndex: [0] },
      { word: 'ظبي', transliteration: 'Dhaby', meaning: 'Gazelle', emoji: '🦌', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'ظُلُمَات', surah: 'Al-Baqarah', meaning: 'Darknesses', letterHighlightIndex: [0] },
      { word: 'ظَلَمُوا', surah: 'Al-Baqarah', meaning: 'They wronged', letterHighlightIndex: [0] },
      { word: 'ظَاهِر', surah: 'Al-Hadid', meaning: 'Manifest', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 18, letter: 'ع', name: 'Ain', nameAr: 'عين', transliteration: 'ʿ',
    sound: 'deep throat sound (no English equivalent)', group: 'throat', color: '#27AE60',
    wordCards: [
      { word: 'عنب', transliteration: 'ʿInab', meaning: 'Grapes', emoji: '🍇', letterHighlightIndex: [0] },
      { word: 'عين', transliteration: 'ʿAyn', meaning: 'Eye', emoji: '👁️', letterHighlightIndex: [0] },
      { word: 'عسل', transliteration: 'ʿAsal', meaning: 'Honey', emoji: '🍯', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'عَلِيم', surah: 'Al-Baqarah', meaning: 'All-Knowing', letterHighlightIndex: [0] },
      { word: 'عَظِيم', surah: 'Al-Baqarah', meaning: 'Great', letterHighlightIndex: [0] },
      { word: 'عِبَاد', surah: 'Al-Baqarah', meaning: 'Servants', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 19, letter: 'غ', name: 'Ghain', nameAr: 'غين', transliteration: 'gh',
    sound: 'gh (like French "r" gargling)', group: 'throat', color: '#F5A623',
    wordCards: [
      { word: 'غزال', transliteration: 'Ghazal', meaning: 'Deer', emoji: '🦌', letterHighlightIndex: [0] },
      { word: 'غيمة', transliteration: 'Ghayma', meaning: 'Cloud', emoji: '☁️', letterHighlightIndex: [0] },
      { word: 'غابة', transliteration: 'Ghaba', meaning: 'Forest', emoji: '🌲', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'غَفُور', surah: 'Al-Baqarah', meaning: 'Forgiving', letterHighlightIndex: [0] },
      { word: 'غَيْب', surah: 'Al-Baqarah', meaning: 'Unseen', letterHighlightIndex: [0] },
      { word: 'غَنِيّ', surah: 'Al-Baqarah', meaning: 'Rich/Self-sufficient', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 20, letter: 'ف', name: 'Fa', nameAr: 'فاء', transliteration: 'f',
    sound: 'f (like "f" in "fish")', group: 'lips', color: '#E8567F',
    wordCards: [
      { word: 'فراشة', transliteration: 'Farasha', meaning: 'Butterfly', emoji: '🦋', letterHighlightIndex: [0] },
      { word: 'فيل', transliteration: 'Feel', meaning: 'Elephant', emoji: '🐘', letterHighlightIndex: [0] },
      { word: 'فراولة', transliteration: 'Farawla', meaning: 'Strawberry', emoji: '🍓', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'فَضْل', surah: 'Al-Baqarah', meaning: 'Bounty', letterHighlightIndex: [0] },
      { word: 'فِيهَا', surah: 'Al-Baqarah', meaning: 'In it', letterHighlightIndex: [0] },
      { word: 'فَلَا', surah: 'Al-Baqarah', meaning: 'So no', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 21, letter: 'ق', name: 'Qaf', nameAr: 'قاف', transliteration: 'q',
    sound: 'q (deep "k" from back of throat)', group: 'back-tongue', color: '#0D7377',
    wordCards: [
      { word: 'قمر', transliteration: 'Qamar', meaning: 'Moon', emoji: '🌙', letterHighlightIndex: [0] },
      { word: 'قطة', transliteration: 'Qitta', meaning: 'Cat', emoji: '🐱', letterHighlightIndex: [0] },
      { word: 'قلم', transliteration: 'Qalam', meaning: 'Pen', emoji: '🖊️', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'قُلْ', surah: 'Al-Ikhlas', meaning: 'Say', letterHighlightIndex: [0] },
      { word: 'قُرْآن', surah: 'Al-Baqarah', meaning: 'Quran', letterHighlightIndex: [0] },
      { word: 'قَدِير', surah: 'Al-Baqarah', meaning: 'Capable', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 22, letter: 'ك', name: 'Kaf', nameAr: 'كاف', transliteration: 'k',
    sound: 'k (like "k" in "king")', group: 'back-tongue', color: '#9B59B6',
    wordCards: [
      { word: 'كلب', transliteration: 'Kalb', meaning: 'Dog', emoji: '🐕', letterHighlightIndex: [0] },
      { word: 'كتاب', transliteration: 'Kitab', meaning: 'Book', emoji: '📖', letterHighlightIndex: [0] },
      { word: 'كرة', transliteration: 'Kura', meaning: 'Ball', emoji: '⚽', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'كِتَاب', surah: 'Al-Baqarah', meaning: 'Book', letterHighlightIndex: [0] },
      { word: 'كَافِرُونَ', surah: 'Al-Kafirun', meaning: 'Disbelievers', letterHighlightIndex: [0] },
      { word: 'كُلّ', surah: 'Al-Baqarah', meaning: 'Every/All', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 23, letter: 'ل', name: 'Lam', nameAr: 'لام', transliteration: 'l',
    sound: 'l (like "l" in "light")', group: 'tongue-tip', color: '#3498DB',
    wordCards: [
      { word: 'ليمون', transliteration: 'Laymoon', meaning: 'Lemon', emoji: '🍋', letterHighlightIndex: [0] },
      { word: 'لعبة', transliteration: 'Luʿba', meaning: 'Toy', emoji: '🧸', letterHighlightIndex: [0] },
      { word: 'لؤلؤ', transliteration: 'Luʾluʾ', meaning: 'Pearl', emoji: '🫧', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'لِلَّهِ', surah: 'Al-Fatiha', meaning: 'For Allah', letterHighlightIndex: [0] },
      { word: 'لَا', surah: 'Al-Baqarah', meaning: 'No/Not', letterHighlightIndex: [0] },
      { word: 'لَعَلَّكُمْ', surah: 'Al-Baqarah', meaning: 'So that you may', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 24, letter: 'م', name: 'Meem', nameAr: 'ميم', transliteration: 'm',
    sound: 'm (like "m" in "moon")', group: 'lips', color: '#E67E22',
    wordCards: [
      { word: 'موز', transliteration: 'Mawz', meaning: 'Banana', emoji: '🍌', letterHighlightIndex: [0] },
      { word: 'مسجد', transliteration: 'Masjid', meaning: 'Mosque', emoji: '🕌', letterHighlightIndex: [0] },
      { word: 'ماء', transliteration: 'Maʾ', meaning: 'Water', emoji: '💧', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'مَالِكِ', surah: 'Al-Fatiha', meaning: 'Master/Owner', letterHighlightIndex: [0] },
      { word: 'مُسْلِمُونَ', surah: 'Al-Baqarah', meaning: 'Muslims', letterHighlightIndex: [0] },
      { word: 'مُؤْمِنُونَ', surah: 'Al-Baqarah', meaning: 'Believers', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 25, letter: 'ن', name: 'Noon', nameAr: 'نون', transliteration: 'n',
    sound: 'n (like "n" in "noon")', group: 'tongue-tip', color: '#1ABC9C',
    wordCards: [
      { word: 'نحلة', transliteration: 'Nahla', meaning: 'Bee', emoji: '🐝', letterHighlightIndex: [0] },
      { word: 'نجمة', transliteration: 'Najma', meaning: 'Star', emoji: '⭐', letterHighlightIndex: [0] },
      { word: 'نار', transliteration: 'Nar', meaning: 'Fire', emoji: '🔥', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'نُور', surah: 'An-Nur', meaning: 'Light', letterHighlightIndex: [0] },
      { word: 'نَاس', surah: 'An-Nas', meaning: 'People', letterHighlightIndex: [0] },
      { word: 'نَعْبُدُ', surah: 'Al-Fatiha', meaning: 'We worship', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 26, letter: 'ه', name: 'Ha', nameAr: 'هاء', transliteration: 'h',
    sound: 'h (like "h" in "hello")', group: 'throat', color: '#F39C12',
    wordCards: [
      { word: 'هلال', transliteration: 'Hilal', meaning: 'Crescent', emoji: '🌙', letterHighlightIndex: [0] },
      { word: 'هدية', transliteration: 'Hadiyya', meaning: 'Gift', emoji: '🎁', letterHighlightIndex: [0] },
      { word: 'هرة', transliteration: 'Hirra', meaning: 'Cat', emoji: '🐱', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'هُدًى', surah: 'Al-Baqarah', meaning: 'Guidance', letterHighlightIndex: [0] },
      { word: 'هُوَ', surah: 'Al-Ikhlas', meaning: 'He', letterHighlightIndex: [0] },
      { word: 'هَٰذَا', surah: 'Al-Baqarah', meaning: 'This', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 27, letter: 'و', name: 'Waw', nameAr: 'واو', transliteration: 'w',
    sound: 'w (like "w" in "water")', group: 'lips', color: '#E74C3C',
    wordCards: [
      { word: 'وردة', transliteration: 'Warda', meaning: 'Rose', emoji: '🌹', letterHighlightIndex: [0] },
      { word: 'وجه', transliteration: 'Wajh', meaning: 'Face', emoji: '😊', letterHighlightIndex: [0] },
      { word: 'ولد', transliteration: 'Walad', meaning: 'Boy', emoji: '👦', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'وَلَا', surah: 'Al-Fatiha', meaning: 'And not', letterHighlightIndex: [0] },
      { word: 'وَاللَّهُ', surah: 'Al-Baqarah', meaning: 'And Allah', letterHighlightIndex: [0] },
      { word: 'وَالْعَصْرِ', surah: 'Al-Asr', meaning: 'By time', letterHighlightIndex: [0] },
    ],
  },
  {
    id: 28, letter: 'ي', name: 'Ya', nameAr: 'ياء', transliteration: 'y',
    sound: 'y (like "y" in "yes")', group: 'middle-tongue', color: '#2ECC71',
    wordCards: [
      { word: 'يد', transliteration: 'Yad', meaning: 'Hand', emoji: '✋', letterHighlightIndex: [0] },
      { word: 'يمامة', transliteration: 'Yamama', meaning: 'Dove', emoji: '🕊️', letterHighlightIndex: [0] },
      { word: 'يقطين', transliteration: 'Yaqteen', meaning: 'Pumpkin', emoji: '🎃', letterHighlightIndex: [0] },
    ],
    quranicWords: [
      { word: 'يَوْم', surah: 'Al-Fatiha', meaning: 'Day', letterHighlightIndex: [0] },
      { word: 'يُؤْمِنُونَ', surah: 'Al-Baqarah', meaning: 'They believe', letterHighlightIndex: [0] },
      { word: 'يَعْلَمُ', surah: 'Al-Baqarah', meaning: 'He knows', letterHighlightIndex: [0] },
    ],
  },
];

// Harakat (Short Vowels) data
export const harakat = [
  { id: 'fatha', symbol: 'َ', name: 'Fatha', nameAr: 'فتحة', sound: 'a (short "a")', position: 'above', color: '#E74C3C' },
  { id: 'kasra', symbol: 'ِ', name: 'Kasra', nameAr: 'كسرة', sound: 'i (short "i")', position: 'below', color: '#2ECC71' },
  { id: 'damma', symbol: 'ُ', name: 'Damma', nameAr: 'ضمة', sound: 'u (short "u")', position: 'above', color: '#3498DB' },
];

// Tanween data
export const tanween = [
  { id: 'fathatayn', symbol: 'ً', name: 'Fathatayn', nameAr: 'فتحتين', sound: 'an', color: '#E74C3C' },
  { id: 'kasratayn', symbol: 'ٍ', name: 'Kasratayn', nameAr: 'كسرتين', sound: 'in', color: '#2ECC71' },
  { id: 'dammatayn', symbol: 'ٌ', name: 'Dammatayn', nameAr: 'ضمتين', sound: 'un', color: '#3498DB' },
];

// Lessons structure
export const lessons: Lesson[] = [
  { id: 1, title: 'First Letters', titleAr: 'الحروف الأولى', description: 'Learn Alif to Kha', level: 1, type: 'letters', letters: [1, 2, 3, 4, 5, 6, 7], icon: '🌱' },
  { id: 2, title: 'Next Letters', titleAr: 'الحروف التالية', description: 'Learn Dal to Seen', level: 1, type: 'letters', letters: [8, 9, 10, 11, 12], unlockAfter: 1, icon: '🌿' },
  { id: 3, title: 'More Letters', titleAr: 'المزيد من الحروف', description: 'Learn Sheen to Ain', level: 1, type: 'letters', letters: [13, 14, 15, 16, 17, 18], unlockAfter: 2, icon: '🌺' },
  { id: 4, title: 'Final Letters', titleAr: 'الحروف الأخيرة', description: 'Learn Ghain to Ya', level: 1, type: 'letters', letters: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28], unlockAfter: 3, icon: '🌸' },
  { id: 5, title: 'Fatha', titleAr: 'الفتحة', description: 'Learn the Fatha vowel sound', level: 2, type: 'harakat', unlockAfter: 4, icon: '☀️' },
  { id: 6, title: 'Kasra', titleAr: 'الكسرة', description: 'Learn the Kasra vowel sound', level: 2, type: 'harakat', unlockAfter: 5, icon: '🌙' },
  { id: 7, title: 'Damma', titleAr: 'الضمة', description: 'Learn the Damma vowel sound', level: 2, type: 'harakat', unlockAfter: 6, icon: '⭐' },
  { id: 8, title: 'Tanween', titleAr: 'التنوين', description: 'Learn double vowel sounds', level: 3, type: 'tanween', unlockAfter: 7, icon: '✨' },
  { id: 9, title: 'Long Vowels', titleAr: 'حروف المد', description: 'Learn to stretch sounds', level: 4, type: 'madd', unlockAfter: 8, icon: '🎵' },
  { id: 10, title: 'Sukoon', titleAr: 'السكون', description: 'Learn silent letters', level: 5, type: 'sukoon', unlockAfter: 9, icon: '🔇' },
  { id: 11, title: 'Word Building', titleAr: 'بناء الكلمات', description: 'Combine letters into words', level: 6, type: 'practice', unlockAfter: 10, icon: '📖' },
];

// Levels structure
export const levels: Level[] = [
  { id: 1, title: 'The Garden of Letters', description: 'Learn all 28 Arabic letters', color: '#0D7377', lessons: [1, 2, 3, 4] },
  { id: 2, title: 'The Vowel Oasis', description: 'Learn short vowel sounds', color: '#F5A623', lessons: [5, 6, 7] },
  { id: 3, title: 'The Tanween Trail', description: 'Learn double vowel sounds', color: '#E8567F', lessons: [8] },
  { id: 4, title: 'The Stretching Stream', description: 'Learn long vowel sounds', color: '#9B59B6', lessons: [9] },
  { id: 5, title: 'The Silent Meadow', description: 'Learn about Sukoon', color: '#27AE60', lessons: [10] },
  { id: 6, title: 'The Reading Garden', description: 'Practice reading words', color: '#3498DB', lessons: [11] },
];

// Helper: Get letters for a specific lesson
export function getLettersForLesson(lessonId: number): ArabicLetter[] {
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson || !lesson.letters) return [];
  return lesson.letters.map(id => arabicLetters.find(l => l.id === id)!).filter(Boolean);
}

// Helper: Check if a lesson is unlocked
export function isLessonUnlocked(lessonId: number, completedLessons: number[]): boolean {
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) return false;
  if (!lesson.unlockAfter) return true;
  return completedLessons.includes(lesson.unlockAfter);
}

/**
 * PROGRESSIVE DISTRACTOR LOGIC
 * 
 * Returns ONLY letters the child has already learned (completed in previous lessons + 
 * earlier in the current lesson). Never returns letters the child hasn't seen yet.
 * 
 * @param currentLetter - The letter being learned right now
 * @param lessonId - Current lesson ID
 * @param letterIndexInLesson - Index of current letter within the lesson (0-based)
 * @param completedLessons - Array of completed lesson IDs
 * @param count - How many distractors to return
 */
export function getProgressiveDistractors(
  currentLetter: ArabicLetter,
  lessonId: number,
  letterIndexInLesson: number,
  completedLessons: number[],
  count: number
): ArabicLetter[] {
  const learnedLetters: ArabicLetter[] = [];
  
  // Add letters from all completed lessons
  for (const completedLessonId of completedLessons) {
    const lessonLetters = getLettersForLesson(completedLessonId);
    learnedLetters.push(...lessonLetters);
  }
  
  // Add letters from the current lesson that come BEFORE the current letter
  const currentLessonLetters = getLettersForLesson(lessonId);
  for (let i = 0; i < letterIndexInLesson; i++) {
    if (currentLessonLetters[i] && !learnedLetters.find(l => l.id === currentLessonLetters[i].id)) {
      learnedLetters.push(currentLessonLetters[i]);
    }
  }
  
  // Remove the current letter from the pool
  const pool = learnedLetters.filter(l => l.id !== currentLetter.id);
  
  // Shuffle and return requested count
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Determines if the current letter is the FIRST letter the child is learning.
 * If true, games should NOT use any distractors — only reinforce the single letter.
 */
export function isFirstLetterEver(
  lessonId: number,
  letterIndexInLesson: number,
  completedLessons: number[]
): boolean {
  // First letter of the first lesson, and no other lessons completed
  return lessonId === 1 && letterIndexInLesson === 0 && completedLessons.length === 0;
}

/**
 * Returns the count of previously learned letters available as distractors.
 */
export function getAvailableDistractorCount(
  currentLetter: ArabicLetter,
  lessonId: number,
  letterIndexInLesson: number,
  completedLessons: number[]
): number {
  return getProgressiveDistractors(currentLetter, lessonId, letterIndexInLesson, completedLessons, 100).length;
}

// Practice words for Level 6
export const practiceWords = [
  { word: 'بِسْمِ', transliteration: 'bismi', meaning: 'In the name of' },
  { word: 'اللَّهِ', transliteration: 'Allahi', meaning: 'Allah (God)' },
  { word: 'كِتَاب', transliteration: 'kitab', meaning: 'Book' },
  { word: 'قَلَم', transliteration: 'qalam', meaning: 'Pen' },
  { word: 'نُور', transliteration: 'noor', meaning: 'Light' },
  { word: 'سَلَام', transliteration: 'salaam', meaning: 'Peace' },
];
