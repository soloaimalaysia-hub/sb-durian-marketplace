'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, Shield, User, ArrowRight, ArrowLeft, Loader, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'
import { MALAYSIA_STATES, LANGUAGE_LABELS } from '@/lib/constants'
import type { UserRole, Language } from '@/lib/types'

type Step = 'language' | 'phone' | 'otp' | 'role' | 'profile' | 'pending'

const ROLES: { id: UserRole; emoji: string; zh: string; en: string; bm: string; needsApproval: boolean }[] = [
  { id: 'orchard', emoji: '🌳', zh: '园主（果农）', en: 'Orchard Owner', bm: 'Pemilik Ladang', needsApproval: true },
  { id: 'wholesaler', emoji: '⚖️', zh: '批发商', en: 'Wholesaler', bm: 'Pemborong', needsApproval: true },
  { id: 'retailer', emoji: '🏪', zh: '零售商', en: 'Retailer', bm: 'Peruncit', needsApproval: true },
  { id: 'consumer', emoji: '😋', zh: '消费者', en: 'Consumer', bm: 'Pengguna', needsApproval: false },
]

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') as UserRole | null

  const { language, setLanguage, setUser } = useAppStore()
  const tr = t[language]
  const router = useRouter()

  const [step, setStep] = useState<Step>('language')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [role, setRole] = useState<UserRole | null>(initialRole)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    state: '',
    store_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  function formatPhone(raw: string) {
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
      const { error: err } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) })
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
    if (otp.length < 6) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp,
        type: 'sms',
      })
      if (err) throw err

      if (data.user) {
        setAuthUserId(data.user.id)
        // Check if already registered
        const { data: existing } = await supabase
          .from('sbm_users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single()

        if (existing) {
          setUser(existing)
          const dashboards: Record<string, string> = {
            orchard: '/orchard/dashboard',
            wholesaler: '/wholesaler/dashboard',
            retailer: '/retailer/dashboard',
            consumer: '/consumer/dashboard',
            admin: '/admin/dashboard',
          }
          router.push(dashboards[existing.role] || '/')
          return
        }
      }
      setStep(initialRole ? 'profile' : 'role')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    setError('')
    if (!form.full_name.trim() || !role) return
    setLoading(true)
    try {
      const supabase = createClient()
      const isConsumer = role === 'consumer'

      // Insert sbm_users
      const { data: newUser, error: userErr } = await supabase
        .from('sbm_users')
        .insert({
          auth_id: authUserId,
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: formatPhone(phone),
          whatsapp: form.whatsapp.trim() || formatPhone(phone),
          role,
          language,
          status: isConsumer ? 'active' : 'pending',
          verified_at: isConsumer ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (userErr) throw userErr

      // Create store for B2B roles
      if (['orchard', 'wholesaler', 'retailer'].includes(role) && form.store_name.trim()) {
        await supabase.from('sbm_stores').insert({
          user_id: newUser.id,
          store_name: form.store_name.trim(),
          state: form.state || null,
        })
      }

      setUser(newUser)
      setStep('pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.id === role)

  // Step: Language
  if (step === 'language') {
    return (
      <StepWrapper title={language === 'zh' ? '选择语言' : language === 'en' ? 'Select Language' : 'Pilih Bahasa'}>
        <div className="space-y-3">
          {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([code, label]) => (
            <button
              key={code}
              onClick={() => { setLanguage(code); setStep('phone') }}
              className={`w-full p-4 rounded-xl border text-left font-semibold transition-all ${language === code ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-300 hover:border-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </StepWrapper>
    )
  }

  // Step: Phone
  if (step === 'phone') {
    return (
      <StepWrapper title={tr.registerTitle}>
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
                placeholder="0123456789"
                className="input pl-11"
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleSendOtp} disabled={loading || !phone.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {tr.sendOtp}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white">{tr.login}</Link>
          </div>
        </div>
      </StepWrapper>
    )
  }

  // Step: OTP
  if (step === 'otp') {
    return (
      <StepWrapper title={tr.otpSent}>
        <div className="space-y-5">
          <div className="text-center">
            <Shield size={40} className="text-brand-gold mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{phone}</p>
          </div>
          <div>
            <label className="label">{tr.otp}</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              placeholder="------"
              className="input text-center text-2xl tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <Loader size={18} className="animate-spin" />}
            {tr.verifyOtp}
          </button>
          <button onClick={() => { setStep('phone'); setOtp(''); setError('') }} className="w-full text-sm text-gray-400 hover:text-white">
            {tr.back}
          </button>
        </div>
      </StepWrapper>
    )
  }

  // Step: Role
  if (step === 'role') {
    return (
      <StepWrapper title={tr.selectRole}>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id); setStep('profile') }}
              className="card hover:border-brand-gold/50 transition-all text-center p-5 flex flex-col items-center gap-2"
            >
              <span className="text-3xl">{r.emoji}</span>
              <span className="font-semibold text-white text-sm">
                {language === 'zh' ? r.zh : language === 'en' ? r.en : r.bm}
              </span>
            </button>
          ))}
        </div>
      </StepWrapper>
    )
  }

  // Step: Profile
  if (step === 'profile') {
    const needsStore = role && ['orchard', 'wholesaler', 'retailer'].includes(role)
    return (
      <StepWrapper title={tr.registerTitle}>
        <div className="space-y-4">
          {selectedRole && (
            <div className="flex items-center gap-2 p-3 bg-brand-green/20 rounded-xl">
              <span className="text-2xl">{selectedRole.emoji}</span>
              <span className="text-brand-gold font-medium text-sm">
                {language === 'zh' ? selectedRole.zh : language === 'en' ? selectedRole.en : selectedRole.bm}
              </span>
              {!initialRole && (
                <button onClick={() => setStep('role')} className="ml-auto text-xs text-gray-400 hover:text-white flex items-center gap-1">
                  <ArrowLeft size={12} /> {tr.back}
                </button>
              )}
            </div>
          )}

          <div>
            <label className="label">{tr.fullName} *</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder={language === 'zh' ? '你的姓名' : language === 'en' ? 'Your full name' : 'Nama penuh anda'}
                className="input pl-11"
                autoFocus
              />
            </div>
          </div>

          {needsStore && (
            <div>
              <label className="label">
                {language === 'zh' ? '店面/园场名称 *' : language === 'en' ? 'Store/Farm Name *' : 'Nama Kedai/Ladang *'}
              </label>
              <input
                type="text"
                value={form.store_name}
                onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))}
                placeholder={language === 'zh' ? '例：金山园主 / KL 榴莲批发' : 'e.g. Golden Hill Farm'}
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">{tr.email}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="label">{tr.whatsapp}</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              placeholder={phone}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'zh' ? '留空则使用注册手机号' : language === 'en' ? 'Leave blank to use registration phone' : 'Kosongkan untuk guna nombor pendaftaran'}
            </p>
          </div>

          {needsStore && (
            <div>
              <label className="label">{tr.selectState}</label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="input bg-brand-dark"
              >
                <option value="">{language === 'zh' ? '-- 选择州属 --' : language === 'en' ? '-- Select State --' : '-- Pilih Negeri --'}</option>
                {MALAYSIA_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !form.full_name.trim() || (needsStore ? !form.store_name.trim() : false)}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
            {tr.submit}
          </button>
        </div>
      </StepWrapper>
    )
  }

  // Step: Pending
  if (step === 'pending') {
    const isConsumer = role === 'consumer'
    return (
      <StepWrapper title="">
        <div className="text-center space-y-6">
          <div className="text-6xl">{isConsumer ? '✅' : '⏳'}</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isConsumer
                ? (language === 'zh' ? '注册成功！' : language === 'en' ? 'Welcome!' : 'Selamat datang!')
                : tr.pending}
            </h2>
            <p className="text-gray-400 text-sm">
              {isConsumer
                ? (language === 'zh' ? '欢迎加入 SB Durian！' : language === 'en' ? 'You are now part of SB Durian!' : 'Anda kini sebahagian dari SB Durian!')
                : tr.pendingDesc}
            </p>
          </div>
          {isConsumer ? (
            <Link href="/consumer/dashboard" className="btn-primary inline-flex items-center gap-2">
              {tr.dashboard} <ArrowRight size={18} />
            </Link>
          ) : (
            <Link href="/" className="btn-ghost inline-flex items-center gap-2">
              {language === 'zh' ? '返回首页' : language === 'en' ? 'Back to Home' : 'Kembali ke Utama'}
            </Link>
          )}
        </div>
      </StepWrapper>
    )
  }

  return null
}

function StepWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍈</div>
          {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-brand-gold" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
