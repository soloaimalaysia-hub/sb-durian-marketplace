'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, Search, Crown, MapPin, Star, ArrowRight, Wallet, Ticket, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase/client'

// ── Design tokens ────────────────────────────────────────────────────────
const CREAM     = '#F5EDD5'
const CREAM2    = '#EFE5C3'
const GOLD      = '#C9A227'
const DARK_TEXT = '#2d1f0e'
const MUTED     = 'rgba(45,31,14,0.55)'
const BG_DARK   = '#243b2f'

// ── Types ────────────────────────────────────────────────────────────────
interface HomepageCard {
  id: string; section: string; title: string; subtitle: string | null
  action_label: string | null; emoji: string | null; image_url: string | null
  href: string; bg_gradient: string | null; is_active: boolean; sort_order: number
}
interface FeaturedVendor {
  id: string; shop_name: string; location: string; rating: number
  cover_image_url: string | null; logo_url: string | null
  tags: string[]; open_hours: string; open_days: string; is_open: boolean
}

// ── Section Header (ornamental) ──────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-5">
      <div className="flex items-center gap-3 px-5 py-2 rounded-full"
        style={{ background: 'linear-gradient(90deg,rgba(201,162,39,0.08),rgba(201,162,39,0.18),rgba(201,162,39,0.08))', border: '1px solid rgba(201,162,39,0.45)' }}>
        <span style={{ color: GOLD, fontSize: 12 }}>→</span>
        <span className="text-sm font-bold tracking-wide" style={{ color: GOLD }}>{label}</span>
        <span style={{ color: GOLD, fontSize: 12 }}>←</span>
      </div>
    </div>
  )
}

// ── Mascot ───────────────────────────────────────────────────────────────
function Mascot({ message }: { message: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="fixed bottom-5 right-3 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {open && (
        <div className="relative pointer-events-auto">
          <div className="px-3 py-2.5 rounded-2xl rounded-br-none text-xs font-medium leading-snug shadow-xl max-w-[160px]"
            style={{ background: CREAM, border: `1.5px solid ${GOLD}`, color: DARK_TEXT }}>
            {message}
          </div>
          <button onClick={() => setOpen(false)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold pointer-events-auto"
            style={{ background: GOLD, color: '#fff' }}>×</button>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} className="pointer-events-auto"
        style={{ fontSize: 42, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}>
        🧑‍🦱
      </button>
    </div>
  )
}

// ── Growth Loop Card ─────────────────────────────────────────────────────
function GrowthCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href} className="flex flex-col items-center rounded-2xl p-2.5 text-center active:scale-95 transition-all"
      style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.45)`, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      {card.image_url ? (
        <img src={card.image_url} alt={card.title} className="w-12 h-12 object-contain mb-1" />
      ) : (
        <div className="text-3xl mb-1 leading-none">{card.emoji ?? '🍈'}</div>
      )}
      <p className="font-black text-xs leading-tight" style={{ color: DARK_TEXT }}>{card.title}</p>
      {card.subtitle && <p className="text-xs mt-0.5 leading-tight" style={{ color: MUTED, fontSize: 9 }}>{card.subtitle}</p>}
      {card.action_label && <p className="text-xs font-bold mt-1" style={{ color: GOLD, fontSize: 9 }}>· {card.action_label}</p>}
    </Link>
  )
}

// ── Entry Role Card (2×2, photo bg + cream footer) ───────────────────────
function EntryCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href} className="rounded-2xl overflow-hidden active:scale-95 transition-all block"
      style={{ border: `1.5px solid rgba(201,162,39,0.4)`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {/* Photo */}
      <div className="h-32 relative overflow-hidden"
        style={{ background: card.bg_gradient ?? 'linear-gradient(135deg,#1a4a2e,#2d6b3a)' }}>
        {card.image_url && (
          <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
        )}
        {!card.image_url && (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">{card.emoji}</div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(20,38,28,0.5) 0%,transparent 60%)' }} />
      </div>
      {/* Cream footer */}
      <div className="px-3 py-2.5 flex items-end justify-between"
        style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})` }}>
        <div>
          <p className="font-black text-sm leading-tight" style={{ color: DARK_TEXT }}>{card.title}</p>
          {card.subtitle && <p className="text-xs mt-0.5 leading-tight" style={{ color: MUTED }}>{card.subtitle}</p>}
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
          style={{ background: BG_DARK, border: `1px solid ${GOLD}` }}>
          <ArrowRight size={14} style={{ color: GOLD }} />
        </div>
      </div>
    </Link>
  )
}

// ── Vendor Card (large, photo + cream info) ──────────────────────────────
function VendorCard({ v }: { v: FeaturedVendor }) {
  const initials = v.shop_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Link href={`/vendor/${v.id}`} className="block rounded-2xl overflow-hidden active:scale-[0.99] transition-all"
      style={{ border: `1.5px solid rgba(201,162,39,0.45)`, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
      {/* Cover photo */}
      <div className="relative h-44 overflow-hidden">
        {v.cover_image_url ? (
          <img src={v.cover_image_url} alt={v.shop_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1a4a2e,#2d6b3a)' }}>
            <span className="text-7xl opacity-15">🍈</span>
          </div>
        )}
        {v.is_open && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(94,127,31,0.95)', color: '#fff' }}>OPEN</span>
        )}
      </div>

      {/* Cream info section */}
      <div className="px-4 py-3" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})` }}>
        <div className="flex items-start justify-between gap-3">
          {/* Logo + name + location */}
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {v.logo_url ? (
              <img src={v.logo_url} alt="logo" className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                style={{ border: `2px solid ${GOLD}` }} />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: BG_DARK, color: GOLD, border: `2px solid ${GOLD}` }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-black text-sm truncate" style={{ color: DARK_TEXT }}>{v.shop_name}</p>
                {v.is_open && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{ background: 'rgba(94,127,31,0.15)', color: '#3a6a1a', border: '1px solid rgba(94,127,31,0.3)', fontSize: 9 }}>open</span>}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} style={{ color: MUTED }} />
                <span className="text-xs truncate" style={{ color: MUTED }}>{v.location}</span>
              </div>
            </div>
          </div>
          {/* Rating */}
          <div className="flex-shrink-0 text-right">
            <p className="text-xs font-semibold" style={{ color: MUTED }}>Rate</p>
            <div className="flex items-center gap-1">
              <span className="font-black text-base" style={{ color: DARK_TEXT }}>{v.rating.toFixed(1)}</span>
              <Star size={14} fill={GOLD} stroke={GOLD} />
            </div>
          </div>
        </div>

        {/* Tags */}
        {(v.tags || []).length > 0 && (
          <div className="flex items-center gap-2 mt-2.5">
            {(v.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(45,31,14,0.07)', color: MUTED, border: '1px solid rgba(45,31,14,0.15)', fontSize: 10 }}>
                🌿 {tag}
              </span>
            ))}
          </div>
        )}

        {/* View Store button */}
        <div className="mt-3">
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl"
            style={{ background: BG_DARK, border: `1px solid ${GOLD}` }}>
            <span className="text-sm font-bold" style={{ color: GOLD }}>View Store</span>
            <ArrowRight size={14} style={{ color: GOLD }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════════════════
// SHARED BODY
// ════════════════════════════════════════════════════════════════════════
function HomeBody({ language }: { language: string }) {
  const [growthCards, setGrowthCards] = useState<HomepageCard[]>([])
  const [entryCards, setEntryCards] = useState<HomepageCard[]>([])
  const [vendors, setVendors] = useState<FeaturedVendor[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('sbm_homepage_cards').select('*').eq('is_active', true).eq('section', 'growth').order('sort_order'),
      supabase.from('sbm_homepage_cards').select('*').eq('is_active', true).eq('section', 'role').order('sort_order'),
      supabase.from('sbm_featured_vendors').select('*').eq('is_active', true).order('rank').limit(10),
    ]).then(([g, r, v]) => {
      setGrowthCards(g.data || [])
      setEntryCards(r.data || [])
      setVendors(v.data || [])
    })
  }, [])

  return (
    <div className="space-y-0 pb-28">

      {/* ── Wallet + Vouchers ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Wallet card */}
        <div className="rounded-2xl p-4" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.5)`, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} style={{ color: GOLD }} />
            <span className="text-xs font-semibold" style={{ color: MUTED }}>SB Wallet</span>
            <ChevronRight size={12} style={{ color: GOLD }} />
          </div>
          <p className="text-lg font-black mb-2.5" style={{ color: DARK_TEXT }}>RM 0.00</p>
          <div className="flex gap-1.5">
            <button className="flex-1 text-xs py-1.5 rounded-lg font-bold"
              style={{ background: BG_DARK, color: GOLD, border: `1px solid ${GOLD}` }}>
              ↑ Top Up
            </button>
            <button className="flex-1 text-xs py-1.5 rounded-lg font-semibold"
              style={{ background: 'rgba(45,31,14,0.08)', color: DARK_TEXT, border: '1px solid rgba(45,31,14,0.15)' }}>
              Transactions
            </button>
          </div>
        </div>

        {/* Voucher card */}
        <div className="rounded-2xl p-4 flex flex-col" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.5)`, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Ticket size={14} style={{ color: GOLD }} />
            <span className="text-xs font-semibold" style={{ color: MUTED }}>Vouchers</span>
          </div>
          <p className="text-2xl font-black" style={{ color: DARK_TEXT }}>0</p>
          <p className="text-xs mb-auto" style={{ color: MUTED }}>Available</p>
          <Link href="/consumer/vouchers" className="mt-3 flex items-center justify-center gap-1 py-1.5 rounded-xl font-bold text-xs"
            style={{ background: BG_DARK, color: GOLD, border: `1px solid ${GOLD}` }}>
            View <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Growth Loop 4-in-a-row ── */}
      {growthCards.length > 0 && (
        <div className="mb-3">
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            {growthCards.map(c => <GrowthCard key={c.id} card={c} />)}
          </div>
          {/* Promo strip */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: `linear-gradient(90deg,rgba(201,162,39,0.18),rgba(201,162,39,0.28),rgba(201,162,39,0.18))`, border: `1px solid rgba(201,162,39,0.45)` }}>
            <p className="text-xs font-medium" style={{ color: DARK_TEXT }}>
              🪙 Redeem SB Coins &amp; Points for rewards, vouchers &amp; more!
            </p>
            <Link href="/consumer/rewards" className="text-xs font-black ml-2 flex-shrink-0 flex items-center gap-0.5"
              style={{ color: GOLD }}>
              View All <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Entry Cards 2×2 ── */}
      {entryCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-2">
          {entryCards.slice(0, 4).map(c => <EntryCard key={c.id} card={c} />)}
        </div>
      )}

      {/* ── Top 10 Featured Vendors ── */}
      {vendors.length > 0 && (
        <div>
          <SectionHeader label="Top 10 Featured Vendor" />
          <div className="space-y-4">
            {vendors.map(v => <VendorCard key={v.id} v={v} />)}
          </div>
          <div className="text-center mt-4">
            <Link href="/marketplace" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm"
              style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid ${GOLD}`, color: DARK_TEXT }}>
              {language === 'zh' ? '查看全部' : 'See All Stores'} <ArrowRight size={14} style={{ color: GOLD }} />
            </Link>
          </div>
        </div>
      )}

      {/* DURIANEX */}
      <p className="text-center text-xs pt-6 pb-2" style={{ color: 'rgba(246,241,231,0.25)' }}>
        {language === 'zh' ? '价格数据由 ' : 'Price data by '}
        <a href="https://durianex-web.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>DURIANEX</a>
        {language === 'zh' ? ' 支持' : ''}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// TOP BAR
// ════════════════════════════════════════════════════════════════════════
function TopBar({ isGuest = false }: { isGuest?: boolean }) {
  const { user, language } = useAppStore()
  const initials = (user?.full_name ?? 'G').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? (language === 'zh' ? '访客' : 'Guest')
  const coins = user?.sb_coins ?? 0

  return (
    <div className="flex items-center gap-2 mb-4">
      {/* Avatar */}
      {!isGuest && user?.avatar_url ? (
        <img src={user.avatar_url} alt={firstName} className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          style={{ border: `2px solid ${GOLD}` }} />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
          style={{ background: isGuest ? 'rgba(201,162,39,0.1)' : `linear-gradient(135deg,#5E7F1F,#3a5a1a)`, color: GOLD, border: `2px solid rgba(201,162,39,${isGuest ? '0.25' : '0.55'})` }}>
          {isGuest ? '👤' : initials}
        </div>
      )}

      {/* Name + Crown */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-bold text-sm" style={{ color: '#F6F1E7' }}>{firstName}</span>
        {!isGuest && <Crown size={13} style={{ color: GOLD }} />}
      </div>

      {/* SB Coins */}
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: isGuest ? 'rgba(201,162,39,0.07)' : 'rgba(201,162,39,0.15)', border: `1px solid rgba(201,162,39,${isGuest ? '0.15' : '0.35'})` }}>
        <span style={{ fontSize: 12, opacity: isGuest ? 0.4 : 1 }}>🪙</span>
        <span className="text-xs font-black" style={{ color: isGuest ? 'rgba(201,162,39,0.35)' : GOLD }}>{isGuest ? '0' : coins.toLocaleString()}</span>
        {!isGuest && <span className="text-xs" style={{ color: MUTED, fontSize: 9 }}>SB Coins</span>}
      </div>

      {/* Bell */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.4)` }}>
          <Bell size={16} style={{ color: GOLD }} />
        </div>
        {!isGuest && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#243b2f]" />}
      </div>

      {/* Search / Login+Register */}
      {isGuest ? (
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <Link href="/login" className="text-xs font-semibold px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.35)' }}>
            {language === 'zh' ? '登录' : 'Login'}
          </Link>
          <Link href="/register" className="text-xs font-bold px-2.5 py-1.5 rounded-xl"
            style={{ background: '#5E7F1F', color: '#F6F1E7' }}>
            {language === 'zh' ? '注册' : 'Register'}
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1px solid rgba(201,162,39,0.35)` }}>
          <Search size={13} style={{ color: MUTED }} />
          <span className="text-xs" style={{ color: MUTED }}>Search...</span>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// LOGGED-IN NAV BAR
// ════════════════════════════════════════════════════════════════════════
function NavBar() {
  return (
    <div className="flex items-center gap-2 mb-4">
      {[
        { href: '/consumer/dashboard', icon: '👤', label: 'User' },
        { href: '/marketplace', icon: '🛍️', label: 'Style Hub' },
        { href: '/consumer/cart', icon: '🛒', label: 'Cart', badge: 0 },
      ].map(item => (
        <Link key={item.href} href={item.href}
          className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl"
          style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.4)`, minWidth: 56 }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: DARK_TEXT, fontSize: 9 }}>{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold" style={{ fontSize: 9 }}>{item.badge}</span>
          )}
        </Link>
      ))}
      {/* Search */}
      <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full"
        style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.4)` }}>
        <Search size={13} style={{ color: MUTED }} />
        <span className="text-xs" style={{ color: MUTED }}>Search...</span>
        <span style={{ fontSize: 14, marginLeft: 'auto' }}>💬</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { user, language } = useAppStore()
  const isLoggedIn = !!user && !['super_admin', 'platform_admin'].includes(user.platform_role ?? '')

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <TopBar isGuest={!isLoggedIn} />
        {isLoggedIn && <NavBar />}
        <HomeBody language={language} />
      </div>
      <Mascot message={
        isLoggedIn
          ? 'Hello! Welcome to SB Durian Marketplace 🍈'
          : (language === 'zh' ? '注册后享受更多功能！🍈' : 'Register to unlock more! 🍈')
      } />
    </div>
  )
}
