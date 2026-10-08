import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Storage Paths ─────────────────────────────────────────────────────────────
// Default to /app/data in container (mount point for Railway Volume) or local ./data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const RECORDINGS_DIR = path.join(DATA_DIR, 'recordings')
const DB_FILE = path.join(DATA_DIR, 'recordings.json')

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true })
}

// Ensure recordings database file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]), 'utf8')
}

// ── Helpers for Recordings JSON Database ─────────────────────────────────────
function readRecordings() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error reading recordings DB:', err)
    return []
  }
}

function writeRecordings(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.error('Error writing recordings DB:', err)
  }
}

// ── Auth Token Helpers ────────────────────────────────────────────────────────
const APP_PASSWORD = (process.env.APP_PASSWORD || '').trim()
const SERVER_SECRET = process.env.SERVER_SECRET || 'quran-dashboard-secret-key-2026'

function generateToken() {
  const payload = `auth_${Date.now()}_${APP_PASSWORD}`
  return crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex')
}

// In-memory set of valid tokens (or token prefix validation)
const validTokens = new Set()

function verifyAuth(req) {
  if (!APP_PASSWORD) return true // No password configured, open access
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false
  return validTokens.has(token)
}

function authMiddleware(req, res, next) {
  if (verifyAuth(req)) {
    return next()
  }
  return res.status(401).json({ error: 'Unauthorized: invalid or missing token' })
}

// ── Express Application ──────────────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

// Healthcheck endpoints for Railway
app.get('/health', (req, res) => res.status(200).send('OK'))
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }))

// Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, RECORDINGS_DIR)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.webm'
    const uniqueId = `take_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    cb(null, `${uniqueId}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for recitations
})

// ── Auth Endpoints ───────────────────────────────────────────────────────────
// Check auth status
app.get('/api/auth/check', (req, res) => {
  const isPasswordRequired = !!APP_PASSWORD
  const isAuthenticated = verifyAuth(req)
  res.json({
    isPasswordRequired,
    isAuthenticated,
  })
})

// Login with password
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {}
  if (!APP_PASSWORD) {
    const token = generateToken()
    validTokens.add(token)
    return res.json({ success: true, token, message: 'No password required' })
  }

  if (password === APP_PASSWORD) {
    const token = generateToken()
    validTokens.add(token)
    return res.json({ success: true, token })
  }

  return res.status(401).json({ success: false, error: 'Incorrect password' })
})

// ── Recordings Endpoints ─────────────────────────────────────────────────────
// List all recordings
app.get('/api/recordings', authMiddleware, (req, res) => {
  const recordings = readRecordings()
  // Add audioUrl property for streaming
  const mapped = recordings.map((r) => ({
    ...r,
    audioUrl: `/api/recordings/${r.id}/audio`,
  }))
  res.json({ success: true, takes: mapped })
})

// Upload a new recording take
app.post('/api/recordings', authMiddleware, upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' })
  }

  const surahNumber = parseInt(req.body.surahNumber || '1', 10)
  const ayahNumber = parseInt(req.body.ayahNumber || '1', 10)
  const surahName = req.body.surahName || `سورة ${surahNumber}`
  const duration = parseFloat(req.body.duration || '0')
  const title = req.body.title || ''

  const filename = req.file.filename
  const id = path.basename(filename, path.extname(filename))

  const newTake = {
    id,
    surahNumber,
    surahName,
    ayahNumber,
    duration,
    title,
    filename,
    mimeType: req.file.mimetype || 'audio/webm',
    fileSize: req.file.size,
    createdAt: Date.now(),
  }

  const list = readRecordings()
  list.unshift(newTake)
  writeRecordings(list)

  res.status(201).json({
    success: true,
    take: {
      ...newTake,
      audioUrl: `/api/recordings/${id}/audio`,
    },
  })
})

// Stream audio file with Range support
app.get('/api/recordings/:id/audio', (req, res) => {
  const { id } = req.params
  const list = readRecordings()
  const take = list.find((t) => t.id === id)

  if (!take) {
    return res.status(404).json({ error: 'Recording not found' })
  }

  const filePath = path.join(RECORDINGS_DIR, take.filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file missing on disk' })
  }

  // Set proper headers
  res.setHeader('Content-Type', take.mimeType || 'audio/webm')
  res.setHeader('Accept-Ranges', 'bytes')

  // Express sendFile handles Range headers (HTTP 206 Partial Content) automatically
  res.sendFile(filePath)
})

// Delete a recording take
app.delete('/api/recordings/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const list = readRecordings()
  const take = list.find((t) => t.id === id)

  if (!take) {
    return res.status(404).json({ error: 'Recording not found' })
  }

  // Delete file from disk
  const filePath = path.join(RECORDINGS_DIR, take.filename)
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
    } catch (e) {
      console.warn('Failed to delete file from disk:', e)
    }
  }

  // Remove from JSON list
  const updated = list.filter((t) => t.id !== id)
  writeRecordings(updated)

  res.json({ success: true, message: 'Recording deleted successfully' })
})

// ── Serve Production Frontend ─────────────────────────────────────────────────
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'))
    }
    next()
  })
}

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Quran Dashboard] Server running on port ${PORT}`)
  console.log(`[Storage] Data dir: ${DATA_DIR}`)
  console.log(`[Auth] Password protection: ${APP_PASSWORD ? 'ENABLED' : 'DISABLED'}`)
})
