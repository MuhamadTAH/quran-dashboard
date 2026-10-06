import React, { useState, useEffect } from 'react'
import type { ThemeColors } from '../utils/themeStyles'
import {
  Bot,
  Sparkles,
  Send,
  X,
  Copy,
  Check,
  StickyNote,
  BookOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { askQuranAi } from '../services/aiService'

interface AiAskModalProps {
  isOpen: boolean
  onClose: () => void
  surahNumber: number
  surahName: string
  ayahNumber: number
  ayahText: string
  wordText?: string
  themeConfig: ThemeColors
  onSaveAsNote: (text: string) => void
}

export const AiAskModal: React.FC<AiAskModalProps> = ({
  isOpen,
  onClose,
  surahNumber,
  surahName,
  ayahNumber,
  ayahText,
  wordText,
  themeConfig,
  onSaveAsNote,
}) => {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedToNotes, setSavedToNotes] = useState(false)

  // Reset state when target changes
  useEffect(() => {
    if (isOpen) {
      setQuestion('')
      setAnswer(null)
      setError(null)
      setCopied(false)
      setSavedToNotes(false)
    }
  }, [isOpen, wordText, ayahNumber, surahNumber])

  if (!isOpen) return null

  // Suggestions based on whether a specific word or entire ayah is targeted
  const wordSuggestions = [
    'لماذا كُتبت هكذا في الرسم العثماني؟',
    'ما معناها اللغوي وسياقها في الآية؟',
    'ما إعراب هذه الكلمة بالتفصيل؟',
    'كيف أتعرف عليها وأحكام نطقها وتجويدها؟',
  ]

  const ayahSuggestions = [
    'ما هو التفسير الميسر وأبرز دلالات الآية؟',
    'ما سبب نزول هذه الآية الكريمة؟',
    'ما هي اللطائف البلاغية والبيانية فيها؟',
    'ما أبرز هدايات الآية وتطبيقاتها في حياتنا؟',
  ]

  const suggestions = wordText ? wordSuggestions : ayahSuggestions

  const handleSend = async (customQ?: string) => {
    const qToSend = customQ || question
    if (!qToSend.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setSavedToNotes(false)

    try {
      const response = await askQuranAi({
        surahNumber,
        surahName,
        ayahNumber,
        ayahText,
        wordText,
        question: qToSend.trim(),
      })
      setAnswer(response)
    } catch (err: any) {
      setError(err.message || 'تعذر الحصول على إجابة، يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!answer) return
    navigator.clipboard.writeText(answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveToNotes = () => {
    if (!answer) return
    const noteContent = wordText
      ? `[سؤال الذكاء الاصطناعي حول "${wordText}"]: ${question || 'سؤال'}\n\n${answer}`
      : `[سؤال الذكاء الاصطناعي]: ${question || 'سؤال'}\n\n${answer}`
    onSaveAsNote(noteContent)
    setSavedToNotes(true)
    setTimeout(() => setSavedToNotes(false), 3000)
  }

  // Simple Markdown renderer for readable formatting
  const renderFormattedAnswer = (text: string) => {
    const lines = text.split('\n')
    return (
      <div className="space-y-2 text-right leading-relaxed font-ui">
        {lines.map((line, i) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={i} className="h-1.5" />

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={i} className="font-bold text-sm text-purple-700 dark:text-purple-300 pt-2 border-b border-current/10 pb-1">
                {trimmed.replace('### ', '')}
              </h4>
            )
          }
          if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            return (
              <h3 key={i} className="font-bold text-base text-purple-800 dark:text-purple-200 pt-2 border-b border-current/10 pb-1">
                {trimmed.replace(/^#+\s*/, '')}
              </h3>
            )
          }

          // Bullets
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const content = trimmed.replace(/^[\*\-•]\s*/, '')
            return (
              <div key={i} className="flex items-start gap-2 pr-2">
                <span className="text-purple-500 font-bold mt-1 text-xs">•</span>
                <span className="flex-1 text-sm">{renderInlineFormatting(content)}</span>
              </div>
            )
          }

          // Separator line
          if (trimmed === '---' || trimmed === '***') {
            return <div key={i} className="h-px bg-current/10 my-2" />
          }

          return (
            <p key={i} className="text-sm">
              {renderInlineFormatting(trimmed)}
            </p>
          )
        })}
      </div>
    )
  }

  const renderInlineFormatting = (content: string) => {
    // Bold formatting: **bold** or __bold__
    const parts = content.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-purple-900 dark:text-purple-200 bg-purple-500/10 px-1 rounded">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl ${themeConfig.bgCard} border ${themeConfig.border} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-current/10 bg-gradient-to-l from-purple-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-ui">المساعد القرآني الذكي</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs opacity-60 font-ui">
                {wordText ? `سؤال حول كلمة: ${wordText}` : `سؤال حول الآية ${ayahNumber} من ${surahName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Target Ayah & Word Context Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                سورة {surahName} (رقم {surahNumber}) — الآية {ayahNumber}
              </span>
              <span className="text-[11px] opacity-60 font-mono">
                ﴿الآية {ayahNumber}﴾
              </span>
            </div>

            {/* Ayah full text */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold opacity-60 block">
                الآية كاملة (Ayah):
              </span>
              <p className="font-quran-amiri text-base sm:text-lg leading-relaxed text-right text-current/90 select-text p-2 rounded-xl bg-current/5 border border-current/10">
                « {ayahText} »
              </p>
            </div>

            {/* Selective / Question about */}
            {wordText && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                  الجزء المختار / السؤال عنه (Selective / Question about):
                </span>
                <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 font-quran-amiri text-base text-purple-900 dark:text-purple-200 font-bold">
                  « {wordText} »
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs opacity-65 font-ui">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>أسئلة مقترحة سريعة (انقر للسؤال مباشرة):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(sug)
                    handleSend(sug)
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/25 transition-all text-right disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input Box */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={isLoading}
                placeholder={
                  wordText
                    ? `اكتب سؤالك هنا عن "${wordText}" (مثال: لماذا كُتبت بالرسم العثماني هكذا؟ أو كيف أتعرف عليها؟)...`
                    : 'اكتب سؤالك هنا عن هذه الآية الكريمة...'
                }
                rows={2}
                className={`w-full resize-none rounded-2xl border border-current/20 ${themeConfig.bgCard} p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 leading-relaxed font-ui`}
              />
              <button
                onClick={() => handleSend()}
                disabled={!question.trim() || isLoading}
                className="absolute left-2.5 bottom-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/25 disabled:opacity-40 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التفكير...</span>
                  </>
                ) : (
                  <>
                    <span>إرسال</span>
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] opacity-50 px-1 font-ui">
              💡 اضغط Enter للإرسال السريع، أو اختر أحد الأسئلة المقترحة أعلاه.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 font-ui">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold">خطأ في استجابة الذكاء الاصطناعي</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator Card */}
          {isLoading && !answer && (
            <div className="p-8 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-center space-y-3 animate-pulse">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 animate-spin">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 font-ui">
                جاري تحليل الآية والرسم والبحث في علوم القرآن...
              </p>
            </div>
          )}

          {/* AI Response Card */}
          {answer && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-xs sm:text-sm text-purple-900 dark:text-purple-200 font-ui">
                    إجابة المساعد القرآني
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg border border-current/10 hover:bg-current/10 text-xs flex items-center gap-1 transition-colors"
                    title="نسخ الإجابة"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px] hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                  <button
                    onClick={handleSaveToNotes}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                      savedToNotes
                        ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                        : 'border-current/10 hover:bg-current/10'
                    }`}
                    title="حفظ في ملاحظاتي"
                  >
                    <StickyNote className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-[11px] hidden sm:inline">{savedToNotes ? 'تم الحفظ!' : 'حفظ بالملاحظات'}</span>
                  </button>
                </div>
              </div>

              {/* Rendered answer text */}
              <div className="select-text pt-1">
                {renderFormattedAnswer(answer)}
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-3 sm:p-4 border-t border-current/10 flex items-center justify-between bg-black/5 dark:bg-white/5 text-xs">
          <span className="opacity-50 text-[11px] font-ui">
            مدعوم بنموذج Google Gemini 3.8 Flash عبر gemini-web2api
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-current/15 hover:bg-current/10 font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
