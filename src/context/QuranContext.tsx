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
  getAyahAudioUrl,
} from '../services/quranService'

// ─── Note Types ─────────────────────────────────────────────────────────────
export interface QuranNote {
  id: string
  surahNumber: number
  ayahNumber: number
  wordIndex?: number   // undefined = ayah-level note, number = word-level note
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

  // Notes / Annotations
  notes: QuranNote[]
  addNote: (surahNumber: number, ayahNumber: number, text: string, wordIndex?: number) => void
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
  playAyah: (ayahNumberInSurah: number) => void
  playWholeSurah: () => void
  pauseAudio: () => void
  resumeAudio: () => void
  toggleAudio: () => void
  stopAudio: () => void
  nextAyahAudio: () => void
  prevAyahAudio: () => void
  audioDuration: number
  audioCurrentTime: number
  seekAudio: (seconds: number) => void
  speakWord: (word: string) => void
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

  const addNote = (surahNumber: number, ayahNumber: number, text: string, wordIndex?: number) => {
    const note: QuranNote = {
      id: `note_${surahNumber}_${ayahNumber}_${wordIndex ?? 'a'}_${Date.now()}`,
      surahNumber,
      ayahNumber,
      wordIndex,
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

  // Word-level TTS (Web Speech API — Arabic)
  const speakWord = (word: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(word)
    utt.lang = 'ar-SA'
    utt.rate = 0.8
    window.speechSynthesis.speak(utt)
  }

  // Audio setup
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleEnded = () => {
      if (currentSurahData && playingAyahNumber !== null) {
        if (playingAyahNumber < currentSurahData.numberOfAyahs) {
          playAyah(playingAyahNumber + 1)
        } else {
          setIsPlaying(false)
          setPlayingAyahNumber(null)
        }
      }
    }

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
    }

    const handleError = () => {
      console.warn('Audio playback error')
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
  }, [currentSurahData, playingAyahNumber, reciter])

  const playAyah = (ayahNumberInSurah: number) => {
    if (!audioRef.current || !currentSurahData) return

    const url = getAyahAudioUrl(reciter.folder, currentSurahData.number, ayahNumberInSurah)
    audioRef.current.src = url
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true)
        setPlayingAyahNumber(ayahNumberInSurah)
        saveLastRead(currentSurahData.number, currentSurahData.name, ayahNumberInSurah)

        const el = document.getElementById(`ayah-${ayahNumberInSurah}`)
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
    playAyah(1)
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
