import React, { useState } from 'react'
import {
  BookOpen,
  Sparkles,
  Bookmark,
  Search,
  Sun,
  Moon,
  Minus,
  Plus,
  RotateCcw,
  Compass,
  Zap,
  MousePointer2,
  Headphones,
  StickyNote,
  ChevronDown,
  AlignJustify,
  Type,
  Palette,
  Bot,
  Mic,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { ThemeMode, FontFamily, LineSpacing } from '../types/quran'

// ── Collapsible group ──────────────────────────────────────────────────────────
const Group: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({
  label, icon, children, defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 px-1 text-xs font-bold opacity-70 hover:opacity-100 transition-opacity"
      >
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-3 space-y-2">{children}</div>}
    </div>
  )
}

// ── Circle mode button ────────────────────────────────────────────────────────
const ModeCircle: React.FC<{
  icon: React.ReactNode
  label: string
  active: boolean
  activeClass: string
  onClick: () => void
  badge?: number
}> = ({ icon, label, active, activeClass, onClick, badge }) => (
  <button
    onClick={onClick}
    title={label}
    className={`relative flex flex-col items-center gap-1 group w-full`}
  >
    <span
      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all shadow-sm ${
        active
          ? `${activeClass} border-transparent shadow-md scale-105`
          : 'border-current/20 opacity-65 hover:opacity-100 hover:border-current/40 hover:bg-current/5'
      }`}
    >
      {icon}
    </span>
    <span className="text-[9px] font-bold leading-tight text-center opacity-75 group-hover:opacity-100 truncate w-full">
      {label}
    </span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-0.5 w-4 h-4 bg-violet-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow">
        {badge}
      </span>
    )}
  </button>
)

// ── Main Sidebar ──────────────────────────────────────────────────────────────
interface SidebarProps {
  onOpenSettings: () => void
  showNotesSidebar: boolean
  setShowNotesSidebar: (v: boolean) => void
  onOpenRecording?: () => void
  isRecordingOpen?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSettings: _onOpenSettings,
  showNotesSidebar,
  setShowNotesSidebar,
  onOpenRecording,
  isRecordingOpen,
}) => {
  const {
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
    isSelectionMode,
    setIsSelectionMode,
    isAudioClickMode,
    setIsAudioClickMode,
    isAiAskMode,
    setIsAiAskMode,
    activeTab,
    setActiveTab,
    setIsSurahSelectorOpen,
    bookmarks,
    notes,
    currentSurahNumber,
    toggleDarkMode,
    isDarkMode,
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]
  const currentSurahNotes = notes.filter((n) => n.surahNumber === currentSurahNumber)

  const themes: { id: ThemeMode; label: string; dot: string }[] = [
    { id: 'emerald', label: 'زمردي', dot: 'bg-emerald-600' },
    { id: 'parchment', label: 'ورقي', dot: 'bg-[#d8c39e]' },
    { id: 'dark', label: 'ليلي', dot: 'bg-slate-700 border border-slate-500' },
    { id: 'pearl', label: 'لؤلؤي', dot: 'bg-teal-500' },
  ]

  const navItems = [
    { id: 'dashboard' as const, icon: <Compass className="w-5 h-5" />, label: 'الرئيسية' },
    { id: 'quran' as const, icon: <BookOpen className="w-5 h-5" />, label: 'المصحف' },
    { id: 'adhkar' as const, icon: <Sparkles className="w-5 h-5" />, label: 'الأذكار' },
    {
      id: 'bookmarks' as const,
      icon: <Bookmark className="w-5 h-5" />,
      label: 'العلامات',
      badge: bookmarks.length,
    },
  ]

  return (
    <aside
      className={`fixed right-0 top-0 h-screen w-56 flex flex-col border-l ${themeConfig.border} ${themeConfig.bgCard} z-30 overflow-y-auto`}
      dir="rtl"
    >
      {/* ── App Brand ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 cursor-pointer select-none border-b border-current/10"
        onClick={() => setActiveTab('dashboard')}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0">
          <BookOpen className="w-4.5 h-4.5 text-emerald-950" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">نور القرآن</h1>
          <p className="text-[10px] opacity-60">المصحف والأذكار</p>
        </div>
      </div>

      {/* ── Navigation tabs ── */}
      <nav className="px-3 pt-4 pb-2 space-y-1 border-b border-current/10">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === item.id
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'hover:bg-current/5 opacity-70 hover:opacity-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              {item.icon}
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-stone-900/20 text-stone-950' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Studio Recording Trigger ── */}
      {onOpenRecording && (
        <div className="px-3 pt-2.5 pb-1 border-b border-current/10">
          <button
            onClick={onOpenRecording}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              isRecordingOpen
                ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-400 shadow-sm'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20'
            }`}
            title="افتح استوديو تسجيل التلاوة المستقل"
          >
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-500" />
              <span>تسجيل التلاوة</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 font-mono">
              {isRecordingOpen ? 'مفتوح' : '🎙️'}
            </span>
          </button>
        </div>
      )}

      {/* ── Scrollable settings area ── */}
      <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto text-sm">

        {/* Surah search */}
        <button
          onClick={() => setIsSurahSelectorOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-current/15 hover:bg-current/5 transition-all text-xs font-semibold opacity-80 hover:opacity-100"
        >
          <Search className="w-4 h-4 text-amber-500" />
          <span>البحث في السور</span>
        </button>

        <div className="h-px bg-current/10 my-2" />

        {/* Dark mode + Theme row */}
        <Group label="المظهر والألوان" icon={<Palette className="w-3.5 h-3.5 text-amber-500" />}>
          {/* Dark/light toggle */}
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${
              isDarkMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'border-current/15 opacity-70 hover:opacity-100 hover:bg-current/5'
            }`}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {isDarkMode ? 'وضع النهار' : 'الوضع الليلي'}
          </button>

          {/* Theme color dots */}
          <div className="flex items-center gap-2 px-1 pt-1">
            <span className="text-[10px] opacity-60">اللون:</span>
            <div className="flex gap-1.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  className={`w-5 h-5 rounded-full ${t.dot} transition-all ${
                    theme === t.id ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
        </Group>

        <div className="h-px bg-current/10 my-1" />

        {/* Typography */}
        <Group label="الخط والطباعة" icon={<Type className="w-3.5 h-3.5 text-amber-500" />}>
          {/* Font size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span>حجم الخط</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= 18}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-current/5 hover:bg-current/10 disabled:opacity-30 transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="18"
                max="64"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500 h-1.5"
              />
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= 64}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-current/5 hover:bg-current/10 disabled:opacity-30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={resetFontSize}
              className="w-full text-[10px] opacity-50 hover:opacity-80 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" /> إعادة الضبط
            </button>
          </div>

          {/* Font family */}
          <div className="space-y-1">
            <span className="text-[11px] opacity-60">نوع الخط</span>
            <div className="space-y-1">
              {(
                [
                  { id: 'amiri', label: 'الأميري القرآني', cls: 'font-quran-amiri' },
                  { id: 'scheherazade', label: 'شهرزاد', cls: 'font-quran-scheherazade' },
                  { id: 'noto', label: 'نسخ حديث', cls: 'font-quran-noto' },
                ] as const
              ).map(({ id, label, cls }) => (
                <button
                  key={id}
                  onClick={() => setFontFamily(id as FontFamily)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs transition-all text-right ${cls} ${
                    fontFamily === id
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-current/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Line spacing */}
          <div className="space-y-1">
            <span className="text-[11px] opacity-60">تباعد الأسطر</span>
            <div className="flex gap-1">
              {(['normal', 'relaxed', 'spacious'] as LineSpacing[]).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setLineSpacing(sp)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    lineSpacing === sp
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-current/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  {sp === 'normal' ? 'عادي' : sp === 'relaxed' ? 'مريح' : 'واسع'}
                </button>
              ))}
            </div>
          </div>

          {/* Reading area width (numeric in pixels) */}
          <div className="space-y-1.5 pt-1 border-t border-current/10">
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span>عرض مساحة القراءة</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {readingWidth >= 2000 ? 'كامل الشاشة' : `${readingWidth}px`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={decreaseReadingWidth}
                disabled={readingWidth <= 600}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-current/5 hover:bg-current/10 disabled:opacity-30 transition-all"
                title="تضييق العرض (-50px)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="600"
                max="2000"
                step="50"
                value={readingWidth}
                onChange={(e) => setReadingWidth(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500 h-1.5"
              />
              <button
                onClick={increaseReadingWidth}
                disabled={readingWidth >= 2000}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-current/5 hover:bg-current/10 disabled:opacity-30 transition-all"
                title="توسيع العرض (+50px)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Quick numeric presets */}
            <div className="flex gap-1 pt-0.5">
              {[800, 1100, 1400, 2000].map((val) => (
                <button
                  key={val}
                  onClick={() => setReadingWidth(val)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                    readingWidth === val
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-current/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  {val === 2000 ? '100%' : `${val}px`}
                </button>
              ))}
            </div>
            <button
              onClick={resetReadingWidth}
              className="w-full text-[10px] opacity-50 hover:opacity-80 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" /> استعادة العرض الافتراضي (1100px)
            </button>
          </div>
        </Group>

        <div className="h-px bg-current/10 my-1" />

        {/* Reading mode */}
        <Group label="طريقة القراءة" icon={<AlignJustify className="w-3.5 h-3.5 text-amber-500" />}>
          <div className="flex gap-1">
            <button
              onClick={() => setReadingMode('mushaf')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                readingMode === 'mushaf'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-current/5 opacity-70 hover:opacity-100'
              }`}
            >
              📖 متصل
            </button>
            <button
              onClick={() => setReadingMode('verse')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                readingMode === 'verse'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-current/5 opacity-70 hover:opacity-100'
              }`}
            >
              📋 آية بآية
            </button>
          </div>

          {readingMode === 'verse' && (
            <div className="space-y-1 pt-1 border-t border-current/10">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all text-right ${
                  showTranslation
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'border-current/15 opacity-60 hover:opacity-100'
                }`}
              >
                {showTranslation ? '✓' : '○'} الترجمة الإنجليزية
              </button>
              <button
                onClick={() => setShowTafseer(!showTafseer)}
                className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all text-right ${
                  showTafseer
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-current/15 opacity-60 hover:opacity-100'
                }`}
              >
                {showTafseer ? '✓' : '○'} التفسير الميسر
              </button>
            </div>
          )}
        </Group>

        <div className="h-px bg-current/10 my-1" />

        {/* Mode circles */}
        <div className="py-1">
          <p className="text-[10px] font-bold opacity-60 px-1 mb-2.5">أوضاع التفاعل</p>
          <div className="grid grid-cols-5 gap-0.5 justify-items-center">
            {/* Rare words */}
            <ModeCircle
              icon={<Zap className="w-3.5 h-3.5" />}
              label="نادرة"
              active={highlightRareWords}
              activeClass="bg-amber-500 text-stone-950"
              onClick={() => setHighlightRareWords(!highlightRareWords)}
            />

            {/* Selection mode */}
            <ModeCircle
              icon={<MousePointer2 className="w-3.5 h-3.5" />}
              label="اختيار"
              active={isSelectionMode}
              activeClass="bg-blue-500 text-white"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                if (!isSelectionMode) {
                  setIsAudioClickMode(false)
                  setIsAiAskMode(false)
                }
              }}
            />

            {/* Audio click mode */}
            <ModeCircle
              icon={<Headphones className="w-3.5 h-3.5" />}
              label="استماع"
              active={isAudioClickMode}
              activeClass="bg-emerald-600 text-white"
              onClick={() => {
                setIsAudioClickMode(!isAudioClickMode)
                if (!isAudioClickMode) {
                  setIsSelectionMode(false)
                  setIsAiAskMode(false)
                }
              }}
            />

            {/* Ask AI mode */}
            <ModeCircle
              icon={<Bot className="w-3.5 h-3.5" />}
              label="اسأل AI"
              active={isAiAskMode}
              activeClass="bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/25"
              onClick={() => {
                setIsAiAskMode(!isAiAskMode)
                if (!isAiAskMode) {
                  setIsSelectionMode(false)
                  setIsAudioClickMode(false)
                }
              }}
            />

            {/* Notes panel */}
            <ModeCircle
              icon={<StickyNote className="w-3.5 h-3.5" />}
              label="ملاحظات"
              active={showNotesSidebar}
              activeClass="bg-violet-600 text-white"
              onClick={() => setShowNotesSidebar(!showNotesSidebar)}
              badge={currentSurahNotes.length}
            />
          </div>

          {/* Rare words threshold (shows when active) */}
          {highlightRareWords && (
            <div className="mt-3 flex items-center gap-1 px-1">
              <span className="text-[9px] opacity-60 shrink-0">التكرار:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((t) => (
                  <button
                    key={t}
                    onClick={() => setRareWordThreshold(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      rareWordThreshold === t
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-current/5 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {t === 1 ? 'مرة' : `≤${t}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active mode hint */}
          {(isSelectionMode || isAudioClickMode || isAiAskMode) && (
            <p className={`mt-2 text-[9px] leading-relaxed px-2 py-1.5 rounded-lg ${
              isAiAskMode
                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold'
                : isSelectionMode
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            }`}>
              {isAiAskMode
                ? '🤖 وضع سؤال الذكاء: انقر على أي كلمة أو رقم آية لطرح سؤالك عنها'
                : isSelectionMode
                ? 'انقر على آية أو كلمة لإضافة ملاحظة'
                : 'انقر على رقم الآية للسماع، أو أي كلمة لنطقها'}
            </p>
          )}
        </div>
      </div>

      {/* ── Bottom: version tag ── */}
      <div className="px-4 py-3 border-t border-current/10 text-[10px] opacity-40 text-center">
        صدقة جارية
      </div>
    </aside>
  )
}
