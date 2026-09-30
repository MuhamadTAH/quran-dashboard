import type { ThemeMode } from '../types/quran'

export interface ThemeColors {
  name: string
  bg: string
  bgCard: string
  bgHeader: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  accent: string
  accentHover: string
  accentBg: string
  accentBorder: string
  ayahMarker: string
  ayahActive: string
  badgeBg: string
  badgeText: string
  cardHover: string
}

export const THEME_CONFIGS: Record<ThemeMode, ThemeColors> = {
  emerald: {
    name: 'الزمردي الإسلامي',
    bg: 'bg-emerald-950/20 text-emerald-950',
    bgCard: 'bg-white border-emerald-900/10 shadow-sm',
    bgHeader: 'bg-emerald-900 text-amber-50',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-emerald-900 font-medium',
    textMuted: 'text-stone-500',
    border: 'border-emerald-800/15',
    accent: 'bg-emerald-700 text-white hover:bg-emerald-800',
    accentHover: 'hover:bg-emerald-50',
    accentBg: 'bg-emerald-50 text-emerald-800',
    accentBorder: 'border-emerald-300',
    ayahMarker: 'text-amber-600 border-amber-600/40 bg-amber-50',
    ayahActive: 'bg-amber-100/60 ring-2 ring-amber-400',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    badgeText: 'text-emerald-800',
    cardHover: 'hover:border-emerald-500/50 hover:shadow-md',
  },
  parchment: {
    name: 'ورق المصحف الدافئ',
    bg: 'bg-[#faf6ee] text-[#2c221a]',
    bgCard: 'bg-[#f5edd9] border-[#e2d5bd] shadow-sm',
    bgHeader: 'bg-[#4a3b2c] text-[#f7eedc]',
    textPrimary: 'text-[#2b2118]',
    textSecondary: 'text-[#875127] font-medium',
    textMuted: 'text-[#7d6f62]',
    border: 'border-[#dfd1b5]',
    accent: 'bg-[#925a2b] text-white hover:bg-[#78471e]',
    accentHover: 'hover:bg-[#efe4cb]',
    accentBg: 'bg-[#ede1c7] text-[#6e3c16]',
    accentBorder: 'border-[#d0be9a]',
    ayahMarker: 'text-[#a2682a] border-[#a2682a]/50 bg-[#faefd9]',
    ayahActive: 'bg-[#e9dab8] ring-2 ring-[#a2682a]',
    badgeBg: 'bg-[#e4d4b4] text-[#5c3716]',
    badgeText: 'text-[#5c3716]',
    cardHover: 'hover:border-[#a2682a]/60 hover:shadow-md',
  },
  dark: {
    name: 'الوضع الليلي الهادئ',
    bg: 'bg-[#0b0f17] text-[#e2e8f0]',
    bgCard: 'bg-[#131b2e] border-slate-800/80 shadow-sm',
    bgHeader: 'bg-[#0f172a] text-amber-200 border-b border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-amber-400 font-medium',
    textMuted: 'text-slate-400',
    border: 'border-slate-800',
    accent: 'bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400',
    accentHover: 'hover:bg-slate-800',
    accentBg: 'bg-amber-500/10 text-amber-300',
    accentBorder: 'border-amber-500/30',
    ayahMarker: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    ayahActive: 'bg-amber-950/40 ring-2 ring-amber-500/70',
    badgeBg: 'bg-slate-800 text-amber-300',
    badgeText: 'text-amber-300',
    cardHover: 'hover:border-amber-500/40 hover:shadow-md',
  },
  pearl: {
    name: 'اللؤلؤي الأبيض',
    bg: 'bg-slate-50 text-slate-900',
    bgCard: 'bg-white border-slate-200 shadow-sm',
    bgHeader: 'bg-white text-slate-900 border-b border-slate-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-teal-700 font-medium',
    textMuted: 'text-slate-500',
    border: 'border-slate-200',
    accent: 'bg-teal-600 text-white hover:bg-teal-700',
    accentHover: 'hover:bg-slate-100',
    accentBg: 'bg-teal-50 text-teal-800',
    accentBorder: 'border-teal-300',
    ayahMarker: 'text-teal-700 border-teal-600/40 bg-teal-50',
    ayahActive: 'bg-teal-50 ring-2 ring-teal-500',
    badgeBg: 'bg-slate-100 text-slate-800',
    badgeText: 'text-slate-800',
    cardHover: 'hover:border-teal-400 hover:shadow-md',
  },
}
