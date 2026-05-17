'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Loader, Check, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'
import { MALAYSIA_STATES, LANGUAGE_LABELS } from '@/lib/constants'
import type { UserRole, Language } from '@/lib/types'

type Step = 'language' | 'signup' | 'confirm' | 'role' | 'profile' | 'pending'

const ROLES: { id: UserRole; emoji: string; zh: string; en: string; bm: string; needsApproval: boolean }[] = [
  { id: 'orchard',    emoji: '🌳', zh: '园主（果农）', en: 'Orchard Owner', bm: 'Pemilik Ladang', needsApproval: true },
  { id: 'wholesaler', emoji: '⚖️', zh: '批发商',       en: 'Wholesaler',    bm: 'Pemborong',     needsApproval: true },
  { id: 'retailer',  emoji: '🏪', zh: '零售商',       en: 'Retailer',      bm: 'Peruncit',      needsApproval: true },
  { id: 'consumer',  emoji: '😋', zh: '消费者',       en: 'Consumer',      bm: 'Pengguna',      needsApproval: false },
]

function RegisterForm() {
  const searchParams = useSearchParams()
  const emailVerified = searchParams.get('email_verified') === '1'
  const initialRole = searchParams.get('role') as UserRole | null

  const { language, setLanguage, setUser } = useAppStore()
  const tr = t[language]
  const router = useRouter()

  const [step, setStep] = useState<Step>(emailVerified ? 'role' : 'language')
  const [role, setRole] = useState<UserRole | null>(initialRole)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signup, setSignup] = useState({ email: '', password: '', confirm: '', full_name: '', phone: '' })
  const [profile, setProfile] = useState({ store_name: '', state: '' })
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [confirmedEmail, setConfirmedEmail] = useState('')

  const label = useCallback((zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm, [language])

  useEffect(() => {
    if (!emailVerified) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setAuthUserId(user.id)
      const meta = user.user_metadata ?? {}
      setSignup(s => ({ ...s, email: user.email ?? '', full_name: meta.full_name ?? '', phone: meta.phone ?? '' }))
    })
  }, [emailVerified])

  const handleSignup = async () => {
    setError('')
    if (!signup.email.trim() || !signup.password || !signup.full_name.trim()) {
      setError(label('请填写所有必填项', 'Please fill all required fields', 'Sila isi semua ruangan wajib'))
      return
    }
    if (signup.password.length < 6) {
      setError(label('密码至少 6 位', 'Password must be at least 6 characters', 'Kata laluan sekurang-kurangnya 6 aksara'))
      return
    }
    if (signup.password !== signup.confirm) {
      setError(label('两次密码不一致', 'Passwords do not match', 'Kata laluan tidak sepadan'))
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signUp({
        email: signup.email.trim(),
        password: signup.password,
        options: {
          data: { full_name: signup.full_name.trim(), phone: signup.phone.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (err) throw err
      setConfirmedEmail(signup.email.trim())
      setStep('confirm')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : label('注册失败', 'Signup failed', 'Pendaftaran gagal'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!signup.full_name.trim() || !role) {
      setError(label('请填写姓名', 'Please enter your name', 'Sila masukkan nama'))
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      let uid = authUserId
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser()
        uid = user?.id ?? null
        if (uid) setAuthUserId(uid)
      }
      if (!uid) throw new Error(label('请先完成邮箱验证', 'Please verify your email first', 'Sila sahkan emel anda dahulu'))

      const isConsumer = role === 'consumer'
      const needsStore = ['orchard', 'wholesaler', 'retailer'].includes(role)

      const { data: newUser, error: userErr } = await supabase
        .from('sbm_users')
        .insert({
          auth_id: uid,
          full_name: signup.full_name.trim(),
          email: signup.email.trim() || null,
          phone: signup.phone.trim() || signup.email.trim(),
          whatsapp: signup.phone.trim() || null,
          role,
          language,
          status: isConsumer ? 'active' : 'pending',
          verified_at: isConsumer ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (userErr) throw userErr

      if (needsStore && profile.store_name.trim()) {
        await supabase.from('sbm_stores').insert({
          user_id: newUser.id,
          store_name: profile.store_name.trim(),
          state: profile.state || null,
        })
      }

      setUser(newUser)
      setStep('pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : label('注册失败', 'Registration failed', 'Pendaftaran gagal'))
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.id === role)
  const needsStore = role && ['orchard', 'wholesaler', 'retailer'].includes(role)

  // ─── Language ──────────────────────────────────────────────────────
  if (step === 'language') return (
    <StepWrapper title={label('选择语言', 'Select Language', 'Pilih Bahasa')}>
      <div className="space-y-3">
        {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([code, lbl]) => (
          <button key={code}
            onClick={() => { setLanguage(code); setStep('signup') }}
            className={`w-full p-4 rounded-xl border text-left font-semibold transition-all ${language === code ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-300 hover:border-gray-500'}`}>
            {lbl}
          </button>
        ))}
      </div>
    </StepWrapper>
  )

  // ─── Signup ────────────────────────────────────────────────────────
  if (step === 'signup') return (
    <StepWrapper title={tr.registerTitle}>
      <div className="space-y-4">
        <div>
          <label className="label">{tr.fullName} *</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={signup.full_name}
              onChange={e => setSignup(s => ({ ...s, full_name: e.target.value }))}
              placeholder={label('你的姓名', 'Your full name', 'Nama penuh anda')}
              className="input pl-10" autoFocus />
          </div>
        </div>
        <div>
          <label className="label">
            {tr.phone}
            <span className="text-gray-500 ml-1 text-xs">{label('（选填）', '(optional)', '(pilihan)')}</span>
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="tel" value={signup.phone}
              onChange={e => setSignup(s => ({ ...s, phone: e.target.value }))}
              placeholder="0123456789" className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">{label('电子邮箱', 'Email', 'Emel')} *</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="email" value={signup.email}
              onChange={e => setSignup(s => ({ ...s, email: e.target.value }))}
              placeholder="email@example.com" className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">{label('密码', 'Password', 'Kata Laluan')} *</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type={showPass ? 'text' : 'password'} value={signup.password}
              onChange={e => setSignup(s => ({ ...s, password: e.target.value }))}
              placeholder={label('至少 6 位', 'At least 6 characters', 'Sekurang-kurangnya 6 aksara')}
              className="input pl-10 pr-10" />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">{label('确认密码', 'Confirm Password', 'Sahkan Kata Laluan')} *</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type={showPass ? 'text' : 'password'} value={signup.confirm}
              onChange={e => setSignup(s => ({ ...s, confirm: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              placeholder={label('再输入一次密码', 'Enter password again', 'Masukkan semula kata laluan')}
              className="input pl-10" />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
        <button onClick={handleSignup} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          {label('注册 · 发送验证邮件', 'Register · Send Verification Email', 'Daftar · Hantar Emel Pengesahan')}
        </button>
        <div className="text-center text-sm text-gray-400">
          {label('已有账号？', 'Already have an account?', 'Sudah ada akaun?')}{' '}
          <Link href="/login" className="text-brand-gold hover:underline">{tr.login}</Link>
        </div>
      </div>
    </StepWrapper>
  )

  // ─── Confirm Email ─────────────────────────────────────────────────
  if (step === 'confirm') return (
    <StepWrapper title="">
      <div className="text-center space-y-5">
        <div className="text-6xl">📧</div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            {label('验证邮件已发送！', 'Verification Email Sent!', 'Emel Pengesahan Dihantar!')}
          </h2>
          <p className="text-gray-400 text-sm">
            {label('请检查', 'Please check', 'Sila semak')}{' '}
            <span className="text-brand-gold font-medium">{confirmedEmail}</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {label('点击邮件中的确认链接即可继续', 'Click the confirmation link to continue', 'Klik pautan pengesahan untuk meneruskan')}
          </p>
          <p className="text-gray-600 text-xs mt-2">{label('（记得检查垃圾邮件箱）', '(Check spam folder too)', '(Semak folder spam juga)')}</p>
        </div>
        <button onClick={() => setStep('signup')}
          className="btn-ghost flex items-center gap-2 mx-auto text-sm">
          <ArrowLeft size={14} /> {label('重新注册', 'Back to Register', 'Kembali Pendaftaran')}
        </button>
      </div>
    </StepWrapper>
  )

  // ─── Role ──────────────────────────────────────────────────────────
  if (step === 'role') return (
    <StepWrapper title={tr.selectRole}>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(r => (
          <button key={r.id}
            onClick={() => { setRole(r.id); setStep('profile') }}
            className="card hover:border-brand-gold/50 transition-all text-center p-5 flex flex-col items-center gap-2">
            <span className="text-3xl">{r.emoji}</span>
            <span className="font-semibold text-white text-sm">
              {language === 'zh' ? r.zh : language === 'en' ? r.en : r.bm}
            </span>
            {r.needsApproval && (
              <span className="text-xs text-gray-500">{label('需审核', 'Needs approval', 'Perlu kelulusan')}</span>
            )}
          </button>
        ))}
      </div>
    </StepWrapper>
  )

  // ─── Profile ───────────────────────────────────────────────────────
  if (step === 'profile') return (
    <StepWrapper title={tr.registerTitle}>
      <div className="space-y-4">
        {selectedRole && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#F59E0B10', border: '1px solid #F59E0B33' }}>
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
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={signup.full_name}
              onChange={e => setSignup(s => ({ ...s, full_name: e.target.value }))}
              placeholder={label('你的姓名', 'Your full name', 'Nama penuh anda')}
              className="input pl-10" autoFocus />
          </div>
        </div>
        {needsStore && (
          <>
            <div>
              <label className="label">{label('店面/园场名称', 'Store/Farm Name', 'Nama Kedai/Ladang')} *</label>
              <input type="text" value={profile.store_name}
                onChange={e => setProfile(p => ({ ...p, store_name: e.target.value }))}
                placeholder={label('例：金山榴莲园', 'e.g. Golden Hill Farm', 'cth. Ladang Bukit Emas')}
                className="input" />
            </div>
            <div>
              <label className="label">{label('所在州属', 'State', 'Negeri')}</label>
              <select value={profile.state}
                onChange={e => setProfile(p => ({ ...p, state: e.target.value }))}
                className="input bg-brand-dark">
                <option value="">{label('-- 选择州属 --', '-- Select State --', '-- Pilih Negeri --')}</option>
                {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}
        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
        <button onClick={handleSubmit}
          disabled={loading || !signup.full_name.trim() || (!!needsStore && !profile.store_name.trim())}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
          {tr.submit}
        </button>
      </div>
    </StepWrapper>
  )

  // ─── Pending ───────────────────────────────────────────────────────
  if (step === 'pending') {
    const isConsumer = role === 'consumer'
    return (
      <StepWrapper title="">
        <div className="text-center space-y-6">
          <div className="text-6xl">{isConsumer ? '✅' : '⏳'}</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isConsumer ? label('欢迎加入！', 'Welcome!', 'Selamat datang!') : tr.pending}
            </h2>
            <p className="text-gray-400 text-sm">
              {isConsumer
                ? label('你已成功注册 SB Durian！', 'You have joined SB Durian!', 'Anda telah menyertai SB Durian!')
                : tr.pendingDesc}
            </p>
          </div>
          {isConsumer ? (
            <Link href="/consumer/dashboard" className="btn-primary inline-flex items-center gap-2">
              {tr.dashboard} <ArrowRight size={18} />
            </Link>
          ) : (
            <Link href="/" className="btn-ghost inline-flex items-center gap-2">
              {label('返回首页', 'Back to Home', 'Kembali ke Utama')}
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
