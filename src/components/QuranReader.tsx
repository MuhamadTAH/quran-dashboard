import React, { useState, useMemo, useEffect, useRef } from 'react'
import type { ThemeColors } from '../utils/themeStyles'
import {
  BookOpen,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  Sparkles,
  X,
  StickyNote,
  Trash2,
  Headphones,
  MousePointer2,
  Bot,
  Loader2,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { FontFamily, LineSpacing, PageData } from '../types/quran'
import { tokenizeAyah, getSurahRareStats } from '../services/wordFrequencyService'
import { cleanAyahText, fetchPage } from '../services/quranService'
import { AiAskModal } from './AiAskModal'

// ─── Arabic Numerals Helper ──────────────────────────────────────────────────
const toArabicDigits = (num: number): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return num
    .toString()
    .split('')
    .map((d) => digits[parseInt(d, 10)] ?? d)
    .join('')
}

// ─── Note Dialog ─────────────────────────────────────────────────────────────
const NoteDialog: React.FC<{
  ayahNumber: number
  wordIndex?: number
  wordText?: string
  existingNote?: string
  onSave: (text: string) => void
  onDelete?: () => void
  onClose: () => void
  themeConfig: ThemeColors
}> = ({ ayahNumber, wordIndex, wordText, existingNote, onSave, onDelete, onClose, themeConfig }) => {
  const [text, setText] = useState(existingNote || '')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm p-5 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl space-y-4`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <span>
              {wordIndex !== undefined
                ? `ملاحظة على: ${wordText}`
                : `ملاحظة — الآية ${ayahNumber}`}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-current/10 hover:bg-current/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب ملاحظتك هنا..."
          rows={4}
          className={`w-full resize-none rounded-xl border border-current/15 ${themeConfig.bgCard} p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed font-ui`}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (text.trim()) {
                onSave(text.trim())
                onClose()
              }
            }}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 font-bold text-xs transition-colors"
          >
            حفظ الملاحظة
          </button>
          {onDelete && (
            <button
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="p-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Ayah Action Popup ────────────────────────────────────────────────────────
const AyahPopup: React.FC<{
  ayahNum: number
  surahNum: number
  surahName: string
  ayahText: string
  themeConfig: ThemeColors
  isPlaying: boolean
  isSelectionMode: boolean
  hasNote: boolean
  onPlay: () => void
  onNote: () => void
  onSelect: () => void
  onAskAi: () => void
  onClose: () => void
}> = ({
  ayahNum,
  surahName,
  themeConfig,
  isPlaying,
  isSelectionMode,
  hasNote,
  onPlay,
  onNote,
  onSelect,
  onAskAi,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className={`${themeConfig.bgCard} border ${themeConfig.border} rounded-2xl shadow-2xl p-4 w-60 space-y-2`}
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      <p className="text-xs font-bold opacity-60 text-center pb-1 border-b border-current/10">
        {surahName} — الآية {ayahNum}
      </p>
      {/* Ask AI about this ayah */}
      <button
        onClick={() => {
          onAskAi()
          onClose()
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-sm font-semibold text-right transition-colors text-purple-700 dark:text-purple-300"
      >
        <Bot className="w-4 h-4 text-purple-500 shrink-0" />
        اسأل الذكاء الاصطناعي
      </button>
      {/* Play this ayah */}
      <button
        onClick={() => {
          onPlay()
          onClose()
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-sm font-semibold text-right transition-colors"
      >
        <Headphones className="w-4 h-4 text-emerald-600 shrink-0" />
        {isPlaying ? 'إيقاف التلاوة' : 'استمع لهذه الآية'}
      </button>
      {/* Add note */}
      <button
        onClick={() => {
          onNote()
          onClose()
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-violet-500/10 text-sm font-semibold text-right transition-colors ${
          hasNote ? 'text-violet-600 dark:text-violet-400' : ''
        }`}
      >
        <StickyNote className="w-4 h-4 text-violet-500 shrink-0" />
        {hasNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة'}
      </button>
      {/* Select ayah */}
      {isSelectionMode && (
        <button
          onClick={() => {
            onSelect()
            onClose()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 text-sm font-semibold text-right transition-colors"
        >
          <MousePointer2 className="w-4 h-4 text-blue-500 shrink-0" />
          تحديد / إلغاء التحديد
        </button>
      )}
    </div>
  </div>
)

// ─── Madani Page View Component (Used for Page and Scroll-Pages modes) ────────
const MadaniPageView: React.FC<{
  page: PageData
  fontSize: number
  fontFamily: FontFamily
  lineSpacing: LineSpacing
  themeConfig: ThemeColors
  highlightRareWords: boolean
  rareWordThreshold: number
  isAiAskMode: boolean
  isAudioClickMode: boolean
  isSelectionMode: boolean
  selectedAyahs: Set<number>
  getAyahNotes: (s: number, a: number) => any[]
  getWordNote: (s: number, a: number, w: number) => any
  onWordClick: (
    word: string,
    ayahNum: number,
    wordIdx: number,
    isRare: boolean,
    rareFreq?: number,
    wordPos?: number,
    surahNum?: number,
    ayahText?: string
  ) => void
  onAyahClick: (ayahNum: number, surahNum: number, surahName: string, ayahText: string) => void
}> = ({
  page,
  fontSize,
  fontFamily,
  lineSpacing,
  themeConfig,
  highlightRareWords,
  rareWordThreshold,
  isAiAskMode,
  isAudioClickMode,
  isSelectionMode,
  selectedAyahs,
  getAyahNotes,
  getWordNote,
  onWordClick,
  onAyahClick,
}) => {
  const getFontFamilyClass = (family: FontFamily) => {
    switch (family) {
      case 'scheherazade':
        return 'font-quran-scheherazade'
      case 'noto':
        return 'font-quran-noto'
      case 'amiri':
      default:
        return 'font-quran-amiri'
    }
  }

  const getLineHeight = (spacing: LineSpacing) => {
    switch (spacing) {
      case 'normal':
        return 2.0
      case 'spacious':
        return 2.8
      case 'relaxed':
      default:
        return 2.4
    }
  }

  return (
    <div
      id={`page-container-${page.pageNumber}`}
      className={`rounded-3xl border-2 border-amber-600/30 ${themeConfig.bgCard} shadow-lg p-5 sm:p-9 relative transition-all duration-200 select-text`}
      dir="rtl"
    >
      {/* ── Page Header Bar (Madani Mushaf style) ── */}
      <div className="flex items-center justify-between border-b-2 border-amber-500/25 pb-3 mb-6 text-xs sm:text-sm font-semibold opacity-85 font-sans">
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>الجزء {toArabicDigits(page.juzNumber)}</span>
        </span>
        <span className="font-quran-amiri font-bold text-base sm:text-xl text-amber-800 dark:text-amber-300">
          سورة {page.surahs.map((s) => s.name).join(' و ')}
        </span>
        <span className="text-amber-700 dark:text-amber-400 font-mono">
          صـ {toArabicDigits(page.pageNumber)}
        </span>
      </div>

      {/* ── Page Quranic Content ── */}
      <div
        className={`${getFontFamilyClass(fontFamily)} text-justify leading-loose`}
        style={{ fontSize: `${fontSize}px`, lineHeight: getLineHeight(lineSpacing) }}
      >
        {page.ayahs.map((ayah, aIdx) => {
          const isFirstInSurah = ayah.isFirstAyahOfSurah || ayah.numberInSurah === 1
          const cleanText = cleanAyahText(ayah.surahNumber, ayah.numberInSurah, ayah.text)
          const tokens = highlightRareWords ? tokenizeAyah(cleanText, rareWordThreshold) : null
          const isSelected = selectedAyahs.has(ayah.numberInSurah)
          const ayahNotes = getAyahNotes(ayah.surahNumber, ayah.numberInSurah)

          return (
            <React.Fragment key={`${ayah.surahNumber}-${ayah.numberInSurah}-${aIdx}`}>
              {/* Surah Banner if this is Ayah 1 of a Surah */}
              {isFirstInSurah && (
                <div className="my-6 text-center select-none block">
                  <div className="relative py-2.5 px-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 shadow-inner inline-flex items-center justify-between w-full max-w-md mx-auto">
                    <span className="text-xs opacity-60">سورة</span>
                    <span className="text-2xl sm:text-3xl font-bold font-quran-amiri text-amber-800 dark:text-amber-200">
                      {ayah.surahName}
                    </span>
                    <span className="text-xs opacity-60 font-mono">﴿{toArabicDigits(ayah.surahNumber)}﴾</span>
                  </div>

                  {/* Bismillah Header (except Surah 1 & Surah 9) */}
                  {ayah.surahNumber !== 1 && ayah.surahNumber !== 9 && (
                    <div className="py-3 text-center">
                      <div className="inline-block text-xl sm:text-2xl font-quran-amiri text-amber-700 dark:text-amber-400 px-6 py-1 border-y border-amber-500/20">
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ayah inline span */}
              <span
                id={`ayah-${ayah.surahNumber}-${ayah.numberInSurah}`}
                className={`transition-colors duration-150 inline rounded-lg px-0.5 ${
                  isSelected ? 'bg-blue-400/20 ring-1 ring-blue-400/50' : ''
                }`}
              >
                {tokens ? (
                  tokens.map((tok, tIdx) => {
                    if (!tok.isWord) return <span key={tIdx}>{tok.text}</span>
                    const wordNote = getWordNote(ayah.surahNumber, ayah.numberInSurah, tIdx)
                    if (tok.isRare) {
                      return (
                        <span
                          key={tIdx}
                          onClick={() =>
                            onWordClick(
                              tok.cleaned,
                              ayah.numberInSurah,
                              tIdx,
                              true,
                              tok.frequency,
                              tok.wordPosition,
                              ayah.surahNumber,
                              cleanText
                            )
                          }
                          className={`relative inline-block cursor-pointer font-bold bg-amber-400/25 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 rounded px-1 mx-0.5 hover:bg-amber-400/40 transition-colors shadow-sm ${
                            isAiAskMode ? 'hover:ring-2 hover:ring-purple-400' : ''
                          } ${wordNote ? 'ring-1 ring-violet-400' : ''}`}
                          title={
                            isAiAskMode
                              ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة'
                              : isAudioClickMode
                              ? `سماع: ${tok.cleaned}`
                              : isSelectionMode
                              ? 'ملاحظة'
                              : `نادرة — ${tok.frequency} مرة`
                          }
                        >
                          {tok.text}
                          {wordNote && (
                            <span className="absolute -top-1.5 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                          )}
                        </span>
                      )
                    }
                    return (
                      <span
                        key={tIdx}
                        onClick={() =>
                          onWordClick(
                            tok.cleaned || tok.text,
                            ayah.numberInSurah,
                            tIdx,
                            false,
                            undefined,
                            tok.wordPosition,
                            ayah.surahNumber,
                            cleanText
                          )
                        }
                        className={`cursor-pointer rounded transition-colors ${
                          isAiAskMode
                            ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5'
                            : 'hover:bg-amber-500/10'
                        } ${wordNote ? 'ring-1 ring-violet-300 rounded px-0.5' : ''}`}
                        title={isAiAskMode ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة' : undefined}
                      >
                        {tok.text}
                      </span>
                    )
                  })
                ) : (
                  <span
                    onClick={() =>
                      onWordClick(cleanText, ayah.numberInSurah, 0, false, undefined, undefined, ayah.surahNumber, cleanText)
                    }
                    className={`cursor-pointer rounded transition-colors ${
                      isAiAskMode ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5' : 'hover:bg-amber-500/10'
                    }`}
                  >
                    {cleanText}
                  </span>
                )}

                {/* Ayah End Ornament */}
                <span
                  onClick={() => onAyahClick(ayah.numberInSurah, ayah.surahNumber, ayah.surahName, cleanText)}
                  className={`ayah-number ${themeConfig.ayahMarker} cursor-pointer relative inline-flex items-center justify-center font-mono mx-1 text-xs select-none ${
                    isAiAskMode
                      ? 'ring-2 ring-purple-400/80 bg-purple-500/15 text-purple-800 dark:text-purple-200 hover:bg-purple-500/30'
                      : isAudioClickMode
                      ? 'ring-2 ring-emerald-400/60'
                      : isSelectionMode
                      ? 'ring-2 ring-blue-400/60'
                      : 'hover:ring-2 hover:ring-amber-400/60'
                  } ${isSelected ? '!bg-blue-500 !text-white' : ''}`}
                  title={`الآية ${ayah.numberInSurah} — انقر للخيارات`}
                >
                  {toArabicDigits(ayah.numberInSurah)}
                  {ayahNotes.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                  )}
                </span>
              </span>
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Page Footer Bar (Page number in center) ── */}
      <div className="mt-8 pt-3 border-t-2 border-amber-500/25 flex items-center justify-center text-center">
        <span className="px-4 py-1 rounded-full border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold bg-amber-500/5">
          – {toArabicDigits(page.pageNumber)} –
        </span>
      </div>
    </div>
  )
}

// ─── Main QuranReader ─────────────────────────────────────────────────────────
interface QuranReaderProps {
  showNotesSidebar: boolean
  setShowNotesSidebar: (v: boolean) => void
}

export const QuranReader: React.FC<QuranReaderProps> = ({ showNotesSidebar, setShowNotesSidebar }) => {
  const {
    theme,
    fontSize,
    fontFamily,
    lineSpacing,
    readingMode,
    showTranslation,
    showTafseer,
    highlightRareWords,
    rareWordThreshold,
    isSelectionMode,
    isAudioClickMode,
    isAiAskMode,
    notes,
    addNote,
    removeNote,
    getAyahNotes,
    getWordNote,
    currentSurahNumber,
    currentSurahData,
    isLoadingSurah,
    surahError,
    loadSurah,
    setIsSurahSelectorOpen,
    toggleBookmark,
    isBookmarked,
    playingAyahNumber,
    isPlaying,
    playAyah,
    playWholeSurah,
    pauseAudio,
    reciter,
    speakWord,
    currentPageNumber,
    setCurrentPageNumber,
    goToPage,
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null)
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; frequency: number } | null>(null)
  const [noteTarget, setNoteTarget] = useState<{
    ayahNumber: number
    wordIndex?: number
    wordText?: string
    surahNumber?: number
  } | null>(null)
  const [selectedAyahs, setSelectedAyahs] = useState<Set<number>>(new Set())

  // Ayah action popup
  const [ayahPopup, setAyahPopup] = useState<{
    ayahNum: number
    surahNum: number
    surahName: string
    ayahText: string
  } | null>(null)

  // AI Ask modal target
  const [aiModalTarget, setAiModalTarget] = useState<{
    ayahNumber: number
    ayahText: string
    wordText?: string
    surahNumber?: number
    surahName?: string
  } | null>(null)

  // ── Single Page state (readingMode === 'page') ───────────────────────────
  const [singlePageData, setSinglePageData] = useState<PageData | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    if (readingMode !== 'page') return
    let active = true
    setIsLoadingPage(true)
    setPageError(null)

    fetchPage(currentPageNumber)
      .then((data) => {
        if (active) {
          setSinglePageData(data)
          setIsLoadingPage(false)
        }
      })
      .catch((err) => {
        if (active) {
          setPageError(err.message || 'تعذر تحميل الصفحة')
          setIsLoadingPage(false)
        }
      })

    return () => {
      active = false
    }
  }, [currentPageNumber, readingMode])

  // Arrow key navigation for single page mode
  useEffect(() => {
    if (readingMode !== 'page') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') {
        if (currentPageNumber < 604) goToPage(currentPageNumber + 1)
      } else if (e.key === 'ArrowRight') {
        if (currentPageNumber > 1) goToPage(currentPageNumber - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readingMode, currentPageNumber, goToPage])

  // ── 5-Pages Window state (readingMode === 'scroll_pages') ─────────────────
  const startWindowPage = Math.max(1, Math.min(600, currentPageNumber - 2))
  const windowPageNumbers = useMemo(() => {
    return [
      startWindowPage,
      startWindowPage + 1,
      startWindowPage + 2,
      startWindowPage + 3,
      startWindowPage + 4,
    ].filter((p) => p <= 604)
  }, [startWindowPage])

  const [windowPages, setWindowPages] = useState<PageData[]>([])
  const [isLoadingWindowPages, setIsLoadingWindowPages] = useState<boolean>(false)

  useEffect(() => {
    if (readingMode !== 'scroll_pages') return
    let active = true
    setIsLoadingWindowPages(true)

    Promise.all(windowPageNumbers.map((p) => fetchPage(p)))
      .then((pages) => {
        if (active) {
          setWindowPages(pages)
          setIsLoadingWindowPages(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load window pages:', err)
          setIsLoadingWindowPages(false)
        }
      })

    return () => {
      active = false
    }
  }, [windowPageNumbers, readingMode])

  // Smooth IntersectionObserver to update currentPageNumber without scroll jumping
  const observerRef = useRef<IntersectionObserver | null>(null)
  useEffect(() => {
    if (readingMode !== 'scroll_pages' || windowPages.length === 0) return

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            const pageAttr = entry.target.getAttribute('data-page-number')
            if (pageAttr) {
              const pNum = parseInt(pageAttr, 10)
              if (!isNaN(pNum) && pNum !== currentPageNumber) {
                setCurrentPageNumber(pNum)
              }
            }
          }
        })
      },
      { threshold: [0.4] }
    )

    windowPages.forEach((p) => {
      const el = document.getElementById(`scroll-page-${p.pageNumber}`)
      if (el && observerRef.current) {
        observerRef.current.observe(el)
      }
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [windowPages, readingMode, currentPageNumber, setCurrentPageNumber])

  // ── Common Helpers ────────────────────────────────────────────────────────
  const getFontFamilyClass = (family: FontFamily) => {
    switch (family) {
      case 'scheherazade':
        return 'font-quran-scheherazade'
      case 'noto':
        return 'font-quran-noto'
      case 'amiri':
      default:
        return 'font-quran-amiri'
    }
  }

  const getLineHeight = (spacing: LineSpacing) => {
    switch (spacing) {
      case 'normal':
        return 1.9
      case 'spacious':
        return 2.7
      case 'relaxed':
      default:
        return 2.3
    }
  }

  const handleCopyAyah = (ayahNum: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAyah(ayahNum)
    setTimeout(() => setCopiedAyah(null), 2000)
  }

  const handleNextSurah = () => {
    if (currentSurahNumber < 114) {
      loadSurah(currentSurahNumber + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const handlePrevSurah = () => {
    if (currentSurahNumber > 1) {
      loadSurah(currentSurahNumber - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const surahRareStats = useMemo(() => {
    if (!currentSurahData) return { totalRareOccurrences: 0, uniqueRareCount: 0 }
    return getSurahRareStats(currentSurahData, rareWordThreshold)
  }, [currentSurahData, rareWordThreshold])

  const toggleAyahSelected = (ayahNum: number) => {
    setSelectedAyahs((prev) => {
      const next = new Set(prev)
      if (next.has(ayahNum)) next.delete(ayahNum)
      else next.add(ayahNum)
      return next
    })
  }

  const handleWordClick = (
    word: string,
    ayahNum: number,
    wordIdx: number,
    isRare: boolean,
    rareFreq?: number,
    wordPosition?: number,
    surahNum?: number,
    fullAyahText?: string
  ) => {
    const sNum = surahNum || currentSurahNumber
    const sName =
      surahNum && surahNum !== currentSurahNumber
        ? singlePageData?.surahs.find((s) => s.number === surahNum)?.name || `سورة ${surahNum}`
        : currentSurahData?.name || ''

    if (isAiAskMode) {
      const ayahText =
        fullAyahText ||
        currentSurahData?.ayahs.find((a) => a.numberInSurah === ayahNum)?.text ||
        word
      setAiModalTarget({
        ayahNumber: ayahNum,
        ayahText,
        wordText: word,
        surahNumber: sNum,
        surahName: sName,
      })
      return
    }

    if (isAudioClickMode) {
      speakWord(word, sNum, ayahNum, wordPosition)
      return
    }

    if (isSelectionMode) {
      setNoteTarget({
        ayahNumber: ayahNum,
        wordIndex: wordIdx,
        wordText: word,
        surahNumber: sNum,
      })
      return
    }

    if (isRare && rareFreq !== undefined) {
      setSelectedWordInfo({ word, frequency: rareFreq })
    }
  }

  const handleAyahNumberClick = (
    ayahNum: number,
    surahNum?: number,
    surahName?: string,
    fullAyahText?: string
  ) => {
    const sNum = surahNum || currentSurahNumber
    const sName = surahName || currentSurahData?.name || `سورة ${sNum}`
    const aText =
      fullAyahText ||
      currentSurahData?.ayahs.find((a) => a.numberInSurah === ayahNum)?.text ||
      `الآية ${ayahNum}`

    if (isAiAskMode) {
      setAiModalTarget({
        ayahNumber: ayahNum,
        ayahText: aText,
        surahNumber: sNum,
        surahName: sName,
      })
      return
    }

    if (isAudioClickMode) {
      if (sNum === currentSurahNumber) {
        playAyah(ayahNum)
      } else {
        loadSurah(sNum, ayahNum)
      }
      return
    }

    if (isSelectionMode) {
      toggleAyahSelected(ayahNum)
      return
    }

    // Default: show options popup
    setAyahPopup({
      ayahNum,
      surahNum: sNum,
      surahName: sName,
      ayahText: aText,
    })
  }

  const currentSurahNotes = notes.filter((n) => n.surahNumber === currentSurahNumber)

  // ── Loading & Error Fallbacks ─────────────────────────────────────────────
  if (isLoadingSurah && !currentSurahData && readingMode === 'verse') {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm font-semibold opacity-70">جاري تحميل السورة الكريمة...</p>
      </div>
    )
  }

  if (surahError && !currentSurahData && readingMode === 'verse') {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-red-500 font-bold">{surahError}</p>
        <button
          onClick={() => loadSurah(currentSurahNumber)}
          className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="pb-28 space-y-5">
      {/* ── Active mode hint bar ── */}
      {(isSelectionMode || isAudioClickMode || isAiAskMode) && (
        <div
          className={`text-center text-xs py-2 px-4 rounded-xl border ${
            isAiAskMode
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold'
              : isSelectionMode
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isAiAskMode
            ? '🤖 وضع سؤال الذكاء الاصطناعي — انقر على أي كلمة أو رقم آية لسؤال Gemini عن الرسم أو الإعراب أو التفسير'
            : isSelectionMode
            ? '🟦 وضع الاختيار — انقر كلمة لملاحظتها • انقر رقم الآية لخيارات'
            : '🎧 وضع الاستماع — انقر رقم الآية لخيارات • انقر كلمة لسماع نطقها'}
        </div>
      )}

      {!isSelectionMode && !isAudioClickMode && !isAiAskMode && (
        <div className="text-center text-xs py-1.5 px-4 rounded-xl border border-current/10 opacity-50">
          💡 انقر على رقم أي آية لكتابة ملاحظة أو الاستماع • انقر على كلمة مضيئة لمعرفة تكرارها
        </div>
      )}

      {/* Clear selection strip */}
      {isSelectionMode && selectedAyahs.size > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
          <span className="text-blue-700 dark:text-blue-300 font-semibold">{selectedAyahs.size} آيات محددة</span>
          <button
            onClick={() => setSelectedAyahs(new Set())}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> إلغاء التحديد
          </button>
        </div>
      )}

      {/* ── Layout: reading area + optional notes panel ── */}
      <div className="flex gap-4 items-start">
        {/* Main reading container */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ═══════════════════════════════════════════════════════════════
              MODE 1: PAGE BY PAGE (صفحة بصفحة)
              - Authentic Madani Mushaf page
              - Pure Quranic text, NO Tafsir
             ═══════════════════════════════════════════════════════════════ */}
          {readingMode === 'page' && (
            <div className="space-y-4">
              {/* Top Page Navigation Bar */}
              <div
                className={`p-4 rounded-2xl ${themeConfig.bgCard} border ${themeConfig.border} flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm`}
              >
                <button
                  onClick={() => goToPage(Math.max(1, currentPageNumber - 1))}
                  disabled={currentPageNumber <= 1}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الصفحة السابقة</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="opacity-70">صفحة</span>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={currentPageNumber}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val >= 1 && val <= 604) goToPage(val)
                    }}
                    className="w-16 text-center font-mono font-bold py-1.5 px-2 rounded-xl bg-current/5 border border-current/15 text-sm"
                  />
                  <span className="opacity-70">من 604</span>
                </div>

                <button
                  onClick={() => goToPage(Math.min(604, currentPageNumber + 1))}
                  disabled={currentPageNumber >= 604}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all"
                  title="الصفحة التالية"
                >
                  <span>الصفحة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Page Content */}
              {isLoadingPage ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-sm font-semibold opacity-70">
                    جاري تحميل الصفحة {currentPageNumber} من المصحف الشريف...
                  </p>
                </div>
              ) : pageError ? (
                <div className="text-center py-16 space-y-4">
                  <p className="text-red-500 font-bold">{pageError}</p>
                  <button
                    onClick={() => goToPage(currentPageNumber)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : singlePageData ? (
                <MadaniPageView
                  page={singlePageData}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  lineSpacing={lineSpacing}
                  themeConfig={themeConfig}
                  highlightRareWords={highlightRareWords}
                  rareWordThreshold={rareWordThreshold}
                  isAiAskMode={isAiAskMode}
                  isAudioClickMode={isAudioClickMode}
                  isSelectionMode={isSelectionMode}
                  selectedAyahs={selectedAyahs}
                  getAyahNotes={getAyahNotes}
                  getWordNote={getWordNote}
                  onWordClick={handleWordClick}
                  onAyahClick={handleAyahNumberClick}
                />
              ) : null}

              {/* Bottom Page Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-current/10 text-xs font-semibold">
                <button
                  onClick={() => goToPage(Math.max(1, currentPageNumber - 1))}
                  disabled={currentPageNumber <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" /> السابقة
                </button>
                <span className="opacity-50 text-[11px]">
                  (يمكنك التنقل أيضاً باستخدام أزرار الأسهم ◀ ▶)
                </span>
                <button
                  onClick={() => goToPage(Math.min(604, currentPageNumber + 1))}
                  disabled={currentPageNumber >= 604}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30"
                >
                  التالية <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MODE 2: 5-PAGE SLIDING WINDOW SMOOTH SCROLL (تصفح 5 صفحات متتابعة)
              - Exactly 5 pages loaded at any time (2 before, current, 2 after)
              - Pure Quranic text, NO Tafsir
             ═══════════════════════════════════════════════════════════════ */}
          {readingMode === 'scroll_pages' && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    تصفح متتابع وسلس (عرض 5 صفحات: صـ {windowPageNumbers[0]} إلى صـ{' '}
                    {windowPageNumbers[windowPageNumbers.length - 1]})
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                  الصفحة في العرض: {currentPageNumber}
                </span>
              </div>

              {/* Load Previous 5 Pages Button */}
              {startWindowPage > 1 && (
                <div className="text-center py-1">
                  <button
                    onClick={() => goToPage(Math.max(1, startWindowPage - 1))}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 font-bold text-xs text-amber-800 dark:text-amber-200 transition-all flex items-center gap-2 mx-auto shadow-sm"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>
                      تحميل الـ 5 صفحات السابقة (صـ {Math.max(1, startWindowPage - 5)} - {startWindowPage - 1})
                    </span>
                  </button>
                </div>
              )}

              {/* 5 Pages List */}
              {isLoadingWindowPages && windowPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-sm font-semibold opacity-70">جاري تحميل الصفحات الخمس...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {windowPages.map((page) => (
                    <div
                      key={page.pageNumber}
                      id={`scroll-page-${page.pageNumber}`}
                      data-page-number={page.pageNumber}
                      className="transition-all"
                    >
                      <MadaniPageView
                        page={page}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        lineSpacing={lineSpacing}
                        themeConfig={themeConfig}
                        highlightRareWords={highlightRareWords}
                        rareWordThreshold={rareWordThreshold}
                        isAiAskMode={isAiAskMode}
                        isAudioClickMode={isAudioClickMode}
                        isSelectionMode={isSelectionMode}
                        selectedAyahs={selectedAyahs}
                        getAyahNotes={getAyahNotes}
                        getWordNote={getWordNote}
                        onWordClick={handleWordClick}
                        onAyahClick={handleAyahNumberClick}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Load Next 5 Pages Button */}
              {windowPageNumbers[windowPageNumbers.length - 1] < 604 && (
                <div className="text-center py-1">
                  <button
                    onClick={() => goToPage(Math.min(604, startWindowPage + 5))}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 font-bold text-xs text-amber-800 dark:text-amber-200 transition-all flex items-center gap-2 mx-auto shadow-sm"
                  >
                    <span>
                      تحميل الـ 5 صفحات التالية (صـ {startWindowPage + 5} - {Math.min(604, startWindowPage + 9)})
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MODE 3: VERSE BY VERSE (آية بآية)
              - Ayah cards
              - Tafsir appears ONLY here (conditioned on showTafseer)
             ═══════════════════════════════════════════════════════════════ */}
          {(readingMode === 'verse' || readingMode === 'mushaf') && currentSurahData && (
            <div className="space-y-5">
              {/* Surah header card */}
              <div
                className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 ${themeConfig.bgCard} border ${themeConfig.border} text-center space-y-4 shadow-sm`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <button
                    onClick={handlePrevSurah}
                    disabled={currentSurahNumber <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابقة</span>
                  </button>
                  <button
                    onClick={() => setIsSurahSelectorOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>فهرس السور ({currentSurahNumber}/114)</span>
                  </button>
                  <button
                    onClick={handleNextSurah}
                    disabled={currentSurahNumber >= 114}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all"
                  >
                    <span>التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="inline-block px-3 py-1 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    {currentSurahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {currentSurahData.numberOfAyahs} آيات
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-quran-amiri tracking-wide py-1">
                    {currentSurahData.name}
                  </h2>
                  <p className="text-xs sm:text-sm opacity-60 font-sans">
                    {currentSurahData.englishName} • {currentSurahData.englishNameTranslation}
                  </p>
                  {highlightRareWords && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <strong>{surahRareStats.totalRareOccurrences} كلمة</strong>
                        {rareWordThreshold === 1 ? ' فريدة' : ` وردت ≤${rareWordThreshold} مرات`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={playWholeSurah}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 mx-auto shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  استمع إلى السورة كاملة ({reciter.arabicName})
                </button>
              </div>

              {/* Bismillah Header (except Surah 1 & Surah 9) */}
              {currentSurahNumber !== 1 && currentSurahNumber !== 9 && (
                <div className="text-center py-4">
                  <div className="inline-block text-2xl sm:text-3xl lg:text-4xl font-quran-amiri text-amber-700 dark:text-amber-400 select-none px-6 py-2 border-y border-amber-500/20">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                </div>
              )}

              {/* Verse Cards */}
              <div className="space-y-4">
                {currentSurahData.ayahs.map((ayah) => {
                  const isBookmarkedAyah = isBookmarked(currentSurahNumber, ayah.numberInSurah)
                  const isPlayingThis = isPlaying && playingAyahNumber === ayah.numberInSurah
                  const isSelectedAyah = selectedAyahs.has(ayah.numberInSurah)
                  const cleanText = cleanAyahText(currentSurahNumber, ayah.numberInSurah, ayah.text)
                  const tokens = highlightRareWords ? tokenizeAyah(cleanText, rareWordThreshold) : null
                  const ayahNotes = getAyahNotes(currentSurahNumber, ayah.numberInSurah)

                  return (
                    <div
                      key={ayah.number}
                      id={`ayah-${ayah.numberInSurah}`}
                      className={`p-5 sm:p-6 rounded-3xl ${themeConfig.bgCard} border transition-all duration-200 space-y-4 ${
                        isPlayingThis
                          ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                          : isSelectedAyah
                          ? 'border-blue-400 ring-2 ring-blue-400/30'
                          : themeConfig.border
                      }`}
                    >
                      {/* Verse Header Bar */}
                      <div className="flex items-center justify-between border-b pb-3 border-current/10">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() =>
                              handleAyahNumberClick(
                                ayah.numberInSurah,
                                currentSurahNumber,
                                currentSurahData.name,
                                cleanText
                              )
                            }
                            className={`relative w-8 h-8 rounded-full font-mono text-xs font-bold flex items-center justify-center border cursor-pointer transition-all ${
                              isAiAskMode
                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 ring-1 ring-purple-400 hover:bg-purple-500/30'
                                : isAudioClickMode
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-400'
                                : isSelectionMode
                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 ring-1 ring-blue-400'
                                : isSelectedAyah
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                            }`}
                            title="انقر للخيارات أو لكتابة ملاحظة"
                          >
                            {toArabicDigits(ayah.numberInSurah)}
                            {ayahNotes.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                            )}
                          </span>
                          <span className="text-xs opacity-60">
                            الآية {toArabicDigits(ayah.numberInSurah)} من{' '}
                            {toArabicDigits(currentSurahData.numberOfAyahs)}
                          </span>
                          {ayahNotes.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-violet-600 dark:text-violet-400">
                              <StickyNote className="w-3 h-3" />
                              {ayahNotes.length}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setAiModalTarget({
                                ayahNumber: ayah.numberInSurah,
                                ayahText: cleanText,
                                surahNumber: currentSurahNumber,
                                surahName: currentSurahData.name,
                              })
                            }}
                            className="p-2 rounded-xl border border-purple-500/30 hover:bg-purple-500/15 text-purple-600 dark:text-purple-300 opacity-90 hover:opacity-100 transition-all"
                            title="اسأل الذكاء الاصطناعي عن هذه الآية"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => (isPlayingThis ? pauseAudio() : playAyah(ayah.numberInSurah))}
                            className={`p-2 rounded-xl border transition-all ${
                              isPlayingThis
                                ? 'bg-amber-500 text-stone-950 border-amber-500'
                                : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                            }`}
                            title={isPlayingThis ? 'إيقاف' : 'استماع'}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setNoteTarget({
                                ayahNumber: ayah.numberInSurah,
                                surahNumber: currentSurahNumber,
                              })
                            }
                            className={`p-2 rounded-xl border transition-all ${
                              ayahNotes.length > 0
                                ? 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/50'
                                : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                            }`}
                            title="ملاحظة"
                          >
                            <StickyNote className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              toggleBookmark(
                                currentSurahNumber,
                                currentSurahData.name,
                                ayah.numberInSurah,
                                cleanText
                              )
                            }
                            className={`p-2 rounded-xl border transition-all ${
                              isBookmarkedAyah
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50'
                                : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                            }`}
                            title={isBookmarkedAyah ? 'إزالة العلامة' : 'حفظ علامة'}
                          >
                            {isBookmarkedAyah ? (
                              <BookmarkCheck className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyAyah(ayah.numberInSurah, cleanText)}
                            className="p-2 rounded-xl border border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100 transition-all"
                            title="نسخ"
                          >
                            {copiedAyah === ayah.numberInSurah ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Arabic Text */}
                      <div
                        className={`text-right ${getFontFamilyClass(fontFamily)} transition-all duration-150 select-text`}
                        style={{ fontSize: `${fontSize}px`, lineHeight: getLineHeight(lineSpacing) }}
                        dir="rtl"
                      >
                        {tokens ? (
                          tokens.map((tok, idx) => {
                            if (!tok.isWord) return <span key={idx}>{tok.text}</span>
                            const wordNote = getWordNote(currentSurahNumber, ayah.numberInSurah, idx)
                            if (tok.isRare) {
                              return (
                                <span
                                  key={idx}
                                  onClick={() =>
                                    handleWordClick(
                                      tok.cleaned,
                                      ayah.numberInSurah,
                                      idx,
                                      true,
                                      tok.frequency,
                                      tok.wordPosition,
                                      currentSurahNumber,
                                      cleanText
                                    )
                                  }
                                  className={`relative inline-block cursor-pointer font-bold bg-amber-400/25 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 rounded px-1 mx-0.5 hover:bg-amber-400/40 transition-colors shadow-sm ${
                                    isAiAskMode ? 'hover:ring-2 hover:ring-purple-400' : ''
                                  } ${wordNote ? 'ring-1 ring-violet-400' : ''}`}
                                  title={
                                    isAiAskMode
                                      ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة'
                                      : isAudioClickMode
                                      ? `سماع: ${tok.cleaned}`
                                      : isSelectionMode
                                      ? 'ملاحظة'
                                      : `نادرة — ${tok.frequency} مرة`
                                  }
                                >
                                  {tok.text}
                                  {wordNote && (
                                    <span className="absolute -top-1.5 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                                  )}
                                </span>
                              )
                            }
                            return (
                              <span
                                key={idx}
                                onClick={() =>
                                  handleWordClick(
                                    tok.cleaned || tok.text,
                                    ayah.numberInSurah,
                                    idx,
                                    false,
                                    undefined,
                                    tok.wordPosition,
                                    currentSurahNumber,
                                    cleanText
                                  )
                                }
                                className={`cursor-pointer rounded transition-colors ${
                                  isAiAskMode
                                    ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5'
                                    : 'hover:bg-amber-500/10'
                                } ${wordNote ? 'ring-1 ring-violet-300 bg-violet-500/5 px-0.5' : ''}`}
                                title={isAiAskMode ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة' : undefined}
                              >
                                {tok.text}
                              </span>
                            )
                          })
                        ) : (
                          <span
                            onClick={() =>
                              handleWordClick(
                                cleanText,
                                ayah.numberInSurah,
                                0,
                                false,
                                undefined,
                                undefined,
                                currentSurahNumber,
                                cleanText
                              )
                            }
                            className={`cursor-pointer rounded transition-colors ${
                              isAiAskMode
                                ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5'
                                : 'hover:bg-amber-500/10'
                            }`}
                          >
                            {cleanText}
                          </span>
                        )}
                        <span className={`ayah-number ${themeConfig.ayahMarker}`}>
                          {toArabicDigits(ayah.numberInSurah)}
                        </span>
                      </div>

                      {/* Ayah notes list */}
                      {ayahNotes.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {ayahNotes.map((n) => (
                            <div
                              key={n.id}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs"
                              dir="rtl"
                            >
                              <StickyNote className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                              <p className="flex-1 leading-relaxed text-violet-800 dark:text-violet-300">{n.text}</p>
                              <button
                                onClick={() => removeNote(n.id)}
                                className="text-red-400 hover:text-red-600 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* English translation */}
                      {showTranslation && ayah.translation && (
                        <div
                          className="pt-2 text-left text-sm text-stone-600 dark:text-stone-300 font-sans border-t border-current/5"
                          dir="ltr"
                        >
                          <p className="leading-relaxed opacity-90">{ayah.translation}</p>
                        </div>
                      )}

                      {/* Tafsir (strictly only when showTafseer is ON in Verse mode) */}
                      {showTafseer && ayah.tafseer && (
                        <div
                          className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 text-xs sm:text-sm text-right leading-relaxed font-ui"
                          dir="rtl"
                        >
                          <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">
                            التفسير الميسر:
                          </span>
                          <p className="opacity-90">{ayah.tafseer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bottom navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-current/10">
                <button
                  onClick={handlePrevSurah}
                  disabled={currentSurahNumber <= 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-30 transition-all font-bold text-xs"
                >
                  <ChevronRight className="w-4 h-4" /> السورة السابقة
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-xs font-bold opacity-75 hover:opacity-100"
                >
                  ↑ أعلى الصفحة
                </button>
                <button
                  onClick={handleNextSurah}
                  disabled={currentSurahNumber >= 114}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-30 transition-all font-bold text-xs"
                >
                  السورة التالية <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Notes sidebar panel ── */}
        {showNotesSidebar && (
          <div className="w-56 shrink-0 sticky top-4">
            <div className={`p-4 rounded-2xl ${themeConfig.bgCard} border ${themeConfig.border} space-y-3`} dir="rtl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-violet-500" />
                  ملاحظاتي
                </h3>
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-60">{currentSurahNotes.length}</span>
                  <button
                    onClick={() => setShowNotesSidebar(false)}
                    className="p-1 rounded-lg hover:bg-current/10 opacity-60 hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {currentSurahNotes.length === 0 ? (
                <p className="text-xs opacity-50 text-center py-4">لا توجد ملاحظات لهذه السورة</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentSurahNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold opacity-75">
                        <span>الآية {toArabicDigits(n.ayahNumber)}</span>
                        <button
                          onClick={() => removeNote(n.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="leading-relaxed text-violet-900 dark:text-violet-200">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RARE WORD INFO MODAL ── */}
      {selectedWordInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedWordInfo(null)}
        >
          <div
            className={`w-full max-w-sm p-6 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl text-center space-y-4`}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-current/10">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> إحصائيات الكلمة في القرآن
              </span>
              <button
                onClick={() => setSelectedWordInfo(null)}
                className="p-1 rounded-lg border border-current/10 hover:bg-current/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <span className="font-quran-amiri text-4xl sm:text-5xl font-extrabold text-amber-800 dark:text-amber-300">
                {selectedWordInfo.word}
              </span>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 text-sm">
                <span className="opacity-70 font-ui">عدد مرات الورود:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {selectedWordInfo.frequency === 1
                    ? 'مرة واحدة فقط ✨'
                    : `${toArabicDigits(selectedWordInfo.frequency)} مرات`}
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed font-ui p-2">
                📌 الحساب يعتمد على المطابقة التامة للحروف مع التشكيل.
              </p>
            </div>
            <button
              onClick={() => setSelectedWordInfo(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ── AYAH ACTION POPUP ── */}
      {ayahPopup !== null && (
        <AyahPopup
          ayahNum={ayahPopup.ayahNum}
          surahNum={ayahPopup.surahNum}
          surahName={ayahPopup.surahName}
          ayahText={ayahPopup.ayahText}
          themeConfig={themeConfig}
          isPlaying={isPlaying && playingAyahNumber === ayahPopup.ayahNum}
          isSelectionMode={isSelectionMode}
          hasNote={getAyahNotes(ayahPopup.surahNum, ayahPopup.ayahNum).length > 0}
          onPlay={() => {
            if (isPlaying && playingAyahNumber === ayahPopup.ayahNum) {
              pauseAudio()
            } else {
              if (ayahPopup.surahNum === currentSurahNumber) {
                playAyah(ayahPopup.ayahNum)
              } else {
                loadSurah(ayahPopup.surahNum, ayahPopup.ayahNum)
              }
            }
          }}
          onNote={() =>
            setNoteTarget({
              ayahNumber: ayahPopup.ayahNum,
              surahNumber: ayahPopup.surahNum,
            })
          }
          onSelect={() => toggleAyahSelected(ayahPopup.ayahNum)}
          onAskAi={() => {
            setAiModalTarget({
              ayahNumber: ayahPopup.ayahNum,
              ayahText: ayahPopup.ayahText,
              surahNumber: ayahPopup.surahNum,
              surahName: ayahPopup.surahName,
            })
          }}
          onClose={() => setAyahPopup(null)}
        />
      )}

      {/* ── NOTE DIALOG ── */}
      {noteTarget && (() => {
        const targetSurah = noteTarget.surahNumber || currentSurahNumber
        const existing =
          noteTarget.wordIndex !== undefined
            ? getWordNote(targetSurah, noteTarget.ayahNumber, noteTarget.wordIndex)
            : getAyahNotes(targetSurah, noteTarget.ayahNumber)[0]
        return (
          <NoteDialog
            ayahNumber={noteTarget.ayahNumber}
            wordIndex={noteTarget.wordIndex}
            wordText={noteTarget.wordText}
            existingNote={existing?.text}
            themeConfig={themeConfig}
            onSave={(text) => {
              if (existing) removeNote(existing.id)
              addNote(targetSurah, noteTarget.ayahNumber, text, noteTarget.wordIndex)
            }}
            onDelete={existing ? () => removeNote(existing.id) : undefined}
            onClose={() => setNoteTarget(null)}
          />
        )
      })()}

      {/* ── AI ASK MODAL ── */}
      {aiModalTarget && (
        <AiAskModal
          isOpen={!!aiModalTarget}
          onClose={() => setAiModalTarget(null)}
          surahNumber={aiModalTarget.surahNumber || currentSurahNumber}
          surahName={aiModalTarget.surahName || currentSurahData?.name || 'سورة'}
          ayahNumber={aiModalTarget.ayahNumber}
          ayahText={aiModalTarget.ayahText}
          wordText={aiModalTarget.wordText}
          themeConfig={themeConfig}
          onSaveAsNote={(text) => {
            addNote(aiModalTarget.surahNumber || currentSurahNumber, aiModalTarget.ayahNumber, text)
          }}
        />
      )}
    </div>
  )
}
