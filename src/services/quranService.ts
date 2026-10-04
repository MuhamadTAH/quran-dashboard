import surahsList from '../data/surahs.json'
import preloadedSurahs from '../data/preloadedSurahs.json'
import type { SurahMeta, SurahData, Ayah, Reciter, PageData, PageAyah } from '../types/quran'

export const RECITERS: Reciter[] = [
  {
    id: 'alafasy',
    name: 'Mishary Rashid Alafasy',
    arabicName: 'مشاري راشد العفاسي',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'alijaber',
    name: 'Ali Jaber',
    arabicName: 'علي عبد الله جابر',
    folder: 'Ali_Jaber_64kbps',
  },
  {
    id: 'abdulbasit',
    name: 'AbdulBaset AbdulSamad (Murattal)',
    arabicName: 'عبد الباسط عبد الصمد (مرتل)',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    arabicName: 'محمود خليل الحصري',
    folder: 'Husary_128kbps',
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    arabicName: 'محمد صديق المنشاوي',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    arabicName: 'سعد الغامدي',
    folder: 'Ghamadi_40kbps',
  },
]

// Bismillah prefix regex for stripping redundant Bismillah from Ayah 1 of Surahs 2..114
export const BISMILLAH_PREFIX_REGEX = /^بِسْمِ\s+[\u0600-\u06FF\s]+?[ٱا]لرَّحِيمِ\s*/u

export function cleanAyahText(surahNumber: number, ayahNumberInSurah: number, text: string): string {
  if (surahNumber > 1 && ayahNumberInSurah === 1) {
    return text.replace(BISMILLAH_PREFIX_REGEX, '').trim()
  }
  return text
}

// Starting page (1..604) for all 114 Surahs in King Fahd Madani Mushaf
export const SURAH_START_PAGES: number[] = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604,
]

export function getPageForSurah(surahNumber: number): number {
  if (surahNumber < 1 || surahNumber > 114) return 1
  return SURAH_START_PAGES[surahNumber - 1] || 1
}

export function getSurahForPage(pageNumber: number): number {
  if (pageNumber < 1) return 1
  if (pageNumber > 604) return 114
  for (let i = SURAH_START_PAGES.length - 1; i >= 0; i--) {
    if (pageNumber >= SURAH_START_PAGES[i]) {
      return i + 1
    }
  }
  return 1
}

// In-memory cache for Quran pages
const pageCache = new Map<number, PageData>()

export async function fetchPage(pageNumber: number): Promise<PageData> {
  const pageNum = Math.max(1, Math.min(604, pageNumber))

  // 1. Check in-memory cache
  if (pageCache.has(pageNum)) {
    return pageCache.get(pageNum)!
  }

  // 2. Check localStorage cache
  const storageKey = `quran_page_${pageNum}`
  try {
    const local = localStorage.getItem(storageKey)
    if (local) {
      const parsed: PageData = JSON.parse(local)
      if (parsed.ayahs && parsed.ayahs.length > 0) {
        pageCache.set(pageNum, parsed)
        return parsed
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error for page:', e)
  }

  // 3. Fetch from API
  const url = `https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load page ${pageNum}`)
  }
  const json = await res.json()
  const rawAyahs = json.data?.ayahs || []

  const surahMap = new Map<number, string>()
  const ayahs: PageAyah[] = rawAyahs.map((a: any) => {
    const sNum = a.surah.number
    const sName = a.surah.name
    surahMap.set(sNum, sName)
    const isFirst = a.numberInSurah === 1

    return {
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: cleanAyahText(sNum, a.numberInSurah, a.text),
      surahNumber: sNum,
      surahName: sName,
      surahEnglishName: a.surah.englishName,
      juz: a.juz,
      page: a.page,
      hizbQuarter: a.hizbQuarter,
      isFirstAyahOfSurah: isFirst,
    }
  })

  const surahs = Array.from(surahMap.entries()).map(([num, name]) => ({
    number: num,
    name,
  }))

  const result: PageData = {
    pageNumber: pageNum,
    juzNumber: ayahs[0]?.juz || 1,
    hizbQuarter: ayahs[0]?.hizbQuarter,
    surahs,
    ayahs,
  }

  pageCache.set(pageNum, result)
  try {
    localStorage.setItem(storageKey, JSON.stringify(result))
  } catch (e) {
    console.warn('LocalStorage write error for page:', e)
  }

  return result
}

// In-memory cache for surahs
const surahCache = new Map<number, SurahData>()

// Initialize preloaded surahs in cache
const typedPreloaded = preloadedSurahs as Record<string, any[]>
Object.entries(typedPreloaded).forEach(([key, editions]) => {
  const surahNum = parseInt(key, 10)
  if (editions && editions.length >= 1) {
    const uthmani = editions[0]
    const english = editions[1]
    const muyassar = editions[2]

    const meta = (surahsList as SurahMeta[]).find((s) => s.number === surahNum)
    if (meta && uthmani.ayahs) {
      const ayahs: Ayah[] = uthmani.ayahs.map((a: any, idx: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: cleanAyahText(surahNum, a.numberInSurah, a.text),
        translation: english?.ayahs?.[idx]?.text || '',
        tafseer: muyassar?.ayahs?.[idx]?.text || '',
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
      }))

      surahCache.set(surahNum, {
        number: surahNum,
        name: meta.name,
        englishName: meta.englishName,
        englishNameTranslation: meta.englishNameTranslation,
        numberOfAyahs: meta.numberOfAyahs,
        revelationType: meta.revelationType,
        ayahs,
      })
    }
  }
})

export function getSurahList(): SurahMeta[] {
  return surahsList as SurahMeta[]
}

export function normalizeArabic(text: string): string {
  return text
    .replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z0-9])/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .toLowerCase()
}

export function searchSurahs(query: string): SurahMeta[] {
  if (!query.trim()) return getSurahList()
  const qClean = normalizeArabic(query.trim())
  const qRaw = query.trim().toLowerCase()

  return (surahsList as SurahMeta[]).filter((s) => {
    if (s.number.toString() === qRaw) return true
    if (s.englishName.toLowerCase().includes(qRaw)) return true
    if (s.englishNameTranslation.toLowerCase().includes(qRaw)) return true
    const sNameClean = normalizeArabic(s.name)
    return sNameClean.includes(qClean) || s.name.includes(query.trim())
  })
}

export async function fetchSurah(surahNumber: number): Promise<SurahData> {
  // Check memory cache
  if (surahCache.has(surahNumber)) {
    return surahCache.get(surahNumber)!
  }

  // Check localStorage cache
  const storageKey = `quran_surah_${surahNumber}`
  try {
    const local = localStorage.getItem(storageKey)
    if (local) {
      const parsed: SurahData = JSON.parse(local)
      if (parsed.ayahs && parsed.ayahs.length > 0 && parsed.number > 1) {
        parsed.ayahs[0].text = cleanAyahText(parsed.number, 1, parsed.ayahs[0].text)
      }
      surahCache.set(surahNumber, parsed)
      return parsed
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e)
  }

  // Fetch from API
  const meta = (surahsList as SurahMeta[]).find((s) => s.number === surahNumber)
  if (!meta) throw new Error(`Surah #${surahNumber} not found`)

  const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.muyassar`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load Surah ${surahNumber}`)
  }

  const json = await response.json()
  const editions = json.data
  const uthmani = editions[0]
  const english = editions[1]
  const muyassar = editions[2]

  const ayahs: Ayah[] = uthmani.ayahs.map((a: any, idx: number) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: cleanAyahText(surahNumber, a.numberInSurah, a.text),
    translation: english?.ayahs?.[idx]?.text || '',
    tafseer: muyassar?.ayahs?.[idx]?.text || '',
    juz: a.juz,
    page: a.page,
    hizbQuarter: a.hizbQuarter,
  }))

  const result: SurahData = {
    number: surahNumber,
    name: meta.name,
    englishName: meta.englishName,
    englishNameTranslation: meta.englishNameTranslation,
    numberOfAyahs: meta.numberOfAyahs,
    revelationType: meta.revelationType,
    ayahs,
  }

  surahCache.set(surahNumber, result)
  try {
    localStorage.setItem(storageKey, JSON.stringify(result))
  } catch (e) {
    console.warn('LocalStorage write failed:', e)
  }

  return result
}

export function getAyahAudioUrl(
  reciterFolder: string,
  surahNumber: number,
  ayahNumber: number
): string {
  const sStr = surahNumber.toString().padStart(3, '0')
  const aStr = ayahNumber.toString().padStart(3, '0')
  return `https://everyayah.com/data/${reciterFolder}/${sStr}${aStr}.mp3`
}

// Daily curated inspirational verses
export const FEATURED_VERSES = [
  {
    surahNumber: 2,
    ayahNumber: 286,
    surahName: 'سورة البقرة',
    text: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ',
    translation: 'Allah does not burden a soul beyond that it can bear.',
  },
  {
    surahNumber: 94,
    ayahNumber: 6,
    surahName: 'سورة الشرح',
    text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship [will be] ease.',
  },
  {
    surahNumber: 65,
    ayahNumber: 3,
    surahName: 'سورة الطلاق',
    text: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'And will provide for him from where he does not expect. And whoever relies upon Allah - then He is sufficient for him.',
  },
  {
    surahNumber: 13,
    ayahNumber: 28,
    surahName: 'سورة الرعد',
    text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Unquestionably, by the remembrance of Allah hearts are assured.',
  },
  {
    surahNumber: 2,
    ayahNumber: 152,
    surahName: 'سورة البقرة',
    text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
  },
  {
    surahNumber: 3,
    ayahNumber: 139,
    surahName: 'سورة آل عمران',
    text: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ',
    translation: 'So do not weaken and do not grieve, and you will be superior if you are [true] believers.',
  },
  {
    surahNumber: 2,
    ayahNumber: 255,
    surahName: 'سورة البقرة (آية الكرسي)',
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence.',
  },
]

export function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const idx = dayOfYear % FEATURED_VERSES.length
  return FEATURED_VERSES[idx]
}
