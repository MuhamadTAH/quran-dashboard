import React, { useState } from 'react'
import { Lock, KeyRound, Eye, EyeOff, Loader2, Sparkles, ShieldCheck } from 'lucide-react'
import { loginWithPassword } from '../services/apiService'

interface LoginModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess }) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await loginWithPassword(password.trim())
    setIsLoading(false)

    if (res.success) {
      onSuccess()
    } else {
      setErrorMessage(res.error || 'رمز المرور غير صحيح')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      dir="rtl"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/30 text-stone-100 shadow-2xl relative overflow-hidden space-y-6">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header with App Branding */}
        <div className="text-center space-y-2 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-3">
            <Lock className="w-7 h-7 text-stone-950" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-quran-amiri tracking-wide text-amber-400">
            لوحة نور القرآن الكريم
          </h2>
          <p className="text-xs sm:text-sm opacity-70">
            أدخل رمز المرور الشخصي للمتابعة واستعراض تلاواتك وملاحظاتك
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-semibold opacity-80 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>رمز المرور (Password)</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="أدخل رمز المرور الخاص بك..."
                className="w-full py-3 pr-4 pl-12 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 outline-none text-sm transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>تسجيل الدخول وفتح اللوحة</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] opacity-60 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>تسجيلاتك الصوتية تُحفظ سحابياً بأمان ومتاحة على جميع أجهزتك.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
