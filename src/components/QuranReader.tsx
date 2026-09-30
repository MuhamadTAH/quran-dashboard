import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Copy,
  ChevronRight,
  ChevronLeft,
  Type,
  Minus,
  Plus,
  RotateCcw,
  Check,
  Sparkles,
  Zap,
  X,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { FontFamily, LineSpacing } from '../types/quran'
import { tokenizeAyah, getSurahRareStats } from '../services/wordFrequencyService'

export const QuranReader: React.FC = () => {
  const {
    theme,
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
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null)
  
  // Selected Rare Word Popover state
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string
    frequency: number
  } | null>(null)

  // Determine font class
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

  // Determine line spacing style
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

  // Calculate rare word statistics for the current surah
  const surahRareStats = useMemo(() => {
    if (!currentSurahData) return { totalRareOccurrences: 0, uniqueRareCount: 0 }
    return getSurahRareStats(currentSurahData, rareWordThreshold)
  }, [currentSurahData, rareWordThreshold])

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
        <button
          onClick={() => loadSurah(currentSurahNumber)}
          className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  if (!currentSurahData) return null

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* Top Floating / Sticky Text Size & Reading Controls Bar */}
      <div className={`p-4 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-sm space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Font Size Adjuster with Slider */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-current/80 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-amber-500" />
              <span>حجم الخط:</span>
            </span>

            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-current/10">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= 18}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 disabled:opacity-40 transition-all font-bold text-xs"
                title="تصغير الخط"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono text-sm font-bold min-w-[50px] text-center text-amber-600 dark:text-amber-400">
                {fontSize}px
              </span>

              <button
                onClick={increaseFontSize}
                disabled={fontSize >= 64}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 disabled:opacity-40 transition-all font-bold text-xs"
                title="تكبير الخط"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={resetFontSize}
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-current/70 hover:text-current"
                title="إعادة ضبط حجم الخط الافتراضي (32px)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slider for smooth text resize */}
            <input
              type="range"
              min="18"
              max="64"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-28 sm:w-36 accent-amber-500 cursor-pointer"
              title={`حجم الخط: ${fontSize}px`}
            />
          </div>

          {/* Reading Mode Switcher & Display Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Reading Mode: Continuous vs Verse */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-current/10 text-xs font-semibold">
              <button
                onClick={() => setReadingMode('mushaf')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  readingMode === 'mushaf'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                المصحف المتصل
              </button>
              <button
                onClick={() => setReadingMode('verse')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  readingMode === 'verse'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                آية بآية
              </button>
            </div>

            {/* Translation & Tafseer toggles (only relevant in Verse mode) */}
            {readingMode === 'verse' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    showTranslation
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'border-current/15 opacity-60 hover:opacity-100'
                  }`}
                >
                  الترجمة الإنجليزية
                </button>
                <button
                  onClick={() => setShowTafseer(!showTafseer)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    showTafseer
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-current/15 opacity-60 hover:opacity-100'
                  }`}
                >
                  التفسير الميسر
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Font Family, Spacing & Rare Word Highlight Toggle */}
        <div className="pt-2 border-t border-current/10 flex items-center justify-between flex-wrap gap-3 text-xs">
          {/* Font Family selector chips */}
          <div className="flex items-center gap-2">
            <span className="opacity-70">نوع الخط:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFontFamily('amiri')}
                className={`px-2.5 py-1 rounded-lg transition-all font-quran-amiri ${
                  fontFamily === 'amiri'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                الأميري القرآني
              </button>
              <button
                onClick={() => setFontFamily('scheherazade')}
                className={`px-2.5 py-1 rounded-lg transition-all font-quran-scheherazade ${
                  fontFamily === 'scheherazade'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                شهرزاد
              </button>
              <button
                onClick={() => setFontFamily('noto')}
                className={`px-2.5 py-1 rounded-lg transition-all font-quran-noto ${
                  fontFamily === 'noto'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                نسخ حديث
              </button>
            </div>
          </div>

          {/* Line spacing selector */}
          <div className="flex items-center gap-2">
            <span className="opacity-70">الأسطر:</span>
            <div className="flex items-center gap-1">
              {(['normal', 'relaxed', 'spacious'] as LineSpacing[]).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setLineSpacing(sp)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    lineSpacing === sp
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  {sp === 'normal' ? 'عادي' : sp === 'relaxed' ? 'مريح' : 'واسع'}
                </button>
              ))}
            </div>
          </div>

          {/* RARE WORDS HIGHLIGHT TOGGLE (User Requirement: "it select those words and come the leastest time in the quran") */}
          <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-400/5 p-1 rounded-xl border border-amber-500/30">
            <button
              onClick={() => setHighlightRareWords(!highlightRareWords)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                highlightRareWords
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="تفعيل/تعطيل تمييز الكلمات النادرة والفريدة في القرآن الكريم حسب الرسم والتشكيل"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>تمييز الكلمات النادرة</span>
              <span className={`w-2 h-2 rounded-full ${highlightRareWords ? 'bg-stone-950' : 'bg-stone-400'}`} />
            </button>

            {highlightRareWords && (
              <div className="flex items-center gap-1 pr-1 border-r border-amber-500/30">
                <span className="text-[11px] opacity-75 hidden sm:inline">التكرار:</span>
                {[1, 2, 3].map((thresh) => (
                  <button
                    key={thresh}
                    onClick={() => setRareWordThreshold(thresh)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      rareWordThreshold === thresh
                        ? 'bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    title={
                      thresh === 1
                        ? 'الكلمات الفريدة تماماً (وردت مرة واحدة فقط بالقرآن كله بهذا الضبط والتشكيل)'
                        : `الكلمات التي وردت ${thresh} مرات أو أقل بالقرآن كله`
                    }
                  >
                    {thresh === 1 ? 'مرة واحدة' : `≤ ${thresh}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Surah Header / Frame Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${themeConfig.bgCard} border ${themeConfig.border} text-center space-y-4 shadow-sm`}>
        {/* Navigation between surahs */}
        <div className="flex items-center justify-between text-xs font-bold">
          <button
            onClick={handlePrevSurah}
            disabled={currentSurahNumber <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السورة السابقة</span>
          </button>

          <button
            onClick={() => setIsSurahSelectorOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>فهرس السور ({currentSurahNumber} / 114)</span>
          </button>

          <button
            onClick={handleNextSurah}
            disabled={currentSurahNumber >= 114}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-current/15 hover:bg-current/5 disabled:opacity-30 transition-all"
          >
            <span>السورة التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Surah Decorative Title */}
        <div className="space-y-1">
          <div className="inline-block p-1 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs px-3 font-semibold mb-1">
            {currentSurahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {currentSurahData.numberOfAyahs} آيات
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-quran-amiri text-current tracking-wide py-1">
            {currentSurahData.name}
          </h2>
          <p className="text-xs sm:text-sm opacity-60 font-sans">
            {currentSurahData.englishName} • {currentSurahData.englishNameTranslation}
          </p>

          {/* Rare words summary badge */}
          {highlightRareWords && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  تتضمن هذه السورة{' '}
                  <strong className="font-bold underline">{surahRareStats.totalRareOccurrences} كلمة</strong>{' '}
                  {rareWordThreshold === 1 ? 'فريدة (وردت مرة واحدة فقط بالقرآن كله)' : `وردت ≤ ${rareWordThreshold} مرات بالقرآن كله`}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Audio Recitation button */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={playWholeSurah}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>استمع إلى السورة كاملة ({reciter.arabicName})</span>
          </button>
        </div>
      </div>

      {/* Bismillah Header (except for Surah 9 At-Tawbah) */}
      {currentSurahNumber !== 9 && (
        <div className="text-center py-6">
          <div className="inline-block text-2xl sm:text-3xl lg:text-4xl font-quran-amiri text-amber-700 dark:text-amber-400 select-none px-6 py-2 border-y border-amber-500/20">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>
      )}

      {/* READING MODE A: CONTINUOUS MUSHAF FLOW */}
      {readingMode === 'mushaf' ? (
        <div
          className={`p-6 sm:p-10 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-md text-justify leading-loose select-text`}
          dir="rtl"
        >
          <div
            className={`${getFontFamilyClass(fontFamily)} transition-all duration-150`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: getLineHeight(lineSpacing),
            }}
          >
            {currentSurahData.ayahs.map((ayah) => {
              const isPlayingThis = isPlaying && playingAyahNumber === ayah.numberInSurah
              const tokens = highlightRareWords ? tokenizeAyah(ayah.text, rareWordThreshold) : null

              return (
                <span
                  key={ayah.number}
                  id={`ayah-${ayah.numberInSurah}`}
                  className={`transition-colors duration-200 inline rounded-lg px-0.5 ${
                    isPlayingThis ? themeConfig.ayahActive : ''
                  }`}
                >
                  {tokens ? (
                    tokens.map((tok, idx) => {
                      if (!tok.isWord) {
                        return <span key={idx}>{tok.text}</span>
                      }
                      if (tok.isRare) {
                        return (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedWordInfo({
                                word: tok.cleaned,
                                frequency: tok.frequency,
                              })
                            }}
                            className="relative inline-block cursor-pointer font-bold bg-amber-400/25 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 rounded px-1 mx-0.5 hover:bg-amber-400/40 transition-colors shadow-sm"
                            title={`كلمة نادرة! وردت ${tok.frequency} مرة فقط بهذا التشكيل بالقرآن كله (اضغط للتفاصيل)`}
                          >
                            {tok.text}
                          </span>
                        )
                      }
                      return (
                        <span
                          key={idx}
                          onClick={() => playAyah(ayah.numberInSurah)}
                          className="cursor-pointer hover:bg-amber-500/10 rounded"
                        >
                          {tok.text}
                        </span>
                      )
                    })
                  ) : (
                    <span
                      onClick={() => playAyah(ayah.numberInSurah)}
                      className="cursor-pointer hover:bg-amber-500/10 rounded"
                    >
                      {ayah.text}
                    </span>
                  )}

                  <span
                    className={`ayah-number ${themeConfig.ayahMarker} cursor-pointer`}
                    onClick={() => playAyah(ayah.numberInSurah)}
                    title={`الآية ${ayah.numberInSurah} (انقر للاستماع)`}
                  >
                    {ayah.numberInSurah}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        /* READING MODE B: VERSE BY VERSE CARDS */
        <div className="space-y-4">
          {currentSurahData.ayahs.map((ayah) => {
            const isBookmarkedAyah = isBookmarked(currentSurahNumber, ayah.numberInSurah)
            const isPlayingThis = isPlaying && playingAyahNumber === ayah.numberInSurah
            const tokens = highlightRareWords ? tokenizeAyah(ayah.text, rareWordThreshold) : null

            return (
              <div
                key={ayah.number}
                id={`ayah-${ayah.numberInSurah}`}
                className={`p-5 sm:p-6 rounded-3xl ${themeConfig.bgCard} border ${
                  isPlayingThis ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md' : themeConfig.border
                } transition-all duration-200 space-y-4`}
              >
                {/* Verse top bar: Ayah number & Action buttons */}
                <div className="flex items-center justify-between border-b pb-3 border-current/10">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/30">
                      {ayah.numberInSurah}
                    </span>
                    <span className="text-xs opacity-60">الآية {ayah.numberInSurah} من {currentSurahData.numberOfAyahs}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Play Audio Button */}
                    <button
                      onClick={() => (isPlayingThis ? pauseAudio() : playAyah(ayah.numberInSurah))}
                      className={`p-2 rounded-xl border transition-all ${
                        isPlayingThis
                          ? 'bg-amber-500 text-stone-950 font-bold border-amber-500'
                          : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                      }`}
                      title={isPlayingThis ? 'إيقاف مؤقت' : 'استماع للآية'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Bookmark Button */}
                    <button
                      onClick={() =>
                        toggleBookmark(
                          currentSurahNumber,
                          currentSurahData.name,
                          ayah.numberInSurah,
                          ayah.text
                        )
                      }
                      className={`p-2 rounded-xl border transition-all ${
                        isBookmarkedAyah
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50'
                          : 'border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100'
                      }`}
                      title={isBookmarkedAyah ? 'إزالة العلامة' : 'حفظ كعلامة مرجعية'}
                    >
                      {isBookmarkedAyah ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    {/* Copy Text Button */}
                    <button
                      onClick={() => handleCopyAyah(ayah.numberInSurah, ayah.text)}
                      className="p-2 rounded-xl border border-current/15 hover:bg-current/5 opacity-80 hover:opacity-100 transition-all"
                      title="نسخ نص الآية"
                    >
                      {copiedAyah === ayah.numberInSurah ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* The Quranic Arabic Verse Text (Dynamic Font Size + Rare words highlight applied!) */}
                <div
                  className={`text-right ${getFontFamilyClass(fontFamily)} transition-all duration-150 select-text`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: getLineHeight(lineSpacing),
                  }}
                  dir="rtl"
                >
                  {tokens ? (
                    tokens.map((tok, idx) => {
                      if (!tok.isWord) {
                        return <span key={idx}>{tok.text}</span>
                      }
                      if (tok.isRare) {
                        return (
                          <span
                            key={idx}
                            onClick={() =>
                              setSelectedWordInfo({
                                word: tok.cleaned,
                                frequency: tok.frequency,
                              })
                            }
                            className="relative inline-block cursor-pointer font-bold bg-amber-400/25 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border-b-2 border-amber-500 rounded px-1 mx-0.5 hover:bg-amber-400/40 transition-colors shadow-sm"
                            title={`كلمة نادرة! وردت ${tok.frequency} مرة فقط بهذا التشكيل في القرآن كله (اضغط للتفاصيل)`}
                          >
                            {tok.text}
                          </span>
                        )
                      }
                      return <span key={idx}>{tok.text}</span>
                    })
                  ) : (
                    <span>{ayah.text}</span>
                  )}

                  <span className={`ayah-number ${themeConfig.ayahMarker}`}>
                    {ayah.numberInSurah}
                  </span>
                </div>

                {/* English Translation */}
                {showTranslation && ayah.translation && (
                  <div className="pt-2 text-left text-sm text-stone-600 dark:text-stone-300 font-sans border-t border-current/5" dir="ltr">
                    <p className="leading-relaxed opacity-90">{ayah.translation}</p>
                  </div>
                )}

                {/* Arabic Tafseer Al-Muyassar */}
                {showTafseer && ayah.tafseer && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 text-xs sm:text-sm text-right leading-relaxed font-ui" dir="rtl">
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
      )}

      {/* Bottom Surah Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-current/10">
        <button
          onClick={handlePrevSurah}
          disabled={currentSurahNumber <= 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-30 transition-all font-bold text-xs"
        >
          <ChevronRight className="w-4 h-4" />
          <span>السورة السابقة</span>
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
          <span>السورة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* RARE WORD DETAILS MODAL / POPOVER */}
      {selectedWordInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedWordInfo(null)}
        >
          <div
            className={`w-full max-w-md p-6 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl text-center space-y-4`}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b pb-3 border-current/10">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>إحصاء الكلمة في القرآن الكريم</span>
              </div>
              <button
                onClick={() => setSelectedWordInfo(null)}
                className="p-1 rounded-lg border border-current/10 hover:bg-current/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Big Calligraphic Display of the Word with Exact Tashkeel */}
            <div className="py-3 bg-amber-500/10 dark:bg-amber-400/5 rounded-2xl border border-amber-500/20">
              <span className="font-quran-amiri text-4xl sm:text-5xl font-extrabold text-amber-800 dark:text-amber-300">
                {selectedWordInfo.word}
              </span>
            </div>

            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 text-sm">
                <span className="opacity-70 font-ui">عدد مرات الورود بهذا الضبط والتشكيل:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-base">
                  {selectedWordInfo.frequency === 1
                    ? 'مرة واحدة فقط (فريدة)'
                    : `${selectedWordInfo.frequency} مرات`}
                </span>
              </div>

              <p className="text-xs opacity-80 leading-relaxed font-ui p-2">
                📌 معيار الحساب يعتمد على المطابقة التامة للحروف مع التشكيل الكامل؛ فاختلاف حركة إعرابية أو حرف واحد يجعل الكلمة فريدة في هذا الموضع القرآني.
              </p>
            </div>

            <button
              onClick={() => setSelectedWordInfo(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-sm transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
