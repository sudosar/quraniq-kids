/**
 * Arabic Letter Forms Data
 * 
 * Each Arabic letter has 4 positional forms:
 * - Isolated: standalone form (e.g., at the end of a word after a non-connecting letter)
 * - Initial: at the beginning of a connected segment
 * - Medial: in the middle of a connected segment
 * - Final: at the end of a connected segment
 * 
 * Some letters (و, ر, ز, د, ذ, ا) don't connect to the left,
 * so they have fewer distinct visual forms.
 */

export interface LetterForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

// Map from the base letter to its 4 positional forms
export const arabicLetterForms: Record<string, LetterForms> = {
  'ا': { isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا' },
  'ب': { isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
  'ت': { isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
  'ث': { isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
  'ج': { isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
  'ح': { isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
  'خ': { isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
  'د': { isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
  'ذ': { isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
  'ر': { isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
  'ز': { isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
  'س': { isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
  'ش': { isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش' },
  'ص': { isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
  'ض': { isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
  'ط': { isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
  'ظ': { isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ' },
  'ع': { isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع' },
  'غ': { isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
  'ف': { isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
  'ق': { isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
  'ك': { isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
  'ل': { isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
  'م': { isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
  'ن': { isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
  'ه': { isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
  'و': { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
  'ي': { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
};

// Position labels for display
export const formLabels = {
  isolated: { en: 'Alone', ar: 'مفردة' },
  initial: { en: 'Start', ar: 'أول' },
  medial: { en: 'Middle', ar: 'وسط' },
  final: { en: 'End', ar: 'آخر' },
};

/**
 * Get the forms for a letter, handling normalization
 */
export function getLetterForms(letter: string): LetterForms | null {
  // Direct lookup
  if (arabicLetterForms[letter]) return arabicLetterForms[letter];
  
  // Normalize Alif variants
  const alifVariants = ['\u0622', '\u0623', '\u0625', '\u0671', '\u0672', '\u0673'];
  if (alifVariants.includes(letter)) return arabicLetterForms['ا'];
  
  // Ta Marbuta → Ta
  if (letter === '\u0629') return arabicLetterForms['ت'];
  
  // Alif Maksura → Ya
  if (letter === '\u0649') return arabicLetterForms['ي'];
  
  return null;
}
