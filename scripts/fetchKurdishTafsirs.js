import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const surahsFile = path.join(rootDir, 'src', 'data', 'surahs.json')
const surahs = JSON.parse(fs.readFileSync(surahsFile, 'utf-8'))

const tafsirBaseDir = path.join(rootDir, 'public', 'data', 'tafsir')
const ramanDir = path.join(tafsirBaseDir, 'raman')
const reberDir = path.join(tafsirBaseDir, 'reber')
const asanDir = path.join(tafsirBaseDir, 'asan')
const puxtaDir = path.join(tafsirBaseDir, 'puxta')

for (const dir of [ramanDir, reberDir, asanDir, puxtaDir]) {
  fs.mkdirSync(dir, { recursive: true })
}

function cleanHtmlTags(str) {
  if (!str) return ''
  return str
    .replace(/<span class="saw">(.*?)<\/span>/gi, '($1)')
    .replace(/<span class="arabic uthmani">(.*?)<\/span>/gi, '[$1]')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function processLineBasedTafsir(url, targetDir, name) {
  console.log(`Fetching ${name}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.statusText}`)
  const text = await res.text()
  const lines = text.split('\n').map((l) => l.trim())

  let lineOffset = 0
  for (const surah of surahs) {
    const sNum = surah.number
    const count = surah.numberOfAyahs
    const ayahMap = {}

    for (let a = 1; a <= count; a++) {
      const line = lines[lineOffset] || ''
      ayahMap[a] = line.replace(/^\d+[\s\-:]+/, '').trim()
      lineOffset++
    }

    const outPath = path.join(targetDir, `${sNum}.json`)
    fs.writeFileSync(outPath, JSON.stringify({ surah: sNum, ayahs: ayahMap }), 'utf-8')
  }
  console.log(`Saved ${name} for all 114 surahs to ${targetDir}`)
}

async function processReberTafsir() {
  console.log('Fetching Reber Kurdish Tafsir from Quran.com API...')
  for (let sNum = 1; sNum <= 114; sNum++) {
    const outPath = path.join(reberDir, `${sNum}.json`)
    if (fs.existsSync(outPath)) {
      continue
    }

    try {
      const url = `https://api.quran.com/api/v4/verses/by_chapter/${sNum}?tafsirs=804&per_page=300`
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`Surah ${sNum} failed: ${res.statusText}`)
        continue
      }
      const data = await res.json()
      const ayahMap = {}

      if (data.verses) {
        for (const v of data.verses) {
          const aNum = v.verse_number
          const tafsirObj = v.tafsirs && v.tafsirs[0]
          const tafsirText = tafsirObj ? cleanHtmlTags(tafsirObj.text) : ''
          ayahMap[aNum] = tafsirText
        }
      }

      fs.writeFileSync(outPath, JSON.stringify({ surah: sNum, ayahs: ayahMap }), 'utf-8')
      if (sNum % 10 === 0 || sNum === 114) {
        console.log(`Saved Reber Tafsir through Surah ${sNum}/114`)
      }
    } catch (err) {
      console.warn(`Error on Surah ${sNum}:`, err.message)
    }
  }
  console.log('Saved Reber Kurdish Tafsir for all surahs.')
}

async function main() {
  try {
    await processLineBasedTafsir(
      'https://raw.githubusercontent.com/0xdolan/kurdish_quran/master/txt/translation_raman.txt',
      ramanDir,
      'Raman (ڕامان)'
    )
    await processLineBasedTafsir(
      'https://raw.githubusercontent.com/0xdolan/kurdish_quran/master/txt/translation_asan.txt',
      asanDir,
      'Asan (ئاسان)'
    )
    await processLineBasedTafsir(
      'https://raw.githubusercontent.com/0xdolan/kurdish_quran/master/txt/translation_puxta.txt',
      puxtaDir,
      'Puxta (پوختە)'
    )
    await processReberTafsir()
    console.log('All Kurdish Tafsirs processed successfully!')
  } catch (err) {
    console.error('Fatal error in download:', err)
  }
}

main()
