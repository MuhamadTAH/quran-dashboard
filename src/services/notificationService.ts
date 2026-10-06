import type { NotificationSettings } from '../types/quran'

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  dailyReminderTime: '08:30',
  adhkarReminder: true,
  mistakesReminder: true,
  soundEnabled: true,
}

let swRegistration: ServiceWorkerRegistration | null = null

// Initialize Service Worker for Mobile and Desktop background notification handling
export async function initNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    swRegistration = reg
    return reg
  } catch (err) {
    console.warn('Service worker registration failed:', err)
    return null
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'

  try {
    const perm = await Notification.requestPermission()
    return perm
  } catch (err) {
    console.error('Error requesting notification permission:', err)
    return 'denied'
  }
}

export async function sendNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<boolean> {
  if (!isNotificationSupported()) return false

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission()
    if (perm !== 'granted') return false
  }

  const defaultOptions: NotificationOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    dir: 'rtl',
    lang: 'ar',
    ...options,
  }

  // Priority 1: Service Worker registration (Works on Mobile Chrome, Android, iOS PWA, and Desktop)
  try {
    if ('serviceWorker' in navigator) {
      const reg = swRegistration || (await navigator.serviceWorker.ready)
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, defaultOptions)
        return true
      }
    }
  } catch (swErr) {
    console.warn('Service worker showNotification fallback:', swErr)
  }

  // Priority 2: Direct browser Notification constructor (Standard Desktop)
  try {
    new Notification(title, defaultOptions)
    return true
  } catch (directErr) {
    console.error('Desktop Notification error:', directErr)
    return false
  }
}

// Send an immediate test notification to confirm it works on mobile or laptop
export async function sendTestNotification(): Promise<boolean> {
  return sendNotification('✨ لوحة نور القرآن — إشعار تجريبي', {
    body: 'تم تفعيل الإشعارات بنجاح على جهازك (حاسوبك وهاتفك)! ستصلك تنبيهات الورد اليومي ومراجعة الأخطاء.',
    tag: 'test_notification',
  })
}

// Check and trigger scheduled reminders (called periodically when app is open)
export function checkScheduledReminders(
  settings: NotificationSettings,
  totalMistakesCount: number = 0
) {
  if (!settings.enabled || getNotificationPermission() !== 'granted') return

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const currentHour = now.getHours()
  const currentMin = now.getMinutes()
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`

  // 1. Daily Quran reading reminder
  if (settings.dailyReminder && settings.dailyReminderTime === currentTimeStr) {
    const lastDaily = localStorage.getItem('last_daily_quran_notification')
    if (lastDaily !== todayStr) {
      sendNotification('📖 تذكير الورد القرآني اليومي', {
        body: 'لا تنسَ نصيبك من قراءة كتاب الله اليوم. «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ».',
        tag: 'daily_quran_reminder',
      })
      localStorage.setItem('last_daily_quran_notification', todayStr)
    }
  }

  // 2. Mistakes & Memorization review reminder (e.g. at 17:00 / 5 PM)
  if (settings.mistakesReminder && currentHour === 17 && currentMin === 0) {
    const lastMistakesNotif = localStorage.getItem('last_mistakes_notification')
    if (lastMistakesNotif !== todayStr && totalMistakesCount > 0) {
      sendNotification('⚠️ مراجعة أخطاء الحفظ والتلاوة', {
        body: `لديك ${totalMistakesCount} موضع مسجل للمراجعة والتثبيت. راجع أخطاءك اليوم لتثبيت حفظك!`,
        tag: 'mistakes_review_reminder',
      })
      localStorage.setItem('last_mistakes_notification', todayStr)
    }
  }

  // 3. Adhkar reminders (Morning at 06:30, Evening at 18:00)
  if (settings.adhkarReminder) {
    if (currentHour === 6 && currentMin === 30) {
      const lastMorning = localStorage.getItem('last_morning_adhkar_notification')
      if (lastMorning !== todayStr) {
        sendNotification('☀️ أذكار الصباح', {
          body: 'أصبحنا وأصبح الملك لله.. حان وقت أذكار الصباح لحفظك ويوم مبارك.',
          tag: 'morning_adhkar_reminder',
        })
        localStorage.setItem('last_morning_adhkar_notification', todayStr)
      }
    } else if (currentHour === 18 && currentMin === 0) {
      const lastEvening = localStorage.getItem('last_evening_adhkar_notification')
      if (lastEvening !== todayStr) {
        sendNotification('🌙 أذكار المساء', {
          body: 'أمسينا وأمسى الملك لله.. حان وقت أذكار المساء والسكينة.',
          tag: 'evening_adhkar_reminder',
        })
        localStorage.setItem('last_evening_adhkar_notification', todayStr)
      }
    }
  }
}
