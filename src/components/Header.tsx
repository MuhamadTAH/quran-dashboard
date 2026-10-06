import React, { useState } from 'react'
import {
  BookOpen,
  Sparkles,
  Bookmark,
  Settings,
  Bell,
  Search,
  Sun,
  Moon,
  Minus,
  Plus,
  Compass,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { ThemeMode } from '../types/quran'

interface HeaderProps {
  onOpenSettings: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    theme,
    setTheme,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    activeTab,
    setActiveTab,
    setIsSurahSelectorOpen,
    bookmarks,
    toggleDarkMode,
    isDarkMode,
  } = useQuran()

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const themeConfig = THEME_CONFIGS[theme]

  const themes: { id: ThemeMode; label: string; icon: string; dotColor: string }[] = [
    { id: 'emerald', label: 'زمردي كلاسيكي', icon: '🟢', dotColor: 'bg-emerald-600' },
    { id: 'parchment', label: 'ورق مصحف دافئ', icon: '📜', dotColor: 'bg-[#d8c39e]' },
    { id: 'dark', label: 'ليلي هادئ', icon: '🌙', dotColor: 'bg-slate-900 border border-slate-700' },
    { id: 'pearl', label: 'لؤلؤي ناصع', icon: '⚪', dotColor: 'bg-teal-500' },
  ]

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b ${themeConfig.border} ${themeConfig.bgHeader} backdrop-blur-md bg-opacity-95 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Right side (RTL Start): App Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-bold">
            <BookOpen className="w-5 h-5 text-emerald-950" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-tight font-ui flex items-center gap-1.5">
              <span>نور القرآن</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                لوحة إسلامية
              </span>
            </h1>
            <p className="text-xs opacity-75 hidden sm:block">المصحف الشريف والأذكار اليومية</p>
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'opacity-80 hover:opacity-100 hover:bg-white/10'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </button>

          <button
            onClick={() => setActiveTab('quran')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'quran'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'opacity-80 hover:opacity-100 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>المصحف</span>
          </button>

          <button
            onClick={() => setActiveTab('adhkar')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'adhkar'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'opacity-80 hover:opacity-100 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>الأذكار</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative ${
              activeTab === 'bookmarks'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'opacity-80 hover:opacity-100 hover:bg-white/10'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden md:inline">العلامات</span>
            {bookmarks.length > 0 && (
              <span className="w-4 h-4 text-[10px] rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>
        </nav>

        {/* Left side (RTL End): Font Controls & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Font Size Controls: A- [size] A+ */}
          <div className="flex items-center bg-black/15 dark:bg-white/10 rounded-xl p-1 border border-white/10" title="تحكم في حجم خط القرآن">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= 18}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all font-bold text-xs"
              title="تصغير الخط (A-)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetFontSize}
              className="px-1.5 text-xs font-mono font-bold tracking-tight opacity-90 hover:text-amber-400 transition-colors"
              title="إعادة ضبط حجم الخط (32px)"
            >
              {fontSize}px
            </button>

            <button
              onClick={increaseFontSize}
              disabled={fontSize >= 64}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all font-bold text-xs"
              title="تكبير الخط (A+)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Surah quick picker search button */}
          <button
            onClick={() => setIsSurahSelectorOpen(true)}
            className="p-2 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 text-current transition-all flex items-center gap-1.5"
            title="فهرس السور والبحث"
          >
            <Search className="w-4 h-4" />
            <span className="text-xs font-medium hidden lg:inline">السور</span>
          </button>

          {/* Direct One-Click Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl transition-all flex items-center justify-center ${
              isDarkMode
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                : 'bg-black/15 dark:bg-white/10 hover:bg-white/20'
            }`}
            title={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-slate-950" /> : <Moon className="w-4 h-4 text-amber-300" />}
          </button>

          {/* Theme switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="p-2 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all"
              title="سمات الألوان (الأخضر، الورقي، الليلي، الأبيض)"
            >
              <span className="text-xs">🎨</span>
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-stone-200 dark:border-slate-800 p-1.5 z-50 text-right animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsThemeMenuOpen(false)}
              >
                <div className="px-2.5 py-1 text-[11px] font-semibold text-stone-400">اختر مظهر القراءة:</div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      theme === t.id
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${t.dotColor}`}></span>
                      <span>{t.label}</span>
                    </span>
                    {theme === t.id && <span className="text-amber-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all text-amber-500"
            title="إشعارات وتنبيهات الهاتف والحاسوب"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Advanced Settings Modal trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all"
            title="إعدادات القراءة والخطوط"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
