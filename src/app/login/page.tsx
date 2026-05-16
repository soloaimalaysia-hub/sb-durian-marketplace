'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, Lock, Shield, ArrowRight, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'

type Step = 'input' | 'otp'
type Method = 'phone' | 'email' | 'password'

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

  const [step, setStep] = useState<Step>('input')
  const [method, setMethod] = useState<Method>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('60')) return `+${digits}`
    if (digits.startsWith('0')) return `+6${digits}`
    return `+60${digits}`
  }

  async function handlePasswordLogin() {
    setError('')
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (err) throw err
      if (data.user) {
        const { data: profile } = await supabase
          .from('sbm_users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single()
        if (profile) {
          setUser(profile)
          if (['super_admin', 'platform_admin'].includes(profile.platform_role ?? '')) {
            router.push('/admin/dashboard')
            return
          }
          router.push(ROLE_DASHBOARD[profile.role] || '/')
        } else {
          router.push('/register')
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      if (method === 'phone') {
        if (!phone.trim()) return
        const { error: err } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) })
        if (err) throw err
      } else {
        if (!email.trim()) return
        const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() })
        if (err) throw err
      }
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
      let data, err

      if (method === 'phone') {
        const res = await supabase.auth.verifyOtp({
          phone: formatPhone(phone),
          token: otp,
          type: 'sms',
        })
        data = res.data; err = res.error
      } else {
        const res = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otp,
          type: 'email',
        })
        data = res.data; err = res.error
      }

      if (err) throw err

      if (data?.user) {
        const { data: profile } = await supabase
          .from('sbm_users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single()

        if (profile) {
          setUser(profile)
          // Admin users go to admin dashboard
          if (['super_admin', 'platform_admin'].includes(profile.platform_role ?? '')) {
            router.push('/admin/dashboard')
            return
          }
          router.push(ROLE_DASHBOARD[profile.role] || '/')
        } else {
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
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍈</div>
          <h1 className="text-2xl font-bold text-white">{tr.loginTitle}</h1>
          <p className="text-gray-400 text-sm mt-2">
            {label('还没有账号？', "Don't have an account?", 'Belum ada akaun?')}{' '}
            <Link href="/register" className="text-brand-gold hover:underline">{tr.register}</Link>
          </p>
        </div>

        <div className="card">
          {step === 'input' ? (
            <div className="space-y-5">
              {/* Method toggle */}
              <div className="flex rounded-xl overflow-hidden border border-brand-dark-border">
                <button
                  onClick={() => { setMethod('phone'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${method === 'phone' ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:text-white'}`}
                >
                  <Phone size={13} />
                  {label('手机', 'Phone', 'Telefon')}
                </button>
                <button
                  onClick={() => { setMethod('email'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${method === 'email' ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:text-white'}`}
                >
                  <Mail size={13} />
                  {label('邮箱OTP', 'Email OTP', 'OTP Emel')}
                </button>
                <button
                  onClick={() => { setMethod('password'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${method === 'password' ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:text-white'}`}
                >
                  <Lock size={13} />
                  {label('密码', 'Password', 'Kata Laluan')}
                </button>
              </div>

              {method === 'phone' && (
                <div>
                  <label className="label">{tr.phone}</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      placeholder={label('例：0123456789', 'e.g. 0123456789', 'cth. 0123456789')}
                      className="input pl-11"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {method === 'email' && (
                <div>
                  <label className="label">{label('电子邮箱', 'Email Address', 'Alamat Emel')}</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      placeholder="email@example.com"
                      className="input pl-11"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {label('验证码将发送到你的邮箱', 'OTP will be sent to your email', 'OTP akan dihantar ke emel anda')}
                  </p>
                </div>
              )}

              {method === 'password' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">{label('电子邮箱', 'Email', 'Emel')}</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                        placeholder="email@example.com"
                        className="input pl-11"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">{label('密码', 'Password', 'Kata Laluan')}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                        placeholder="••••••••"
                        className="input pl-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {method === 'password' ? (
                <button
                  onClick={handlePasswordLogin}
                  disabled={loading || !email.trim() || !password.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {label('登录', 'Login', 'Log Masuk')}
                </button>
              ) : (
              <button
                onClick={handleSendOtp}
                disabled={loading || (method === 'phone' ? !phone.trim() : !email.trim())}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {tr.sendOtp}
              </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <Shield size={40} className="text-brand-gold mx-auto mb-3" />
                <p className="text-gray-300 text-sm">
                  {method === 'phone'
                    ? label(`验证码已发送至 ${phone}`, `OTP sent to ${phone}`, `OTP dihantar ke ${phone}`)
                    : label(`验证码已发送至 ${email}`, `OTP sent to ${email}`, `OTP dihantar ke ${email}`)
                  }
                </p>
                {method === 'email' && (
                  <p className="text-xs text-gray-500 mt-1">{label('请检查收件箱（包括垃圾邮件）', 'Check your inbox (including spam)', 'Semak peti masuk anda (termasuk spam)')}</p>
                )}
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
                onClick={() => { setStep('input'); setOtp(''); setError('') }}
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
