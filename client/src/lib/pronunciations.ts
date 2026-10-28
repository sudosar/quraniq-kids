/**
 * Explicit pronunciations for bare-consonant vocabulary words.
 *
 * WHY THIS EXISTS
 * Most curriculum word cards are written in BARE-CONSOLANT form
 * ("جمل", "أسد", "يقطين") so a toddler can pick out the target letter
 * in the word — the letter-shape game depends on the word containing
 * exactly the letters it teaches, with no harakat in between.
 *
 * But the AUDIO for those cards is generated from the same bare string,
 * and Edge-TTS given a bare consonant skeleton has no vowel to read:
 * it guesses one, and it guesses wrong. "جمل" was synthesised as
 * "جُمِل" (jumalun) instead of "جَمَل" (jamal) — see issue #21.
 *
 * The fix is to keep the DISPLAY text bare and give the SYNTHESIS an
 * explicitly vocalised form. The clip manifest is still keyed by the
 * displayed text, so every caller (word cards, letter games, memory
 * match) resolves the same clip it always did — only the audio that
 * clip contains changes.
 *
 * Rules for this table:
 *   - Key   = the bare word exactly as it appears in curriculum.ts.
 *   - Value = the vocalised form Edge-TTS should speak (harakat only,
 *             no tanween — the cards are taught in the plain isolated
 *             form, e.g. "جَمَل" not "جَمَلٌ").
 *   - Every bare word in the curriculum MUST appear here; the clip
 *     generator refuses to run otherwise (see scripts/list-audio-clips.ts).
 */

/** Bare word -> vocalised form used for speech synthesis. */
export const PRONUNCIATIONS: Record<string, string> = {
  // --- ا ---
  'أثاث': 'أَثَاث',       // furniture
  'أرنب': 'أَرْنَب',       // rabbit
  'أسد': 'أَسَد',         // lion
  'أناناس': 'أَنَانَاس',   // pineapple
  // --- ب ---
  'بحر': 'بَحْر',         // sea
  'بطة': 'بَطَّة',         // duck
  'بقرة': 'بَقَرَة',       // cow
  'بنت': 'بِنْت',         // girl
  'بيت': 'بَيْت',         // house
  // --- ت ---
  'تاج': 'تَاج',          // crown
  'تفاح': 'تُفَّاح',       // apple
  'تلميذ': 'تِلْمِيذ',     // student
  'تمر': 'تَمْر',         // dates
  // --- ث ---
  'ثعلب': 'ثَعْلَب',       // fox
  'ثلج': 'ثَلْج',         // snow
  'ثوب': 'ثَوْب',         // garment
  // --- ج ---
  'جبل': 'جَبَل',         // mountain
  'جبن': 'جُبْن',         // cheese
  'جزر': 'جَزَر',         // carrot
  'جمل': 'جَمَل',         // camel
  // --- ح ---
  'حديث': 'حَدِيث',       // speech
  'حصان': 'حِصَان',       // horse
  'حوت': 'حُوت',         // whale
  'حليب': 'حَلِيب',       // milk
  // --- خ ---
  'خبز': 'خَبْز',         // bread
  'خروف': 'خَرُوف',       // sheep
  'خيمة': 'خَيْمَة',       // tent
  // --- د ---
  'دب': 'دُبّ',           // bear
  'دجاجة': 'دَجَاجَة',     // chicken
  'دلفين': 'دَلْفِين',     // dolphin
  'ذئب': 'ذِئْب',         // wolf
  'ذرة': 'ذُرَّة',         // corn
  'ذهب': 'ذَهَب',         // gold
  // --- ر ---
  'رجل': 'رَجُل',         // man
  'رمان': 'رُمَّان',       // pomegranate
  'ريشة': 'رِيشَة',       // feather
  // --- ز ---
  'زرافة': 'زَرَافَة',     // giraffe
  'زهرة': 'زَهْرَة',       // flower
  'زيتون': 'زَيْتُون',     // olive
  // --- س ---
  'سلحفاة': 'سُلْحَفَاة', // turtle
  'سماء': 'سَمَاء',       // sky
  'سمكة': 'سَمَكَة',       // fish
  'سيارة': 'سَيَّارَة',     // car
  'شاي': 'شَاي',          // tea
  'شجرة': 'شَجَرَة',       // tree
  'شمس': 'شَمْس',         // sun
  // --- ص ---
  'صاروخ': 'صَارُوخ',     // rocket
  'صقر': 'صَقْر',         // falcon
  'صندوق': 'صَنْدُوق',     // box
  // --- ض ---
  'ضباب': 'ضَبَاب',       // fog
  'ضفدع': 'ضِفْدَع',       // frog
  'ضوء': 'ضَوْء',         // light
  // --- ط ---
  'طائر': 'طَائِر',       // bird
  'طبخ': 'طَبْخ',         // cooking
  'طبل': 'طَبْل',         // drum
  'طماطم': 'طَمَاطِم',     // tomato
  'ظبي': 'ظَبِي',         // deer
  'ظرف': 'ظَرْف',         // envelope
  'ظل': 'ظِلّ',           // shadow
  // --- ع ---
  'عسل': 'عَسَل',         // honey
  'عصفور': 'عُصْفُور',     // sparrow
  'عنب': 'عِنَب',         // grapes
  // --- غ ---
  'غراب': 'غُرَاب',       // crow
  'غزال': 'غَزَال',       // gazelle
  'غيمة': 'غَيْمَة',       // cloud
  // --- ف ---
  'فراشة': 'فَرَاشَة',     // butterfly
  'فراولة': 'فَرَاوَلَة',   // strawberry (read "farawla", as the card's
                           // transliteration says — the written ا is
                           // spoken, not a silent ة)
  'فيل': 'فِيل',          // elephant
  // --- ق ---
  'قائد': 'قَائِد',       // leader
  'قطة': 'قِطَّة',         // cat
  'قلم': 'قَلَم',         // pen
  'قمر': 'قَمَر',         // moon
  'كتاب': 'كِتَاب',       // book
  'كتب': 'كُتُب',         // books
  'كرة': 'كُرَة',         // ball
  'كلب': 'كَلْب',         // dog
  // --- ل ---
  'لحم': 'لَحْم',         // meat
  'لذيذ': 'لَذِيذ',       // delicious
  'لعبة': 'لُعْبَة',       // toy
  'ليمون': 'لَيْمُون',     // lemon
  // --- م ---
  'ماء': 'مَاء',          // water
  'مدرسة': 'مَدْرَسَة',     // school
  'مفتاح': 'مِفْتَاح',      // key
  'ملح': 'مِلْح',         // salt
  'موز': 'مَوْز',         // banana
  // --- ن ---
  'نجم': 'نَجْم',         // star
  'نجمة': 'نَجْمَة',       // star
  'نحلة': 'نَحْلَة',       // bee
  'نخل': 'نَخْل',         // palm tree
  'نمر': 'نَمِر',         // tiger
  // --- ه ---
  'هدية': 'هَدِيَّة',       // gift
  'هرة': 'هِرَّة',         // cat
  'هلال': 'هِلَال',       // crescent
  // --- و ---
  'وجه': 'وَجْه',         // face
  'وردة': 'وَرْدَة',       // rose
  'ولد': 'وَلَد',         // boy
  // --- ي ---
  'يد': 'يَد',            // hand
  'يقطين': 'يَقْطِين',     // pumpkin
  'يمامة': 'يَمَامَة',     // dove
};
