export type ThemeMode = 'emerald' | 'parchment' | 'dark' | 'pearl'

export type FontFamily = 'amiri' | 'scheherazade' | 'noto'

export type ReadingMode = 'mushaf' | 'verse'

export type LineSpacing = 'normal' | 'relaxed' | 'spacious'

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
