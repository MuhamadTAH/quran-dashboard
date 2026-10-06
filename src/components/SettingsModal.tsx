import React, { useState } from 'react'
import {
  X,
  Type,
  Sliders,
  RotateCcw,
  Check,
  Bell,
  Smartphone,
  Laptop,
  CheckCircle2,
  Volume2,
  Clock,
  Send,
  Loader2,
} from 'lucide-react'
import { useQuran } from '../context/QuranContext'
import { THEME_CONFIGS } from '../utils/themeStyles'
import type { FontFamily, ThemeMode } from '../types/quran'
import { RECITERS } from '../services/quranService'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    resetFontSize,
    fontFamily,
    setFontFamily,
    setLineSpacing,
    setReadingMode,
    reciter,
    setReciter,
    notificationSettings,
    updateNotificationSettings,
    requestNotifications,
    sendTestNotification,
  } = useQuran()

  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testSentSuccess, setTestSentSuccess] = useState<boolean | null>(null)

  if (!isOpen) return null

  const themeConfig = THEME_CONFIGS[theme]

  const themes: { id: ThemeMode; label: string; desc: string }[] = [
    { id: 'emerald', label: 'الزمردي الكلاسيكي', desc: 'أخضر ملكي مريح مزين بلمسات ذهبية' },
    { id: 'parchment', label: 'ورق المصحف الدافئ', desc: 'ألوان صفحات المصحف التقليدية المريحة للعين' },
    { id: 'dark', label: 'الوضع الليلي الهادئ', desc: 'داكن عميق مناسب للقراءة الليلية دون إجهاد' },
    { id: 'pearl', label: 'اللؤلؤي الناصع', desc: 'تصميم أبيض نقي وواضح عالي التباين' },
  ]

  const fontSizes = [
    { label: 'صغير', size: 24 },
    { label: 'متوسط', size: 32 },
    { label: 'كبير', size: 40 },
    { label: 'كبير جداً', size: 50 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-ui">إعدادات القراءة والمظهر</h3>
              <p className="text-xs opacity-70">خصص حجم الخط ونوعه ومظهر المصحف حسب راحتك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-current/15 hover:bg-current/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Font Size (Crucial User Requirement!) */}
          <div className="space-y-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm font-ui">حجم خط القرآن الكريم</h4>
              </div>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {fontSize} بكسل (px)
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="18"
              max="64"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-black/10 dark:bg-white/10 rounded-lg"
            />

            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {fontSizes.map((preset) => (
                <button
                  key={preset.size}
                  onClick={() => setFontSize(preset.size)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                    fontSize === preset.size
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                      : 'border border-current/10 hover:bg-current/5 opacity-80'
                  }`}
                >
                  {preset.label} ({preset.size})
                </button>
              ))}
            </div>

            {/* Live Preview Box */}
            <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-current/15 text-center overflow-x-hidden">
              <p
                className={`transition-all ${
                  fontFamily === 'scheherazade'
                    ? 'font-quran-scheherazade'
                    : fontFamily === 'noto'
                    ? 'font-quran-noto'
                    : 'font-quran-amiri'
                }`}
                style={{ fontSize: `${fontSize}px` }}
                dir="rtl"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝
              </p>
              <span className="text-[10px] opacity-50 block mt-1">معاينة حية للنص بهذا الحجم</span>
            </div>
          </div>

          {/* Section 2: Font Family */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-ui opacity-90">نوع الخط العربي</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'amiri', name: 'المصحف الأميري', sub: 'الخط القرآني الكلاسيكي الأصيل' },
                { id: 'scheherazade', name: 'خط شهرزاد', sub: 'رسم نسخ واضح ومريح' },
                { id: 'noto', name: 'نسخ حديث', sub: 'خط رقمي نقي وعصري' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id as FontFamily)}
                  className={`p-3 rounded-2xl text-right border transition-all ${
                    fontFamily === f.id
                      ? 'border-amber-500 bg-amber-500/15'
                      : 'border-current/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="font-bold text-sm font-ui">{f.name}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Themes */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-ui opacity-90">مظهر لوحة التحكم (السمات)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3.5 rounded-2xl text-right border transition-all flex items-start justify-between ${
                    theme === t.id
                      ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-400/40'
                      : 'border-current/10 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm font-ui">{t.label}</div>
                    <div className="text-[11px] opacity-65 mt-0.5">{t.desc}</div>
                  </div>
                  {theme === t.id && <Check className="w-4 h-4 text-amber-500 mt-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Audio Reciter */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-ui opacity-90">القارئ الصوتي الافتراضي</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReciter(r)}
                  className={`p-3 rounded-xl text-right border transition-all flex items-center justify-between ${
                    reciter.id === r.id
                      ? 'border-amber-500 bg-amber-500/15 font-bold'
                      : 'border-current/10 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-xs font-ui">{r.arabicName}</span>
                  {reciter.id === r.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Web & Mobile Notifications (إشعارات الهاتف والحاسوب) */}
          <div className="space-y-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm font-ui flex items-center gap-1.5">
                    <span>إشعارات وتنبيهات الهاتف والحاسوب</span>
                    <span className="text-[10px] opacity-60 font-mono">(Web Push)</span>
                  </h4>
                  <p className="text-[11px] opacity-65">
                    تلقي تذكيرات يومية وتنبيهات مراجعة الأخطاء على شاشة هاتفك وجهازك المحمول
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  مفعلة
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-1 rounded-full border border-amber-500/30">
                  غير مفعلة بعد
                </span>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={async () => {
                  const granted = await requestNotifications()
                  if (granted) {
                    await sendTestNotification()
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <span>تفعيل وتصريح الإشعارات</span>
              </button>

              <button
                onClick={async () => {
                  setIsSendingTest(true)
                  setTestSentSuccess(null)
                  const success = await sendTestNotification()
                  setTestSentSuccess(success)
                  setTimeout(() => {
                    setIsSendingTest(false)
                    setTestSentSuccess(null)
                  }, 4000)
                }}
                disabled={isSendingTest}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-current/15 hover:bg-current/10 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isSendingTest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>
                  {testSentSuccess === true
                    ? 'تم إرسال إشعار تجريبي بنجاح! 🔔'
                    : testSentSuccess === false
                    ? 'يرجى السماح بالإشعارات أولاً'
                    : 'إرسال إشعار تجريبي فوري'}
                </span>
              </button>
            </div>

            {/* Toggles list */}
            <div className="space-y-2 pt-2 border-t border-current/10 text-xs">
              {/* 1. Daily Reading Reminder */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-current/10 bg-current/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold">تذكير الورد القرآني اليومي</span>
                    <p className="text-[10px] opacity-65">تنبيه بقراءة وردك اليومي من كتاب الله</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notificationSettings.dailyReminder && (
                    <input
                      type="time"
                      value={notificationSettings.dailyReminderTime || '08:00'}
                      onChange={(e) =>
                        updateNotificationSettings({ dailyReminderTime: e.target.value })
                      }
                      className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 border border-current/15 font-mono text-xs font-bold"
                    />
                  )}
                  <button
                    onClick={() =>
                      updateNotificationSettings({
                        dailyReminder: !notificationSettings.dailyReminder,
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                      notificationSettings.dailyReminder ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        notificationSettings.dailyReminder ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Mistakes Review Reminder */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-current/10 bg-current/5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-[10px] shrink-0">
                    !
                  </div>
                  <div>
                    <span className="font-bold">تذكير مراجعة الأخطاء والمتشابهات</span>
                    <p className="text-[10px] opacity-65">تنبيه لمراجعة الكلمات والآيات المسجلة في سجل الأخطاء لتثبيت الحفظ</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateNotificationSettings({
                      mistakesReminder: !notificationSettings.mistakesReminder,
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notificationSettings.mistakesReminder ? 'bg-red-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      notificationSettings.mistakesReminder ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Adhkar Reminder */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-current/10 bg-current/5">
                <div className="flex items-center gap-2">
                  <div className="text-amber-500 shrink-0">✨</div>
                  <div>
                    <span className="font-bold">تذكير أذكار الصباح والمساء</span>
                    <p className="text-[10px] opacity-65">تنبيه في 07:00 صباحاً و 17:00 مساءً لقراءة الأذكار</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateNotificationSettings({
                      adhkarReminder: !notificationSettings.adhkarReminder,
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notificationSettings.adhkarReminder ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      notificationSettings.adhkarReminder ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Sound Alert Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-current/10 bg-current/5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold">صوت التنبيه المصاحب للإشعار</span>
                    <p className="text-[10px] opacity-65">تشغيل نغمة هادئة ومؤثر صوتي لطيف عند وصول التنبيه</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateNotificationSettings({
                      soundEnabled: !notificationSettings.soundEnabled,
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notificationSettings.soundEnabled ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      notificationSettings.soundEnabled ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Platform notes */}
            <p className="text-[10px] opacity-60 leading-relaxed bg-black/5 dark:bg-white/5 p-2 rounded-xl">
              💡 <span className="font-bold">ملاحظة للأجهزة:</span> يعمل الإشعار مباشرة على أجهزة الكمبيوتر المحمول والمكتبي (Chrome, Edge, Firefox, Safari) وهواتف Android. وعلى أجهزة iPhone و iPad، يعمل بكامل طاقته عند تثبيت الموقع على الشاشة الرئيسية (Add to Home Screen).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-current/10 flex items-center justify-between">
          <button
            onClick={() => {
              resetFontSize()
              setFontFamily('amiri')
              setLineSpacing('relaxed')
              setReadingMode('verse')
            }}
            className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الإعدادات الافتراضية</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
          >
            تم الحفظ
          </button>
        </div>
      </div>
    </div>
  )
}
