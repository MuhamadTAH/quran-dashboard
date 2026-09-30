import React, { useState } from 'react'
import { QuranProvider, useQuran } from './context/QuranContext'
import { Sidebar } from './components/Sidebar'
import { DashboardHome } from './components/DashboardHome'
import { QuranReader } from './components/QuranReader'
import { AdhkarView } from './components/AdhkarView'
import { BookmarksView } from './components/BookmarksView'
import { SurahSelectorModal } from './components/SurahSelectorModal'
import { SettingsModal } from './components/SettingsModal'
import { AudioPlayerBar } from './components/AudioPlayerBar'
import { THEME_CONFIGS } from './utils/themeStyles'

const MainContent: React.FC = () => {
  const { theme, activeTab, readingWidth } = useQuran()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showNotesSidebar, setShowNotesSidebar] = useState(false)
  const themeConfig = THEME_CONFIGS[theme]

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${themeConfig.bg} font-ui selection:bg-amber-400/40 selection:text-current`}
      dir="rtl"
    >
      {/* ── Fixed right sidebar ── */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        showNotesSidebar={showNotesSidebar}
        setShowNotesSidebar={setShowNotesSidebar}
      />

      {/* ── Main content area — offset by sidebar (w-56 = 224px), then centered with numeric max-width ── */}
      <div className="mr-56 min-h-screen flex justify-center">
        <main
          className="flex-1 w-full px-4 sm:px-8 py-6 sm:py-8 transition-[max-width] duration-150"
          style={{ maxWidth: readingWidth >= 2000 ? '100%' : `${readingWidth}px` }}
        >
          {activeTab === 'dashboard' && <DashboardHome />}
          {activeTab === 'quran' && (
            <QuranReader
              showNotesSidebar={showNotesSidebar}
              setShowNotesSidebar={setShowNotesSidebar}
            />
          )}
          {activeTab === 'adhkar' && <AdhkarView />}
          {activeTab === 'bookmarks' && <BookmarksView />}
        </main>
      </div>

      {/* ── Modals & Overlays ── */}
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
