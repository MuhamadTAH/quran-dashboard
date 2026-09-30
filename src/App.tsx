import React, { useState } from 'react'
import { QuranProvider, useQuran } from './context/QuranContext'
import { Header } from './components/Header'
import { DashboardHome } from './components/DashboardHome'
import { QuranReader } from './components/QuranReader'
import { AdhkarView } from './components/AdhkarView'
import { BookmarksView } from './components/BookmarksView'
import { SurahSelectorModal } from './components/SurahSelectorModal'
import { SettingsModal } from './components/SettingsModal'
import { AudioPlayerBar } from './components/AudioPlayerBar'
import { THEME_CONFIGS } from './utils/themeStyles'
import { BookOpen } from 'lucide-react'

const MainContent: React.FC = () => {
  const { theme, activeTab, setActiveTab } = useQuran()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const themeConfig = THEME_CONFIGS[theme]

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${themeConfig.bg} flex flex-col font-ui selection:bg-amber-400/40 selection:text-current`}
      dir="rtl"
    >
      {/* Top Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && <DashboardHome />}
        {activeTab === 'quran' && <QuranReader />}
        {activeTab === 'adhkar' && <AdhkarView />}
        {activeTab === 'bookmarks' && <BookmarksView />}
      </main>

      {/* Footer */}
      <footer className={`py-6 border-t ${themeConfig.border} mt-auto text-center text-xs opacity-75`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="font-bold">لوحة القرآن الكريم والأذكار</span>
            <span>— تلاوة وتدبر وتسبيح</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button onClick={() => setActiveTab('dashboard')} className="hover:underline">
              الرئيسية
            </button>
            <button onClick={() => setActiveTab('quran')} className="hover:underline">
              المصحف
            </button>
            <button onClick={() => setActiveTab('adhkar')} className="hover:underline">
              الأذكار
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:underline">
              إعدادات الخط
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] opacity-70">
            <span>صدقة جارية نفعنا الله وإياكم بها</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <SurahSelectorModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AudioPlayerBar />
    </div>
  )
}

export function App() {
  return (
    <QuranProvider>
      <MainContent />
    </QuranProvider>
  )
}

export default App
