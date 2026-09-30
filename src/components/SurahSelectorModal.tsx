import React, { useState, useMemo } from 'react'
import { Search, X, BookOpen } from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { searchSurahs } from '../services/quranService'
import { THEME_CONFIGS } from '../utils/themeStyles'

export const SurahSelectorModal: React.FC = () => {
  const {
    theme,
    isSurahSelectorOpen,
    setIsSurahSelectorOpen,
    currentSurahNumber,
    loadSurah,
    setActiveTab,
  } = useQuran()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan'>('all')

  const themeConfig = THEME_CONFIGS[theme]

  const filteredSurahs = useMemo(() => {
    let list = searchSurahs(searchQuery)
    if (filterType !== 'all') {
      list = list.filter((s) => s.revelationType === filterType)
    }
    return list
  }, [searchQuery, filterType])

  if (!isSurahSelectorOpen) return null

  const handleSelectSurah = (surahNumber: number) => {
    loadSurah(surahNumber)
    setActiveTab('quran')
    setIsSurahSelectorOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsSurahSelectorOpen(false)}
    >
      <div
        className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-ui">فهرس سور القرآن الكريم</h3>
              <p className="text-xs opacity-70">114 سورة — اختر السورة للانتقال المباشر</p>
            </div>
          </div>

          <button
            onClick={() => setIsSurahSelectorOpen(false)}
            className="p-2 rounded-xl border border-current/15 hover:bg-current/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-4 border-b border-current/10 bg-black/5 dark:bg-white/5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم السورة (مثال: الكهف، يس، البقرة) أو رقمها..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-current/15 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-right font-ui"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-xs opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters: All / Makki / Madani */}
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-70">التصفية:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                الكل (114)
              </button>
              <button
                onClick={() => setFilterType('Meccan')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'Meccan'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                مكية
              </button>
              <button
                onClick={() => setFilterType('Medinan')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'Medinan'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                مدنية
              </button>
            </div>
          </div>
        </div>

        {/* Surahs Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {filteredSurahs.map((surah) => {
            const isSelected = currentSurahNumber === surah.number
            return (
              <div
                key={surah.number}
                onClick={() => handleSelectSurah(surah.number)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 shadow-sm'
                    : 'border-current/10 hover:border-amber-500/50 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950'
                    }`}
                  >
                    {surah.number}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm font-ui group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {surah.name}
                    </h4>
                    <p className="text-[11px] opacity-60 font-sans">
                      {surah.englishName}
                    </p>
                  </div>
                </div>

                <div className="text-left text-xs opacity-75">
                  <span className="block font-medium">{surah.numberOfAyahs} آيات</span>
                  <span className="text-[10px] opacity-60">
                    {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                  </span>
                </div>
              </div>
            )
          })}

          {filteredSurahs.length === 0 && (
            <div className="col-span-full py-12 text-center opacity-60">
              لا توجد سور مطابقة لبحثك "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
