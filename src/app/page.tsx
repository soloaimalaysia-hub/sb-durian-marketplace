'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Bell, ShoppingBag, ShoppingCart, Search,
  Wallet, Ticket, CalendarCheck, Gift, Zap, Gamepad2,
  ArrowRight, MapPin, Star, Crown, ChevronRight,
  Users, Truck, MessageCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase/client'

// ── Types ───────────────────────────────────────────────────────────────
interface FeaturedVendor {
  id: string
  shop_name: string
  location: string
  rating: number
  cover_image_url: string | null
  logo_url: string | null
  tags: string[]
  open_hours: string
  is_open: boolean
}

// ── Star Rating ─────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11}
          fill={i <= Math.round(rating) ? '#C7A617' : 'none'}
          stroke={i <= Math.round(rating) ? '#C7A617' : 'rgba(199,166,23,0.35)'} />
      ))}
      <span className="text-xs font-bold ml-1" style={{ color: '#C7A617' }}>{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Mascot ──────────────────────────────────────────────────────────────
function Mascot({ message }: { message: string }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
      <div className="relative max-w-[180px]">
        <div className="px-3 py-2 rounded-2xl rounded-br-none text-xs font-medium leading-snug shadow-lg"
          style={{ background: 'rgba(20,38,28,0.97)', border: '1px solid rgba(199,166,23,0.4)', color: '#F6F1E7' }}>
          {message}
        </div>
        <button onClick={() => setVisible(false)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(199,166,23,0.3)', color: '#C7A617' }}>×</button>
      </div>
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', border: '2px solid rgba(199,166,23,0.6)' }}>
        🧧
      </div>
    </div>
  )
}

// ── Big Entry Cards data ─────────────────────────────────────────────────
const BIG_CARDS = [
  { href: '/marketplace', title: 'Explore Marketplace', desc: 'Shop premium durian with trusted sellers', emoji: '🛒', grad: 'linear-gradient(135deg,#1a4a2e 0%,#2d6b3a 100%)' },
  { href: '/register?role=retailer', title: 'Start Selling', desc: 'Grow your durian business with us', emoji: '🍈', grad: 'linear-gradient(135deg,#2a3a1a 0%,#4a5a28 100%)' },
  { href: '/register?role=wholesaler', title: 'Earn Commission', desc: 'Share & earn up to 20% commission', emoji: '💰', grad: 'linear-gradient(135deg,#1a2a3a 0%,#2a4a5a 100%)' },
  { href: '/register?role=orchard', title: 'Deliver & Earn', desc: 'Flexible hours, more deliveries, more income', emoji: '🚚', grad: 'linear-gradient(135deg,#2a1a3a 0%,#3a2a5a 100%)' },
]

// ── Compact Vendor Card ──────────────────────────────────────────────────
function VendorCard({ v }: { v: FeaturedVendor }) {
  const initials = v.shop_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Link href={`/vendor/${v.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{ background: 'rgba(20,38,28,0.8)', border: '1px solid rgba(199,166,23,0.18)' }}>
      {v.logo_url ? (
        <img src={v.logo_url} alt={v.shop_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          style={{ border: '1.5px solid rgba(199,166,23,0.35)' }} />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', color: '#C7A617' }}>
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: '#C7A617' }}>{v.shop_name}</p>
        <StarRating rating={v.rating} />
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={10} style={{ color: 'rgba(246,241,231,0.4)' }} />
          <span className="text-xs truncate" style={{ color: 'rgba(246,241,231,0.45)' }}>{v.location}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {v.is_open && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(94,127,31,0.85)', color: '#F6F1E7' }}>OPEN</span>
        )}
        <ChevronRight size={14} style={{ color: 'rgba(199,166,23,0.5)' }} />
      </div>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════════════════
// LOGGED-IN HOME
// ════════════════════════════════════════════════════════════════════════
function LoggedInHome() {
  const { user } = useAppStore()
  const initials = (user?.full_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? 'User'
  const coins = user?.sb_coins ?? 0
  const balance = user?.wallet_balance ?? 0
  const vouchers = user?.voucher_count ?? 0

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={firstName} className="w-12 h-12 rounded-full object-cover"
                style={{ border: '2px solid rgba(199,166,23,0.6)' }} />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base"
                style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', color: '#C7A617', border: '2px solid rgba(199,166,23,0.5)' }}>
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-base" style={{ color: '#F6F1E7' }}>{firstName}</span>
                <Crown size={14} style={{ color: '#C7A617' }} />
              </div>
              <span className="text-xs" style={{ color: 'rgba(246,241,231,0.45)' }}>Welcome back 👋</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(199,166,23,0.15)', border: '1px solid rgba(199,166,23,0.35)' }}>
              <span className="text-sm">🪙</span>
              <span className="text-sm font-black" style={{ color: '#C7A617' }}>{coins.toLocaleString()}</span>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(20,38,28,0.9)', border: '1px solid rgba(199,166,23,0.25)' }}>
                <Bell size={18} style={{ color: '#F6F1E7' }} />
              </div>
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#14261c]" />
            </div>
          </div>
        </div>

        {/* ── Nav Bar ── */}
        <div className="flex items-center gap-2">
          {[
            { href: '/consumer/dashboard', icon: Users, label: 'User' },
            { href: '/marketplace', icon: ShoppingBag, label: 'Style Hub' },
            { href: '/consumer/cart', icon: ShoppingCart, label: 'Cart' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(20,38,28,0.85)', border: '1px solid rgba(199,166,23,0.18)' }}>
              <item.icon size={18} style={{ color: '#C7A617' }} />
              <span className="text-xs whitespace-nowrap" style={{ color: 'rgba(246,241,231,0.6)' }}>{item.label}</span>
            </Link>
          ))}
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(20,38,28,0.85)', border: '1px solid rgba(199,166,23,0.18)' }}>
            <Search size={15} style={{ color: 'rgba(246,241,231,0.35)' }} />
            <span className="text-sm flex-1" style={{ color: 'rgba(246,241,231,0.3)' }}>Search...</span>
            <MessageCircle size={15} style={{ color: 'rgba(199,166,23,0.5)' }} />
          </div>
        </div>

        {/* ── Wallet + Vouchers ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg,rgba(20,38,28,0.97),rgba(30,55,38,0.97))', border: '1px solid rgba(199,166,23,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={14} style={{ color: '#C7A617' }} />
              <span className="text-xs font-semibold" style={{ color: 'rgba(246,241,231,0.55)' }}>SB Wallet</span>
            </div>
            <p className="text-xl font-black mb-3" style={{ color: '#F6F1E7' }}>
              RM {balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex gap-2">
              <button className="flex-1 text-xs py-1.5 rounded-lg font-semibold"
                style={{ background: 'rgba(199,166,23,0.18)', color: '#C7A617', border: '1px solid rgba(199,166,23,0.3)' }}>
                Top Up
              </button>
              <button className="flex-1 text-xs py-1.5 rounded-lg font-semibold"
                style={{ background: 'rgba(94,127,31,0.18)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.3)' }}>
                Txns
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-4 flex flex-col"
            style={{ background: 'linear-gradient(135deg,rgba(20,38,28,0.97),rgba(30,55,38,0.97))', border: '1px solid rgba(199,166,23,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={14} style={{ color: '#C7A617' }} />
              <span className="text-xs font-semibold" style={{ color: 'rgba(246,241,231,0.55)' }}>Vouchers</span>
            </div>
            <p className="text-2xl font-black" style={{ color: '#C7A617' }}>{vouchers}</p>
            <p className="text-xs mb-auto" style={{ color: 'rgba(246,241,231,0.4)' }}>Available</p>
            <Link href="/consumer/vouchers" className="mt-3 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-semibold"
              style={{ background: 'rgba(199,166,23,0.18)', color: '#C7A617', border: '1px solid rgba(199,166,23,0.3)' }}>
              View All <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* ── Growth Loop 2×2 ── */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(20,38,28,0.9)', border: '1px solid rgba(199,166,23,0.2)' }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { emoji: '📅', title: 'Check In', sub: 'Earn Points Daily', action: '+10 Points', color: '#8bc34a', bg: 'rgba(94,127,31,0.15)', border: 'rgba(94,127,31,0.25)' },
              { emoji: '🎁', title: 'Hot Rewards', sub: 'Redeem Coins & Points', action: 'Redeem Now', color: '#C7A617', bg: 'rgba(199,166,23,0.12)', border: 'rgba(199,166,23,0.25)' },
              { emoji: '🎰', title: 'Lucky Draw', sub: 'Try Your Luck', action: 'Use Coins', color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.25)' },
              { emoji: '🎮', title: 'Mini Games', sub: 'Play & Earn Coins', action: 'Play Now', color: '#8bc34a', bg: 'rgba(139,195,74,0.1)', border: 'rgba(139,195,74,0.25)' },
            ].map((item, i) => (
              <button key={i} className="rounded-xl p-3 text-left active:scale-95 transition-all"
                style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <div className="text-xl mb-1.5">{item.emoji}</div>
                <p className="font-bold text-xs" style={{ color: '#F6F1E7' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(246,241,231,0.4)' }}>{item.sub}</p>
                <p className="text-xs font-bold mt-1" style={{ color: item.color }}>· {item.action}</p>
              </button>
            ))}
          </div>
          {/* Promo strip */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: 'linear-gradient(90deg,rgba(94,127,31,0.2),rgba(199,166,23,0.12))', border: '1px solid rgba(199,166,23,0.2)' }}>
            <p className="text-xs" style={{ color: 'rgba(246,241,231,0.65)' }}>
              🪙 Redeem SB Coins &amp; Points for rewards!
            </p>
            <Link href="/consumer/rewards" className="flex items-center gap-0.5 text-xs font-bold flex-shrink-0 ml-2"
              style={{ color: '#C7A617' }}>
              View All <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* ── Big Entry Cards 2×2 ── */}
        <div className="grid grid-cols-2 gap-3">
          {BIG_CARDS.map(card => (
            <Link key={card.href} href={card.href}
              className="relative rounded-2xl overflow-hidden h-36 flex flex-col justify-end p-3 active:scale-95 transition-all"
              style={{ background: card.grad }}>
              <div className="absolute top-3 right-3 text-3xl opacity-30">{card.emoji}</div>
              <p className="font-black text-sm leading-tight" style={{ color: '#F6F1E7' }}>{card.title}</p>
              <p className="text-xs mt-0.5 mb-2" style={{ color: 'rgba(246,241,231,0.5)' }}>{card.desc}</p>
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(199,166,23,0.25)' }}>
                <ArrowRight size={13} style={{ color: '#C7A617' }} />
              </div>
            </Link>
          ))}
        </div>

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
  const [vendors, setVendors] = useState<FeaturedVendor[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('sbm_featured_vendors').select('*').eq('is_active', true)
      .order('rank', { ascending: true }).limit(10)
      .then(({ data }) => setVendors(data || []))
  }, [])

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* Guest Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(94,127,31,0.12)', border: '2px dashed rgba(199,166,23,0.3)' }}>
              <span className="text-xl">👤</span>
            </div>
            <div>
              <p className="font-black text-base" style={{ color: '#F6F1E7' }}>
                {language === 'zh' ? '欢迎光临' : language === 'en' ? 'Welcome, Guest' : 'Selamat Datang'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(246,241,231,0.4)' }}>
                {language === 'zh' ? '登录后解锁更多功能 🍈' : language === 'en' ? 'Login to unlock more 🍈' : 'Log masuk untuk lebih ciri 🍈'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.35)' }}>
              {language === 'zh' ? '登录' : language === 'en' ? 'Login' : 'Log In'}
            </Link>
            <Link href="/register" className="text-sm font-bold px-3 py-1.5 rounded-xl"
              style={{ background: '#5E7F1F', color: '#F6F1E7' }}>
              {language === 'zh' ? '注册' : language === 'en' ? 'Register' : 'Daftar'}
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center py-2">
          <div className="flex justify-center mb-3">
            <img src="https://klrfpzxjsacriaqtfssf.supabase.co/storage/v1/object/public/sbm-assets/logo.jpeg"
              alt="SB Durian" className="h-20 w-20 rounded-2xl object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#C7A617' }}>
            SB Durian <span style={{ color: '#F6F1E7' }}>Marketplace</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(246,241,231,0.45)' }}>
            {language === 'zh' ? '马来西亚智能榴莲市场' : language === 'en' ? "Malaysia's Smart Durian Market" : 'Pasaran Durian Pintar Malaysia'}
          </p>
        </div>

        {/* Big Entry Cards */}
        <div className="grid grid-cols-2 gap-3">
          {BIG_CARDS.map(card => (
            <Link key={card.href} href={card.href}
              className="relative rounded-2xl overflow-hidden h-36 flex flex-col justify-end p-3 active:scale-95 transition-all"
              style={{ background: card.grad }}>
              <div className="absolute top-3 right-3 text-3xl opacity-30">{card.emoji}</div>
              <p className="font-black text-sm leading-tight" style={{ color: '#F6F1E7' }}>{card.title}</p>
              <p className="text-xs mt-0.5 mb-2" style={{ color: 'rgba(246,241,231,0.5)' }}>{card.desc}</p>
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(199,166,23,0.25)' }}>
                <ArrowRight size={13} style={{ color: '#C7A617' }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Top 10 Vendors */}
        {vendors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-black" style={{ color: '#C7A617' }}>🏆 Top 10 Durian Stores</h2>
                <p className="text-xs" style={{ color: 'rgba(246,241,231,0.4)' }}>
                  {language === 'zh' ? '精选榴莲商家' : 'Handpicked premium vendors'}
                </p>
              </div>
              <Link href="/marketplace" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: '#C7A617' }}>
                {language === 'zh' ? '全部' : 'See all'} <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {vendors.map(v => <VendorCard key={v.id} v={v} />)}
            </div>
          </div>
        )}

        {/* DURIANEX */}
        <p className="text-center text-xs pb-4" style={{ color: 'rgba(246,241,231,0.3)' }}>
          {language === 'zh' ? '价格数据由 ' : 'Price data powered by '}
          <a href="https://durianex-web.vercel.app" target="_blank" rel="noopener noreferrer"
            className="text-brand-gold hover:underline">DURIANEX</a>
          {language === 'zh' ? ' 提供支持' : ''}
        </p>

      </div>

      <Mascot message={language === 'zh' ? '注册后享受更多功能！🍈' : 'Register to unlock more features! 🍈'} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// ROOT — logged in vs guest
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { user } = useAppStore()

  if (user && !['super_admin', 'platform_admin'].includes(user.platform_role ?? '')) {
    return <LoggedInHome />
  }

  return <GuestHome />
}
