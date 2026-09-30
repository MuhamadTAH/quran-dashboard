import React, { useState } from 'react'
import {
  Sparkles,
  Sun,
  Moon,
  HeartHandshake,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import adhkarData from '../data/adhkar.json'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { AdhkarCategory } from '../types/quran'

export const AdhkarView: React.FC = () => {
  const { theme } = useQuran()
  const themeConfig = THEME_CONFIGS[theme]

  const categories = adhkarData as AdhkarCategory[]
  const [selectedCategory, setSelectedCategory] = useState<string>('morning')

  // Track counts per dhikr item ID
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('adhkar_progress')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Digital Tasbih state
  const [tasbihCount, setTasbihCount] = useState<number>(() => {
    const saved = localStorage.getItem('tasbih_count')
    return saved ? parseInt(saved, 10) : 0
  })
  const [tasbihTarget, setTasbihTarget] = useState<number>(33)
  const [tasbihPhrase, setTasbihPhrase] = useState<string>('سُبْحَانَ اللَّهِ')
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  const phrases = [
    'سُبْحَانَ اللَّهِ',
    'الحَمْدُ لِلَّهِ',
    'لاَ إِلَهَ إِلاَّ اللَّهُ',
    'اللَّهُ أَكْبَرُ',
    'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    'لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ',
    'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ',
    'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ العَظِيمِ',
  ]

  const activeCategoryData = categories.find((c) => c.category === selectedCategory)

  // Save progress
  const handleIncrement = (id: string, maxCount: number) => {
    const current = counts[id] || 0
    if (current < maxCount) {
      const next = current + 1
      const updated = { ...counts, [id]: next }
      setCounts(updated)
      localStorage.setItem('adhkar_progress', JSON.stringify(updated))

      // Trigger celebration if reached max
      if (next === maxCount) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        })
      }
    }
  }

  const handleResetItem = (id: string) => {
    const updated = { ...counts, [id]: 0 }
    setCounts(updated)
    localStorage.setItem('adhkar_progress', JSON.stringify(updated))
  }

  const handleResetAllCategory = () => {
    if (!activeCategoryData) return
    const updated = { ...counts }
    activeCategoryData.items.forEach((item) => {
      updated[item.id] = 0
    })
    setCounts(updated)
    localStorage.setItem('adhkar_progress', JSON.stringify(updated))
  }

  // Tasbih click audio synthesizer (safe, zero external dependency)
  const playClickSound = () => {
    if (!soundEnabled) return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {
      // AudioContext not allowed or unsupported
    }
  }

  const handleTasbihClick = () => {
    playClickSound()
    const next = tasbihCount + 1
    setTasbihCount(next)
    localStorage.setItem('tasbih_count', next.toString())

    if (tasbihTarget > 0 && next % tasbihTarget === 0) {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
      })
    }
  }

  const handleResetTasbih = () => {
    setTasbihCount(0)
    localStorage.setItem('tasbih_count', '0')
  }

  // Category Icon helper
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500" />
      case 'evening':
        return <Moon className="w-4 h-4 text-indigo-400" />
      case 'after_prayer':
        return <HeartHandshake className="w-4 h-4 text-emerald-500" />
      case 'quran_duas':
      default:
        return <BookOpen className="w-4 h-4 text-teal-500" />
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* View Header */}
      <div className={`p-6 sm:p-8 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-sm text-center relative overflow-hidden`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>حصن المسلم وأدعية القرآن</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-ui">الأذكار والتسبيح اليومي</h2>
          <p className="text-xs sm:text-sm opacity-75 max-w-xl mx-auto leading-relaxed">
            «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» — أذكار الصباح والمساء وأدعية قرآنية مع عداد تسبيح تفاعلي.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setSelectedCategory(c.category)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                selectedCategory === c.category
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              {getCategoryIcon(c.category)}
              <span>{c.categoryTitle}</span>
            </button>
          ))}

          {/* Dedicated Tab: Interactive Tasbih */}
          <button
            onClick={() => setSelectedCategory('tasbih')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === 'tasbih'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 scale-105'
                : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
            }`}
          >
            <span>📿</span>
            <span>السبحة الإلكترونية</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW: INTERACTIVE TASBIH */}
      {selectedCategory === 'tasbih' ? (
        <div className={`p-6 sm:p-12 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-lg max-w-2xl mx-auto text-center space-y-8`}>
          {/* Preset Phrase Picker */}
          <div className="space-y-3">
            <span className="text-xs font-bold opacity-70 block">اختر صيغة الذكر:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {phrases.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => setTasbihPhrase(phrase)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-ui transition-all ${
                    tasbihPhrase === phrase
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Target Goal Selector */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="opacity-70">الهدف:</span>
            {[33, 100, 0].map((t) => (
              <button
                key={t}
                onClick={() => setTasbihTarget(t)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tasbihTarget === t
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                    : 'bg-black/5 dark:bg-white/5 opacity-60'
                }`}
              >
                {t === 0 ? 'مفتوح' : `${t} مرة`}
              </button>
            ))}

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg border border-current/15 ml-2 opacity-70 hover:opacity-100"
              title={soundEnabled ? 'كتم صوت النقر' : 'تفعيل صوت النقر'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Big Tactile Tasbih Counter Button */}
          <div className="py-6 flex flex-col items-center justify-center">
            <button
              onClick={handleTasbihClick}
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 active:scale-95 transition-transform duration-100 shadow-xl shadow-amber-500/25 flex flex-col items-center justify-center text-stone-950 select-none cursor-pointer border-4 border-amber-200"
            >
              <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight">
                {tasbihCount}
              </span>
              <span className="text-xs font-bold mt-1 opacity-80">
                {tasbihTarget > 0 ? `/ ${tasbihTarget}` : 'تسبيحة'}
              </span>
              <span className="text-xs font-semibold mt-2 px-3 py-1 rounded-full bg-stone-950/10">
                اضغط للتسبيح
              </span>
            </button>

            {/* Current phrase display */}
            <p className="mt-6 text-xl sm:text-2xl font-bold font-quran-amiri text-current">
              {tasbihPhrase}
            </p>
          </div>

          {/* Reset button */}
          <div className="pt-4 border-t border-current/10 flex items-center justify-center">
            <button
              onClick={handleResetTasbih}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-current/15 hover:bg-current/5 opacity-70 hover:opacity-100 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير العداد</span>
            </button>
          </div>
        </div>
      ) : (
        /* RENDER VIEW: ADHKAR ITEMS LIST */
        activeCategoryData && (
          <div className="space-y-4">
            {/* Category action bar */}
            <div className="flex items-center justify-between px-2">
              <span className="text-xs opacity-75 font-semibold">
                عدد الأذكار: {activeCategoryData.items.length}
              </span>
              <button
                onClick={handleResetAllCategory}
                className="text-xs font-bold opacity-60 hover:opacity-100 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط العدادات</span>
              </button>
            </div>

            {/* Dhikr items */}
            {activeCategoryData.items.map((item) => {
              const current = counts[item.id] || 0
              const isCompleted = current >= item.count
              const progressPct = Math.min(100, Math.round((current / item.count) * 100))

              return (
                <div
                  key={item.id}
                  className={`p-5 sm:p-6 rounded-3xl ${themeConfig.bgCard} border ${
                    isCompleted
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : themeConfig.border
                  } transition-all duration-200 space-y-4`}
                >
                  {/* Item Text (Arabic) */}
                  <p
                    className="font-quran-amiri text-lg sm:text-xl lg:text-2xl leading-[2.1] text-right select-text"
                    dir="rtl"
                  >
                    {item.text}
                  </p>

                  {/* Virtue / Hadith */}
                  {item.virtue && (
                    <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-right opacity-80 font-ui leading-relaxed">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                        الفضل:
                      </span>
                      {item.virtue}
                    </div>
                  )}

                  {/* Progress Bar & Interactive Tap Button */}
                  <div className="pt-3 border-t border-current/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleResetItem(item.id)}
                        className="p-2 rounded-xl border border-current/15 hover:bg-current/5 opacity-50 hover:opacity-100 transition-colors"
                        title="إعادة ضبط العداد لهذا الذكر"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-mono font-bold">
                          <span className="text-amber-600 dark:text-amber-400 text-sm">
                            {current}
                          </span>
                          <span className="opacity-50"> / {item.count}</span>
                        </div>
                        <div className="w-20 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Big Increment Action Button */}
                    <button
                      onClick={() => handleIncrement(item.id, item.count)}
                      disabled={isCompleted}
                      className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>اكتمل الذكر</span>
                        </>
                      ) : (
                        <>
                          <span>كرر الذكر ({item.count - current})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
