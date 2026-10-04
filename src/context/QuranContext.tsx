import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import type {
  ThemeMode,
  FontFamily,
  ReadingMode,
  LineSpacing,
  Bookmark,
  LastRead,
  Reciter,
  SurahData,
} from '../types/quran'
import {
  RECITERS,
  fetchSurah,
  fetchPage,
  getAyahAudioUrl,
  getPageForSurah,
  getSurahForPage,
  getSurahList,
} from '../services/quranService'

// ─── Note Types ─────────────────────────────────────────────────────────────
export interface QuranNote {
  id: string
  surahNumber: number
  ayahNumber: number
  wordIndex?: number   // undefined = ayah-level note, number = word-level note
  selectedText?: string // phrase or part of ayah for this note
  text: string
  timestamp: number
}

interface QuranContextType {
  // Theme & Appearance
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  
  // Font Size & Typography
  fontSize: number
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  fontFamily: FontFamily
  setFontFamily: (font: FontFamily) => void
  lineSpacing: LineSpacing
  setLineSpacing: (spacing: LineSpacing) => void
  readingWidth: number
  setReadingWidth: (w: number) => void
  increaseReadingWidth: () => void
  decreaseReadingWidth: () => void
  resetReadingWidth: () => void

  // Reading Preferences
  readingMode: ReadingMode
  setReadingMode: (mode: ReadingMode) => void
  showTranslation: boolean
  setShowTranslation: (show: boolean) => void
  showTafseer: boolean
  setShowTafseer: (show: boolean) => void

  // Rare Words
  highlightRareWords: boolean
  setHighlightRareWords: (highlight: boolean) => void
  rareWordThreshold: number
  setRareWordThreshold: (threshold: number) => void

  // Dark Mode Helper
  toggleDarkMode: () => void
  isDarkMode: boolean

  // Interaction Modes
  isSelectionMode: boolean
  setIsSelectionMode: (on: boolean) => void
  isAudioClickMode: boolean
  setIsAudioClickMode: (on: boolean) => void
  isAiAskMode: boolean
  setIsAiAskMode: (on: boolean) => void

  // Notes / Annotations
  notes: QuranNote[]
  addNote: (
    surahNumber: number,
    ayahNumber: number,
    text: string,
    wordIndex?: number,
    selectedText?: string
  ) => void
  removeNote: (id: string) => void
  getAyahNotes: (surahNumber: number, ayahNumber: number) => QuranNote[]
  getWordNote: (surahNumber: number, ayahNumber: number, wordIndex: number) => QuranNote | undefined

  // Navigation & Views
  activeTab: 'dashboard' | 'quran' | 'adhkar' | 'bookmarks'
  setActiveTab: (tab: 'dashboard' | 'quran' | 'adhkar' | 'bookmarks') => void
  currentSurahNumber: number
  setCurrentSurahNumber: (num: number) => void
  currentSurahData: SurahData | null
  isLoadingSurah: boolean
  surahError: string | null
  loadSurah: (surahNumber: number, targetAyah?: number) => Promise<void>
  isSurahSelectorOpen: boolean
  setIsSurahSelectorOpen: (open: boolean) => void

  // Page Tracking (1 to 604)
  currentPageNumber: number
  setCurrentPageNumber: (page: number) => void
  goToPage: (page: number) => void

  // Bookmarks & History
  bookmarks: Bookmark[]
  toggleBookmark: (surahNumber: number, surahName: string, ayahNumber: number, text: string) => void
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean
  removeBookmark: (id: string) => void
  lastRead: LastRead | null
  saveLastRead: (surahNumber: number, surahName: string, ayahNumber: number) => void

  // Audio Playback
  reciter: Reciter
  setReciter: (reciter: Reciter) => void
  isPlaying: boolean
  playingAyahNumber: number | null
  playAyah: (ayahNumberInSurah: number, surahNumber?: number) => void
  playWholeSurah: () => void
  playPage: (pageNumber: number) => Promise<void>
  pauseAudio: () => void
  resumeAudio: () => void
  toggleAudio: () => void
  stopAudio: () => void
  nextAyahAudio: () => void
  prevAyahAudio: () => void
  audioDuration: number
  audioCurrentTime: number
  seekAudio: (seconds: number) => void
  speakWord: (word: string, surahNumber?: number, ayahNumber?: number, wordIndex?: number) => void
}

const QuranContext = createContext<QuranContextType | undefined>(undefined)

const DEFAULT_FONT_SIZE = 32

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('quran_theme') as ThemeMode) || 'emerald'
  })

  // Font size state
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('quran_font_size')
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE
  })

  // Font family
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    return (localStorage.getItem('quran_font_family') as FontFamily) || 'amiri'
  })

  // Line spacing
  const [lineSpacing, setLineSpacingState] = useState<LineSpacing>(() => {
    return (localStorage.getItem('quran_line_spacing') as LineSpacing) || 'relaxed'
  })

  // Reading area width (numeric in pixels)
  const DEFAULT_READING_WIDTH = 1100
  const MIN_READING_WIDTH = 600
  const MAX_READING_WIDTH = 2200

  const [readingWidth, setReadingWidthState] = useState<number>(() => {
    const saved = localStorage.getItem('quran_reading_width_px')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= MIN_READING_WIDTH && parsed <= MAX_READING_WIDTH) {
        return parsed
      }
    }
    return DEFAULT_READING_WIDTH
  })

  const setReadingWidth = (w: number) => {
    const clamped = Math.min(MAX_READING_WIDTH, Math.max(MIN_READING_WIDTH, w))
    setReadingWidthState(clamped)
    localStorage.setItem('quran_reading_width_px', clamped.toString())
  }

  const increaseReadingWidth = () => setReadingWidth(readingWidth + 50)
  const decreaseReadingWidth = () => setReadingWidth(readingWidth - 50)
  const resetReadingWidth = () => setReadingWidth(DEFAULT_READING_WIDTH)

  // Reading mode
  const [readingMode, setReadingModeState] = useState<ReadingMode>(() => {
    return (localStorage.getItem('quran_reading_mode') as ReadingMode) || 'verse'
  })

  // View toggles
  const [showTranslation, setShowTranslation] = useState<boolean>(true)
  const [showTafseer, setShowTafseer] = useState<boolean>(false)

  // Rare Words
  const [highlightRareWords, setHighlightRareWordsState] = useState<boolean>(() => {
    const saved = localStorage.getItem('quran_highlight_rare_words')
    return saved !== null ? saved === 'true' : true
  })

  const [rareWordThreshold, setRareWordThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem('quran_rare_word_threshold')
    return saved ? parseInt(saved, 10) : 1
  })

  const setHighlightRareWords = (val: boolean) => {
    setHighlightRareWordsState(val)
    localStorage.setItem('quran_highlight_rare_words', val.toString())
  }

  const setRareWordThreshold = (val: number) => {
    setRareWordThresholdState(val)
    localStorage.setItem('quran_rare_word_threshold', val.toString())
  }

  // Dark mode direct toggle
  const isDarkMode = theme === 'dark'
  const toggleDarkMode = () => {
    if (theme === 'dark') {
      const prevTheme = (localStorage.getItem('quran_prev_theme') as ThemeMode) || 'emerald'
      setTheme(prevTheme)
    } else {
      localStorage.setItem('quran_prev_theme', theme)
      setTheme('dark')
    }
  }

  // Interaction modes
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false)
  const [isAudioClickMode, setIsAudioClickMode] = useState<boolean>(false)
  const [isAiAskMode, setIsAiAskMode] = useState<boolean>(false)

  // Notes / Annotations
  const [notes, setNotes] = useState<QuranNote[]>(() => {
    try {
      const saved = localStorage.getItem('quran_notes')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const saveNotes = (updated: QuranNote[]) => {
    setNotes(updated)
    localStorage.setItem('quran_notes', JSON.stringify(updated))
  }

  const addNote = (
    surahNumber: number,
    ayahNumber: number,
    text: string,
    wordIndex?: number,
    selectedText?: string
  ) => {
    const note: QuranNote = {
      id: `note_${surahNumber}_${ayahNumber}_${wordIndex ?? 'part'}_${Date.now()}`,
      surahNumber,
      ayahNumber,
      wordIndex,
      selectedText,
      text,
      timestamp: Date.now(),
    }
    saveNotes([note, ...notes])
  }

  const removeNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id))
  }

  const getAyahNotes = (surahNumber: number, ayahNumber: number) => {
    return notes.filter(
      (n) => n.surahNumber === surahNumber && n.ayahNumber === ayahNumber && n.wordIndex === undefined
    )
  }

  const getWordNote = (surahNumber: number, ayahNumber: number, wordIndex: number) => {
    return notes.find(
      (n) => n.surahNumber === surahNumber && n.ayahNumber === ayahNumber && n.wordIndex === wordIndex
    )
  }

  // Navigation tab with localStorage persistence
  const [activeTab, setActiveTabState] = useState<'dashboard' | 'quran' | 'adhkar' | 'bookmarks'>(() => {
    const saved = localStorage.getItem('quran_active_tab')
    if (saved && ['dashboard', 'quran', 'adhkar', 'bookmarks'].includes(saved)) {
      return saved as any
    }
    return 'dashboard'
  })

  const setActiveTab = (tab: 'dashboard' | 'quran' | 'adhkar' | 'bookmarks') => {
    setActiveTabState(tab)
    localStorage.setItem('quran_active_tab', tab)
  }

  // Current Surah with localStorage persistence
  const [currentSurahNumber, setCurrentSurahNumberState] = useState<number>(() => {
    const saved = localStorage.getItem('quran_current_surah')
    if (saved) {
      const num = parseInt(saved, 10)
      if (!isNaN(num) && num >= 1 && num <= 114) return num
    }
    const last = localStorage.getItem('quran_last_read')
    if (last) {
      try {
        const parsed = JSON.parse(last)
        if (parsed?.surahNumber && parsed.surahNumber >= 1 && parsed.surahNumber <= 114) {
          return parsed.surahNumber
        }
      } catch {}
    }
    return 1
  })

  const setCurrentSurahNumber = (num: number) => {
    setCurrentSurahNumberState(num)
    localStorage.setItem('quran_current_surah', num.toString())
  }
  const [currentSurahData, setCurrentSurahData] = useState<SurahData | null>(null)
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false)
  const [surahError, setSurahError] = useState<string | null>(null)
  const [isSurahSelectorOpen, setIsSurahSelectorOpen] = useState<boolean>(false)

  // Page Tracking (1 to 604)
  const [currentPageNumber, setCurrentPageNumberState] = useState<number>(() => {
    const saved = localStorage.getItem('quran_current_page')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 604) return parsed
    }
    const surahSaved = localStorage.getItem('quran_current_surah')
    const sNum = surahSaved ? parseInt(surahSaved, 10) : 1
    return getPageForSurah(sNum)
  })

  const setCurrentPageNumber = (page: number) => {
    const clamped = Math.max(1, Math.min(604, page))
    setCurrentPageNumberState(clamped)
    localStorage.setItem('quran_current_page', clamped.toString())
  }

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(604, page))
    setCurrentPageNumber(clamped)
    const surah = getSurahForPage(clamped)
    if (surah && surah !== currentSurahNumber) {
      loadSurah(surah)
    }
  }

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('quran_bookmarks')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Last read
  const [lastRead, setLastRead] = useState<LastRead | null>(() => {
    try {
      const saved = localStorage.getItem('quran_last_read')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Audio reciter
  const [reciter, setReciterState] = useState<Reciter>(() => {
    const savedId = localStorage.getItem('quran_reciter_id')
    return RECITERS.find((r) => r.id === savedId) || RECITERS[0]
  })

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Persistence effects
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    localStorage.setItem('quran_theme', newTheme)
  }

  const setFontSize = (size: number) => {
    const clamped = Math.min(64, Math.max(18, size))
    setFontSizeState(clamped)
    localStorage.setItem('quran_font_size', clamped.toString())
  }

  const increaseFontSize = () => setFontSize(fontSize + 2)
  const decreaseFontSize = () => setFontSize(fontSize - 2)
  const resetFontSize = () => setFontSize(DEFAULT_FONT_SIZE)

  const setFontFamily = (family: FontFamily) => {
    setFontFamilyState(family)
    localStorage.setItem('quran_font_family', family)
  }

  const setLineSpacing = (spacing: LineSpacing) => {
    setLineSpacingState(spacing)
    localStorage.setItem('quran_line_spacing', spacing)
  }

  const setReadingMode = (mode: ReadingMode) => {
    setReadingModeState(mode)
    localStorage.setItem('quran_reading_mode', mode)
  }

  const setReciter = (r: Reciter) => {
    setReciterState(r)
    localStorage.setItem('quran_reciter_id', r.id)
    if (isPlaying && playingAyahNumber !== null) {
      playAyah(playingAyahNumber)
    }
  }

  // Bookmarking helpers
  const toggleBookmark = (
    surahNumber: number,
    surahName: string,
    ayahNumber: number,
    ayahText: string
  ) => {
    const exists = bookmarks.find(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    )
    let updated: Bookmark[]
    if (exists) {
      updated = bookmarks.filter((b) => b.id !== exists.id)
    } else {
      const newBm: Bookmark = {
        id: `${surahNumber}_${ayahNumber}_${Date.now()}`,
        surahNumber,
        surahName,
        ayahNumber,
        ayahText,
        timestamp: Date.now(),
      }
      updated = [newBm, ...bookmarks]
    }
    setBookmarks(updated)
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated))
  }

  const isBookmarked = (surahNumber: number, ayahNumber: number) => {
    return bookmarks.some(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    )
  }

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id)
    setBookmarks(updated)
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated))
  }

  const saveLastRead = (surahNumber: number, surahName: string, ayahNumber: number) => {
    const item: LastRead = {
      surahNumber,
      surahName,
      ayahNumber,
      timestamp: Date.now(),
    }
    setLastRead(item)
    localStorage.setItem('quran_last_read', JSON.stringify(item))
  }

  // Surah loader
  const loadSurah = async (surahNumber: number, targetAyah?: number) => {
    setIsLoadingSurah(true)
    setSurahError(null)
    try {
      const data = await fetchSurah(surahNumber)
      setCurrentSurahNumber(surahNumber)
      setCurrentSurahData(data)
      localStorage.setItem('quran_current_surah', surahNumber.toString())

      // Sync page number with surah start page only in verse mode
      if (readingMode === 'verse') {
        const surahPage = getPageForSurah(surahNumber)
        setCurrentPageNumberState(surahPage)
        localStorage.setItem('quran_current_page', surahPage.toString())
      }

      // Preserve existing ayahNumber if reloading same surah without targetAyah
      setLastRead((prevLastRead) => {
        const ayah = targetAyah || (prevLastRead?.surahNumber === surahNumber ? prevLastRead.ayahNumber : 1)
        const item: LastRead = {
          surahNumber,
          surahName: data.name,
          ayahNumber: ayah,
          timestamp: Date.now(),
        }
        localStorage.setItem('quran_last_read', JSON.stringify(item))
        return item
      })

      if (targetAyah) {
        setTimeout(() => {
          const el = document.getElementById(`ayah-${targetAyah}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
      }
    } catch (err: any) {
      setSurahError(err.message || 'تعذر تحميل السورة، يرجى المحاولة مرة أخرى')
    } finally {
      setIsLoadingSurah(false)
    }
  }

  // Word-level audio (tries authentic Quranic audio first, falls back to reciter ayah audio)
  const wordAudioRef = useRef<HTMLAudioElement | null>(null)

  // Audio state refs so event listeners always access fresh state without recreating the Audio object
  const currentSurahDataRef = useRef(currentSurahData)
  currentSurahDataRef.current = currentSurahData
  const currentSurahNumberRef = useRef(currentSurahNumber)
  currentSurahNumberRef.current = currentSurahNumber
  const playingAyahNumberRef = useRef(playingAyahNumber)
  playingAyahNumberRef.current = playingAyahNumber
  const reciterRef = useRef(reciter)
  reciterRef.current = reciter

  const speakWord = (_word: string, surahNumber?: number, ayahNumber?: number, wordIndex?: number) => {
    const sNum = surahNumber || currentSurahNumberRef.current || 1
    const aNum = ayahNumber || 1

    if (wordIndex && wordIndex > 0) {
      const s = String(sNum).padStart(3, '0')
      const a = String(aNum).padStart(3, '0')
      const w = String(wordIndex).padStart(3, '0')
      const url = `https://audio.qurancdn.com/wbw/${s}_${a}_${w}.mp3`

      if (!wordAudioRef.current) {
        wordAudioRef.current = new Audio()
      }
      const audio = wordAudioRef.current
      audio.pause()
      audio.src = url
      audio.onerror = () => {
        playAyah(aNum, sNum)
      }
      audio.play().catch(() => {
        playAyah(aNum, sNum)
      })
      return
    }

    // Direct fallback to playing the Ayah with the chosen reciter
    playAyah(aNum, sNum)
  }

  // Audio setup - mounted ONCE on component creation so React re-renders NEVER cancel active audio
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleEnded = () => {
      const sData = currentSurahDataRef.current
      const currentAyah = playingAyahNumberRef.current
      const sNum = currentSurahNumberRef.current
      if (currentAyah !== null) {
        const surahMeta = getSurahList().find((s) => s.number === sNum)
        const totalAyahs = surahMeta?.numberOfAyahs || sData?.numberOfAyahs || 1
        if (currentAyah < totalAyahs) {
          playAyah(currentAyah + 1, sNum)
        } else {
          setIsPlaying(false)
          setPlayingAyahNumber(null)
        }
      } else {
        setIsPlaying(false)
        setPlayingAyahNumber(null)
      }
    }

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
    }

    const handleError = (e: any) => {
      console.warn('Audio playback error', e)
      setIsPlaying(false)
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  const playAyah = (ayahNumberInSurah: number, surahNumber?: number) => {
    if (!audioRef.current) return

    const targetSurahNum =
      surahNumber || currentSurahNumberRef.current || currentSurahDataRef.current?.number || 1
    const currentReciter = reciterRef.current

    currentSurahNumberRef.current = targetSurahNum
    playingAyahNumberRef.current = ayahNumberInSurah
    setPlayingAyahNumber(ayahNumberInSurah)
    setIsPlaying(true)

    const url = getAyahAudioUrl(currentReciter.folder, targetSurahNum, ayahNumberInSurah)
    audioRef.current.src = url
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true)
        if (targetSurahNum !== currentSurahNumber) {
          setCurrentSurahNumber(targetSurahNum)
          if (readingMode === 'verse') {
            loadSurah(targetSurahNum, ayahNumberInSurah)
          }
        } else {
          saveLastRead(
            targetSurahNum,
            currentSurahDataRef.current?.name || `سورة ${targetSurahNum}`,
            ayahNumberInSurah
          )
        }

        const el =
          document.getElementById(`ayah-${targetSurahNum}-${ayahNumberInSurah}`) ||
          document.getElementById(`ayah-${ayahNumberInSurah}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
      .catch((err) => {
        console.warn('Play error:', err)
        setIsPlaying(false)
      })
  }

  const playWholeSurah = () => {
    playAyah(1, currentSurahNumberRef.current)
  }

  const playPage = async (pageNumber: number) => {
    try {
      const pageData = await fetchPage(pageNumber)
      if (pageData && pageData.ayahs && pageData.ayahs.length > 0) {
        const first = pageData.ayahs[0]
        playAyah(first.numberInSurah, first.surahNumber)
      }
    } catch (e) {
      console.error('Failed to play page audio:', e)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeAudio = () => {
    if (audioRef.current && playingAyahNumber !== null) {
      audioRef.current.play()
      setIsPlaying(true)
    } else if (currentSurahData) {
      playAyah(1)
    }
  }

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      resumeAudio()
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setPlayingAyahNumber(null)
  }

  const nextAyahAudio = () => {
    if (!currentSurahData) return
    const next = (playingAyahNumber || 1) + 1
    if (next <= currentSurahData.numberOfAyahs) {
      playAyah(next)
    }
  }

  const prevAyahAudio = () => {
    if (!currentSurahData) return
    const prev = Math.max(1, (playingAyahNumber || 2) - 1)
    playAyah(prev)
  }

  const seekAudio = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds
      setAudioCurrentTime(seconds)
    }
  }

  // Load initial surah on mount (restores last read or last visited surah)
  useEffect(() => {
    const savedSurah = localStorage.getItem('quran_current_surah')
    let initialSurah = 1
    if (savedSurah) {
      const num = parseInt(savedSurah, 10)
      if (!isNaN(num) && num >= 1 && num <= 114) initialSurah = num
    } else {
      const last = localStorage.getItem('quran_last_read')
      if (last) {
        try {
          const parsed = JSON.parse(last)
          if (parsed?.surahNumber && parsed.surahNumber >= 1 && parsed.surahNumber <= 114) {
            initialSurah = parsed.surahNumber
          }
        } catch {}
      }
    }

    let targetAyah: number | undefined
    const last = localStorage.getItem('quran_last_read')
    if (last) {
      try {
        const parsed = JSON.parse(last)
        if (parsed?.surahNumber === initialSurah && parsed?.ayahNumber) {
          targetAyah = parsed.ayahNumber
        }
      } catch {}
    }

    loadSurah(initialSurah, targetAyah)
  }, [])

  return (
    <QuranContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        fontFamily,
        setFontFamily,
        lineSpacing,
        setLineSpacing,
        readingWidth,
        setReadingWidth,
        increaseReadingWidth,
        decreaseReadingWidth,
        resetReadingWidth,
        readingMode,
        setReadingMode,
        showTranslation,
        setShowTranslation,
        showTafseer,
        setShowTafseer,
        highlightRareWords,
        setHighlightRareWords,
        rareWordThreshold,
        setRareWordThreshold,
        toggleDarkMode,
        isDarkMode,
        isSelectionMode,
        setIsSelectionMode,
        isAudioClickMode,
        setIsAudioClickMode,
        isAiAskMode,
        setIsAiAskMode,
        notes,
        addNote,
        removeNote,
        getAyahNotes,
        getWordNote,
        activeTab,
        setActiveTab,
        currentSurahNumber,
        setCurrentSurahNumber,
        currentSurahData,
        isLoadingSurah,
        surahError,
        loadSurah,
        isSurahSelectorOpen,
        setIsSurahSelectorOpen,
        currentPageNumber,
        setCurrentPageNumber,
        goToPage,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        removeBookmark,
        lastRead,
        saveLastRead,
        reciter,
        setReciter,
        isPlaying,
        playingAyahNumber,
        playAyah,
        playWholeSurah,
        playPage,
        pauseAudio,
        resumeAudio,
        toggleAudio,
        stopAudio,
        nextAyahAudio,
        prevAyahAudio,
        audioDuration,
        audioCurrentTime,
        seekAudio,
        speakWord,
      }}
    >
      {children}
    </QuranContext.Provider>
  )
}

export function useQuran() {
  const context = useContext(QuranContext)
  if (!context) {
    throw new Error('useQuran must be used within a QuranProvider')
  }
  return context
}
