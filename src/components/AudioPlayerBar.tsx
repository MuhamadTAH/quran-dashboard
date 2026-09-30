import React from 'react'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  X,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import { RECITERS } from '../services/quranService'

export const AudioPlayerBar: React.FC = () => {
  const {
    theme,
    isPlaying,
    playingAyahNumber,
    currentSurahData,
    toggleAudio,
    stopAudio,
    nextAyahAudio,
    prevAyahAudio,
    reciter,
    setReciter,
    audioDuration,
    audioCurrentTime,
    seekAudio,
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]

  // Only show if audio is playing or has an active ayah selected
  if (playingAyahNumber === null) return null

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00'
    const mins = Math.floor(secs / 60)
    const rem = Math.floor(secs % 60)
    return `${mins}:${rem.toString().padStart(2, '0')}`
  }

  const progressPercent = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0

  return (
    <div className="fixed bottom-3 sm:bottom-6 inset-x-3 sm:inset-x-6 z-50 max-w-4xl mx-auto animate-in slide-in-from-bottom-6 duration-300">
      <div
        className={`p-3.5 sm:p-4 rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl backdrop-blur-xl bg-opacity-95 flex flex-col gap-2.5`}
      >
        {/* Progress Bar slider */}
        <div className="w-full flex items-center gap-2 text-[10px] font-mono opacity-70">
          <span>{formatTime(audioCurrentTime)}</span>
          <div
            className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pos = (e.clientX - rect.left) / rect.width
              seekAudio(pos * audioDuration)
            }}
          >
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>{formatTime(audioDuration)}</span>
        </div>

        {/* Controls and Track Info */}
        <div className="flex items-center justify-between gap-3">
          {/* Track metadata (Right in RTL) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="font-bold text-xs sm:text-sm font-ui flex items-center gap-1.5">
                <span>{currentSurahData?.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  الآية {playingAyahNumber}
                </span>
              </div>

              {/* Reciter selector */}
              <select
                value={reciter.id}
                onChange={(e) => {
                  const selected = RECITERS.find((r) => r.id === e.target.value)
                  if (selected) setReciter(selected)
                }}
                className="text-[11px] bg-transparent opacity-75 font-ui cursor-pointer focus:outline-none hover:opacity-100"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className="text-stone-900 bg-white">
                    {r.arabicName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Player buttons (Center) */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevAyahAudio}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all opacity-80 hover:opacity-100"
              title="الآية السابقة"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleAudio}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-transform font-bold"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={nextAyahAudio}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all opacity-80 hover:opacity-100"
              title="الآية التالية"
            >
              <SkipBack className="w-4 h-4" />
            </button>
          </div>

          {/* Close Player (Left in RTL) */}
          <div className="flex items-center gap-1">
            <button
              onClick={stopAudio}
              className="p-2 rounded-xl border border-current/15 hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
              title="إغلاق المشغل"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
