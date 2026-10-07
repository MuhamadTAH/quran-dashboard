export type ThemeMode = 'emerald' | 'parchment' | 'dark' | 'pearl'

export type FontFamily = 'amiri' | 'scheherazade' | 'noto'

export type ReadingMode = 'verse' | 'page' | 'scroll_pages' | 'mushaf'

export type LineSpacing = 'normal' | 'relaxed' | 'spacious'

export interface PageAyah {
  number: number
  numberInSurah: number
  text: string
  surahNumber: number
  surahName: string
  surahEnglishName?: string
  juz: number
  page: number
  hizbQuarter?: number
  isFirstAyahOfSurah?: boolean
}

export interface PageData {
  pageNumber: number
  juzNumber: number
  hizbQuarter?: number
  surahs: { number: number; name: string }[]
  ayahs: PageAyah[]
}

export interface SurahMeta {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

export interface Ayah {
  number: number
  numberInSurah: number
  text: string
  translation?: string
  tafseer?: string
  juz?: number
  page?: number
  hizbQuarter?: number
}

export interface SurahData {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
  ayahs: Ayah[]
}

export interface Bookmark {
  id: string
  surahNumber: number
  surahName: string
  ayahNumber: number
  ayahText: string
  timestamp: number
}

export interface LastRead {
  surahNumber: number
  surahName: string
  ayahNumber: number
  timestamp: number
}

export interface Reciter {
  id: string
  name: string
  arabicName: string
  folder: string
}

export interface AdhkarItem {
  id: string
  text: string
  count: number
  virtue?: string
}

export interface AdhkarCategory {
  category: string
  categoryTitle: string
  categorySubtitle: string
  icon: string
  items: AdhkarItem[]
}

export type MistakeCategory =
  | 'memory'      // نسيان
  | 'mutashabih'   // تشابه آيات
  | 'harakah'     // خطأ في التشكيل أو الحركة
  | 'letter'      // خطأ في حرف
  | 'word'        // خطأ في كلمة كاملة
  | 'tajweed'     // حكم تجويدي
  | 'other'       // غير ذلك

export interface QuranMistake {
  id: string
  surahNumber: number
  surahName?: string
  ayahNumber: number
  ayahText?: string
  wordIndex?: number
  selectedText?: string // word, letter, sentence, or ayah
  selectedTokenIndices?: number[] // indices of words/tokens inside the ayah
  reason: string        // why the reciter made a mistake on it
  category?: MistakeCategory
  timestamp: number
  corrected?: boolean
}

export interface NotificationSettings {
  enabled: boolean
  dailyReminder: boolean
  dailyReminderTime: string // e.g. "09:00"
  adhkarReminder: boolean
  mistakesReminder: boolean
  soundEnabled: boolean
}

export type TafsirId = 'reber' | 'raman' | 'asan' | 'puxta' | 'muyassar'

export interface TafsirOption {
  id: TafsirId
  name: string
  author: string
  language: 'ku' | 'ar'
  badge: string
}

export const TAFSIR_OPTIONS: TafsirOption[] = [
  {
    id: 'reber',
    name: 'تەفسیری ڕێبەر',
    author: 'مامۆستا سەڵاحەدین عەبدولکەریم',
    language: 'ku',
    badge: 'کوردی (ڕێبەر)',
  },
  {
    id: 'raman',
    name: 'تەفسیری ڕامان',
    author: 'مامۆستا ئەحمەد کاکە مەحموود',
    language: 'ku',
    badge: 'کوردی (ڕامان)',
  },
  {
    id: 'asan',
    name: 'تەفسیری ئاسان',
    author: 'مامۆستا بورهان محمد ئەمین',
    language: 'ku',
    badge: 'کوردی (ئاسان)',
  },
  {
    id: 'puxta',
    name: 'تەفسیری پوختە',
    author: 'مامۆستا هاروون نووری',
    language: 'ku',
    badge: 'کوردی (پوختە)',
  },
  {
    id: 'muyassar',
    name: 'تفسير الميسر',
    author: 'مجمع الملك فهد لطباعة المصحف',
    language: 'ar',
    badge: 'العربية (الميسر)',
  },
]
