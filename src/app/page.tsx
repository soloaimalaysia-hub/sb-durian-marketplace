'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, Search, Crown, ChevronRight, MapPin, Star, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────
interface HomepageCard {
  id: string
  section: string
  title: string
  subtitle: string | null
  action_label: string | null
  emoji: string | null
  image_url: string | null
  href: string
  bg_gradient: string | null
  is_active: boolean
  sort_order: number
}

interface FeaturedVendor {
  id: string
  shop_name: string
  location: string
  rating: number
  logo_url: string | null
  is_open: boolean
}

// ── Star Rating ──────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10}
          fill={i <= Math.round(rating) ? '#C7A617' : 'none'}
          stroke={i <= Math.round(rating) ? '#C7A617' : 'rgba(199,166,23,0.3)'} />
      ))}
      <span className="text-xs font-bold ml-1" style={{ color: '#C7A617' }}>{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Mascot ───────────────────────────────────────────────────────────────
function Mascot({ message }: { message: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="relative max-w-[170px]">
          <div className="px-3 py-2 rounded-2xl rounded-br-none text-xs font-medium leading-snug shadow-xl"
            style={{ background: 'rgba(20,38,28,0.97)', border: '1px solid rgba(199,166,23,0.45)', color: '#F6F1E7' }}>
            {message}
          </div>
          <button onClick={() => setOpen(false)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(199,166,23,0.3)', color: '#C7A617' }}>×</button>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl"
        style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', border: '2px solid rgba(199,166,23,0.6)' }}>
        🧧
      </button>
    </div>
  )
}

// ── Compact Vendor Row ────────────────────────────────────────────────────
function VendorRow({ v }: { v: FeaturedVendor }) {
  const initials = v.shop_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Link href={`/vendor/${v.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{ background: 'rgba(20,38,28,0.8)', border: '1px solid rgba(199,166,23,0.15)' }}>
      {v.logo_url ? (
        <img src={v.logo_url} alt={v.shop_name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
          style={{ border: '1px solid rgba(199,166,23,0.3)' }} />
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', color: '#C7A617' }}>
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: '#C7A617' }}>{v.shop_name}</p>
        <div className="flex items-center gap-1.5">
          <StarRating rating={v.rating} />
          <span className="text-xs" style={{ color: 'rgba(246,241,231,0.35)' }}>·</span>
          <MapPin size={9} style={{ color: 'rgba(246,241,231,0.4)' }} />
          <span className="text-xs truncate" style={{ color: 'rgba(246,241,231,0.4)' }}>{v.location}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {v.is_open && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(94,127,31,0.8)', color: '#F6F1E7' }}>OPEN</span>}
        <ChevronRight size={13} style={{ color: 'rgba(199,166,23,0.4)' }} />
      </div>
    </Link>
  )
}

// ── Growth Loop Card ─────────────────────────────────────────────────────
function GrowthCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href}
      className="flex flex-col items-center rounded-2xl p-3 text-center active:scale-95 transition-all"
      style={{ background: card.bg_gradient ?? 'rgba(94,127,31,0.15)', border: '1px solid rgba(199,166,23,0.18)' }}>
      {card.image_url ? (
        <img src={card.image_url} alt={card.title} className="w-10 h-10 rounded-xl object-cover mb-1.5" />
      ) : (
        <div className="text-2xl mb-1.5">{card.emoji ?? '🍈'}</div>
      )}
      <p className="font-black text-xs leading-tight" style={{ color: '#F6F1E7' }}>{card.title}</p>
      {card.subtitle && <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(246,241,231,0.4)' }}>{card.subtitle}</p>}
      {card.action_label && <p className="text-xs font-bold mt-1" style={{ color: '#C7A617' }}>· {card.action_label}</p>}
    </Link>
  )
}

// ── Role Card ────────────────────────────────────────────────────────────
function RoleCard({ card }: { card: HomepageCard }) {
  const bg = card.image_url
    ? `linear-gradient(to bottom, rgba(20,38,28,0.3) 0%, rgba(20,38,28,0.85) 100%), url(${card.image_url})`
    : (card.bg_gradient ?? 'linear-gradient(135deg,#1a4a2e,#2d6b3a)')
  return (
    <Link href={card.href}
      className="relative rounded-2xl overflow-hidden flex flex-col justify-end p-3 active:scale-95 transition-all"
      style={{
        background: bg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '110px',
        border: '1px solid rgba(199,166,23,0.2)',
      }}>
      {card.image_url && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,38,28,0.88) 0%, rgba(20,38,28,0.1) 100%)' }} />
      )}
      <div className="relative">
        <div className="text-xl mb-0.5">{card.emoji ?? '🍈'}</div>
        <p className="font-black text-sm leading-tight" style={{ color: '#F6F1E7' }}>{card.title}</p>
        {card.subtitle && <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(246,241,231,0.5)' }}>{card.subtitle}</p>}
      </div>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════════════════
// SHARED BODY (cards + vendors) — same for logged-in and guest
// ════════════════════════════════════════════════════════════════════════
function HomeBody({ language }: { language: string }) {
  const [growthCards, setGrowthCards] = useState<HomepageCard[]>([])
  const [roleCards, setRoleCards] = useState<HomepageCard[]>([])
  const [vendors, setVendors] = useState<FeaturedVendor[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('sbm_homepage_cards').select('*').eq('is_active', true).eq('section', 'growth').order('sort_order'),
      supabase.from('sbm_homepage_cards').select('*').eq('is_active', true).eq('section', 'role').order('sort_order'),
      supabase.from('sbm_featured_vendors').select('id,shop_name,location,rating,logo_url,is_open').eq('is_active', true).order('rank').limit(10),
    ]).then(([g, r, v]) => {
      setGrowthCards(g.data || [])
      setRoleCards(r.data || [])
      setVendors(v.data || [])
    })
  }, [])

  // Role cards: wireframe layout — 3 cols, 2 rows
  // [0] Farmer   [2] Wholesaler  [4] Vendor
  // [1] Affiliate [3] Customer   [5] Driver
  const col1 = roleCards.filter((_, i) => i % 3 === 0)  // pos 0,3
  const col2 = roleCards.filter((_, i) => i % 3 === 1)  // pos 1,4
  const col3 = roleCards.filter((_, i) => i % 3 === 2)  // pos 2,5

  return (
    <div className="space-y-4 pb-28">
      {/* Growth Loop — 4 cards in a row */}
      {growthCards.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {growthCards.map(c => <GrowthCard key={c.id} card={c} />)}
        </div>
      )}

      {/* Role Cards — 3 cols x 2 rows (wireframe layout) */}
      {roleCards.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {/* Column 1 */}
          <div className="flex flex-col gap-2">
            {col1.map(c => <RoleCard key={c.id} card={c} />)}
          </div>
          {/* Column 2 */}
          <div className="flex flex-col gap-2">
            {col2.map(c => <RoleCard key={c.id} card={c} />)}
          </div>
          {/* Column 3 */}
          <div className="flex flex-col gap-2">
            {col3.map(c => <RoleCard key={c.id} card={c} />)}
          </div>
        </div>
      )}

      {/* Top 10 Vendors */}
      {vendors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black" style={{ color: '#C7A617' }}>🏆 Top 10 Durian Stores</h2>
            <Link href="/marketplace" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: '#C7A617' }}>
              {language === 'zh' ? '全部' : 'See all'} <ArrowRight size={10} />
            </Link>
          </div>
          <div className="space-y-2">
            {vendors.map(v => <VendorRow key={v.id} v={v} />)}
          </div>
        </div>
      )}

      {/* DURIANEX */}
      <p className="text-center text-xs pt-2" style={{ color: 'rgba(246,241,231,0.25)' }}>
        {language === 'zh' ? '价格数据由 ' : 'Price data by '}
        <a href="https://durianex-web.vercel.app" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">DURIANEX</a>
        {language === 'zh' ? ' 支持' : ''}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// LOGGED-IN HOME
// ════════════════════════════════════════════════════════════════════════
function LoggedInHome() {
  const { user, language } = useAppStore()
  const initials = (user?.full_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? 'User'
  const coins = user?.sb_coins ?? 0

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-3 pt-4 space-y-3">

        {/* ── Top Bar (wireframe) ── */}
        <div className="flex items-center gap-2">
          {/* Left: Avatar + Name */}
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={firstName} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid rgba(199,166,23,0.55)' }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', color: '#C7A617', border: '2px solid rgba(199,166,23,0.45)' }}>
              {initials}
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm" style={{ color: '#F6F1E7' }}>{firstName}</span>
            <Crown size={12} style={{ color: '#C7A617' }} />
          </div>

          {/* SB Coin */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(199,166,23,0.15)', border: '1px solid rgba(199,166,23,0.3)' }}>
            <span className="text-xs">🪙</span>
            <span className="text-xs font-black" style={{ color: '#C7A617' }}>{coins.toLocaleString()}</span>
          </div>

          {/* Bell */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(20,38,28,0.85)', border: '1px solid rgba(199,166,23,0.2)' }}>
              <Bell size={15} style={{ color: '#F6F1E7' }} />
            </div>
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#14261c]" />
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(20,38,28,0.85)', border: '1px solid rgba(199,166,23,0.2)' }}>
            <Search size={13} style={{ color: 'rgba(246,241,231,0.35)' }} />
            <span className="text-xs" style={{ color: 'rgba(246,241,231,0.3)' }}>Search...</span>
          </div>
        </div>

        <HomeBody language={language} />
      </div>

      <Mascot message="Hello! Welcome to SB Durian Marketplace 🍈" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// GUEST HOME
// ════════════════════════════════════════════════════════════════════════
function GuestHome() {
  const { language } = useAppStore()

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-3 pt-4 space-y-3">

        {/* ── Top Bar (guest) ── */}
        <div className="flex items-center gap-2">
          {/* Guest avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(94,127,31,0.12)', border: '2px dashed rgba(199,166,23,0.25)' }}>
            <span className="text-sm">👤</span>
          </div>
          <span className="font-bold text-sm" style={{ color: 'rgba(246,241,231,0.7)' }}>
            {language === 'zh' ? '欢迎光临' : 'Welcome'}
          </span>

          {/* SB Coin (greyed out) */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(199,166,23,0.07)', border: '1px solid rgba(199,166,23,0.15)' }}>
            <span className="text-xs opacity-40">🪙</span>
            <span className="text-xs font-black" style={{ color: 'rgba(199,166,23,0.35)' }}>0</span>
          </div>

          {/* Bell (greyed out) */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-40"
            style={{ background: 'rgba(20,38,28,0.85)', border: '1px solid rgba(199,166,23,0.15)' }}>
            <Bell size={15} style={{ color: '#F6F1E7' }} />
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(20,38,28,0.85)', border: '1px solid rgba(199,166,23,0.2)' }}>
            <Search size={13} style={{ color: 'rgba(246,241,231,0.35)' }} />
            <span className="text-xs" style={{ color: 'rgba(246,241,231,0.3)' }}>Search...</span>
          </div>

          {/* Login + Register */}
          <Link href="/login" className="text-xs font-semibold px-2.5 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.35)' }}>
            {language === 'zh' ? '登录' : 'Login'}
          </Link>
          <Link href="/register" className="text-xs font-bold px-2.5 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: '#5E7F1F', color: '#F6F1E7' }}>
            {language === 'zh' ? '注册' : 'Register'}
          </Link>
        </div>

        <HomeBody language={language} />
      </div>

      <Mascot message={language === 'zh' ? '注册后享受更多功能！🍈' : 'Register to unlock more! 🍈'} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { user } = useAppStore()
  if (user && !['super_admin', 'platform_admin'].includes(user.platform_role ?? '')) {
    return <LoggedInHome />
  }
  return <GuestHome />
}
