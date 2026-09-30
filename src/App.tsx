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
  const { theme, activeTab } = useQuran()
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

      {/* ── Main content area (offset by sidebar width 224px = w-56) ── */}
      <div className="mr-56 min-h-screen flex flex-col">
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-5xl">
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
