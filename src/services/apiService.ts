// ── API & Cloud Sync Service for Railway Storage and Auth ───────────────────

export interface CloudRecordingTake {
  id: string
  surahNumber: number
  surahName: string
  ayahNumber: number
  audioUrl: string
  duration: number
  createdAt: number
  title?: string
  fileSize?: number
  mimeType?: string
}

const AUTH_TOKEN_KEY = 'quran_auth_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ── Auth Endpoints ───────────────────────────────────────────────────────────
export async function checkAuthStatus(): Promise<{
  isPasswordRequired: boolean
  isAuthenticated: boolean
}> {
  try {
    const res = await fetch('/api/auth/check', {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      return { isPasswordRequired: false, isAuthenticated: true }
    }
    const data = await res.json()
    return {
      isPasswordRequired: Boolean(data.isPasswordRequired),
      isAuthenticated: Boolean(data.isAuthenticated),
    }
  } catch (err) {
    // If running offline or dev without backend, assume authenticated
    return { isPasswordRequired: false, isAuthenticated: true }
  }
}

export async function loginWithPassword(password: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (res.ok && data.success && data.token) {
      setAuthToken(data.token)
      return { success: true }
    }
    return { success: false, error: data.error || 'كلمة المرور غير صحيحة' }
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر الاتصال بالسيرفر' }
  }
}

// ── Recordings Endpoints ─────────────────────────────────────────────────────
export async function fetchRecordingsFromCloud(): Promise<CloudRecordingTake[]> {
  try {
    const res = await fetch('/api/recordings', {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.takes || []
  } catch (err) {
    console.warn('Failed to load cloud recordings:', err)
    return []
  }
}

export async function uploadRecordingToCloud(
  blob: Blob,
  meta: {
    surahNumber: number
    surahName: string
    ayahNumber: number
    duration: number
    title?: string
  }
): Promise<CloudRecordingTake | null> {
  try {
    const formData = new FormData()
    formData.append('audio', blob, `recitation_${Date.now()}.webm`)
    formData.append('surahNumber', meta.surahNumber.toString())
    formData.append('surahName', meta.surahName)
    formData.append('ayahNumber', meta.ayahNumber.toString())
    formData.append('duration', meta.duration.toString())
    if (meta.title) formData.append('title', meta.title)

    const res = await fetch('/api/recordings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!res.ok) {
      console.warn('Failed to upload recording, server returned status:', res.status)
      return null
    }

    const data = await res.json()
    return data.take || null
  } catch (err) {
    console.warn('Failed to upload recording to cloud:', err)
    return null
  }
}

export async function deleteRecordingFromCloud(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/recordings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return res.ok
  } catch (err) {
    console.warn('Failed to delete cloud recording:', err)
    return false
  }
}
