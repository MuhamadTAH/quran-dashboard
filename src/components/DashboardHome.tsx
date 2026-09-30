import React from 'react'
import {
  BookOpen,
  Volume2,
  Sparkles,
  Bookmark,
  ArrowLeft,
  Clock,
  Calendar,
  Copy,
  ChevronLeft,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import { getDailyVerse } from '../services/quranService'

export const DashboardHome: React.FC = () => {
  const {
    theme,
    loadSurah,
    setActiveTab,
    setIsSurahSelectorOpen,
    lastRead,
    bookmarks,
    playAyah,
    reciter,
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]
  const dailyVerse = getDailyVerse()

  // Format today's date
  const now = new Date()
  const gregorianDate = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Quick popular Surahs
  const quickSurahs = [
    { number: 1, name: 'سورة الفاتحة', title: 'The Opening', ayahs: 7, type: 'مكية' },
    { number: 36, name: 'سورة يـس', title: 'Yaseen', ayahs: 83, type: 'مكية' },
    { number: 67, name: 'سورة الملك', title: 'The Sovereignty', ayahs: 30, type: 'مكية' },
    { number: 18, name: 'سورة الكهف', title: 'The Cave', ayahs: 110, type: 'مكية' },
    { number: 56, name: 'سورة الواقعة', title: 'The Inevitable', ayahs: 96, type: 'مكية' },
    { number: 2, name: 'سورة البقرة', title: 'The Cow', ayahs: 286, type: 'مدنية' },
    { number: 112, name: 'سورة الإخلاص', title: 'Sincerity', ayahs: 4, type: 'مكية' },
    { number: 114, name: 'سورة الناس', title: 'Mankind', ayahs: 6, type: 'مكية' },
  ]

  const handleOpenSurah = (surahNum: number, ayahNum?: number) => {
    loadSurah(surahNum, ayahNum)
    setActiveTab('quran')
  }

  const handlePlayDailyVerse = () => {
    loadSurah(dailyVerse.surahNumber, dailyVerse.ayahNumber).then(() => {
      playAyah(dailyVerse.ayahNumber)
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('تم نسخ الآية الكريمة بنجاح')
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${themeConfig.bgCard} border ${themeConfig.border} shadow-sm`}>
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Calendar className="w-3.5 h-3.5" />
              <span>{gregorianDate}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-ui tracking-tight text-current">
              مرحباً بك في لوحة القرآن الكريم
            </h2>
            <p className="text-sm sm:text-base opacity-85 leading-relaxed">
              «خيركم من تعلم القرآن وعلمه» — اقرأ وتدبر كتاب الله بحجم خط مريح وقارئك المفضل.
            </p>
          </div>

          {/* Continue Reading Action Card */}
          {lastRead ? (
            <div className="w-full md:w-auto min-w-[280px] p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> آخر موضع قراءة
                </span>
                <div className="text-base font-bold font-ui">{lastRead.surahName}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">الآية رقم {lastRead.ayahNumber}</div>
              </div>

              <button
                onClick={() => handleOpenSurah(lastRead.surahNumber, lastRead.ayahNumber)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleOpenSurah(1)}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-emerald-700/20 transition-transform active:scale-95"
            >
              <BookOpen className="w-5 h-5" />
              <span>ابدأ قراءة سورة الفاتحة</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured: Ayah of the Day */}
      <div className={`rounded-3xl p-6 sm:p-8 ${themeConfig.bgCard} border ${themeConfig.border} relative overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b pb-4 mb-6 border-current/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-ui">آية وتدبر اليوم</h3>
              <p className="text-xs opacity-70">{dailyVerse.surahName} — الآية {dailyVerse.ayahNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(dailyVerse.text)}
              className="p-2 rounded-xl border border-current/15 hover:bg-current/5 transition-colors text-xs"
              title="نسخ الآية"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayDailyVerse}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>استمع بصوت {reciter.arabicName.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* The Verse Calligraphy Text */}
        <div className="py-4 text-center">
          <p
            className="font-quran-amiri leading-[2.4] text-2xl sm:text-3xl lg:text-4xl text-current px-2 select-text"
            dir="rtl"
          >
            « {dailyVerse.text} »
            <span className="ayah-number text-amber-600 dark:text-amber-400 mx-2 text-sm font-sans">
              {dailyVerse.ayahNumber}
            </span>
          </p>

          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 max-w-2xl mx-auto italic font-sans" dir="ltr">
            "{dailyVerse.translation}"
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-current/10 flex items-center justify-between text-xs">
          <span className="opacity-70">المصدر: القرآن الكريم</span>
          <button
            onClick={() => handleOpenSurah(dailyVerse.surahNumber, dailyVerse.ayahNumber)}
            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>فتح السورة كاملة</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Access to Popular Surahs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold font-ui">سور يكثر قراءتها</h3>
          </div>
          <button
            onClick={() => setIsSurahSelectorOpen(true)}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>عرض فهرس 114 سورة كاملة</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickSurahs.map((surah) => (
            <div
              key={surah.number}
              onClick={() => handleOpenSurah(surah.number)}
              className={`p-4 rounded-2xl ${themeConfig.bgCard} border ${themeConfig.border} ${themeConfig.cardHover} cursor-pointer transition-all duration-200 group relative flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                  {surah.number}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 opacity-70">
                  {surah.type}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base font-ui group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {surah.name}
                </h4>
                <p className="text-xs opacity-60 font-sans">{surah.title}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-[11px] opacity-75">
                <span>{surah.ayahs} آية</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:translate-x-[-3px] transition-transform">
                  قراءة ←
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Quick Adhkar & Spiritual Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Adhkar Card */}
        <div
          onClick={() => setActiveTab('adhkar')}
          className={`p-6 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} cursor-pointer hover:border-amber-500/50 transition-all flex flex-col justify-between group`}
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold font-ui group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              الأذكار والمسبحة الإلكترونية
            </h4>
            <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
              أذكار الصباح والمساء، أذكار بعد الصلاة، وأدعية قرآنية مع مسبحة ذكية لحفظ التسبيح والاستغفار.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>ابدأ الأذكار الآن</span>
            <ChevronLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </div>

        {/* Bookmarks & Reading Stats */}
        <div className={`p-6 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} flex flex-col justify-between`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-500" />
                <h4 className="text-lg font-bold font-ui">المحفوظات والعلامات</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {bookmarks.length} علامة
              </span>
            </div>

            {bookmarks.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {bookmarks.slice(0, 3).map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => handleOpenSurah(bm.surahNumber, bm.ayahNumber)}
                    className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-bold">{bm.surahName} — آية {bm.ayahNumber}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">فتح</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-75 py-4 text-center">
                لم تقم بحفظ أي آية بعد. يمكنك الضغط على أيقونة الإشارة المرجعية بجانب أي آية للعودة إليها لاحقاً.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs">
            <span className="opacity-70">القارئ الحالي: {reciter.arabicName}</span>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              إدارة العلامات
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
