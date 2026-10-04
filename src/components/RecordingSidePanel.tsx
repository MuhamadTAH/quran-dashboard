import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Download,
  Trash2,
  X,
  Gauge,
  Pin,
  PinOff,
  AlertCircle,
  Headphones,
  Sparkles,
  Repeat,
  ChevronLeft,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import { RECITERS } from '../services/quranService'
import {
  fetchRecordingsFromCloud,
  uploadRecordingToCloud,
  deleteRecordingFromCloud,
} from '../services/apiService'

export interface RecordingTake {
  id: string
  surahNumber: number
  surahName: string
  ayahNumber: number
  audioUrl: string
  blob?: Blob
  duration: number
  createdAt: number
  title?: string
  isCloudSynced?: boolean
}

interface RecordingSidePanelProps {
  isOpen: boolean
  onClose: () => void
  onOpen?: () => void
  isPinned: boolean
  onTogglePin: () => void
}

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export const RecordingSidePanel: React.FC<RecordingSidePanelProps> = ({
  isOpen,
  onClose,
  onOpen,
  isPinned,
  onTogglePin,
}) => {
  const {
    theme,
    currentSurahNumber,
    currentSurahData,
    playingAyahNumber,
    playAyah,
    isPlaying: isSheikhPlaying,
    reciter,
    setReciter,
  } = useQuran()

  const themeConfig = THEME_CONFIGS[theme]

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [visualizerLevels, setVisualizerLevels] = useState<number[]>(new Array(18).fill(10))

  // Playback states
  const [currentTake, setCurrentTake] = useState<RecordingTake | null>(null)
  const [takes, setTakes] = useState<RecordingTake[]>([])
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [playbackDuration, setPlaybackDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)
  const [isLooping, setIsLooping] = useState<boolean>(false)

  // MediaRecorder and Audio references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Playback Audio Element
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize playback audio element
  useEffect(() => {
    const audio = new Audio()
    playbackAudioRef.current = audio

    const updateTime = () => setPlaybackTime(audio.currentTime)
    const updateDuration = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setPlaybackDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      setIsPlayingRecorded(false)
      setPlaybackTime(0)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
    }
  }, [])

  // Sync playback rate and loop with active audio
  useEffect(() => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.playbackRate = playbackRate
      // Preserve pitch for natural voice quality across different speeds
      if ('preservesPitch' in playbackAudioRef.current) {
        ;(playbackAudioRef.current as any).preservesPitch = true
      }
      playbackAudioRef.current.loop = isLooping
    }
  }, [playbackRate, isLooping])

  const [isUploadingCloud, setIsUploadingCloud] = useState<boolean>(false)

  // Fetch recordings saved on Railway cloud storage
  useEffect(() => {
    let active = true
    fetchRecordingsFromCloud().then((cloudTakes) => {
      if (active && cloudTakes && cloudTakes.length > 0) {
        setTakes((prev) => {
          const existingIds = new Set(prev.map((t) => t.id))
          const newTakes: RecordingTake[] = cloudTakes
            .filter((ct) => !existingIds.has(ct.id))
            .map((ct) => ({
              id: ct.id,
              surahNumber: ct.surahNumber,
              surahName: ct.surahName,
              ayahNumber: ct.ayahNumber,
              audioUrl: ct.audioUrl,
              duration: ct.duration,
              createdAt: ct.createdAt,
              title: ct.title,
              isCloudSynced: true,
            }))
          return [...prev, ...newTakes]
        })
      }
    })
    return () => {
      active = false
    }
  }, [isOpen])

  // Clean up recording stream on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  // ── Recording Handlers ───────────────────────────────────────────────────
  const startRecording = async () => {
    setErrorMessage(null)
    audioChunksRef.current = []

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('متصفحك لا يدعم تسجيل الصوت عبر الميكروفون')
        return
      }

      // Stop any existing playback
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause()
        setIsPlayingRecorded(false)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      // Audio visualizer setup
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          audioContextRef.current = ctx
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 64
          analyserRef.current = analyser

          const source = ctx.createMediaStreamSource(stream)
          source.connect(analyser)

          const bufferLength = analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)

          const updateVisualizer = () => {
            if (!analyserRef.current) return
            analyserRef.current.getByteFrequencyData(dataArray)

            // Sample 18 equalizer bars
            const step = Math.max(1, Math.floor(bufferLength / 18))
            const levels = []
            for (let i = 0; i < 18; i++) {
              const val = dataArray[i * step] || 0
              // Scale between 8% and 100%
              levels.push(Math.max(8, Math.round((val / 255) * 100)))
            }
            setVisualizerLevels(levels)
            animFrameRef.current = requestAnimationFrame(updateVisualizer)
          }

          updateVisualizer()
        }
      } catch (e) {
        console.warn('AudioContext visualizer not supported or failed:', e)
      }

      // Choose supported mimeType
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
      ].find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || ''

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setVisualizerLevels(new Array(18).fill(10))

        const recordedBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        })

        if (recordedBlob.size > 0) {
          const tempId = `take_${Date.now()}`
          const url = URL.createObjectURL(recordedBlob)
          const newTake: RecordingTake = {
            id: tempId,
            surahNumber: currentSurahNumber,
            surahName: currentSurahData?.name || `سورة ${currentSurahNumber}`,
            ayahNumber: playingAyahNumber || 1,
            audioUrl: url,
            blob: recordedBlob,
            duration: recordingSeconds,
            createdAt: Date.now(),
            isCloudSynced: false,
          }

          setCurrentTake(newTake)
          setTakes((prev) => [newTake, ...prev])
          setPlaybackDuration(recordingSeconds)
          setPlaybackTime(0)

          if (playbackAudioRef.current) {
            playbackAudioRef.current.src = url
            playbackAudioRef.current.load()
          }

          // Upload to Railway cloud storage
          setIsUploadingCloud(true)
          uploadRecordingToCloud(recordedBlob, {
            surahNumber: newTake.surahNumber,
            surahName: newTake.surahName,
            ayahNumber: newTake.ayahNumber,
            duration: newTake.duration,
          })
            .then((cloudTake) => {
              setIsUploadingCloud(false)
              if (cloudTake) {
                setTakes((prev) =>
                  prev.map((t) =>
                    t.id === tempId
                      ? {
                          ...t,
                          id: cloudTake.id,
                          audioUrl: cloudTake.audioUrl,
                          isCloudSynced: true,
                        }
                      : t
                  )
                )
                setCurrentTake((prev) =>
                  prev && prev.id === tempId
                    ? {
                        ...prev,
                        id: cloudTake.id,
                        audioUrl: cloudTake.audioUrl,
                        isCloudSynced: true,
                      }
                    : prev
                )
              }
            })
            .catch(() => {
              setIsUploadingCloud(false)
            })
        }

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      recorder.start(100) // collect chunks every 100ms
      setIsRecording(true)
      setRecordingSeconds(0)

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Recording error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('تم رفض الإذن باستخدام الميكروفون. يرجى تفعيله من إعدادات المتصفح.')
      } else {
        setErrorMessage('تعذر بدء التسجيل، تأكد من توصيل الميكروفون.')
      }
    }
  }

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
  }

  // ── Playback Handlers ────────────────────────────────────────────────────
  const playRecorded = () => {
    if (!playbackAudioRef.current || !currentTake) return

    if (isPlayingRecorded) {
      playbackAudioRef.current.pause()
      setIsPlayingRecorded(false)
    } else {
      playbackAudioRef.current.playbackRate = playbackRate
      playbackAudioRef.current
        .play()
        .then(() => setIsPlayingRecorded(true))
        .catch((e) => console.error('Audio play error:', e))
    }
  }

  const replayFromStart = () => {
    if (!playbackAudioRef.current || !currentTake) return
    playbackAudioRef.current.currentTime = 0
    playbackAudioRef.current.playbackRate = playbackRate
    playbackAudioRef.current
      .play()
      .then(() => setIsPlayingRecorded(true))
      .catch((e) => console.error('Audio play error:', e))
  }

  const seekPlayback = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playbackAudioRef.current || playbackDuration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    // In RTL, click from right or left depending on visual direction
    const clickX = e.clientX - rect.left
    const percent = Math.min(1, Math.max(0, clickX / rect.width))
    const newTime = percent * playbackDuration
    playbackAudioRef.current.currentTime = newTime
    setPlaybackTime(newTime)
  }

  const changeSpeed = (speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.5, Math.round(speed * 100) / 100))
    setPlaybackRate(clamped)
    if (playbackAudioRef.current) {
      playbackAudioRef.current.playbackRate = clamped
    }
  }

  const selectTake = (take: RecordingTake) => {
    if (isRecording) stopRecording()
    setCurrentTake(take)
    setPlaybackDuration(take.duration)
    setPlaybackTime(0)
    setIsPlayingRecorded(false)

    if (playbackAudioRef.current) {
      playbackAudioRef.current.src = take.audioUrl
      playbackAudioRef.current.load()
    }
  }

  const downloadCurrentTake = (take: RecordingTake) => {
    const a = document.createElement('a')
    a.href = take.audioUrl
    a.download = `quran_recitation_${take.surahNumber}_ayah_${take.ayahNumber}_${take.id}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const deleteTake = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteRecordingFromCloud(id).catch(() => {})
    setTakes((prev) => prev.filter((t) => t.id !== id))
    if (currentTake?.id === id) {
      if (playbackAudioRef.current) playbackAudioRef.current.pause()
      setIsPlayingRecorded(false)
      setCurrentTake(null)
      setPlaybackTime(0)
      setPlaybackDuration(0)
    }
  }

  const formatTimer = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00'
    const mins = Math.floor(totalSeconds / 60)
    const secs = Math.floor(totalSeconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentAyahText =
    currentSurahData?.ayahs.find((a) => a.numberInSurah === (playingAyahNumber || 1))?.text || ''

  // Ali Jaber quick reciter switch
  const aliJaberReciter = RECITERS.find((r) => r.id === 'alijaber') || RECITERS[0]
  const isAliJaberSelected = reciter.id === 'alijaber'

  const handleListenToSheikh = () => {
    if (!isAliJaberSelected && aliJaberReciter) {
      setReciter(aliJaberReciter)
    }
    const targetAyah = playingAyahNumber || 1
    playAyah(targetAyah)
  }

  return (
    <>
      {/* Semi-transparent backdrop for mobile screens */}
      {isOpen && !isPinned && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* ── INDEPENDENT RECORDING SIDE PANEL (Left side of screen) ── */}
      <aside
        className={`fixed left-0 top-0 h-screen w-80 sm:w-96 flex flex-col border-r ${themeConfig.border} ${themeConfig.bgCard} shadow-2xl z-40 overflow-hidden transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        dir="rtl"
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-current/10 flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-ui flex items-center gap-1.5">
                <span>استوديو تسجيل التلاوة</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-mono">
                  صوتي
                </span>
              </h2>
              <p className="text-[11px] opacity-60">سجّل واستمع لأدائك مع التحكم بالسرعة</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-current/10 hover:bg-current/10 opacity-70 hover:opacity-100 transition-all flex items-center gap-1 text-xs"
              title="إخفاء اللوحة (يستمر الصوت بالعمل في الخلفية)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px]">إخفاء</span>
            </button>
            <button
              onClick={onTogglePin}
              className={`p-1.5 rounded-xl border transition-all ${
                isPinned
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'border-current/10 hover:bg-current/10 opacity-70'
              }`}
              title={isPinned ? 'إلغاء تثبيت اللوحة' : 'تثبيت اللوحة بجانب المصحف'}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-current/10 hover:bg-current/10 opacity-70 hover:opacity-100 transition-colors"
              title="إغلاق اللوحة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-ui">
          {/* Section 1: Current Quran Verse & Sheikh Ali Jaber reference */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {currentSurahData?.name || `سورة ${currentSurahNumber}`} — الآية{' '}
                  {playingAyahNumber || 1}
                </span>
              </div>
              <button
                onClick={handleListenToSheikh}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] font-semibold transition-colors"
                title="استمع للشيخ علي جابر لهذه الآية"
              >
                {isSheikhPlaying ? (
                  <Volume2 className="w-3 h-3 text-amber-600 animate-pulse" />
                ) : (
                  <Headphones className="w-3 h-3 text-amber-600" />
                )}
                <span>استمع للشيخ {reciter.id === 'alijaber' ? 'علي جابر' : reciter.arabicName}</span>
              </button>
            </div>

            {currentAyahText && (
              <p
                className="text-xs sm:text-sm font-quran-amiri leading-relaxed text-right opacity-90 p-2 rounded-xl bg-black/5 dark:bg-white/5 line-clamp-3"
                dir="rtl"
              >
                « {currentAyahText} »
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-current/10">
              <span className="text-[11px] opacity-70">القارئ الصوتي:</span>
              <select
                value={reciter.id}
                onChange={(e) => {
                  const selected = RECITERS.find((r) => r.id === e.target.value)
                  if (selected) setReciter(selected)
                }}
                className="text-xs bg-black/5 dark:bg-white/10 rounded-lg px-2 py-1 font-ui border border-current/15 cursor-pointer focus:outline-none"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className="text-stone-900 bg-white">
                    {r.arabicName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Section 2: Live Recording Studio Card */}
          <div className="p-4 rounded-3xl bg-black/5 dark:bg-white/5 border border-current/10 text-center space-y-4 shadow-sm">
            {/* Recording Timer & Visualizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                {isRecording && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                )}
                <span className="font-mono text-2xl font-bold tracking-wider">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>

              {/* Dynamic Waveform / Equalizer Bars */}
              <div className="flex items-end justify-center gap-1 h-10 px-4 py-1">
                {visualizerLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isRecording
                        ? 'bg-gradient-to-t from-red-500 to-amber-500'
                        : 'bg-current/15'
                    }`}
                    style={{ height: `${isRecording ? lvl : 15}%` }}
                  />
                ))}
              </div>

              <p className="text-[11px] opacity-60">
                {isRecording
                  ? 'جاري التسجيل الآن... تحدث بصوت واضح'
                  : currentTake
                  ? 'تم حفظ التسجيل! يمكنك الاستماع وضبط السرعة أدناه'
                  : 'اضغط على زر التسجيل أدناه لتسجيل صوتك'}
              </p>
            </div>

            {/* Record / Stop Button */}
            <div className="flex items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-500/25 active:scale-95 transition-all"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>ابدأ التسجيل الصوتي</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>إيقاف وحفظ التسجيل</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Playback & Speed Adjustment ("play again and adjust speed") */}
          {currentTake && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-current/10 pb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  <span>مشغل التسجيل الخاص بك</span>
                </span>
                <span className="text-[10px] font-mono opacity-60">
                  {formatTimer(playbackTime)} / {formatTimer(playbackDuration)}
                </span>
              </div>

              {/* Progress Scrubber */}
              <div
                className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer relative"
                onClick={seekPlayback}
                title="انقر للتنقل في التسجيل"
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all"
                  style={{
                    width: `${
                      playbackDuration > 0 ? (playbackTime / playbackDuration) * 100 : 0
                    }%`,
                  }}
                />
              </div>

              {/* Main Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play / Pause */}
                  <button
                    onClick={playRecorded}
                    className="w-11 h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
                    title={isPlayingRecorded ? 'إيقاف مؤقت' : 'تشغيل التسجيل'}
                  >
                    {isPlayingRecorded ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>

                  {/* Replay from Start */}
                  <button
                    onClick={replayFromStart}
                    className="p-2.5 rounded-xl border border-current/15 hover:bg-current/10 active:scale-95 transition-all opacity-80 hover:opacity-100"
                    title="إعادة الاستماع من البداية"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Loop toggle */}
                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isLooping
                        ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-current/15 hover:bg-current/10 opacity-70'
                    }`}
                    title={isLooping ? 'إلغاء التكرار' : 'تكرار التشغيل باستمرار'}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Download Take */}
                <button
                  onClick={() => downloadCurrentTake(currentTake)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-current/15 hover:bg-current/10 text-xs font-semibold opacity-80 hover:opacity-100 transition-all"
                  title="تحميل الملف الصوتي"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </button>
              </div>

              {/* Listen & Hide Panel Button ("استمع وأخفِ اللوحة") */}
              <button
                onClick={() => {
                  if (!isPlayingRecorded) {
                    playRecorded()
                  }
                  onClose()
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                title="بدء تشغيل تلاوتك وإخفاء لوحة التسجيل لتتمكن من قراءة صفحات المصحف دون أي حجب"
              >
                <Headphones className="w-4 h-4" />
                <span>استمع وأخفِ اللوحة (لقراءة المصحف كاملاً)</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* ── Speed Adjustment Controls ("just the speed also") ── */}
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Gauge className="w-3.5 h-3.5 text-amber-500" />
                    <span>سرعة الصوت (Speed)</span>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {playbackRate.toFixed(2)}x
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-6 gap-1">
                  {SPEED_PRESETS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                        playbackRate === s
                          ? 'border-amber-500 bg-amber-500 text-stone-950 shadow-sm'
                          : 'border-current/10 hover:border-amber-500/40 opacity-75'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Fine Speed Slider */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => changeSpeed(playbackRate - 0.1)}
                    className="w-6 h-6 rounded-lg border border-current/15 hover:bg-current/10 text-xs font-mono font-bold"
                    title="تقليل 0.1x"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={playbackRate}
                    onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg"
                  />
                  <button
                    onClick={() => changeSpeed(playbackRate + 0.1)}
                    className="w-6 h-6 rounded-lg border border-current/15 hover:bg-current/10 text-xs font-mono font-bold"
                    title="زيادة 0.1x"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Takes History / Previous Recordings */}
          {takes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-current/10">
              <div className="flex items-center justify-between text-xs font-bold opacity-80">
                <span className="flex items-center gap-1.5">
                  <span>سجل التلاوات المسجلة ({takes.length})</span>
                  {isUploadingCloud && (
                    <span className="text-[10px] text-amber-500 animate-pulse font-normal">
                      (جاري الرفع سحابياً...)
                    </span>
                  )}
                </span>
                <span className="text-[10px] opacity-60">متزامنة سحابياً ☁️</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {takes.map((t, idx) => {
                  const isSelected = currentTake?.id === t.id
                  return (
                    <div
                      key={t.id}
                      onClick={() => selectTake(t)}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 font-bold shadow-sm'
                          : 'border-current/10 hover:border-amber-500/40 bg-black/5 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-amber-500 text-stone-950 font-bold'
                              : 'bg-black/10 dark:bg-white/10 opacity-75'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="truncate font-semibold flex items-center gap-1.5">
                            <span>{t.surahName} — آية {t.ayahNumber}</span>
                            {t.isCloudSynced && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-normal" title="محفوظ في تخزين Railway ومتاح على هاتفك">
                                ☁️ سحابي
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] opacity-60 font-mono">
                            {formatTimer(t.duration)} • المحاولة #{takes.length - idx}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadCurrentTake(t)
                          }}
                          className="p-1 rounded-lg hover:bg-current/10 opacity-60 hover:opacity-100"
                          title="تحميل"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => deleteTake(t.id, e)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-500/15 opacity-60 hover:opacity-100"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-3 border-t border-current/10 text-center text-[11px] opacity-60 shrink-0 bg-black/5 dark:bg-white/5">
          💡 يمكنك تسجيل تلاوتك وتكرارها وضبط سرعتها لتحسين نطقك وأحكام التجويد
        </div>
      </aside>

      {/* ── FLOATING MINI PLAYER WIDGET (when side panel is hidden & a take is active or playing) ── */}
      {!isOpen && (isPlayingRecorded || currentTake) && currentTake && (
        <div
          className="fixed left-3 sm:left-5 bottom-5 z-40 flex items-center gap-2.5 p-2.5 pr-3.5 rounded-2xl bg-stone-900/95 dark:bg-stone-850/95 text-white border border-amber-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 select-none"
          dir="rtl"
        >
          {/* Play / Pause button */}
          <button
            onClick={playRecorded}
            className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center font-bold shadow-md active:scale-95 transition-transform shrink-0"
            title={isPlayingRecorded ? 'إيقاف مؤقت' : 'تشغيل التسجيل'}
          >
            {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Info & Timer */}
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 truncate">
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{currentTake.surahName} — آية {currentTake.ayahNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-stone-300 font-mono">
              <span>{formatTimer(playbackTime)} / {formatTimer(playbackDuration)}</span>
              <span className="px-1 py-0.2 rounded bg-white/10 font-bold">{playbackRate.toFixed(2)}x</span>
            </div>
          </div>

          {/* Speed toggle quick */}
          <button
            onClick={() => {
              const nextSpeed =
                playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 0.75 : 1
              changeSpeed(nextSpeed)
            }}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-amber-300 shrink-0"
            title="تغيير سرعة الصوت"
          >
            {playbackRate.toFixed(2)}x
          </button>

          {/* Button to reopen recording panel */}
          {onOpen && (
            <button
              onClick={onOpen}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold shrink-0 transition-colors"
              title="فتح استوديو التسجيل الكامل"
            >
              الاستوديو
            </button>
          )}

          {/* Close / stop take button */}
          <button
            onClick={() => {
              if (playbackAudioRef.current) {
                playbackAudioRef.current.pause()
              }
              setIsPlayingRecorded(false)
              setCurrentTake(null)
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white shrink-0"
            title="إغلاق مشغل التسجيل"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  )
}
