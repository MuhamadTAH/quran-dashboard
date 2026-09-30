import React, { useState, useMemo } from 'react'
import type { ThemeColors } from '../utils/themeStyles'
import {
  BookOpen,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Copy,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  X,
  StickyNote,
  Trash2,
  Headphones,
  MousePointer2,
  Bot,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { FontFamily, LineSpacing } from '../types/quran'
import { tokenizeAyah, getSurahRareStats } from '../services/wordFrequencyService'
import { cleanAyahText } from '../services/quranService'
import { AiAskModal } from './AiAskModal'

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
            onClick={() => { if (text.trim()) { onSave(text.trim()); onClose() } }}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 font-bold text-xs transition-colors"
          >
            حفظ الملاحظة
          </button>
          {onDelete && (
            <button onClick={() => { onDelete(); onClose() }} className="p-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors">
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
  themeConfig: ThemeColors
  isPlaying: boolean
  isSelectionMode: boolean
  hasNote: boolean
  onPlay: () => void
  onNote: () => void
  onSelect: () => void
  onAskAi: () => void
  onClose: () => void
}> = ({ ayahNum, themeConfig, isPlaying, isSelectionMode, hasNote, onPlay, onNote, onSelect, onAskAi, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className={`${themeConfig.bgCard} border ${themeConfig.border} rounded-2xl shadow-2xl p-4 w-56 space-y-2`}
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      <p className="text-xs font-bold opacity-60 text-center pb-1 border-b border-current/10">
        الآية {ayahNum}
      </p>
      {/* Ask AI about this ayah */}
      <button
        onClick={() => { onAskAi(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-sm font-semibold text-right transition-colors text-purple-700 dark:text-purple-300"
      >
        <Bot className="w-4 h-4 text-purple-500 shrink-0" />
        اسأل الذكاء الاصطناعي
      </button>
      {/* Play this ayah */}
      <button
        onClick={() => { onPlay(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-sm font-semibold text-right transition-colors"
      >
        <Headphones className="w-4 h-4 text-emerald-600 shrink-0" />
        {isPlaying ? 'إيقاف' : 'استمع لهذه الآية'}
      </button>
      {/* Add note */}
      <button
        onClick={() => { onNote(); onClose() }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-violet-500/10 text-sm font-semibold text-right transition-colors ${hasNote ? 'text-violet-600 dark:text-violet-400' : ''}`}
      >
        <StickyNote className="w-4 h-4 text-violet-500 shrink-0" />
        {hasNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة'}
      </button>
      {/* Select ayah */}
      {isSelectionMode && (
        <button
          onClick={() => { onSelect(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 text-sm font-semibold text-right transition-colors"
        >
          <MousePointer2 className="w-4 h-4 text-blue-500 shrink-0" />
          تحديد / إلغاء التحديد
        </button>
      )}
    </div>
  </div>
)

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
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null)
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; frequency: number } | null>(null)
  const [noteTarget, setNoteTarget] = useState<{ ayahNumber: number; wordIndex?: number; wordText?: string } | null>(null)
  const [selectedAyahs, setSelectedAyahs] = useState<Set<number>>(new Set())
  // Ayah action popup (shown in selection/audio mode when clicking ayah number)
  const [ayahPopup, setAyahPopup] = useState<number | null>(null)
  // AI Ask modal target
  const [aiModalTarget, setAiModalTarget] = useState<{
    ayahNumber: number
    ayahText: string
    wordText?: string
  } | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getFontFamilyClass = (family: FontFamily) => {
    switch (family) {
      case 'scheherazade': return 'font-quran-scheherazade'
      case 'noto': return 'font-quran-noto'
      case 'amiri':
      default: return 'font-quran-amiri'
    }
  }

  const getLineHeight = (spacing: LineSpacing) => {
    switch (spacing) {
      case 'normal': return 1.9
      case 'spacious': return 2.7
      case 'relaxed':
      default: return 2.3
    }
  }

  const handleCopyAyah = (ayahNum: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAyah(ayahNum)
    setTimeout(() => setCopiedAyah(null), 2000)
  }

  const handleNextSurah = () => {
    if (currentSurahNumber < 114) { loadSurah(currentSurahNumber + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }
  const handlePrevSurah = () => {
    if (currentSurahNumber > 1) { loadSurah(currentSurahNumber - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
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

  const handleWordClick = (word: string, ayahNum: number, wordIdx: number, isRare: boolean, rareFreq?: number) => {
    if (isAiAskMode) {
      const ayah = currentSurahData?.ayahs.find((a) => a.numberInSurah === ayahNum)
      const cleanText = cleanAyahText(currentSurahNumber, ayahNum, ayah?.text || '')
      setAiModalTarget({ ayahNumber: ayahNum, ayahText: cleanText, wordText: word })
      return
    }
    if (isAudioClickMode) { speakWord(word); return }
    if (isSelectionMode) { setNoteTarget({ ayahNumber: ayahNum, wordIndex: wordIdx, wordText: word }); return }
    if (isRare && rareFreq !== undefined) setSelectedWordInfo({ word, frequency: rareFreq })
  }

  // Ayah number click:
  //   Ask AI Mode → open AI Ask modal for this ayah
  //   Selection or Audio mode → open action popup (play / note / select / ask AI)
  //   Default → open note dialog for that ayah
  const handleAyahNumberClick = (ayahNum: number) => {
    if (isAiAskMode) {
      const ayah = currentSurahData?.ayahs.find((a) => a.numberInSurah === ayahNum)
      const cleanText = cleanAyahText(currentSurahNumber, ayahNum, ayah?.text || '')
      setAiModalTarget({ ayahNumber: ayahNum, ayahText: cleanText })
      return
    }
    if (isSelectionMode || isAudioClickMode) {
      setAyahPopup(ayahNum)
    } else {
      // Default: open note dialog
      setNoteTarget({ ayahNumber: ayahNum })
    }
  }

  const currentSurahNotes = notes.filter((n) => n.surahNumber === currentSurahNumber)

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoadingSurah && !currentSurahData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-ui font-medium text-sm">جاري تحميل السورة الكريمة...</p>
      </div>
    )
  }
  if (surahError && !currentSurahData) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-red-500 font-bold">{surahError}</p>
        <button onClick={() => loadSurah(currentSurahNumber)} className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs">
          إعادة المحاولة
        </button>
      </div>
    )
  }
  if (!currentSurahData) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-28 space-y-5">

      {/* Active mode hint bar */}
      {(isSelectionMode || isAudioClickMode || isAiAskMode) && (
        <div className={`text-center text-xs py-2 px-4 rounded-xl border ${
          isAiAskMode
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold'
            : isSelectionMode
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        }`}>
          {isAiAskMode
            ? '🤖 وضع سؤال الذكاء الاصطناعي — انقر على أي كلمة أو رقم آية لسؤال Gemini 3.8 Flash عن الرسم أو الإعراب أو التفسير'
            : isSelectionMode
            ? '🟦 وضع الاختيار — انقر كلمة لملاحظتها • انقر رقم الآية لخيارات'
            : '🎧 وضع الاستماع — انقر رقم الآية لخيارات • انقر كلمة لسماع نطقها'}
        </div>
      )}

      {!isSelectionMode && !isAudioClickMode && !isAiAskMode && (
        <div className="text-center text-xs py-1.5 px-4 rounded-xl border border-current/10 opacity-50">
          💡 انقر على رقم أي آية لكتابة ملاحظة • انقر على كلمة مضيئة لمعرفة تكرارها
        </div>
      )}

      {/* Clear selection strip */}
      {isSelectionMode && selectedAyahs.size > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
          <span className="text-blue-700 dark:text-blue-300 font-semibold">{selectedAyahs.size} آيات محددة</span>
          <button onClick={() => setSelectedAyahs(new Set())} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <X className="w-3 h-3" /> إلغاء التحديد
          </button>
        </div>
      )}

      {/* Layout: reading area + optional notes panel */}
      <div className="flex gap-4 items-start">

        {/* ── Main reading area ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Surah header */}
          <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 ${themeConfig.bgCard} border ${themeConfig.border} text-center space-y-4 shadow-sm`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <button onClick={handlePrevSurah} disabled={currentSurahNumber <= 1} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all">
                <ChevronRight className="w-4 h-4" /><span>السابقة</span>
              </button>
              <button onClick={() => setIsSurahSelectorOpen(true)} className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /><span>فهرس السور ({currentSurahNumber}/114)</span>
              </button>
              <button onClick={handleNextSurah} disabled={currentSurahNumber >= 114} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all">
                <span>التالية</span><ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                {currentSurahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {currentSurahData.numberOfAyahs} آيات
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-quran-amiri tracking-wide py-1">{currentSurahData.name}</h2>
              <p className="text-xs sm:text-sm opacity-60 font-sans">{currentSurahData.englishName} • {currentSurahData.englishNameTranslation}</p>
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

            <button onClick={playWholeSurah} className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 mx-auto shadow-md shadow-amber-500/20 active:scale-95 transition-all">
              <Volume2 className="w-4 h-4" />
              استمع إلى السورة كاملة ({reciter.arabicName})
            </button>
          </div>

          {/* Bismillah Header — for all surahs except Al-Fatihah (where Ayah 1 is Bismillah) and At-Tawbah (Surah 9) */}
          {currentSurahNumber !== 1 && currentSurahNumber !== 9 && (
            <div className="text-center py-4">
              <div className="inline-block text-2xl sm:text-3xl lg:text-4xl font-quran-amiri text-amber-700 dark:text-amber-400 select-none px-6 py-2 border-y border-amber-500/20">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            </div>
          )}

          {/* ── MUSHAF MODE ── */}
          {readingMode === 'mushaf' ? (
            <div className={`p-6 sm:p-10 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-md text-justify leading-loose select-text`} dir="rtl">
              <div className={`${getFontFamilyClass(fontFamily)} transition-all duration-150`} style={{ fontSize: `${fontSize}px`, lineHeight: getLineHeight(lineSpacing) }}>
                {currentSurahData.ayahs.map((ayah) => {
                  const isPlayingThis = isPlaying && playingAyahNumber === ayah.numberInSurah
                  const isSelectedAyah = selectedAyahs.has(ayah.numberInSurah)
                  const cleanText = cleanAyahText(currentSurahNumber, ayah.numberInSurah, ayah.text)
                  const tokens = highlightRareWords ? tokenizeAyah(cleanText, rareWordThreshold) : null
                  const ayahNotes = getAyahNotes(currentSurahNumber, ayah.numberInSurah)

                  return (
                    <span
                      key={ayah.number}
                      id={`ayah-${ayah.numberInSurah}`}
                      className={`transition-colors duration-200 inline rounded-lg px-0.5 ${isPlayingThis ? themeConfig.ayahActive : ''} ${isSelectedAyah ? 'bg-blue-400/20 ring-1 ring-blue-400/50 rounded' : ''}`}
                    >
                      {tokens ? (
                        tokens.map((tok, idx) => {
                          if (!tok.isWord) return <span key={idx}>{tok.text}</span>
                          const wordNote = getWordNote(currentSurahNumber, ayah.numberInSurah, idx)
                          if (tok.isRare) {
                            return (
                              <span
                                key={idx}
                                onClick={() => handleWordClick(tok.cleaned, ayah.numberInSurah, idx, true, tok.frequency)}
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
                                {wordNote && <span className="absolute -top-1.5 -right-1 w-2 h-2 bg-violet-500 rounded-full" />}
                              </span>
                            )
                          }
                          return (
                            <span
                              key={idx}
                              onClick={() => handleWordClick(tok.text, ayah.numberInSurah, idx, false)}
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
                          onClick={() => handleWordClick(cleanText, ayah.numberInSurah, 0, false)}
                          className={`cursor-pointer rounded transition-colors ${
                            isAiAskMode ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5' : 'hover:bg-amber-500/10'
                          }`}
                          title={isAiAskMode ? 'اسأل الذكاء الاصطناعي عن هذه الآية' : undefined}
                        >
                          {cleanText}
                        </span>
                      )}

                      {/* Ayah number circle — click to open notes (default) or popup (in a mode) */}
                      <span
                        className={`ayah-number ${themeConfig.ayahMarker} cursor-pointer relative ${
                          isAiAskMode
                            ? 'ring-2 ring-purple-400/80 bg-purple-500/15 text-purple-800 dark:text-purple-200 hover:bg-purple-500/30'
                            : isAudioClickMode
                            ? 'ring-2 ring-emerald-400/60'
                            : isSelectionMode
                            ? 'ring-2 ring-blue-400/60'
                            : 'hover:ring-2 hover:ring-amber-400/60'
                        } ${isSelectedAyah ? '!bg-blue-500 !text-white' : ''}`}
                        onClick={() => handleAyahNumberClick(ayah.numberInSurah)}
                        title={
                          isAiAskMode
                            ? 'اسأل الذكاء الاصطناعي عن هذه الآية'
                            : isAudioClickMode || isSelectionMode
                            ? 'انقر للخيارات'
                            : 'انقر لملاحظة'
                        }
                      >
                        {ayah.numberInSurah}
                        {ayahNotes.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />}
                      </span>
                    </span>
                  )
                })}
              </div>
            </div>
          ) : (
            /* ── VERSE BY VERSE MODE ── */
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
                      isPlayingThis ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                      : isSelectedAyah ? 'border-blue-400 ring-2 ring-blue-400/30'
                      : themeConfig.border
                    }`}
                  >
                    {/* Verse header */}
                    <div className="flex items-center justify-between border-b pb-3 border-current/10">
                      <div className="flex items-center gap-2">
                        {/* Ayah number — same click behavior as mushaf */}
                        <span
                          onClick={() => handleAyahNumberClick(ayah.numberInSurah)}
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
                          title={
                            isAiAskMode
                              ? 'اسأل الذكاء الاصطناعي عن هذه الآية'
                              : isAudioClickMode || isSelectionMode
                              ? 'انقر للخيارات'
                              : 'انقر لملاحظة'
                          }
                        >
                          {ayah.numberInSurah}
                          {ayahNotes.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />}
                        </span>
                        <span className="text-xs opacity-60">الآية {ayah.numberInSurah} من {currentSurahData.numberOfAyahs}</span>
                        {ayahNotes.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-violet-600 dark:text-violet-400">
                            <StickyNote className="w-3 h-3" />{ayahNotes.length}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setAiModalTarget({
                              ayahNumber: ayah.numberInSurah,
                              ayahText: cleanText,
                            })
                          }}
                          className="p-2 rounded-xl border border-purple-500/30 hover:bg-purple-500/15 text-purple-600 dark:text-purple-300 opacity-90 hover:opacity-100 transition-all"
                          title="اسأل الذكاء الاصطناعي عن هذه الآية"
                        >
                          <Bot className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => isPlayingThis ? pauseAudio() : playAyah(ayah.numberInSurah)}
                          className={`p-2 rounded-xl border transition-all ${isPlayingThis ? 'bg-amber-500 text-stone-950 border-amber-500' : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'}`}
                          title={isPlayingThis ? 'إيقاف' : 'استماع'}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setNoteTarget({ ayahNumber: ayah.numberInSurah })}
                          className={`p-2 rounded-xl border transition-all ${ayahNotes.length > 0 ? 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/50' : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'}`}
                          title="ملاحظة"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleBookmark(currentSurahNumber, currentSurahData.name, ayah.numberInSurah, cleanText)}
                          className={`p-2 rounded-xl border transition-all ${isBookmarkedAyah ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50' : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'}`}
                          title={isBookmarkedAyah ? 'إزالة العلامة' : 'حفظ علامة'}
                        >
                          {isBookmarkedAyah ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleCopyAyah(ayah.numberInSurah, cleanText)}
                          className="p-2 rounded-xl border border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100 transition-all"
                          title="نسخ"
                        >
                          {copiedAyah === ayah.numberInSurah ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <div className={`text-right ${getFontFamilyClass(fontFamily)} transition-all duration-150 select-text`} style={{ fontSize: `${fontSize}px`, lineHeight: getLineHeight(lineSpacing) }} dir="rtl">
                      {tokens ? (
                        tokens.map((tok, idx) => {
                          if (!tok.isWord) return <span key={idx}>{tok.text}</span>
                          const wordNote = getWordNote(currentSurahNumber, ayah.numberInSurah, idx)
                          if (tok.isRare) {
                            return (
                              <span
                                key={idx}
                                onClick={() => handleWordClick(tok.cleaned, ayah.numberInSurah, idx, true, tok.frequency)}
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
                                {wordNote && <span className="absolute -top-1.5 -right-1 w-2 h-2 bg-violet-500 rounded-full" />}
                              </span>
                            )
                          }
                          return (
                            <span
                              key={idx}
                              onClick={() => handleWordClick(tok.text, ayah.numberInSurah, idx, false)}
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
                          onClick={() => handleWordClick(cleanText, ayah.numberInSurah, 0, false)}
                          className={`cursor-pointer rounded transition-colors ${
                            isAiAskMode ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5' : isAudioClickMode ? '' : 'hover:bg-amber-500/10'
                          }`}
                          title={isAiAskMode ? 'اسأل الذكاء الاصطناعي عن هذه الآية' : undefined}
                        >
                          {cleanText}
                        </span>
                      )}
                      <span className={`ayah-number ${themeConfig.ayahMarker}`}>{ayah.numberInSurah}</span>
                    </div>

                    {/* Ayah notes */}
                    {ayahNotes.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {ayahNotes.map((n) => (
                          <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs" dir="rtl">
                            <StickyNote className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                            <p className="flex-1 leading-relaxed text-violet-800 dark:text-violet-300">{n.text}</p>
                            <button onClick={() => removeNote(n.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showTranslation && ayah.translation && (
                      <div className="pt-2 text-left text-sm text-stone-600 dark:text-stone-300 font-sans border-t border-current/5" dir="ltr">
                        <p className="leading-relaxed opacity-90">{ayah.translation}</p>
                      </div>
                    )}
                    {showTafseer && ayah.tafseer && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 text-xs sm:text-sm text-right leading-relaxed font-ui" dir="rtl">
                        <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">التفسير الميسر:</span>
                        <p className="opacity-90">{ayah.tafseer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-current/10">
            <button onClick={handlePrevSurah} disabled={currentSurahNumber <= 1} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-30 transition-all font-bold text-xs">
              <ChevronRight className="w-4 h-4" /> السورة السابقة
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs font-bold opacity-75 hover:opacity-100">
              ↑ أعلى الصفحة
            </button>
            <button onClick={handleNextSurah} disabled={currentSurahNumber >= 114} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-30 transition-all font-bold text-xs">
              السورة التالية <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
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
                  <button onClick={() => setShowNotesSidebar(false)} className="p-1 rounded-lg hover:bg-current/10 opacity-60 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {currentSurahNotes.length === 0 ? (
                <p className="text-xs opacity-50 text-center py-4 leading-relaxed">لا توجد ملاحظات.<br />انقر رقم أي آية لإضافة ملاحظة.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {currentSurahNotes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between opacity-60">
                        <span>{n.wordIndex !== undefined ? `آية ${n.ayahNumber} — كلمة` : `آية ${n.ayahNumber}`}</span>
                        <button onClick={() => removeNote(n.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <p className="leading-relaxed text-violet-800 dark:text-violet-300">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RARE WORD MODAL ── */}
      {selectedWordInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedWordInfo(null)}>
          <div className={`w-full max-w-md p-6 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl text-center space-y-4`} onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between border-b pb-3 border-current/10">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" /><span>إحصاء الكلمة في القرآن الكريم</span>
              </div>
              <button onClick={() => setSelectedWordInfo(null)} className="p-1 rounded-lg border border-current/10 hover:bg-current/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <span className="font-quran-amiri text-4xl sm:text-5xl font-extrabold text-amber-800 dark:text-amber-300">{selectedWordInfo.word}</span>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 text-sm">
                <span className="opacity-70 font-ui">عدد مرات الورود:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {selectedWordInfo.frequency === 1 ? 'مرة واحدة فقط ✨' : `${selectedWordInfo.frequency} مرات`}
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed font-ui p-2">📌 الحساب يعتمد على المطابقة التامة للحروف مع التشكيل.</p>
            </div>
            <button onClick={() => setSelectedWordInfo(null)} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors">إغلاق</button>
          </div>
        </div>
      )}

      {/* ── AYAH ACTION POPUP (selection/audio mode) ── */}
      {ayahPopup !== null && currentSurahData && (
        <AyahPopup
          ayahNum={ayahPopup}
          themeConfig={themeConfig}
          isPlaying={isPlaying && playingAyahNumber === ayahPopup}
          isSelectionMode={isSelectionMode}
          hasNote={getAyahNotes(currentSurahNumber, ayahPopup).length > 0}
          onPlay={() => {
            if (isPlaying && playingAyahNumber === ayahPopup) pauseAudio()
            else playAyah(ayahPopup)
          }}
          onNote={() => setNoteTarget({ ayahNumber: ayahPopup })}
          onSelect={() => toggleAyahSelected(ayahPopup)}
          onAskAi={() => {
            const ayah = currentSurahData.ayahs.find((a) => a.numberInSurah === ayahPopup)
            const cleanText = cleanAyahText(currentSurahNumber, ayahPopup, ayah?.text || '')
            setAiModalTarget({
              ayahNumber: ayahPopup,
              ayahText: cleanText,
            })
          }}
          onClose={() => setAyahPopup(null)}
        />
      )}

      {/* ── NOTE DIALOG ── */}
      {noteTarget && currentSurahData && (() => {
        const existing =
          noteTarget.wordIndex !== undefined
            ? getWordNote(currentSurahNumber, noteTarget.ayahNumber, noteTarget.wordIndex)
            : getAyahNotes(currentSurahNumber, noteTarget.ayahNumber)[0]
        return (
          <NoteDialog
            ayahNumber={noteTarget.ayahNumber}
            wordIndex={noteTarget.wordIndex}
            wordText={noteTarget.wordText}
            existingNote={existing?.text}
            themeConfig={themeConfig}
            onSave={(text) => {
              if (existing) removeNote(existing.id)
              addNote(currentSurahNumber, noteTarget.ayahNumber, text, noteTarget.wordIndex)
            }}
            onDelete={existing ? () => removeNote(existing.id) : undefined}
            onClose={() => setNoteTarget(null)}
          />
        )
      })()}

      {/* ── AI ASK MODAL ── */}
      {aiModalTarget && currentSurahData && (
        <AiAskModal
          isOpen={!!aiModalTarget}
          onClose={() => setAiModalTarget(null)}
          surahNumber={currentSurahNumber}
          surahName={currentSurahData.name}
          ayahNumber={aiModalTarget.ayahNumber}
          ayahText={aiModalTarget.ayahText}
          wordText={aiModalTarget.wordText}
          themeConfig={themeConfig}
          onSaveAsNote={(text) => {
            addNote(currentSurahNumber, aiModalTarget.ayahNumber, text)
          }}
        />
      )}
    </div>
  )
}
