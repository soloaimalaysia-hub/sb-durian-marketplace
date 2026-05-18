'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Globe, LogOut, LayoutDashboard } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'
import { createClient } from '@/lib/supabase/client'
import type { Language } from '@/lib/types'

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'zh', label: '华语' },
  { code: 'en', label: 'English' },
  { code: 'bm', label: 'BM' },
]

const ROLE_DASHBOARD: Record<string, string> = {
  orchard: '/orchard/dashboard',
  wholesaler: '/wholesaler/dashboard',
  retailer: '/retailer/dashboard',
  consumer: '/consumer/dashboard',
  admin: '/admin/dashboard',
}

export default function Navbar() {
  const { language, setLanguage, user, setUser } = useAppStore()
  const tr = t[language]
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const dashboardUrl = user ? ROLE_DASHBOARD[user.role] : null

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(26,45,34,0.95)', backdropFilter: 'blur(10px)', borderColor: 'rgba(199,166,23,0.2)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://klrfpzxjsacriaqtfssf.supabase.co/storage/v1/object/public/sbm-assets/logo.jpeg"
              alt="SB Durian Marketplace"
              className="h-10 w-10 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <p className="font-bold text-sm" style={{ color: '#C7A617' }}>SB Durian</p>
              <p className="text-xs font-semibold" style={{ color: '#5E7F1F' }}>Marketplace</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/marketplace" className="text-sm transition-colors" style={{ color: 'rgba(246,241,231,0.8)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C7A617')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(246,241,231,0.8)')}>
              {tr.marketplace}
            </Link>
            <Link href="/retailers" className="text-sm transition-colors" style={{ color: 'rgba(246,241,231,0.8)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C7A617')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(246,241,231,0.8)')}>
              {tr.retailers}
            </Link>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
              >
                <Globe size={16} />
                {LANG_OPTIONS.find(l => l.code === language)?.label}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-8 rounded-xl shadow-xl py-1 min-w-[120px]" style={{ background: 'rgba(26,45,34,0.97)', border: '1px solid rgba(199,166,23,0.2)' }}>
                  {LANG_OPTIONS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === l.code ? '' : ''}`}
                      style={{ color: language === l.code ? '#C7A617' : 'rgba(246,241,231,0.7)' }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                {dashboardUrl && (
                  <Link href={dashboardUrl} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
                    <LayoutDashboard size={16} />
                    {tr.dashboard}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                  {tr.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                  {tr.login}
                </Link>
                <Link href="/register" className="btn-primary py-2 px-4 text-sm">
                  {tr.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t" style={{ background: 'rgba(20,38,28,0.97)', borderColor: 'rgba(199,166,23,0.2)' }}>
          <div className="px-4 py-4 space-y-3">
            <Link href="/marketplace" className="block py-2 text-base" style={{ color: 'rgba(246,241,231,0.8)' }} onClick={() => setMenuOpen(false)}>
              {tr.marketplace}
            </Link>
            <Link href="/retailers" className="block py-2 text-base" style={{ color: 'rgba(246,241,231,0.8)' }} onClick={() => setMenuOpen(false)}>
              {tr.retailers}
            </Link>

            {/* Language */}
            <div className="flex gap-2 py-2">
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setMenuOpen(false) }}
                  className="px-3 py-1 rounded-full text-sm border transition-colors"
                  style={language === l.code
                    ? { borderColor: '#C7A617', color: '#C7A617' }
                    : { borderColor: 'rgba(199,166,23,0.3)', color: 'rgba(246,241,231,0.5)' }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {user ? (
              <>
                {dashboardUrl && (
                  <Link href={dashboardUrl} className="block text-gray-300 py-2 text-base" onClick={() => setMenuOpen(false)}>
                    {tr.dashboard}
                  </Link>
                )}
                <button onClick={handleLogout} className="block text-red-400 py-2 text-base w-full text-left">
                  {tr.logout}
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="btn-ghost py-2 px-4 text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>
                  {tr.login}
                </Link>
                <Link href="/register" className="btn-primary py-2 px-4 text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>
                  {tr.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
