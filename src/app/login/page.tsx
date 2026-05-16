'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Shield, ArrowRight, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'

type Step = 'phone' | 'otp'

const ROLE_DASHBOARD: Record<string, string> = {
  orchard: '/orchard/dashboard',
  wholesaler: '/wholesaler/dashboard',
  retailer: '/retailer/dashboard',
  consumer: '/consumer/dashboard',
  admin: '/admin/dashboard',
}

export default function LoginPage() {
  const { language, setUser } = useAppStore()
  const tr = t[language]
  const router = useRouter()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(raw: string) {
    // Convert to E.164: +601XXXXXXXX
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('60')) return `+${digits}`
    if (digits.startsWith('0')) return `+6${digits}`
    return `+60${digits}`
  }

  async function handleSendOtp() {
    setError('')
    if (!phone.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const formatted = formatPhone(phone)
      const { error: err } = await supabase.auth.signInWithOtp({ phone: formatted })
      if (err) throw err
      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    setError('')
    if (!otp.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const formatted = formatPhone(phone)
      const { data, error: err } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      })
      if (err) throw err

      // Fetch sbm_users profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('sbm_users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single()

        if (profile) {
          setUser(profile)
          router.push(ROLE_DASHBOARD[profile.role] || '/')
        } else {
          // New user, redirect to register
          router.push('/register')
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍈</div>
          <h1 className="text-2xl font-bold text-white">{tr.loginTitle}</h1>
          <p className="text-gray-400 text-sm mt-2">
            {language === 'zh' ? '还没有账号？' : language === 'en' ? "Don't have an account?" : 'Belum ada akaun?'}{' '}
            <Link href="/register" className="text-brand-gold hover:underline">{tr.register}</Link>
          </p>
        </div>

        <div className="card">
          {step === 'phone' ? (
            <div className="space-y-5">
              <div>
                <label className="label">{tr.phone}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder={language === 'zh' ? '例：0123456789' : 'e.g. 0123456789'}
                    className="input pl-11"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'zh' ? '马来西亚手机号，系统会发送验证码' : language === 'en' ? 'Malaysian phone number. An OTP will be sent.' : 'Nombor telefon Malaysia. OTP akan dihantar.'}
                </p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={loading || !phone.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {tr.sendOtp}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <Shield size={40} className="text-brand-gold mx-auto mb-3" />
                <p className="text-gray-300 text-sm">
                  {language === 'zh' ? `验证码已发送至 ${phone}` : language === 'en' ? `OTP sent to ${phone}` : `OTP dihantar ke ${phone}`}
                </p>
              </div>

              <div>
                <label className="label">{tr.otp}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  placeholder="6 digit code"
                  className="input text-center text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : null}
                {tr.verifyOtp}
              </button>

              <button
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                {tr.back}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
