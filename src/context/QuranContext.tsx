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

interface QuranContextType {
  // Theme & Appearance
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  
  // Font Size & Typography (Direct requirement from user!)
  fontSize: number
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  fontFamily: FontFamily
  setFontFamily: (font: FontFamily) => void
  lineSpacing: LineSpacing
  setLineSpacing: (spacing: LineSpacing) => void

  // Reading Preferences
  readingMode: ReadingMode
  setReadingMode: (mode: ReadingMode) => void
  showTranslation: boolean
  setShowTranslation: (show: boolean) => void
  showTafseer: boolean
  setShowTafseer: (show: boolean) => void

  // Rare Words (Least frequent words with exact tashkeel)
  highlightRareWords: boolean
  setHighlightRareWords: (highlight: boolean) => void
  rareWordThreshold: number
  setRareWordThreshold: (threshold: number) => void

  // Dark Mode Helper
  toggleDarkMode: () => void
  isDarkMode: boolean

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

  // Reading mode
  const [readingMode, setReadingModeState] = useState<ReadingMode>(() => {
    return (localStorage.getItem('quran_reading_mode') as ReadingMode) || 'verse'
  })

  // View toggles
  const [showTranslation, setShowTranslation] = useState<boolean>(true)
  const [showTafseer, setShowTafseer] = useState<boolean>(false)

  // Rare Words (Least frequent words with exact diacritics)
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

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quran' | 'adhkar' | 'bookmarks'>('dashboard')
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number>(1)
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
      saveLastRead(surahNumber, data.name, targetAyah || 1)

      // If targetAyah specified, scroll into view after render
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

  // Audio setup
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleEnded = () => {
      // Auto play next ayah in surah
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

        // Smooth scroll to active ayah
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

  // Preload Surah 1 on initial mount
  useEffect(() => {
    loadSurah(1)
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
