'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Loader, Eye, EyeOff, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'

const ROLE_DASHBOARD: Record<string, string> = {
  orchard:    '/orchard/dashboard',
  wholesaler: '/wholesaler/dashboard',
  retailer:   '/retailer/dashboard',
  consumer:   '/consumer/dashboard',
  admin:      '/admin/dashboard',
}

type Mode = 'login' | 'forgot' | 'forgot_done'

export default function LoginPage() {
  const { language, setUser } = useAppStore()
  const tr = t[language]
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError(label('请填写邮箱和密码', 'Please enter email and password', 'Sila masukkan emel dan kata laluan'))
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
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
          // Auth user exists but no profile → complete registration
          router.push('/register?email_verified=1')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Invalid login credentials')) {
        setError(label('邮箱或密码不正确', 'Invalid email or password', 'Emel atau kata laluan tidak betul'))
      } else if (msg.includes('Email not confirmed')) {
        setError(label('请先验证邮箱（检查收件箱）', 'Please verify your email first (check inbox)', 'Sila sahkan emel anda dahulu'))
      } else {
        setError(msg || label('登录失败', 'Login failed', 'Log masuk gagal'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    if (!email.trim()) {
      setError(label('请输入邮箱', 'Please enter your email', 'Sila masukkan emel'))
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (err) throw err
      setMode('forgot_done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : label('发送失败', 'Failed to send', 'Gagal hantar'))
    } finally {
      setLoading(false)
    }
  }

  // ─── Forgot Password Done ──────────────────────────────────────────
  if (mode === 'forgot_done') {
    return (
      <PageWrapper>
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: '#10B98120' }}>
            <Check size={28} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-2">
              {label('重置邮件已发送！', 'Reset Email Sent!', 'Emel Reset Dihantar!')}
            </h2>
            <p className="text-gray-400 text-sm">
              {label('请检查', 'Please check', 'Sila semak')}{' '}
              <span className="text-brand-gold font-medium">{email}</span>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {label('（记得检查垃圾邮件箱）', '(Check spam folder too)', '(Semak folder spam juga)')}
            </p>
          </div>
          <button onClick={() => setMode('login')}
            className="btn-ghost text-sm mx-auto flex items-center gap-2">
            {label('返回登录', 'Back to Login', 'Kembali Log Masuk')}
          </button>
        </div>
      </PageWrapper>
    )
  }

  // ─── Forgot Password Form ──────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <PageWrapper>
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="font-bold text-white">{label('忘记密码', 'Forgot Password', 'Lupa Kata Laluan')}</h2>
            <p className="text-gray-400 text-xs mt-1">
              {label('输入注册邮箱，我们会发送重置链接', 'Enter your email to receive a reset link', 'Masukkan emel untuk pautan tetapan semula')}
            </p>
          </div>
          <div>
            <label className="label">{label('电子邮箱', 'Email', 'Emel')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                placeholder="email@example.com"
                className="input pl-10" autoFocus />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleForgotPassword} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader size={16} className="animate-spin" /> : <Mail size={16} />}
            {label('发送重置链接', 'Send Reset Link', 'Hantar Pautan Reset')}
          </button>
          <button onClick={() => { setMode('login'); setError('') }}
            className="w-full text-sm text-gray-400 hover:text-white text-center">
            {label('← 返回登录', '← Back to Login', '← Kembali Log Masuk')}
          </button>
        </div>
      </PageWrapper>
    )
  }

  // ─── Login Form ────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="space-y-5">
        <div>
          <label className="label">{label('电子邮箱', 'Email', 'Emel')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="email@example.com"
              className="input pl-10" autoFocus />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">{label('密码', 'Password', 'Kata Laluan')}</label>
            <button onClick={() => { setMode('forgot'); setError('') }}
              className="text-xs text-gray-400 hover:text-brand-gold transition-colors">
              {label('忘记密码？', 'Forgot password?', 'Lupa kata laluan?')}
            </button>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="input pl-10 pr-10" />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button onClick={handleLogin} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          {label('登录', 'Login', 'Log Masuk')}
        </button>

        <div className="text-center text-sm text-gray-400">
          {label('还没有账号？', "Don't have an account?", 'Belum ada akaun?')}{' '}
          <Link href="/register" className="text-brand-gold hover:underline">{tr.register}</Link>
        </div>
      </div>
    </PageWrapper>
  )
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const { language } = useAppStore()
  const tr = t[language]
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍈</div>
          <h1 className="text-2xl font-bold text-white">{tr.loginTitle}</h1>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  )
}
