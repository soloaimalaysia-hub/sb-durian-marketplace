'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Bell, Search, Crown, ArrowRight, Wallet, Ticket, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase/client'

// ── Design tokens ────────────────────────────────────────────────────────
const CREAM  = '#F5EDD5'
const CREAM2 = '#EFE5C3'
const GOLD   = '#C9A227'
const DARK   = '#2d1f0e'
const MUTED  = 'rgba(45,31,14,0.55)'
const BG     = '#1e3528'

// ── Types ────────────────────────────────────────────────────────────────
interface HomepageCard {
  id: string; section: string; title: string; subtitle: string | null
  action_label: string | null; emoji: string | null; image_url: string | null
  href: string; bg_gradient: string | null; is_active: boolean; sort_order: number
}

// ── Mascot ───────────────────────────────────────────────────────────────
function Mascot({ message }: { message: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="relative">
          <div className="px-4 py-3 rounded-2xl rounded-br-none text-xs font-medium leading-snug shadow-xl max-w-[180px]"
            style={{ background: CREAM, border: `1.5px solid ${GOLD}`, color: DARK }}>
            {message}
          </div>
          <button onClick={() => setOpen(false)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: GOLD, color: '#fff' }}>×</button>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} style={{ fontSize: 44, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}>
        🧑‍🦱
      </button>
    </div>
  )
}

// ── Growth Card ──────────────────────────────────────────────────────────
function GrowthCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href}
      className="flex flex-col items-center rounded-2xl py-5 px-3 text-center hover:scale-[1.03] active:scale-95 transition-all"
      style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.5)`, boxShadow: '0 3px 12px rgba(0,0,0,0.12)' }}>
      {card.image_url
        ? <img src={card.image_url} alt={card.title} className="w-16 h-16 object-contain mb-3" />
        : <div className="text-5xl mb-3 leading-none">{card.emoji ?? '🍈'}</div>
      }
      <p className="font-black text-base leading-tight" style={{ color: DARK }}>{card.title}</p>
      {card.subtitle && <p className="text-sm mt-1" style={{ color: MUTED }}>{card.subtitle}</p>}
      {card.action_label && <p className="text-sm font-bold mt-2" style={{ color: GOLD }}>· {card.action_label}</p>}
    </Link>
  )
}

// ── Role Card ────────────────────────────────────────────────────────────
function RoleCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href}
      className="rounded-2xl overflow-hidden block hover:scale-[1.02] active:scale-[0.98] transition-all h-full"
      style={{ border: `1.5px solid rgba(201,162,39,0.4)`, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', minHeight: 180 }}>
      {/* Photo / gradient bg */}
      <div className="relative flex-1 overflow-hidden" style={{ height: 130 }}>
        <div className="w-full h-full" style={{ background: card.bg_gradient ?? 'linear-gradient(135deg,#1a4a2e,#2d6b3a)' }}>
          {card.image_url && <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />}
          {!card.image_url && (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">{card.emoji}</div>
          )}
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(20,38,28,0.55) 0%,transparent 55%)' }} />
      </div>
      {/* Cream footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-2"
        style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})` }}>
        <div>
          <p className="font-black text-base" style={{ color: DARK }}>{card.title}</p>
          {card.subtitle && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{card.subtitle}</p>}
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: BG, border: `1px solid ${GOLD}` }}>
          <ArrowRight size={16} style={{ color: GOLD }} />
        </div>
      </div>
    </Link>
  )
}

// ── Top Navbar (full width sticky) ───────────────────────────────────────
function TopNavbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { user, language } = useAppStore()
  const initials  = (user?.full_name ?? 'G').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? (language === 'zh' ? '访客' : 'Guest')
  const coins     = user?.sb_coins ?? 0

  return (
    <header className="sticky top-0 z-50 w-full border-b"
      style={{ background: 'rgba(26,45,32,0.97)', backdropFilter: 'blur(14px)', borderColor: 'rgba(201,162,39,0.18)' }}>
      <div className="w-full px-6 lg:px-10 h-16 flex items-center gap-4">

        {/* ── LEFT: Avatar + Name + Coins + Bell ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={firstName} className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${GOLD}` }} />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm" style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', color: GOLD, border: `2px solid rgba(201,162,39,0.55)` }}>{initials}</div>
              }
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm" style={{ color: '#F6F1E7' }}>{firstName}</span>
                <Crown size={13} style={{ color: GOLD }} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(201,162,39,0.15)', border: `1px solid rgba(201,162,39,0.35)` }}>
                <span style={{ fontSize: 14 }}>🪙</span>
                <span className="text-sm font-black" style={{ color: GOLD }}>{coins.toLocaleString()}</span>
                <span className="text-xs hidden lg:inline" style={{ color: MUTED }}>SB Coins</span>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.4)` }}>
                  <Bell size={15} style={{ color: GOLD }} />
                </div>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#1a2d20]" />
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(201,162,39,0.08)', border: `2px dashed rgba(201,162,39,0.25)` }}>
                <span style={{ fontSize: 18 }}>👤</span>
              </div>
              <span className="font-bold text-sm" style={{ color: 'rgba(245,237,213,0.7)' }}>
                {language === 'zh' ? '欢迎光临' : 'Guest'}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full opacity-40"
                style={{ background: 'rgba(201,162,39,0.08)', border: `1px solid rgba(201,162,39,0.18)` }}>
                <span style={{ fontSize: 14 }}>🪙</span>
                <span className="text-sm font-black" style={{ color: GOLD }}>0</span>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center opacity-40"
                style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.3)` }}>
                <Bell size={15} style={{ color: GOLD }} />
              </div>
            </>
          )}
        </div>

        {/* ── CENTRE: Search bar ── */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full mx-4"
          style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1px solid rgba(201,162,39,0.4)`, maxWidth: 480 }}>
          <Search size={15} style={{ color: MUTED }} />
          <span className="text-sm" style={{ color: MUTED }}>
            {language === 'zh' ? '搜索榴莲、商家...' : 'Search durian, vendors...'}
          </span>
        </div>

        {/* ── RIGHT: Language + Login/Register ── */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <span className="text-sm hidden md:inline" style={{ color: 'rgba(245,237,213,0.5)' }}>
            🌐 {language === 'zh' ? '中文' : language === 'en' ? 'English' : 'BM'}
          </span>
          {isLoggedIn ? (
            <Link href="/consumer/dashboard"
              className="text-sm font-bold px-4 py-2 rounded-xl"
              style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, color: DARK, border: `1px solid rgba(201,162,39,0.4)` }}>
              {language === 'zh' ? '我的账号' : 'My Account'}
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ color: 'rgba(245,237,213,0.8)' }}>
                {language === 'zh' ? '登录' : 'Login'}
              </Link>
              <Link href="/register" className="text-sm font-bold px-5 py-2 rounded-xl"
                style={{ background: '#5E7F1F', color: '#F6F1E7' }}>
                {language === 'zh' ? '注册' : 'Register'}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ════════════════════════════════════════════════════════════════════════
// HOME PAGE — full width, wireframe layout
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { user, language } = useAppStore()
  const isLoggedIn = !!user && !['super_admin', 'platform_admin'].includes(user.platform_role ?? '')

  const [growthCards, setGrowthCards] = useState<HomepageCard[]>([])
  const [roleCards, setRoleCards]     = useState<HomepageCard[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('sbm_homepage_cards').select('*').eq('is_active', true).eq('section', 'growth').order('sort_order'),
      supabase.from('sbm_homepage_cards').select('*').eq('is_active', true).eq('section', 'role').order('sort_order'),
    ]).then(([g, r]) => {
      setGrowthCards(g.data || [])
      setRoleCards(r.data || [])
    })
  }, [])

  // Role cards: 3-column layout (col0, col1, col2 by index % 3)
  const col0 = roleCards.filter((_, i) => i % 3 === 0)
  const col1 = roleCards.filter((_, i) => i % 3 === 1)
  const col2 = roleCards.filter((_, i) => i % 3 === 2)

  return (
    <>
      <TopNavbar isLoggedIn={isLoggedIn} />

      {/* ── FULL WIDTH content, generous padding ── */}
      <div className="w-full px-6 lg:px-10 xl:px-16 pt-6 pb-24 space-y-6">

        {/* ── Wallet + Vouchers (logged-in only) ── */}
        {isLoggedIn && (
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            {/* Wallet */}
            <div className="rounded-2xl p-5" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.5)`, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} style={{ color: GOLD }} />
                <span className="text-sm font-semibold" style={{ color: MUTED }}>SB Wallet</span>
                <ChevronRight size={13} style={{ color: GOLD }} />
              </div>
              <p className="text-2xl font-black mb-3" style={{ color: DARK }}>
                RM {(user?.wallet_balance ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>↑ Top Up</button>
                <button className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(45,31,14,0.08)', color: DARK, border: '1px solid rgba(45,31,14,0.15)' }}>Transactions</button>
              </div>
            </div>

            {/* Vouchers */}
            <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.5)`, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Ticket size={14} style={{ color: GOLD }} />
                  <span className="text-sm font-semibold" style={{ color: MUTED }}>Vouchers</span>
                </div>
                <p className="text-3xl font-black" style={{ color: DARK }}>{user?.voucher_count ?? 0}</p>
                <p className="text-sm" style={{ color: MUTED }}>Available</p>
              </div>
              <Link href="/consumer/vouchers" className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>
                View <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Growth Loop: 4 cards full width ── */}
        {growthCards.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {growthCards.map(c => <GrowthCard key={c.id} card={c} />)}
            </div>
            {/* Promo strip */}
            <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl mt-4"
              style={{ background: `linear-gradient(90deg,rgba(201,162,39,0.12),rgba(201,162,39,0.22),rgba(201,162,39,0.12))`, border: `1px solid rgba(201,162,39,0.4)` }}>
              <p className="text-sm font-medium" style={{ color: DARK }}>
                🪙 Redeem your SB Coins &amp; Points for exciting rewards, vouchers &amp; more!
              </p>
              <Link href="/consumer/rewards" className="flex items-center gap-1 text-sm font-black flex-shrink-0 ml-6" style={{ color: GOLD }}>
                View All Rewards <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Role Cards: 3-column wireframe layout ── */}
        {roleCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Column 0: Farmer + Affiliate */}
            <div className="flex flex-col gap-4">
              {col0.map(c => <RoleCard key={c.id} card={c} />)}
            </div>
            {/* Column 1: Wholesaler + Customer */}
            <div className="flex flex-col gap-4">
              {col1.map(c => <RoleCard key={c.id} card={c} />)}
            </div>
            {/* Column 2: Vendor + Driver */}
            <div className="flex flex-col gap-4">
              {col2.map(c => <RoleCard key={c.id} card={c} />)}
            </div>
          </div>
        )}

        {/* ── Explore More link (instead of listing 10 stores here) ── */}
        <div className="flex items-center justify-center pt-2">
          <Link href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base hover:scale-105 transition-all"
            style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid ${GOLD}`, color: DARK, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {language === 'zh' ? '🏪 浏览全部商家' : '🏪 Explore All Vendors & Products'}
            <ArrowRight size={16} style={{ color: GOLD }} />
          </Link>
        </div>

      </div>

      <Mascot message={
        isLoggedIn
          ? 'Hello! Welcome to SB Durian Marketplace 🍈'
          : (language === 'zh' ? '注册后享受更多功能！🍈' : 'Register to unlock more! 🍈')
      } />
    </>
  )
}
