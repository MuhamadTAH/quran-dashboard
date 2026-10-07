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
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { FontFamily, LineSpacing, PageData, MistakeCategory, QuranMistake } from '../types/quran'
import { TAFSIR_OPTIONS } from '../types/quran'
import { tokenizeAyah, getSurahRareStats } from '../services/wordFrequencyService'
import { cleanAyahText, fetchPage, stripAllTashkeel } from '../services/quranService'
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

// ─── Mistake Categories Constant ─────────────────────────────────────────────
const MISTAKE_CATEGORIES: { id: MistakeCategory; label: string; icon: string; desc: string }[] = [
  { id: 'memory', label: 'نسيان وحفظ', icon: '🧠', desc: 'نسيان موضع أو كلمة أو ترتيب الآية' },
  { id: 'mutashabih', label: 'متشابهات', icon: '🔄', desc: 'تشابه مع موضع في سورة أخرى' },
  { id: 'harakah', label: 'حركة وتشكيل', icon: '✍️', desc: 'خطأ في الفتحة أو الضمة أو الكسرة أو السكون' },
  { id: 'letter', label: 'إبدال حرف', icon: '🔤', desc: 'إبدال أو زيادة أو حذف حرف' },
  { id: 'word', label: 'إبدال كلمة', icon: '📖', desc: 'تقديم أو تأخير أو إبدال كلمة' },
  { id: 'tajweed', label: 'حكم تجويدي', icon: '🎙️', desc: 'مد أو غنة أو إقلاب أو إخفاء' },
  { id: 'other', label: 'أخرى', icon: '⚡', desc: 'تنبيه أو وقفة خاصة' },
]

// ─── Note Dialog ─────────────────────────────────────────────────────────────
const NoteDialog: React.FC<{
  surahNumber?: number
  surahName?: string
  ayahNumber: number
  ayahText?: string
  wordIndex?: number
  wordText?: string
  existingNote?: string
  onSave: (text: string) => void
  onDelete?: () => void
  onClose: () => void
  themeConfig: ThemeColors
}> = ({
  surahNumber,
  surahName,
  ayahNumber,
  ayahText,
  wordText,
  existingNote,
  onSave,
  onDelete,
  onClose,
  themeConfig,
}) => {
  const [text, setText] = useState(existingNote || '')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md p-5 sm:p-6 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between pb-2 border-b border-current/10">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-600 dark:text-blue-400">
            <StickyNote className="w-4 h-4" />
            <span>ملاحظة وتدبر على الآية</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-current/10 hover:bg-current/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Surah & Ayah header info */}
        <div className="flex items-center justify-between text-xs font-semibold px-1 text-stone-600 dark:text-stone-300">
          <span>{surahName ? `سورة ${surahName} (رقم ${surahNumber || 1})` : `سورة رقم ${surahNumber || 1}`}</span>
          <span className="font-mono">الآية {toArabicDigits(ayahNumber)}</span>
        </div>

        {/* Full Ayah card */}
        {ayahText && (
          <div className="space-y-1 text-right">
            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
              الآية كاملة (Ayah):
            </div>
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 font-quran-amiri text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200">
              « {ayahText} »
            </div>
          </div>
        )}

        {/* Selected part card */}
        {wordText && (
          <div className="space-y-1 text-right">
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              الجزء المختار / الملاحظة عنه (Selective):
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 font-quran-amiri text-sm text-blue-900 dark:text-blue-200 leading-relaxed font-bold">
              « {wordText} »
            </div>
          </div>
        )}

        <div className="space-y-1 text-right">
          <label className="text-[11px] font-bold opacity-75 block">نص الملاحظة:</label>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب ملاحظتك وتأملك هنا..."
            rows={4}
            className={`w-full resize-none rounded-xl border border-current/15 ${themeConfig.bgCard} p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 leading-relaxed font-ui`}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              if (text.trim()) {
                onSave(text.trim())
                onClose()
              }
            }}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-md shadow-blue-600/20"
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
              title="حذف الملاحظة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mistake Dialog ──────────────────────────────────────────────────────────
const MistakeDialog: React.FC<{
  surahNumber: number
  surahName: string
  ayahNumber: number
  ayahText: string
  wordText?: string
  existingMistake?: QuranMistake
  onSave: (reason: string, category: MistakeCategory) => void
  onDelete?: () => void
  onToggleCorrected?: () => void
  onClose: () => void
  themeConfig: ThemeColors
}> = ({
  surahNumber,
  surahName,
  ayahNumber,
  ayahText,
  wordText,
  existingMistake,
  onSave,
  onDelete,
  onToggleCorrected,
  onClose,
  themeConfig,
}) => {
  const [reason, setReason] = useState(existingMistake?.reason || '')
  const [category, setCategory] = useState<MistakeCategory>(existingMistake?.category || 'memory')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg p-5 sm:p-6 rounded-3xl ${themeConfig.bgCard} border border-red-500/30 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-current/10">
          <div className="flex items-center gap-2 font-bold text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>تسجيل وتثبيت خطأ التلاوة / الحفظ</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-current/10 hover:bg-current/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Surah & Ayah Information */}
        <div className="flex items-center justify-between text-xs font-semibold px-1 text-stone-600 dark:text-stone-300">
          <span>{surahName ? `سورة ${surahName} (رقم ${surahNumber})` : `سورة رقم ${surahNumber}`}</span>
          <span className="font-mono">الآية {toArabicDigits(ayahNumber)}</span>
        </div>

        {/* Full Ayah (الآية كاملة) */}
        {ayahText && (
          <div className="space-y-1 text-right">
            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
              الآية كاملة (Ayah):
            </div>
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 font-quran-amiri text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200">
              « {ayahText} »
            </div>
          </div>
        )}

        {/* Selective Part (الجزء المختار / موضع الخطأ) */}
        <div className="space-y-1 text-right">
          <div className="text-[11px] font-bold text-red-600 dark:text-red-400">
            الجزء المختار / موضع الخطأ (Selective):
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 font-quran-amiri text-sm text-red-900 dark:text-red-200 leading-relaxed font-bold">
            « {wordText || 'كامل الآية'} »
          </div>
        </div>

        {/* Category selector */}
        <div className="space-y-1.5 text-right">
          <label className="text-[11px] font-bold opacity-75 block">نوع وتصنيف الخطأ:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {MISTAKE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`p-2 rounded-xl text-xs font-medium text-right border transition-all flex items-center gap-1.5 ${
                  category === cat.id
                    ? 'border-red-500 bg-red-500/20 text-red-700 dark:text-red-300 font-bold shadow-sm ring-1 ring-red-400'
                    : 'border-current/10 hover:bg-current/5 opacity-80'
                }`}
                title={cat.desc}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reason textarea */}
        <div className="space-y-1 text-right">
          <label className="text-[11px] font-bold opacity-75 block">
            سبب الخطأ أو التنبيه لمراجعته:
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اكتب سبب الخطأ لمراجعته لاحقاً (مثال: نسيت بداية الآية، تشابه مع موضع البقرة، فتحة عوض كسرة...)"
            rows={3}
            className={`w-full resize-none rounded-xl border border-current/15 ${themeConfig.bgCard} p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 leading-relaxed font-ui`}
          />
        </div>

        {/* Corrected status toggle if existing */}
        {existingMistake && onToggleCorrected && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>الحالة: {existingMistake.corrected ? 'تم التصحيح والإتقان ✓' : 'يحتاج مراجعة وتكرار ⚠️'}</span>
            </span>
            <button
              type="button"
              onClick={onToggleCorrected}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                existingMistake.corrected
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/30'
              }`}
            >
              {existingMistake.corrected ? 'أتقنتها ✓' : 'تعليم كمتقن'}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              if (reason.trim()) {
                onSave(reason.trim(), category)
                onClose()
              }
            }}
            disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-md shadow-red-600/25"
          >
            {existingMistake ? 'تحديث موضع الخطأ' : 'حفظ موضع الخطأ'}
          </button>
          {onDelete && (
            <button
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="p-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
              title="حذف هذا الخطأ"
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
  isMistakeMode: boolean
  hasNote: boolean
  hasMistake: boolean
  onPlay: () => void
  onNote: () => void
  onMistake: () => void
  onSelect: () => void
  onAskAi: () => void
  onClose: () => void
}> = ({
  ayahNum,
  surahName,
  themeConfig,
  isPlaying,
  isSelectionMode,
  isMistakeMode: _isMistakeMode,
  hasNote,
  hasMistake,
  onPlay,
  onNote,
  onMistake,
  onSelect,
  onAskAi,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className={`${themeConfig.bgCard} border ${themeConfig.border} rounded-2xl shadow-2xl p-4 w-64 space-y-2`}
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      <p className="text-xs font-bold opacity-60 text-center pb-1 border-b border-current/10">
        {surahName} — الآية {ayahNum}
      </p>
      {/* Record Mistake */}
      <button
        onClick={() => {
          onMistake()
          onClose()
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-sm font-semibold text-right transition-colors ${
          hasMistake ? 'bg-red-500/15 text-red-700 dark:text-red-300' : 'text-red-600 dark:text-red-400'
        }`}
      >
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        {hasMistake ? 'تعديل الخطأ المسجل' : 'تسجيل خطأ في التلاوة'}
      </button>
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
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 text-sm font-semibold text-right transition-colors ${
          hasNote ? 'text-blue-600 dark:text-blue-400' : ''
        }`}
      >
        <StickyNote className="w-4 h-4 text-blue-500 shrink-0" />
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
  isMistakeMode: boolean
  selectedAyahs: Set<number>
  getAyahNotes: (s: number, a: number) => any[]
  getWordNote: (s: number, a: number, w?: number, text?: string) => any
  getAyahMistakes: (s: number, a: number) => QuranMistake[]
  getWordMistake: (s: number, a: number, w?: number, text?: string) => QuranMistake | undefined
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
  onPlayPage?: (pageNumber: number) => void
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
  isMistakeMode,
  selectedAyahs,
  getAyahNotes,
  getWordNote,
  getAyahMistakes,
  getWordMistake,
  onWordClick,
  onAyahClick,
  onPlayPage,
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
        <div className="flex items-center gap-2.5">
          {onPlayPage && (
            <button
              onClick={() => onPlayPage(page.pageNumber)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="تشغيل تلاوة الصفحة بصوت القارئ المختار"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>استمع للصفحة</span>
            </button>
          )}
          <span className="text-amber-700 dark:text-amber-400 font-mono">
            صـ {toArabicDigits(page.pageNumber)}
          </span>
        </div>
      </div>

      {/* ── Page Quranic Content ── */}
      <div
        className={`${getFontFamilyClass(fontFamily)} text-justify leading-loose`}
        style={{ fontSize: `${fontSize}px`, lineHeight: getLineHeight(lineSpacing) }}
      >
        {page.ayahs.map((ayah, aIdx) => {
          const isFirstInSurah = ayah.isFirstAyahOfSurah || ayah.numberInSurah === 1
          const cleanText = cleanAyahText(ayah.surahNumber, ayah.numberInSurah, ayah.text)
          const tokens = tokenizeAyah(cleanText, rareWordThreshold)
          const isSelected = selectedAyahs.has(ayah.numberInSurah)
          const ayahNotes = getAyahNotes(ayah.surahNumber, ayah.numberInSurah)
          const ayahMistakes = getAyahMistakes(ayah.surahNumber, ayah.numberInSurah)

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
                data-ayah-number={ayah.numberInSurah}
                data-surah-number={ayah.surahNumber}
                className={`transition-colors duration-150 inline rounded-lg px-0.5 ${
                  isSelected ? 'bg-blue-400/20 ring-1 ring-blue-400/50' : ''
                }`}
              >
                {tokens.map((tok, tIdx) => {
                  if (!tok.isWord) return <span key={tIdx}>{tok.text}</span>
                  const tokWord = tok.cleaned || tok.text
                  const wordNote = getWordNote(ayah.surahNumber, ayah.numberInSurah, tIdx, tokWord)
                  const wordMistake = getWordMistake(ayah.surahNumber, ayah.numberInSurah, tIdx, tokWord)
                  const isWordMistakeActive = !!(wordMistake && isMistakeMode)
                  const isWordNoteActive = !!(wordNote && isSelectionMode && !isWordMistakeActive)

                  if (tok.isRare && highlightRareWords) {
                    return (
                      <span
                        key={tIdx}
                        data-ayah-number={ayah.numberInSurah}
                        data-surah-number={ayah.surahNumber}
                        data-word-index={tIdx}
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
                        className={`relative inline-block cursor-pointer font-bold rounded px-1 mx-0.5 transition-colors shadow-sm ${
                          isWordMistakeActive
                            ? 'bg-red-500/30 text-red-950 dark:text-red-100 ring-2 ring-red-500 border-b-2 border-red-600'
                            : isWordNoteActive
                            ? 'bg-blue-500/30 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500 border-b-2 border-blue-600'
                            : 'bg-amber-400/25 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 hover:bg-amber-400/40'
                        } ${
                          isAiAskMode
                            ? 'hover:ring-2 hover:ring-purple-400'
                            : isMistakeMode
                            ? 'hover:ring-2 hover:ring-red-400'
                            : isSelectionMode
                            ? 'hover:ring-2 hover:ring-blue-400'
                            : ''
                        }`}
                        title={
                          isMistakeMode
                            ? `تسجيل خطأ على الكلمة: ${tokWord}${wordMistake ? ` (${wordMistake.reason})` : ''}`
                            : isAiAskMode
                            ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة'
                            : isAudioClickMode
                            ? `سماع: ${tok.cleaned}`
                            : isSelectionMode
                            ? `ملاحظة على الكلمة${wordNote ? ` (${wordNote.text})` : ''}`
                            : `نادرة — ${tok.frequency} مرة`
                        }
                      >
                        {tok.text}
                        {isWordMistakeActive ? (
                          <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`خطأ مسجل: ${wordMistake?.reason}`} />
                        ) : isWordNoteActive ? (
                          <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`ملاحظة مسجلة: ${wordNote?.text}`} />
                        ) : wordMistake ? (
                          <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500/80 rounded-full" />
                        ) : wordNote ? (
                          <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-blue-500/80 rounded-full" />
                        ) : null}
                      </span>
                    )
                  }
                  return (
                    <span
                      key={tIdx}
                      data-ayah-number={ayah.numberInSurah}
                      data-surah-number={ayah.surahNumber}
                      data-word-index={tIdx}
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
                      className={`relative inline-block cursor-pointer rounded transition-colors ${
                        isWordMistakeActive
                          ? 'bg-red-500/30 text-red-950 dark:text-red-100 ring-2 ring-red-500 font-bold border-b-2 border-red-600 px-1 mx-0.5 shadow-sm'
                          : isWordNoteActive
                          ? 'bg-blue-500/30 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500 font-bold border-b-2 border-blue-600 px-1 mx-0.5 shadow-sm'
                          : isAiAskMode
                          ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5'
                          : isMistakeMode
                          ? 'hover:bg-red-500/20 hover:ring-1 hover:ring-red-400 px-0.5'
                          : isSelectionMode
                          ? 'hover:bg-blue-500/20 hover:ring-1 hover:ring-blue-400 px-0.5'
                          : 'hover:bg-amber-500/10'
                      }`}
                      title={
                        isMistakeMode
                          ? `تسجيل خطأ على: ${tokWord}${wordMistake ? ` (${wordMistake.reason})` : ''}`
                          : isAiAskMode
                          ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة'
                          : isAudioClickMode
                          ? `سماع: ${tok.cleaned || tok.text}`
                          : isSelectionMode
                          ? `ملاحظة على: ${tokWord}${wordNote ? ` (${wordNote.text})` : ''}`
                          : undefined
                      }
                    >
                      {tok.text}
                      {isWordMistakeActive ? (
                        <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`خطأ مسجل: ${wordMistake?.reason}`} />
                      ) : isWordNoteActive ? (
                        <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`ملاحظة مسجلة: ${wordNote?.text}`} />
                      ) : wordMistake ? (
                        <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500/80 rounded-full" />
                      ) : wordNote ? (
                        <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-blue-500/80 rounded-full" />
                      ) : null}
                    </span>
                  )
                })}

                {/* Ayah End Ornament */}
                <span
                  onClick={() => onAyahClick(ayah.numberInSurah, ayah.surahNumber, ayah.surahName, cleanText)}
                  className={`ayah-number ${themeConfig.ayahMarker} cursor-pointer relative inline-flex items-center justify-center font-mono mx-1 text-xs select-none ${
                    isAiAskMode
                      ? 'ring-2 ring-purple-400/80 bg-purple-500/15 text-purple-800 dark:text-purple-200 hover:bg-purple-500/30'
                      : isAudioClickMode
                      ? 'ring-2 ring-emerald-400/60'
                      : isMistakeMode
                      ? 'ring-2 ring-red-400/80 bg-red-500/15 text-red-800 dark:text-red-200 hover:bg-red-500/30'
                      : isSelectionMode
                      ? 'ring-2 ring-blue-400/60 hover:bg-blue-500/20'
                      : 'hover:ring-2 hover:ring-amber-400/60'
                  } ${
                    ayahMistakes.length > 0 && isMistakeMode
                      ? '!bg-red-600 !text-white !ring-2 !ring-red-400'
                      : ayahNotes.length > 0 && isSelectionMode
                      ? '!bg-blue-600 !text-white !ring-2 !ring-blue-400'
                      : isSelected
                      ? '!bg-blue-500 !text-white'
                      : ''
                  }`}
                  title={`الآية ${ayah.numberInSurah} — انقر للخيارات`}
                >
                  {toArabicDigits(ayah.numberInSurah)}
                  {ayahMistakes.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-1 ring-white" title={`${ayahMistakes.length} أخطاء مسجلة`} />
                  )}
                  {ayahNotes.length > 0 && ayahMistakes.length === 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-1 ring-white" title={`${ayahNotes.length} ملاحظات`} />
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
    selectedTafsir,
    setSelectedTafsir,
    highlightRareWords,
    rareWordThreshold,
    isSelectionMode,
    isAudioClickMode,
    isAiAskMode,
    isMistakeMode,
    setIsMistakeMode: _setIsMistakeMode,
    showMistakesSidebar,
    setShowMistakesSidebar,
    mistakes,
    addMistake,
    removeMistake,
    updateMistake,
    toggleMistakeCorrected,
    getAyahMistakes,
    getWordMistake,
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
    playPage,
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
    surahName?: string
    ayahText?: string
    selectedTokenIndices?: number[]
  } | null>(null)
  const [mistakeTarget, setMistakeTarget] = useState<{
    ayahNumber: number
    wordIndex?: number
    wordText?: string
    surahNumber?: number
    surahName?: string
    ayahText?: string
    existingMistake?: QuranMistake
    selectedTokenIndices?: number[]
  } | null>(null)
  const [selectedAyahs, setSelectedAyahs] = useState<Set<number>>(new Set())

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

  // Floating text selection state
  const [selectedTextPart, setSelectedTextPart] = useState<{
    text: string
    wordIndex?: number
    ayahNumber?: number
    surahNumber?: number
    surahName?: string
    ayahText?: string
    selectedTokenIndices?: number[]
    rect?: { top: number; left: number }
  } | null>(null)

  const handleMouseUp = () => {
    setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) return
      const text = sel.toString().trim()
      if (!text || text.length === 0) return

      let sNum = currentSurahNumber
      let aNum: number | undefined = undefined
      let startWordIdx: number | undefined = undefined
      let endWordIdx: number | undefined = undefined
      let rangeRect: { top: number; left: number } | undefined = undefined

      // 1. Try to find ayah & exact word indices from Selection Range
      try {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        rangeRect = { top: rect.top, left: rect.left + rect.width / 2 }

        const startEl = range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer?.parentElement
        const endEl = range.endContainer instanceof HTMLElement ? range.endContainer : range.endContainer?.parentElement

        const startSpan = startEl?.closest('[data-word-index]')
        const endSpan = endEl?.closest('[data-word-index]')

        if (startSpan) {
          const parsed = parseInt(startSpan.getAttribute('data-word-index') || '', 10)
          if (!isNaN(parsed)) startWordIdx = parsed
          const dA = startSpan.getAttribute('data-ayah-number')
          const dS = startSpan.getAttribute('data-surah-number')
          if (dA && !aNum) aNum = parseInt(dA, 10)
          if (dS && !sNum) sNum = parseInt(dS, 10)
        }

        if (endSpan) {
          const parsed = parseInt(endSpan.getAttribute('data-word-index') || '', 10)
          if (!isNaN(parsed)) endWordIdx = parsed
          const dA = endSpan.getAttribute('data-ayah-number')
          const dS = endSpan.getAttribute('data-surah-number')
          if (dA && !aNum) aNum = parseInt(dA, 10)
          if (dS && !sNum) sNum = parseInt(dS, 10)
        }

        const candidateNodes = [
          range.startContainer,
          range.endContainer,
          sel.anchorNode,
          sel.focusNode,
          range.commonAncestorContainer,
        ]

        for (const node of candidateNodes) {
          if (!node) continue
          const el = node instanceof HTMLElement ? node : node.parentElement
          if (!el) continue

          const ayahEl = el.closest('[id^="ayah-"]') || el.closest('[data-ayah-number]')
          if (ayahEl) {
            const dataA = ayahEl.getAttribute('data-ayah-number')
            const dataS = ayahEl.getAttribute('data-surah-number')
            if (dataA && !aNum) aNum = parseInt(dataA, 10)
            if (dataS && !sNum) sNum = parseInt(dataS, 10)

            if (!aNum && ayahEl.id) {
              const parts = ayahEl.id.replace('ayah-', '').split('-').map(Number)
              if (parts.length === 2) {
                sNum = parts[0]
                aNum = parts[1]
              } else if (parts.length === 1) {
                aNum = parts[0]
              }
            }
            if (aNum) break
          }
        }
      } catch {}

      // 2. Fallback: Search all ayahs on current page, window pages, or current surah for this text!
      const candidatePageAyahs =
        singlePageData?.ayahs ||
        (windowPages.length > 0 ? windowPages.flatMap((p) => p.ayahs) : undefined)

      if (!aNum) {
        const cleanSearch = stripAllTashkeel(text)
        if (candidatePageAyahs) {
          const found = candidatePageAyahs.find((a) => {
            const cleanAyah = stripAllTashkeel(a.text)
            return cleanAyah.includes(cleanSearch)
          })
          if (found) {
            sNum = found.surahNumber
            aNum = found.numberInSurah
          }
        }
        if (!aNum && currentSurahData?.ayahs) {
          const found = currentSurahData.ayahs.find((a) => {
            const cleanAyah = stripAllTashkeel(a.text)
            return cleanAyah.includes(cleanSearch)
          })
          if (found) {
            sNum = currentSurahNumber
            aNum = found.numberInSurah
          }
        }
      }

      if (!aNum) aNum = 1

      // 3. Find accurate surahName and full ayah text
      let surahName = currentSurahData?.name || `سورة ${sNum}`
      let fullAyahText = text

      if (candidatePageAyahs) {
        const matched = candidatePageAyahs.find(
          (a) => a.surahNumber === sNum && a.numberInSurah === aNum
        )
        if (matched) {
          fullAyahText = cleanAyahText(matched.surahNumber, matched.numberInSurah, matched.text)
          surahName =
            matched.surahName ||
            singlePageData?.surahs.find((s) => s.number === sNum)?.name ||
            windowPages.flatMap((p) => p.surahs).find((s) => s.number === sNum)?.name ||
            surahName
        }
      } else if (currentSurahData && currentSurahNumber === sNum) {
        const matched = currentSurahData.ayahs.find((a) => a.numberInSurah === aNum)
        if (matched) {
          fullAyahText = cleanAyahText(sNum, matched.numberInSurah, matched.text)
          surahName = currentSurahData.name
        }
      }

      // Compute selected token indices in this ayah strictly
      let selectedTokenIndices: number[] | undefined = undefined
      let exactWordIndex: number | undefined = undefined

      if (startWordIdx !== undefined && endWordIdx !== undefined) {
        const minIdx = Math.min(startWordIdx, endWordIdx)
        const maxIdx = Math.max(startWordIdx, endWordIdx)
        selectedTokenIndices = []
        for (let i = minIdx; i <= maxIdx; i++) {
          selectedTokenIndices.push(i)
        }
        if (minIdx === maxIdx) {
          exactWordIndex = minIdx
        }
      } else if (startWordIdx !== undefined) {
        selectedTokenIndices = [startWordIdx]
        exactWordIndex = startWordIdx
      } else if (endWordIdx !== undefined) {
        selectedTokenIndices = [endWordIdx]
        exactWordIndex = endWordIdx
      } else if (fullAyahText) {
        // Fallback only if no data-word-index was captured in DOM
        const tokens = tokenizeAyah(fullAyahText, rareWordThreshold)
        const cleanSel = stripAllTashkeel(text)
        const cleanWords = cleanSel.split(/\s+/).filter(Boolean)

        if (cleanWords.length === 1) {
          const matchIdx = tokens.findIndex((tok) => {
            if (!tok.isWord) return false
            const cleanTok = stripAllTashkeel(tok.cleaned || tok.text)
            return (
              cleanTok === cleanWords[0] ||
              cleanTok.includes(cleanWords[0]) ||
              cleanWords[0].includes(cleanTok)
            )
          })
          if (matchIdx !== -1) {
            selectedTokenIndices = [matchIdx]
            exactWordIndex = matchIdx
          }
        } else {
          let bestStart = -1
          let bestLen = 0
          for (let i = 0; i < tokens.length; i++) {
            if (!tokens[i].isWord) continue
            let matchCount = 0
            for (let j = 0; j < cleanWords.length && i + j < tokens.length; j++) {
              const cTok = stripAllTashkeel(tokens[i + j].cleaned || tokens[i + j].text)
              if (
                cTok === cleanWords[j] ||
                cTok.includes(cleanWords[j]) ||
                cleanWords[j].includes(cTok)
              ) {
                matchCount++
              } else {
                break
              }
            }
            if (matchCount > bestLen) {
              bestLen = matchCount
              bestStart = i
            }
          }
          if (bestStart !== -1 && bestLen > 0) {
            selectedTokenIndices = []
            for (let k = bestStart; k < bestStart + bestLen; k++) {
              selectedTokenIndices.push(k)
            }
          }
        }
      }

      setSelectedTextPart({
        text,
        wordIndex: exactWordIndex,
        ayahNumber: aNum,
        surahNumber: sNum,
        surahName,
        ayahText: fullAyahText,
        selectedTokenIndices,
        rect: rangeRect,
      })
    }, 30)
  }

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

  const scrollToTargetAyah = (surahNum: number, ayahNum: number) => {
    if (readingMode === 'verse' || readingMode === 'mushaf') {
      if (surahNum !== currentSurahNumber) {
        loadSurah(surahNum)
      }
      setTimeout(() => {
        const el = document.getElementById(`ayah-${ayahNum}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
    } else {
      const el =
        document.getElementById(`ayah-${surahNum}-${ayahNum}`) ||
        document.getElementById(`ayah-${ayahNum}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
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

    const activeSelection = window.getSelection()?.toString().trim()
    const targetText = activeSelection && activeSelection.length > 1 ? activeSelection : word
    const targetWordIndex = activeSelection && activeSelection.length > 1 ? undefined : wordIdx
    const ayahText =
      fullAyahText ||
      currentSurahData?.ayahs.find((a) => a.numberInSurah === ayahNum)?.text ||
      targetText

    if (isAiAskMode) {
      setAiModalTarget({
        ayahNumber: ayahNum,
        ayahText,
        wordText: targetText,
        surahNumber: sNum,
        surahName: sName,
      })
      return
    }

    if (isAudioClickMode) {
      if (activeSelection && activeSelection.length > 1) {
        playAyah(ayahNum, sNum)
      } else {
        speakWord(word, sNum, ayahNum, wordPosition)
      }
      return
    }

    const targetSelectedIndices = targetWordIndex !== undefined ? [targetWordIndex] : undefined

    if (isMistakeMode) {
      setMistakeTarget({
        ayahNumber: ayahNum,
        wordIndex: targetWordIndex,
        wordText: targetText,
        surahNumber: sNum,
        surahName: sName,
        ayahText,
        selectedTokenIndices: targetSelectedIndices,
      })
      return
    }

    if (isSelectionMode) {
      setNoteTarget({
        ayahNumber: ayahNum,
        wordIndex: targetWordIndex,
        wordText: targetText,
        surahNumber: sNum,
        surahName: sName,
        ayahText,
        selectedTokenIndices: targetSelectedIndices,
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
      playAyah(ayahNum, sNum)
      return
    }

    if (isMistakeMode) {
      setMistakeTarget({
        ayahNumber: ayahNum,
        surahNumber: sNum,
        surahName: sName,
        ayahText: aText,
      })
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
  const currentSurahMistakes = mistakes.filter((m) => m.surahNumber === currentSurahNumber)

  const [mistakeListFilter, setMistakeListFilter] = useState<'surah' | 'all'>('surah')
  const [noteListFilter, setNoteListFilter] = useState<'surah' | 'all'>('surah')

  const displayedMistakes = mistakeListFilter === 'surah' ? currentSurahMistakes : mistakes
  const displayedNotes = noteListFilter === 'surah' ? currentSurahNotes : notes

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
    <div className="pb-28 space-y-5" onMouseUp={handleMouseUp}>
      {/* ── Active mode hint bar ── */}
      {(isSelectionMode || isAudioClickMode || isAiAskMode || isMistakeMode) && (
        <div
          className={`text-center text-xs py-2 px-4 rounded-xl border ${
            isMistakeMode
              ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300 font-semibold'
              : isAiAskMode
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold'
              : isSelectionMode
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
          }`}
        >
          {isMistakeMode
            ? '⚠️ وضع تسجيل الأخطاء — تظهر مواضع الأخطاء باللون الأحمر • انقر على أي كلمة أو جملة أو رقم آية لتسجيل خطأ وحفظ سببه'
            : isAiAskMode
            ? '🤖 وضع سؤال الذكاء الاصطناعي — انقر على أي كلمة أو رقم آية لسؤال Gemini عن الرسم أو الإعراب أو التفسير'
            : isSelectionMode
            ? '🟦 وضع الملاحظات — تظهر الملاحظات باللون الأزرق • انقر كلمة لملاحظتها • انقر رقم الآية لخيارات'
            : '🎧 وضع الاستماع — انقر رقم الآية لخيارات • انقر كلمة لسماع نطقها'}
        </div>
      )}

      {!isSelectionMode && !isAudioClickMode && !isAiAskMode && !isMistakeMode && (
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

                  <button
                    onClick={() => playPage(currentPageNumber)}
                    className="mr-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
                    title="استمع للصفحة الحالية كاملة"
                  >
                    <Headphones className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>استمع للصفحة</span>
                  </button>
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
                  isMistakeMode={isMistakeMode}
                  selectedAyahs={selectedAyahs}
                  getAyahNotes={getAyahNotes}
                  getWordNote={getWordNote}
                  getAyahMistakes={getAyahMistakes}
                  getWordMistake={getWordMistake}
                  onWordClick={handleWordClick}
                  onAyahClick={handleAyahNumberClick}
                  onPlayPage={playPage}
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
                        isMistakeMode={isMistakeMode}
                        selectedAyahs={selectedAyahs}
                        getAyahNotes={getAyahNotes}
                        getWordNote={getWordNote}
                        getAyahMistakes={getAyahMistakes}
                        getWordMistake={getWordMistake}
                        onWordClick={handleWordClick}
                        onAyahClick={handleAyahNumberClick}
                        onPlayPage={playPage}
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
                  const tokens = tokenizeAyah(cleanText, rareWordThreshold)
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
                          {/* Record Mistake Button */}
                          <button
                            onClick={() => {
                              setMistakeTarget({
                                ayahNumber: ayah.numberInSurah,
                                surahNumber: currentSurahNumber,
                                surahName: currentSurahData.name,
                                ayahText: cleanText,
                              })
                            }}
                            className={`p-2 rounded-xl border transition-all ${
                              getAyahMistakes(currentSurahNumber, ayah.numberInSurah).length > 0
                                ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/50'
                                : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                            }`}
                            title="تسجيل خطأ في الحفظ أو التلاوة في هذه الآية"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          </button>
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
                            onClick={() => (isPlayingThis ? pauseAudio() : playAyah(ayah.numberInSurah, currentSurahNumber))}
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
                                surahName: currentSurahData.name,
                                ayahText: cleanText,
                              })
                            }
                            className={`p-2 rounded-xl border transition-all ${
                              ayahNotes.length > 0
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/50'
                                : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                            }`}
                            title="ملاحظة"
                          >
                            <StickyNote className="w-4 h-4 text-blue-500" />
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
                        {tokens.map((tok, idx) => {
                          if (!tok.isWord) return <span key={idx}>{tok.text}</span>
                          const tokWord = tok.cleaned || tok.text
                          const wordNote = getWordNote(currentSurahNumber, ayah.numberInSurah, idx, tokWord)
                          const wordMistake = getWordMistake(currentSurahNumber, ayah.numberInSurah, idx, tokWord)
                          const isWordMistakeActive = !!(wordMistake && isMistakeMode)
                          const isWordNoteActive = !!(wordNote && isSelectionMode && !isWordMistakeActive)

                          if (tok.isRare && highlightRareWords) {
                            return (
                              <span
                                key={idx}
                                data-ayah-number={ayah.numberInSurah}
                                data-surah-number={currentSurahNumber}
                                data-word-index={idx}
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
                                className={`relative inline-block cursor-pointer font-bold rounded px-1 mx-0.5 transition-colors shadow-sm ${
                                  isWordMistakeActive
                                    ? 'bg-red-500/30 text-red-950 dark:text-red-100 ring-2 ring-red-500 border-b-2 border-red-600'
                                    : isWordNoteActive
                                    ? 'bg-blue-500/30 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500 border-b-2 border-blue-600'
                                    : 'bg-amber-400/25 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 hover:bg-amber-400/40'
                                } ${
                                  isAiAskMode
                                    ? 'hover:ring-2 hover:ring-purple-400'
                                    : isMistakeMode
                                    ? 'hover:ring-2 hover:ring-red-400'
                                    : isSelectionMode
                                    ? 'hover:ring-2 hover:ring-blue-400'
                                    : ''
                                }`}
                                title={
                                  isMistakeMode
                                    ? `تسجيل خطأ على: ${tokWord}${wordMistake ? ` (${wordMistake.reason})` : ''}`
                                    : isAiAskMode
                                    ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة'
                                    : isAudioClickMode
                                    ? `سماع: ${tok.cleaned}`
                                    : isSelectionMode
                                    ? `ملاحظة على: ${tokWord}${wordNote ? ` (${wordNote.text})` : ''}`
                                    : `نادرة — ${tok.frequency} مرة`
                                }
                              >
                                {tok.text}
                                {isWordMistakeActive ? (
                                  <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`خطأ مسجل: ${wordMistake?.reason}`} />
                                ) : isWordNoteActive ? (
                                  <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`ملاحظة مسجلة: ${wordNote?.text}`} />
                                ) : wordMistake ? (
                                  <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500/80 rounded-full" />
                                ) : wordNote ? (
                                  <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-blue-500/80 rounded-full" />
                                ) : null}
                              </span>
                            )
                          }
                          return (
                            <span
                              key={idx}
                              data-ayah-number={ayah.numberInSurah}
                              data-surah-number={currentSurahNumber}
                              data-word-index={idx}
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
                              className={`relative inline-block cursor-pointer rounded transition-colors ${
                                isWordMistakeActive
                                  ? 'bg-red-500/30 text-red-950 dark:text-red-100 ring-2 ring-red-500 font-bold border-b-2 border-red-600 px-1 mx-0.5 shadow-sm'
                                  : isWordNoteActive
                                  ? 'bg-blue-500/30 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500 font-bold border-b-2 border-blue-600 px-1 mx-0.5 shadow-sm'
                                  : isAiAskMode
                                  ? 'hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-400 px-0.5'
                                  : isMistakeMode
                                  ? 'hover:bg-red-500/20 hover:ring-1 hover:ring-red-400 px-0.5'
                                  : isSelectionMode
                                  ? 'hover:bg-blue-500/20 hover:ring-1 hover:ring-blue-400 px-0.5'
                                  : 'hover:bg-amber-500/10'
                              }`}
                              title={
                                isMistakeMode
                                  ? `تسجيل خطأ على: ${tokWord}${wordMistake ? ` (${wordMistake.reason})` : ''}`
                                  : isAiAskMode
                                  ? 'اسأل الذكاء الاصطناعي عن هذه الكلمة'
                                  : isAudioClickMode
                                  ? `سماع: ${tok.cleaned || tok.text}`
                                  : isSelectionMode
                                  ? `ملاحظة على: ${tokWord}${wordNote ? ` (${wordNote.text})` : ''}`
                                  : undefined
                              }
                            >
                              {tok.text}
                              {isWordMistakeActive ? (
                                <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`خطأ مسجل: ${wordMistake?.reason}`} />
                              ) : isWordNoteActive ? (
                                <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-stone-900" title={`ملاحظة مسجلة: ${wordNote?.text}`} />
                              ) : wordMistake ? (
                                <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500/80 rounded-full" />
                              ) : wordNote ? (
                                <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-blue-500/80 rounded-full" />
                              ) : null}
                            </span>
                          )
                        })}
                        {/* End of Ayah marker */}
                        <span
                          onClick={() => handleAyahNumberClick(ayah.numberInSurah, currentSurahNumber, currentSurahData.name, cleanText)}
                          className={`ayah-number ${themeConfig.ayahMarker} cursor-pointer relative inline-flex items-center justify-center font-mono mx-1 text-xs select-none ${
                            getAyahMistakes(currentSurahNumber, ayah.numberInSurah).length > 0 && isMistakeMode
                              ? '!bg-red-600 !text-white !ring-2 !ring-red-400'
                              : ayahNotes.length > 0 && isSelectionMode
                              ? '!bg-blue-600 !text-white !ring-2 !ring-blue-400'
                              : isSelectedAyah
                              ? '!bg-blue-500 !text-white'
                              : ''
                          }`}
                          title={`الآية ${ayah.numberInSurah} — انقر للخيارات`}
                        >
                          {toArabicDigits(ayah.numberInSurah)}
                          {getAyahMistakes(currentSurahNumber, ayah.numberInSurah).length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-1 ring-white" title={`${getAyahMistakes(currentSurahNumber, ayah.numberInSurah).length} أخطاء مسجلة`} />
                          )}
                          {ayahNotes.length > 0 && getAyahMistakes(currentSurahNumber, ayah.numberInSurah).length === 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-1 ring-white" title={`${ayahNotes.length} ملاحظات`} />
                          )}
                        </span>
                      </div>

                      {/* Ayah mistakes list */}
                      {getAyahMistakes(currentSurahNumber, ayah.numberInSurah).length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {getAyahMistakes(currentSurahNumber, ayah.numberInSurah).map((m) => (
                            <div
                              key={m.id}
                              className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${
                                m.corrected
                                  ? 'bg-emerald-500/10 border-emerald-500/20'
                                  : 'bg-red-500/10 border-red-500/20'
                              }`}
                              dir="rtl"
                            >
                              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${m.corrected ? 'text-emerald-500' : 'text-red-500'}`} />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {m.selectedText && (
                                    <span className="inline-block text-[11px] font-quran-amiri font-bold text-red-800 dark:text-red-200 bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 rounded-md">
                                      « {m.selectedText} »
                                    </span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-500/15 font-semibold">
                                    {m.category === 'memory' ? '🧠 نسيان' : m.category === 'mutashabih' ? '🔄 متشابهات' : m.category === 'harakah' ? '✍️ تشكيل' : m.category === 'letter' ? '🔤 حرف' : m.category === 'word' ? '📖 كلمة' : m.category === 'tajweed' ? '🎙️ تجويد' : '⚡ أخرى'}
                                  </span>
                                  <button
                                    onClick={() => toggleMistakeCorrected(m.id)}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                                      m.corrected
                                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                    }`}
                                  >
                                    {m.corrected ? 'تم التصحيح ✓' : 'يحتاج مراجعة ⚠️'}
                                  </button>
                                </div>
                                <p className="leading-relaxed text-stone-800 dark:text-stone-200">{m.reason}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setMistakeTarget({
                                      ayahNumber: ayah.numberInSurah,
                                      wordIndex: m.wordIndex,
                                      wordText: m.selectedText,
                                      surahNumber: currentSurahNumber,
                                      surahName: currentSurahData.name,
                                      ayahText: cleanText,
                                      existingMistake: m,
                                    })
                                  }}
                                  className="text-stone-400 hover:text-stone-600 p-1"
                                  title="تعديل الخطأ"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => removeMistake(m.id)}
                                  className="text-red-400 hover:text-red-600 p-1"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ayah notes list */}
                      {ayahNotes.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {ayahNotes.map((n) => (
                            <div
                              key={n.id}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs"
                              dir="rtl"
                            >
                              <StickyNote className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <div className="flex-1 space-y-1">
                                {n.selectedText && (
                                  <span className="inline-block text-[11px] font-quran-amiri font-bold text-blue-800 dark:text-blue-200 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded-md">
                                    « {n.selectedText} »
                                  </span>
                                )}
                                <p className="leading-relaxed text-blue-800 dark:text-blue-300">{n.text}</p>
                              </div>
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
                      {showTafseer && (
                        <div
                          className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 text-xs sm:text-sm text-right leading-relaxed font-ui space-y-2"
                          dir="rtl"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-amber-500/15">
                            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                              <span>{TAFSIR_OPTIONS.find((t) => t.id === selectedTafsir)?.name || 'التفسير'}</span>
                              <span className="text-[11px] opacity-70 font-normal">
                                ({TAFSIR_OPTIONS.find((t) => t.id === selectedTafsir)?.author})
                              </span>
                            </div>

                            {/* Kurdish & Arabic Tafsir Quick Switcher Pills */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {TAFSIR_OPTIONS.map((opt) => {
                                const isCurrent = opt.id === selectedTafsir
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedTafsir(opt.id)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                                      isCurrent
                                        ? 'bg-amber-600 text-white shadow-sm font-bold'
                                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                                    }`}
                                    title={opt.author}
                                  >
                                    {opt.name}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {ayah.tafseer ? (
                            <p className="opacity-95 text-stone-800 dark:text-stone-200 leading-relaxed font-ui whitespace-pre-line text-xs sm:text-sm">
                              {ayah.tafseer}
                            </p>
                          ) : (
                            <p className="text-stone-400 italic text-xs">جاري تحميل التفسير أو غير متوفر لهذه الآية...</p>
                          )}
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
          <div className="w-64 sm:w-80 shrink-0 sticky top-4">
            <div className={`p-4 rounded-2xl ${themeConfig.bgCard} border ${themeConfig.border} space-y-3 shadow-lg`} dir="rtl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-blue-500" />
                  ملاحظاتي والتدبر
                </h3>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold font-mono">
                    {displayedNotes.length}
                  </span>
                  <button
                    onClick={() => setShowNotesSidebar(false)}
                    className="p-1 rounded-lg hover:bg-current/10 opacity-60 hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs: Surah vs All */}
              <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setNoteListFilter('surah')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    noteListFilter === 'surah'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:bg-current/5'
                  }`}
                >
                  <span>السورة</span>
                  <span className="text-[10px] opacity-80">({currentSurahNotes.length})</span>
                </button>
                <button
                  onClick={() => setNoteListFilter('all')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    noteListFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:bg-current/5'
                  }`}
                >
                  <span>الكل</span>
                  <span className="text-[10px] opacity-80">({notes.length})</span>
                </button>
              </div>

              {displayedNotes.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs opacity-60">
                    {noteListFilter === 'surah'
                      ? 'لا توجد ملاحظات لهذه السورة'
                      : 'لا توجد أي ملاحظات مسجلة بعد'}
                  </p>
                  {noteListFilter === 'surah' && notes.length > 0 && (
                    <button
                      onClick={() => setNoteListFilter('all')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 underline font-semibold hover:opacity-80"
                    >
                      لديك {notes.length} ملاحظات في سور أخرى (اضغط للعرض)
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {displayedNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold opacity-80">
                        <div
                          onClick={() => scrollToTargetAyah(n.surahNumber, n.ayahNumber)}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                          title="الانتقال إلى موضع الآية"
                        >
                          {noteListFilter === 'all' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold">
                              {n.surahName || `سورة ${n.surahNumber}`}
                            </span>
                          )}
                          <span>الآية {toArabicDigits(n.ayahNumber)}</span>
                        </div>
                        <button
                          onClick={() => removeNote(n.id)}
                          className="text-red-400 hover:text-red-600 p-0.5"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {n.selectedText && (
                        <div
                          onClick={() => scrollToTargetAyah(n.surahNumber, n.ayahNumber)}
                          className="text-[11px] font-quran-amiri font-bold text-blue-800 dark:text-blue-200 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-blue-500/25"
                          title="الانتقال إلى موضع الملاحظة"
                        >
                          « {n.selectedText} »
                        </div>
                      )}
                      <p className="leading-relaxed text-blue-900 dark:text-blue-200">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Mistakes sidebar panel ── */}
        {showMistakesSidebar && (
          <div className="w-64 sm:w-80 shrink-0 sticky top-4">
            <div className={`p-4 rounded-2xl ${themeConfig.bgCard} border border-red-500/30 space-y-3 shadow-lg`} dir="rtl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  سجل أخطاء التلاوة
                </h3>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 font-bold font-mono">
                    {displayedMistakes.length}
                  </span>
                  <button
                    onClick={() => setShowMistakesSidebar(false)}
                    className="p-1 rounded-lg hover:bg-current/10 opacity-60 hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs: Current Surah vs All */}
              <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setMistakeListFilter('surah')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    mistakeListFilter === 'surah'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:bg-current/5'
                  }`}
                >
                  <span>السورة الحالية</span>
                  <span className="text-[10px] opacity-80">({currentSurahMistakes.length})</span>
                </button>
                <button
                  onClick={() => setMistakeListFilter('all')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    mistakeListFilter === 'all'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:bg-current/5'
                  }`}
                >
                  <span>الكل</span>
                  <span className="text-[10px] opacity-80">({mistakes.length})</span>
                </button>
              </div>

              {displayedMistakes.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {mistakeListFilter === 'surah'
                      ? 'لا توجد أخطاء مسجلة لهذه السورة 🎉'
                      : 'لا توجد أي أخطاء مسجلة بعد 🎉'}
                  </p>
                  <p className="text-[11px] opacity-60">حفظك وتلاوتك متقنة ما شاء الله!</p>
                  {mistakeListFilter === 'surah' && mistakes.length > 0 && (
                    <button
                      onClick={() => setMistakeListFilter('all')}
                      className="text-[11px] text-amber-600 dark:text-amber-400 underline font-semibold hover:opacity-80 block mx-auto pt-1"
                    >
                      لديك {mistakes.length} أخطاء في سور أخرى (اضغط للعرض)
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {displayedMistakes.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        m.corrected
                          ? 'bg-emerald-500/10 border-emerald-500/25'
                          : 'bg-red-500/10 border-red-500/25'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <div
                          onClick={() => scrollToTargetAyah(m.surahNumber, m.ayahNumber)}
                          className="flex items-center gap-1.5 flex-wrap cursor-pointer hover:opacity-80"
                          title="الانتقال إلى موضع الآية"
                        >
                          {mistakeListFilter === 'all' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                              {m.surahName || `سورة ${m.surahNumber}`}
                            </span>
                          )}
                          <span className="text-[11px] opacity-75">الآية {toArabicDigits(m.ayahNumber)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleMistakeCorrected(m.id)}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                              m.corrected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-500/20 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {m.corrected ? 'متقن ✓' : 'مراجعة ⚠️'}
                          </button>
                          <button
                            onClick={() => removeMistake(m.id)}
                            className="text-red-400 hover:text-red-600 p-0.5"
                            title="حذف الخطأ"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {m.selectedText && (
                        <div
                          onClick={() => scrollToTargetAyah(m.surahNumber, m.ayahNumber)}
                          className="text-[11px] font-quran-amiri font-bold text-red-900 dark:text-red-200 bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-red-500/25"
                          title="الانتقال إلى موضع الخطأ"
                        >
                          « {m.selectedText} »
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-500/15 font-semibold opacity-75">
                          {m.category === 'memory'
                            ? '🧠 نسيان'
                            : m.category === 'mutashabih'
                            ? '🔄 متشابهات'
                            : m.category === 'harakah'
                            ? '✍️ تشكيل'
                            : m.category === 'letter'
                            ? '🔤 حرف'
                            : m.category === 'word'
                            ? '📖 كلمة'
                            : m.category === 'tajweed'
                            ? '🎙️ تجويد'
                            : '⚡ أخرى'}
                        </span>
                        <p className="leading-relaxed text-stone-800 dark:text-stone-200 text-[11px] flex-1">{m.reason}</p>
                      </div>
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
          isMistakeMode={isMistakeMode}
          hasNote={getAyahNotes(ayahPopup.surahNum, ayahPopup.ayahNum).length > 0}
          hasMistake={getAyahMistakes(ayahPopup.surahNum, ayahPopup.ayahNum).length > 0}
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
              surahName: ayahPopup.surahName,
              ayahText: ayahPopup.ayahText,
            })
          }
          onMistake={() =>
            setMistakeTarget({
              ayahNumber: ayahPopup.ayahNum,
              surahNumber: ayahPopup.surahNum,
              surahName: ayahPopup.surahName,
              ayahText: ayahPopup.ayahText,
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
        const targetSurahName =
          noteTarget.surahName ||
          (targetSurah === currentSurahNumber ? currentSurahData?.name : `سورة ${targetSurah}`) ||
          'سورة'
        const existing =
          noteTarget.wordIndex !== undefined
            ? getWordNote(targetSurah, noteTarget.ayahNumber, noteTarget.wordIndex, noteTarget.wordText)
            : noteTarget.wordText
            ? getWordNote(targetSurah, noteTarget.ayahNumber, undefined, noteTarget.wordText)
            : getAyahNotes(targetSurah, noteTarget.ayahNumber)[0]

        return (
          <NoteDialog
            surahNumber={targetSurah}
            surahName={targetSurahName}
            ayahNumber={noteTarget.ayahNumber}
            ayahText={noteTarget.ayahText || ''}
            wordIndex={noteTarget.wordIndex}
            wordText={noteTarget.wordText}
            existingNote={existing?.text}
            themeConfig={themeConfig}
            onSave={(text) => {
              if (existing) removeNote(existing.id)
              addNote(
                targetSurah,
                noteTarget.ayahNumber,
                text,
                noteTarget.wordIndex,
                noteTarget.wordText,
                targetSurahName,
                noteTarget.ayahText,
                noteTarget.selectedTokenIndices
              )
            }}
            onDelete={existing ? () => removeNote(existing.id) : undefined}
            onClose={() => setNoteTarget(null)}
          />
        )
      })()}

      {/* ── MISTAKE DIALOG ── */}
      {mistakeTarget && (() => {
        const targetSurah = mistakeTarget.surahNumber || currentSurahNumber
        const targetSurahName =
          mistakeTarget.surahName ||
          (targetSurah === currentSurahNumber ? currentSurahData?.name : `سورة ${targetSurah}`) ||
          'سورة'
        const existing =
          mistakeTarget.existingMistake ||
          (mistakeTarget.wordIndex !== undefined
            ? getWordMistake(targetSurah, mistakeTarget.ayahNumber, mistakeTarget.wordIndex, mistakeTarget.wordText)
            : mistakeTarget.wordText
            ? getWordMistake(targetSurah, mistakeTarget.ayahNumber, undefined, mistakeTarget.wordText)
            : getAyahMistakes(targetSurah, mistakeTarget.ayahNumber)[0])

        return (
          <MistakeDialog
            surahNumber={targetSurah}
            surahName={targetSurahName}
            ayahNumber={mistakeTarget.ayahNumber}
            ayahText={mistakeTarget.ayahText || ''}
            wordText={mistakeTarget.wordText}
            existingMistake={existing}
            themeConfig={themeConfig}
            onSave={(reason, category) => {
              if (existing) {
                updateMistake(existing.id, reason, category, {
                  selectedText: mistakeTarget.wordText,
                  wordIndex: mistakeTarget.wordIndex,
                  selectedTokenIndices: mistakeTarget.selectedTokenIndices,
                })
              } else {
                addMistake(targetSurah, mistakeTarget.ayahNumber, reason, {
                  surahName: targetSurahName,
                  ayahText: mistakeTarget.ayahText,
                  wordIndex: mistakeTarget.wordIndex,
                  selectedText: mistakeTarget.wordText,
                  category,
                  selectedTokenIndices: mistakeTarget.selectedTokenIndices,
                })
              }
            }}
            onDelete={existing ? () => removeMistake(existing.id) : undefined}
            onToggleCorrected={existing ? () => toggleMistakeCorrected(existing.id) : undefined}
            onClose={() => setMistakeTarget(null)}
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
            addNote(
              aiModalTarget.surahNumber || currentSurahNumber,
              aiModalTarget.ayahNumber,
              text,
              undefined,
              aiModalTarget.wordText,
              aiModalTarget.surahName,
              aiModalTarget.ayahText
            )
          }}
        />
      )}

      {/* ── FLOATING SELECTION TOOLBAR ── */}
      {selectedTextPart && (
        <div
          style={
            selectedTextPart.rect
              ? {
                  position: 'fixed',
                  top: `${Math.max(16, selectedTextPart.rect.top - 52)}px`,
                  left: `${selectedTextPart.rect.left}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 60,
                }
              : {
                  position: 'fixed',
                  bottom: '80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 60,
                }
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl ${themeConfig.bgCard} border-2 border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-bold animate-in fade-in zoom-in-95 duration-150`}
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 text-[11px] font-quran-amiri text-amber-800 dark:text-amber-200 border-l border-current/15 pl-2 max-w-[120px] truncate">
            « {selectedTextPart.text} »
          </div>

          {/* Record Mistake on selection (Red button) */}
          <button
            onClick={() => {
              setMistakeTarget({
                ayahNumber: selectedTextPart.ayahNumber || 1,
                wordIndex: selectedTextPart.wordIndex,
                wordText: selectedTextPart.text,
                surahNumber: selectedTextPart.surahNumber || currentSurahNumber,
                surahName:
                  selectedTextPart.surahName ||
                  currentSurahData?.name ||
                  `سورة ${selectedTextPart.surahNumber || currentSurahNumber}`,
                ayahText:
                  selectedTextPart.ayahText ||
                  currentSurahData?.ayahs.find(
                    (a) => a.numberInSurah === (selectedTextPart.ayahNumber || 1)
                  )?.text ||
                  selectedTextPart.text,
                selectedTokenIndices: selectedTextPart.selectedTokenIndices,
              })
              setSelectedTextPart(null)
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 transition-colors"
            title="تسجيل خطأ على الجزء المختار"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>تسجيل خطأ</span>
          </button>

          {/* Note on selection (Blue button) */}
          <button
            onClick={() => {
              setNoteTarget({
                ayahNumber: selectedTextPart.ayahNumber || 1,
                wordIndex: selectedTextPart.wordIndex,
                wordText: selectedTextPart.text,
                surahNumber: selectedTextPart.surahNumber || currentSurahNumber,
                surahName:
                  selectedTextPart.surahName ||
                  currentSurahData?.name ||
                  `سورة ${selectedTextPart.surahNumber || currentSurahNumber}`,
                ayahText:
                  selectedTextPart.ayahText ||
                  currentSurahData?.ayahs.find(
                    (a) => a.numberInSurah === (selectedTextPart.ayahNumber || 1)
                  )?.text ||
                  selectedTextPart.text,
                selectedTokenIndices: selectedTextPart.selectedTokenIndices,
              })
              setSelectedTextPart(null)
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 transition-colors"
            title="إضافة ملاحظة على الجزء المختار"
          >
            <StickyNote className="w-3.5 h-3.5 text-blue-500" />
            <span>ملاحظة</span>
          </button>

          <button
            onClick={() => {
              setAiModalTarget({
                ayahNumber: selectedTextPart.ayahNumber || 1,
                ayahText:
                  selectedTextPart.ayahText ||
                  currentSurahData?.ayahs.find(
                    (a) => a.numberInSurah === (selectedTextPart.ayahNumber || 1)
                  )?.text ||
                  selectedTextPart.text,
                wordText: selectedTextPart.text,
                surahNumber: selectedTextPart.surahNumber || currentSurahNumber,
                surahName:
                  selectedTextPart.surahName ||
                  currentSurahData?.name ||
                  `سورة ${selectedTextPart.surahNumber || currentSurahNumber}`,
              })
              setSelectedTextPart(null)
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 transition-colors"
            title="اسأل الذكاء الاصطناعي عن هذا الجزء"
          >
            <Bot className="w-3.5 h-3.5 text-purple-500" />
            <span>اسأل AI</span>
          </button>

          <button
            onClick={() => {
              playAyah(selectedTextPart.ayahNumber || 1, selectedTextPart.surahNumber || currentSurahNumber)
              setSelectedTextPart(null)
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 transition-colors"
            title="استمع للآية"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-500" />
            <span>استماع</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedTextPart.text)
              setSelectedTextPart(null)
            }}
            className="p-1 rounded-lg hover:bg-current/10 opacity-70 hover:opacity-100"
            title="نسخ النص"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setSelectedTextPart(null)}
            className="p-1 rounded-lg hover:bg-current/10 opacity-60 hover:opacity-100"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
