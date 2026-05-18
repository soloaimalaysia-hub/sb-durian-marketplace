'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, Search, Crown, MapPin, Star, ArrowRight, Wallet, Ticket, ChevronRight, TrendingUp, ShoppingBag, Users, Gamepad2, Gift, CalendarCheck, Zap } from 'lucide-react'
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
interface FeaturedVendor {
  id: string; shop_name: string; location: string; rating: number
  cover_image_url: string | null; logo_url: string | null
  tags: string[]; open_hours: string; open_days: string; is_open: boolean
}

// ── Ornamental Section Header ────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="flex items-center gap-3 px-6 py-2 rounded-full"
        style={{ background: `linear-gradient(90deg,rgba(201,162,39,0.06),rgba(201,162,39,0.18),rgba(201,162,39,0.06))`, border: `1px solid rgba(201,162,39,0.5)` }}>
        <span style={{ color: GOLD }}>→</span>
        <span className="text-sm font-bold tracking-widest uppercase" style={{ color: GOLD }}>{label}</span>
        <span style={{ color: GOLD }}>←</span>
      </div>
    </div>
  )
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

// ── Cream Card wrapper ───────────────────────────────────────────────────
function CreamCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.45)`, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', ...style }}>
      {children}
    </div>
  )
}

// ── Growth Card ──────────────────────────────────────────────────────────
function GrowthCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href}
      className="flex flex-col items-center rounded-2xl p-3 text-center active:scale-95 transition-all hover:shadow-lg"
      style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.45)`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {card.image_url
        ? <img src={card.image_url} alt={card.title} className="w-14 h-14 object-contain mb-2" />
        : <div className="text-4xl mb-2">{card.emoji ?? '🍈'}</div>
      }
      <p className="font-black text-sm leading-tight" style={{ color: DARK }}>{card.title}</p>
      {card.subtitle && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{card.subtitle}</p>}
      {card.action_label && <p className="text-xs font-bold mt-1.5" style={{ color: GOLD }}>· {card.action_label}</p>}
    </Link>
  )
}

// ── Entry Card ───────────────────────────────────────────────────────────
function EntryCard({ card }: { card: HomepageCard }) {
  return (
    <Link href={card.href}
      className="rounded-2xl overflow-hidden block hover:scale-[1.02] active:scale-[0.98] transition-all"
      style={{ border: `1.5px solid rgba(201,162,39,0.4)`, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        <div className="w-full h-full" style={{ background: card.bg_gradient ?? 'linear-gradient(135deg,#1a4a2e,#2d6b3a)' }}>
          {card.image_url && <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />}
          {!card.image_url && <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">{card.emoji}</div>}
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(20,38,28,0.55) 0%,transparent 60%)' }} />
      </div>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})` }}>
        <div>
          <p className="font-black text-sm" style={{ color: DARK }}>{card.title}</p>
          {card.subtitle && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{card.subtitle}</p>}
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
          style={{ background: BG, border: `1px solid ${GOLD}` }}>
          <ArrowRight size={15} style={{ color: GOLD }} />
        </div>
      </div>
    </Link>
  )
}

// ── Vendor Card (desktop: horizontal layout) ─────────────────────────────
function VendorCard({ v, compact = false }: { v: FeaturedVendor; compact?: boolean }) {
  const initials = v.shop_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (compact) {
    // Horizontal compact for sidebar / list view on desktop
    return (
      <Link href={`/vendor/${v.id}`}
        className="flex items-center gap-3 p-3 rounded-xl hover:shadow-md transition-all"
        style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1px solid rgba(201,162,39,0.35)` }}>
        {v.logo_url
          ? <img src={v.logo_url} alt={v.shop_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `1.5px solid ${GOLD}` }} />
          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: BG, color: GOLD, border: `1.5px solid ${GOLD}` }}>{initials}</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: DARK }}>{v.shop_name}</p>
          <div className="flex items-center gap-1">
            <Star size={11} fill={GOLD} stroke={GOLD} />
            <span className="text-xs font-bold" style={{ color: DARK }}>{v.rating.toFixed(1)}</span>
            <span className="text-xs" style={{ color: MUTED }}>· {v.location}</span>
          </div>
        </div>
        {v.is_open && <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(94,127,31,0.15)', color: '#3a6a1a', border: '1px solid rgba(94,127,31,0.3)' }}>OPEN</span>}
      </Link>
    )
  }

  // Full card (vertical, for grid)
  return (
    <Link href={`/vendor/${v.id}`}
      className="block rounded-2xl overflow-hidden hover:scale-[1.01] transition-all"
      style={{ border: `1.5px solid rgba(201,162,39,0.45)`, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        {v.cover_image_url
          ? <img src={v.cover_image_url} alt={v.shop_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1a4a2e,#2d6b3a)' }}><span className="text-6xl opacity-15">🍈</span></div>
        }
        {v.is_open && <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(94,127,31,0.9)', color: '#fff' }}>OPEN</span>}
      </div>
      <div className="p-4" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})` }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {v.logo_url
              ? <img src={v.logo_url} alt="logo" className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${GOLD}` }} />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: BG, color: GOLD, border: `2px solid ${GOLD}` }}>{initials}</div>
            }
            <div className="min-w-0">
              <p className="font-black text-sm truncate" style={{ color: DARK }}>{v.shop_name}</p>
              <div className="flex items-center gap-1">
                <MapPin size={10} style={{ color: MUTED }} />
                <span className="text-xs truncate" style={{ color: MUTED }}>{v.location}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs" style={{ color: MUTED }}>Rate</p>
            <div className="flex items-center gap-1">
              <span className="font-black text-base" style={{ color: DARK }}>{v.rating.toFixed(1)}</span>
              <Star size={13} fill={GOLD} stroke={GOLD} />
            </div>
          </div>
        </div>
        {(v.tags || []).length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {(v.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,31,14,0.07)', color: MUTED, border: '1px solid rgba(45,31,14,0.12)', fontSize: 10 }}>🌿 {tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ background: BG, border: `1px solid ${GOLD}` }}>
          <span className="text-sm font-bold" style={{ color: GOLD }}>View Store</span>
          <ArrowRight size={14} style={{ color: GOLD }} />
        </div>
      </div>
    </Link>
  )
}

// ── Left Sidebar (desktop only) ──────────────────────────────────────────
function Sidebar({ user }: { user: ReturnType<typeof useAppStore>['user'] }) {
  const coins    = user?.sb_coins ?? 0
  const balance  = user?.wallet_balance ?? 0
  const vouchers = user?.voucher_count ?? 0

  const quickLinks = [
    { icon: TrendingUp, label: 'Marketplace', href: '/marketplace' },
    { icon: ShoppingBag, label: 'Style Hub', href: '/marketplace' },
    { icon: Users, label: 'My Account', href: '/consumer/dashboard' },
  ]

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">
      {/* Wallet */}
      <CreamCard className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={15} style={{ color: GOLD }} />
          <span className="text-xs font-semibold" style={{ color: MUTED }}>SB Wallet</span>
        </div>
        <p className="text-2xl font-black mb-4" style={{ color: DARK }}>
          RM {balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>↑ Top Up</button>
          <button className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(45,31,14,0.08)', color: DARK, border: '1px solid rgba(45,31,14,0.15)' }}>Txns</button>
        </div>
      </CreamCard>

      {/* Vouchers */}
      <CreamCard className="p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={15} style={{ color: GOLD }} />
            <span className="text-xs font-semibold" style={{ color: MUTED }}>Vouchers</span>
          </div>
          <p className="text-3xl font-black" style={{ color: DARK }}>{vouchers}</p>
          <p className="text-xs" style={{ color: MUTED }}>Available</p>
        </div>
        <Link href="/consumer/vouchers" className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>
          View <ChevronRight size={14} />
        </Link>
      </CreamCard>

      {/* SB Coins */}
      <CreamCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: MUTED }}>🪙 SB Coins</p>
            <p className="text-2xl font-black" style={{ color: DARK }}>{coins.toLocaleString()}</p>
          </div>
          <Link href="/consumer/rewards" className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>
            Redeem
          </Link>
        </div>
      </CreamCard>

      {/* Quick Links */}
      <CreamCard className="p-4">
        <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: MUTED }}>Quick Access</p>
        <div className="space-y-1">
          {quickLinks.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-all" style={{ background: 'rgba(45,31,14,0.06)' }}>
              <item.icon size={15} style={{ color: GOLD }} />
              <span className="text-sm font-semibold" style={{ color: DARK }}>{item.label}</span>
              <ChevronRight size={13} style={{ color: MUTED, marginLeft: 'auto' }} />
            </Link>
          ))}
        </div>
      </CreamCard>
    </aside>
  )
}

// ── Top Navbar ───────────────────────────────────────────────────────────
function Navbar({ isLoggedIn, user }: { isLoggedIn: boolean; user: ReturnType<typeof useAppStore>['user'] }) {
  const { language } = useAppStore()
  const initials = (user?.full_name ?? 'G').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? (language === 'zh' ? '访客' : 'Guest')
  const coins = user?.sb_coins ?? 0

  return (
    <header className="sticky top-0 z-40 border-b"
      style={{ background: 'rgba(30,53,40,0.97)', backdropFilter: 'blur(12px)', borderColor: 'rgba(201,162,39,0.2)' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="https://klrfpzxjsacriaqtfssf.supabase.co/storage/v1/object/public/sbm-assets/logo.jpeg"
            alt="SB Durian" className="w-10 h-10 rounded-xl object-contain" />
          <div className="hidden sm:block">
            <p className="font-black text-sm leading-tight" style={{ color: GOLD }}>SB Durian</p>
            <p className="text-xs" style={{ color: 'rgba(245,237,213,0.5)' }}>Marketplace</p>
          </div>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {[
            { href: '/marketplace', label: language === 'zh' ? '市场' : 'Marketplace' },
            { href: '/marketplace', label: language === 'zh' ? '分类' : 'Categories' },
            { href: '/vendor', label: language === 'zh' ? '商家' : 'Vendors' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all"
              style={{ color: 'rgba(245,237,213,0.7)' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search bar */}
        <div className="flex-1 max-w-sm mx-auto flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1px solid rgba(201,162,39,0.4)` }}>
          <Search size={15} style={{ color: MUTED }} />
          <span className="text-sm" style={{ color: MUTED }}>Search durian, vendors...</span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {isLoggedIn ? (
            <>
              {/* Coins */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(201,162,39,0.15)', border: `1px solid rgba(201,162,39,0.35)` }}>
                <span style={{ fontSize: 14 }}>🪙</span>
                <span className="text-sm font-black" style={{ color: GOLD }}>{coins.toLocaleString()}</span>
                <span className="text-xs hidden lg:inline" style={{ color: MUTED }}>SB Coins</span>
              </div>

              {/* Bell */}
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.4)` }}>
                <Bell size={16} style={{ color: GOLD }} />
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#1e3528]" />
              </div>

              {/* Avatar */}
              <Link href="/consumer/dashboard">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt={firstName} className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${GOLD}` }} />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm" style={{ background: `linear-gradient(135deg,#5E7F1F,#3a5a1a)`, color: GOLD, border: `2px solid rgba(201,162,39,0.55)` }}>{initials}</div>
                }
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.4)' }}>
                {language === 'zh' ? '登录' : 'Login'}
              </Link>
              <Link href="/register" className="text-sm font-bold px-4 py-2 rounded-xl"
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

// ── Mobile top bar (avatar + coins row) ──────────────────────────────────
function MobileTopBar({ isLoggedIn, user }: { isLoggedIn: boolean; user: ReturnType<typeof useAppStore>['user'] }) {
  const { language } = useAppStore()
  const initials = (user?.full_name ?? 'G').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? (language === 'zh' ? '访客' : 'Guest')
  const coins = user?.sb_coins ?? 0

  return (
    <div className="lg:hidden flex items-center gap-2 mb-4">
      {isLoggedIn ? (
        <>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={firstName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${GOLD}` }} />
            : <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0" style={{ background: `linear-gradient(135deg,#5E7F1F,#3a5a1a)`, color: GOLD, border: `2px solid rgba(201,162,39,0.5)` }}>{initials}</div>
          }
          <div className="flex items-center gap-1"><span className="font-bold text-sm" style={{ color: '#F6F1E7' }}>{firstName}</span><Crown size={12} style={{ color: GOLD }} /></div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(201,162,39,0.15)', border: `1px solid rgba(201,162,39,0.3)` }}>
            <span style={{ fontSize: 12 }}>🪙</span>
            <span className="text-xs font-black" style={{ color: GOLD }}>{coins.toLocaleString()}</span>
          </div>
          <div className="relative ml-auto">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid rgba(201,162,39,0.4)` }}>
              <Bell size={15} style={{ color: GOLD }} />
            </div>
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#1e3528]" />
          </div>
        </>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,162,39,0.1)', border: `2px dashed rgba(201,162,39,0.25)` }}>👤</div>
          <span className="font-bold text-sm" style={{ color: '#F6F1E7' }}>{language === 'zh' ? '欢迎光临' : 'Welcome'}</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <Link href="/login" className="text-xs font-semibold px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.35)' }}>
              {language === 'zh' ? '登录' : 'Login'}
            </Link>
            <Link href="/register" className="text-xs font-bold px-2.5 py-1.5 rounded-xl" style={{ background: '#5E7F1F', color: '#F6F1E7' }}>
              {language === 'zh' ? '注册' : 'Register'}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// MAIN CONTENT (shared)
// ════════════════════════════════════════════════════════════════════════
function MainContent({ language, isLoggedIn, user }: { language: string; isLoggedIn: boolean; user: ReturnType<typeof useAppStore>['user'] }) {
  const [growthCards, setGrowthCards] = useState<HomepageCard[]>([])
  const [entryCards, setEntryCards]   = useState<HomepageCard[]>([])
  const [vendors, setVendors]         = useState<FeaturedVendor[]>([])

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
    <div className="flex-1 min-w-0 space-y-6 pb-28">

      {/* Mobile: Wallet + Vouchers (hidden on desktop where sidebar shows them) */}
      {isLoggedIn && (
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          <CreamCard className="p-4">
            <div className="flex items-center gap-1.5 mb-1"><Wallet size={13} style={{ color: GOLD }} /><span className="text-xs font-semibold" style={{ color: MUTED }}>SB Wallet</span></div>
            <p className="text-lg font-black mb-2.5" style={{ color: DARK }}>RM {(user?.wallet_balance ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
            <div className="flex gap-1.5">
              <button className="flex-1 text-xs py-1.5 rounded-lg font-bold" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>Top Up</button>
              <button className="flex-1 text-xs py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(45,31,14,0.08)', color: DARK, border: '1px solid rgba(45,31,14,0.12)' }}>Txns</button>
            </div>
          </CreamCard>
          <CreamCard className="p-4 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1"><Ticket size={13} style={{ color: GOLD }} /><span className="text-xs font-semibold" style={{ color: MUTED }}>Vouchers</span></div>
            <p className="text-2xl font-black" style={{ color: DARK }}>{user?.voucher_count ?? 0}</p>
            <p className="text-xs mb-auto" style={{ color: MUTED }}>Available</p>
            <Link href="/consumer/vouchers" className="mt-3 flex items-center justify-center gap-1 py-1.5 rounded-xl font-bold text-xs" style={{ background: BG, color: GOLD, border: `1px solid ${GOLD}` }}>
              View <ChevronRight size={12} />
            </Link>
          </CreamCard>
        </div>
      )}

      {/* Growth Loop */}
      {growthCards.length > 0 && (
        <div>
          {/* 4-col on mobile, 4-col bigger on desktop */}
          <div className="grid grid-cols-4 gap-3">
            {growthCards.map(c => <GrowthCard key={c.id} card={c} />)}
          </div>
          {/* Promo strip */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mt-3"
            style={{ background: `linear-gradient(90deg,rgba(201,162,39,0.12),rgba(201,162,39,0.22),rgba(201,162,39,0.12))`, border: `1px solid rgba(201,162,39,0.4)` }}>
            <p className="text-sm font-medium" style={{ color: DARK }}>
              🪙 Redeem your SB Coins &amp; Points for exciting rewards, vouchers &amp; more!
            </p>
            <Link href="/consumer/rewards" className="flex items-center gap-1 text-sm font-black flex-shrink-0 ml-4" style={{ color: GOLD }}>
              View All Rewards <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Entry Cards — 2 col mobile, 4 col desktop */}
      {entryCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {entryCards.slice(0, 4).map(c => <EntryCard key={c.id} card={c} />)}
        </div>
      )}

      {/* Top 10 Featured Vendors */}
      {vendors.length > 0 && (
        <div>
          <SectionHeader label="Top 10 Featured Vendor" />
          {/* 1 col mobile, 2 col md, 3 col lg */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {vendors.map(v => <VendorCard key={v.id} v={v} />)}
          </div>
          <div className="text-center mt-6">
            <Link href="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all"
              style={{ background: `linear-gradient(145deg,${CREAM},${CREAM2})`, border: `1.5px solid ${GOLD}`, color: DARK, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              {language === 'zh' ? '查看全部商家' : 'See All Stores'} <ArrowRight size={15} style={{ color: GOLD }} />
            </Link>
          </div>
        </div>
      )}

      {/* DURIANEX */}
      <p className="text-center text-xs pt-4" style={{ color: 'rgba(246,241,231,0.25)' }}>
        {language === 'zh' ? '价格数据由 ' : 'Price data powered by '}
        <a href="https://durianex-web.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>DURIANEX</a>
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { user, language } = useAppStore()
  const isLoggedIn = !!user && !['super_admin', 'platform_admin'].includes(user.platform_role ?? '')

  return (
    <>
      {/* Sticky top navbar */}
      <Navbar isLoggedIn={isLoggedIn} user={user} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        {/* Mobile top bar (avatar/coins row — hidden on desktop, navbar handles it) */}
        <MobileTopBar isLoggedIn={isLoggedIn} user={user} />

        {/* Desktop: sidebar + main | Mobile: just main */}
        <div className="flex gap-6 items-start">
          {/* Sidebar — desktop only, logged in only */}
          {isLoggedIn && <Sidebar user={user} />}

          {/* Main content */}
          <MainContent language={language} isLoggedIn={isLoggedIn} user={user} />
        </div>
      </div>

      <Mascot message={
        isLoggedIn
          ? 'Hello! Welcome to SB Durian Marketplace 🍈'
          : (language === 'zh' ? '注册后享受更多功能！🍈' : 'Register to unlock more features! 🍈')
      } />
    </>
  )
}
