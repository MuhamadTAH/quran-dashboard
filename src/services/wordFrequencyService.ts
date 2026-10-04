import quranWordFreq from '../data/quranWordFreq.json'
import type { SurahData } from '../types/quran'

const freqMap = quranWordFreq as Record<string, number>

// Regex for Quran waqf signs and decorative Quranic marks
const WAQF_MARKS_REGEX = /[\u06D6-\u06DC\u06DE-\u06E8\u06EA-\u06ED\u060E\u060F\u0615\u061B\u061E\u061F\u060C\.\,\;\(\)\[\]\{\}\<\>\"\'«»\:\!\؟\s]/g

/**
 * Strips Quranic stop marks (waqf) and outer punctuation,
 * while strictly preserving every single letter and exact tashkeel/harakah.
 */
export function cleanQuranWord(rawWord: string): string {
  if (!rawWord) return ''
  return rawWord.replace(WAQF_MARKS_REGEX, '').trim()
}

/**
 * Returns the exact frequency of this word (with exact letter & diacritic match)
 * across the entire Holy Quran.
 */
export function getWordFrequency(rawWord: string): number {
  const cleaned = cleanQuranWord(rawWord)
  if (!cleaned) return 0
  return freqMap[cleaned] ?? 0
}

/**
 * Checks whether a word is considered rare based on a threshold (default <= 1)
 */
export function isRareWord(rawWord: string, threshold: number = 1): boolean {
  const count = getWordFrequency(rawWord)
  return count > 0 && count <= threshold
}

export interface WordToken {
  text: string
  cleaned: string
  isWord: boolean
  frequency: number
  isRare: boolean
  wordPosition?: number
}

/**
 * Splits an ayah text into tokens preserving spaces and calculating exact frequency for words.
 */
export function tokenizeAyah(text: string, threshold: number = 1): WordToken[] {
  // Split by whitespace while preserving words
  const parts = text.split(/(\s+)/)
  let wordCounter = 0
  return parts.map((part) => {
    const isWhitespace = /^\s+$/.test(part)
    if (isWhitespace) {
      return {
        text: part,
        cleaned: '',
        isWord: false,
        frequency: 0,
        isRare: false,
      }
    }

    const cleaned = cleanQuranWord(part)
    const freq = cleaned ? (freqMap[cleaned] ?? 0) : 0
    const isRare = freq > 0 && freq <= threshold
    if (cleaned.length > 0) {
      wordCounter += 1
    }

    return {
      text: part,
      cleaned,
      isWord: cleaned.length > 0,
      frequency: freq,
      isRare,
      wordPosition: cleaned.length > 0 ? wordCounter : undefined,
    }
  })
}

/**
 * Calculates rarity statistics for a full Surah
 */
export function getSurahRareStats(surah: SurahData, threshold: number = 1) {
  let totalRareOccurrences = 0
  const uniqueRareWords = new Set<string>()

  surah.ayahs.forEach((ayah) => {
    const parts = ayah.text.split(/\s+/)
    parts.forEach((p) => {
      const cleaned = cleanQuranWord(p)
      if (cleaned && freqMap[cleaned] && freqMap[cleaned] <= threshold) {
        totalRareOccurrences += 1
        uniqueRareWords.add(cleaned)
      }
    })
  })

  return {
    totalRareOccurrences,
    uniqueRareCount: uniqueRareWords.size,
  }
}
