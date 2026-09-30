import React from 'react'
import { Bookmark, Trash2, ArrowLeft } from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'

export const BookmarksView: React.FC = () => {
  const { theme, bookmarks, removeBookmark, loadSurah, setActiveTab } = useQuran()
  const themeConfig = THEME_CONFIGS[theme]

  const handleJumpToAyah = (surahNumber: number, ayahNumber: number) => {
    loadSurah(surahNumber, ayahNumber)
    setActiveTab('quran')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div className={`p-6 sm:p-8 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-sm text-center space-y-2`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <Bookmark className="w-3.5 h-3.5" />
          <span>العلامات المرجعية</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-ui">الآيات المحفوظة</h2>
        <p className="text-xs sm:text-sm opacity-75 max-w-md mx-auto">
          يمكنك حفظ أي آية أثناء القراءة بالضغط على أيقونة الإشارة المرجعية للعودة إليها في أي وقت.
        </p>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <div className={`p-12 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} text-center space-y-4`}>
          <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto opacity-40">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-ui">لا توجد علامات مرجعية محفوظة</h3>
          <p className="text-xs opacity-70 max-w-sm mx-auto">
            أثناء قراءة أي سورة، اضغط على زر الإشارة المرجعية بجوار الآية لحفظها هنا.
          </p>
          <button
            onClick={() => setActiveTab('quran')}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
          >
            الانتقال للمصحف الشريف
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className={`p-5 rounded-2xl ${themeConfig.bgCard} border ${themeConfig.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-amber-500/40 transition-all`}
            >
              <div className="space-y-1.5 flex-1 text-right" dir="rtl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base font-ui text-amber-600 dark:text-amber-400">
                    {bm.surahName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 opacity-80">
                    الآية {bm.ayahNumber}
                  </span>
                  <span className="text-[10px] opacity-50 mr-auto" dir="ltr">
                    {new Date(bm.timestamp).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="font-quran-amiri text-base sm:text-lg opacity-90 leading-relaxed line-clamp-2">
                  « {bm.ayahText} »
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-current/10">
                <button
                  onClick={() => removeBookmark(bm.id)}
                  className="p-2 rounded-xl border border-current/15 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
                  title="حذف العلامة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleJumpToAyah(bm.surahNumber, bm.ayahNumber)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>قراءة في المصحف</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
