import React, { useState, useEffect } from 'react'
import { QuranProvider, useQuran } from './context/QuranContext'
import { Sidebar } from './components/Sidebar'
import { DashboardHome } from './components/DashboardHome'
import { QuranReader } from './components/QuranReader'
import { AdhkarView } from './components/AdhkarView'
import { BookmarksView } from './components/BookmarksView'
import { SurahSelectorModal } from './components/SurahSelectorModal'
import { SettingsModal } from './components/SettingsModal'
import { AudioPlayerBar } from './components/AudioPlayerBar'
import { RecordingSidePanel } from './components/RecordingSidePanel'
import { LoginModal } from './components/LoginModal'
import { checkAuthStatus } from './services/apiService'
import { THEME_CONFIGS } from './utils/themeStyles'
import { Mic } from 'lucide-react'

const MainContent: React.FC = () => {
  const { theme, activeTab, readingWidth } = useQuran()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showNotesSidebar, setShowNotesSidebar] = useState(false)
  const [isRecordingPanelOpen, setIsRecordingPanelOpen] = useState(false)
  const [isRecordingPanelPinned, setIsRecordingPanelPinned] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const themeConfig = THEME_CONFIGS[theme]

  useEffect(() => {
    checkAuthStatus().then((status) => {
      if (status.isPasswordRequired && !status.isAuthenticated) {
        setIsAuthModalOpen(true)
      }
    })
  }, [])

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${themeConfig.bg} font-ui selection:bg-amber-400/40 selection:text-current relative`}
      dir="rtl"
    >
      {/* ── Fixed right sidebar ── */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        showNotesSidebar={showNotesSidebar}
        setShowNotesSidebar={setShowNotesSidebar}
        onOpenRecording={() => setIsRecordingPanelOpen(true)}
        isRecordingOpen={isRecordingPanelOpen}
      />

      {/* ── Floating Recording Button (on left side) ── */}
      {!isRecordingPanelOpen && (
        <button
          onClick={() => setIsRecordingPanelOpen(true)}
          className="fixed left-3 sm:left-5 top-24 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-500/25 active:scale-95 transition-all group font-ui"
          title="افتح استوديو تسجيل الصوت والتدريب على التلاوة"
        >
          <div className="relative">
            <Mic className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
          </div>
          <span className="text-xs font-bold hidden sm:inline">تسجيل التلاوة</span>
        </button>
      )}

      {/* ── Independent Recording Side Panel (Left side) ── */}
      <RecordingSidePanel
        isOpen={isRecordingPanelOpen}
        onClose={() => setIsRecordingPanelOpen(false)}
        isPinned={isRecordingPanelPinned}
        onTogglePin={() => setIsRecordingPanelPinned(!isRecordingPanelPinned)}
      />

      {/* ── Main content area — offset by right sidebar (mr-56), and left panel if pinned (ml-80 / ml-96), then centered ── */}
      <div
        className={`mr-56 ${
          isRecordingPanelPinned && isRecordingPanelOpen ? 'ml-80 sm:ml-96' : ''
        } min-h-screen flex justify-center transition-[margin] duration-300`}
      >
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
      <LoginModal isOpen={isAuthModalOpen} onSuccess={() => setIsAuthModalOpen(false)} />
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
