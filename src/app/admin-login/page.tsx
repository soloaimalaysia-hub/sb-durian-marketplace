'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

export default function AdminLoginPage() {
  const { setUser } = useAppStore()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authErr) {
        setError(`Auth 错误: ${authErr.message}`)
        return
      }

      if (!data.user) {
        setError('登录失败，用户不存在')
        return
      }

      const { data: profile, error: profileErr } = await supabase
        .from('sbm_users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()

      if (profileErr) {
        setError(`Profile 错误: ${profileErr.message}`)
        return
      }

      if (!profile) {
        setError('找不到用户资料')
        return
      }

      if (!['super_admin', 'platform_admin'].includes(profile.platform_role ?? '')) {
        setError(`权限不足: platform_role = ${profile.platform_role ?? 'null'}`)
        return
      }

      setUser(profile)
      router.push('/admin/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">SB Durian Marketplace</p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="sbbrandsholdings@gmail.com"
                className="input pl-10"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="input pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm break-all">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Lock size={18} />}
            {loading ? 'Logging in...' : 'Login to Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}
