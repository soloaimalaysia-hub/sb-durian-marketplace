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
    <nav className="sticky top-0 z-50 bg-brand-dark border-b border-brand-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍈</span>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">SB Durian</p>
              <p className="text-brand-gold text-xs">Marketplace</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/marketplace" className="text-gray-300 hover:text-white text-sm transition-colors">
              {tr.marketplace}
            </Link>
            <Link href="/retailers" className="text-gray-300 hover:text-white text-sm transition-colors">
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
                <div className="absolute right-0 top-8 bg-brand-dark-card border border-brand-dark-border rounded-xl shadow-xl py-1 min-w-[120px]">
                  {LANG_OPTIONS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-dark transition-colors ${language === l.code ? 'text-brand-gold' : 'text-gray-300'}`}
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
        <div className="md:hidden border-t border-brand-dark-border bg-brand-dark-card">
          <div className="px-4 py-4 space-y-3">
            <Link href="/marketplace" className="block text-gray-300 py-2 text-base" onClick={() => setMenuOpen(false)}>
              {tr.marketplace}
            </Link>
            <Link href="/retailers" className="block text-gray-300 py-2 text-base" onClick={() => setMenuOpen(false)}>
              {tr.retailers}
            </Link>

            {/* Language */}
            <div className="flex gap-2 py-2">
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setMenuOpen(false) }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${language === l.code ? 'border-brand-gold text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}
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
