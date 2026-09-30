import React from 'react'
import {
  X,
  Type,
  Sliders,
  RotateCcw,
  Check,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { FontFamily, ThemeMode } from '../types/quran'
import { RECITERS } from '../services/quranService'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    resetFontSize,
    fontFamily,
    setFontFamily,
    setLineSpacing,
    setReadingMode,
    reciter,
    setReciter,
  } = useQuran()

  if (!isOpen) return null

  const themeConfig = THEME_CONFIGS[theme]

  const themes: { id: ThemeMode; label: string; desc: string }[] = [
    { id: 'emerald', label: 'الزمردي الكلاسيكي', desc: 'أخضر ملكي مريح مزين بلمسات ذهبية' },
    { id: 'parchment', label: 'ورق المصحف الدافئ', desc: 'ألوان صفحات المصحف التقليدية المريحة للعين' },
    { id: 'dark', label: 'الوضع الليلي الهادئ', desc: 'داكن عميق مناسب للقراءة الليلية دون إجهاد' },
    { id: 'pearl', label: 'اللؤلؤي الناصع', desc: 'تصميم أبيض نقي وواضح عالي التباين' },
  ]

  const fontSizes = [
    { label: 'صغير', size: 24 },
    { label: 'متوسط', size: 32 },
    { label: 'كبير', size: 40 },
    { label: 'كبير جداً', size: 50 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-ui">إعدادات القراءة والمظهر</h3>
              <p className="text-xs opacity-70">خصص حجم الخط ونوعه ومظهر المصحف حسب راحتك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-current/15 hover:bg-current/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Font Size (Crucial User Requirement!) */}
          <div className="space-y-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm font-ui">حجم خط القرآن الكريم</h4>
              </div>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {fontSize} بكسل (px)
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="18"
              max="64"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-black/10 dark:bg-white/10 rounded-lg"
            />

            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {fontSizes.map((preset) => (
                <button
                  key={preset.size}
                  onClick={() => setFontSize(preset.size)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                    fontSize === preset.size
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                      : 'border border-current/10 hover:bg-current/5 opacity-80'
                  }`}
                >
                  {preset.label} ({preset.size})
                </button>
              ))}
            </div>

            {/* Live Preview Box */}
            <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-current/15 text-center overflow-x-hidden">
              <p
                className={`transition-all ${
                  fontFamily === 'scheherazade'
                    ? 'font-quran-scheherazade'
                    : fontFamily === 'noto'
                    ? 'font-quran-noto'
                    : 'font-quran-amiri'
                }`}
                style={{ fontSize: `${fontSize}px` }}
                dir="rtl"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝
              </p>
              <span className="text-[10px] opacity-50 block mt-1">معاينة حية للنص بهذا الحجم</span>
            </div>
          </div>

          {/* Section 2: Font Family */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-ui opacity-90">نوع الخط العربي</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'amiri', name: 'المصحف الأميري', sub: 'الخط القرآني الكلاسيكي الأصيل' },
                { id: 'scheherazade', name: 'خط شهرزاد', sub: 'رسم نسخ واضح ومريح' },
                { id: 'noto', name: 'نسخ حديث', sub: 'خط رقمي نقي وعصري' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id as FontFamily)}
                  className={`p-3 rounded-2xl text-right border transition-all ${
                    fontFamily === f.id
                      ? 'border-amber-500 bg-amber-500/15'
                      : 'border-current/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="font-bold text-sm font-ui">{f.name}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Themes */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-ui opacity-90">مظهر لوحة التحكم (السمات)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3.5 rounded-2xl text-right border transition-all flex items-start justify-between ${
                    theme === t.id
                      ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-400/40'
                      : 'border-current/10 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm font-ui">{t.label}</div>
                    <div className="text-[11px] opacity-65 mt-0.5">{t.desc}</div>
                  </div>
                  {theme === t.id && <Check className="w-4 h-4 text-amber-500 mt-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Audio Reciter */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-ui opacity-90">القارئ الصوتي الافتراضي</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReciter(r)}
                  className={`p-3 rounded-xl text-right border transition-all flex items-center justify-between ${
                    reciter.id === r.id
                      ? 'border-amber-500 bg-amber-500/15 font-bold'
                      : 'border-current/10 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-xs font-ui">{r.arabicName}</span>
                  {reciter.id === r.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-current/10 flex items-center justify-between">
          <button
            onClick={() => {
              resetFontSize()
              setFontFamily('amiri')
              setLineSpacing('relaxed')
              setReadingMode('verse')
            }}
            className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الإعدادات الافتراضية</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
          >
            تم الحفظ
          </button>
        </div>
      </div>
    </div>
  )
}
