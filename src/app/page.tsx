'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, TrendingUp, ShoppingCart, Users, Zap, MapPin, Clock, Star, Crown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'
import { createClient } from '@/lib/supabase/client'

interface FeaturedVendor {
  id: string
  shop_name: string
  location: string
  rating: number
  cover_image_url: string | null
  logo_url: string | null
  tags: string[]
  open_hours: string
  open_days: string
  is_open: boolean
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12}
          fill={i <= Math.round(rating) ? '#C7A617' : 'none'}
          stroke={i <= Math.round(rating) ? '#C7A617' : 'rgba(199,166,23,0.35)'} />
      ))}
      <span className="text-xs font-bold ml-1" style={{ color: '#C7A617' }}>{rating.toFixed(1)}</span>
    </div>
  )
}

function VendorCard({ v }: { v: FeaturedVendor }) {
  const initials = v.shop_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  return (
    <Link href={`/vendor/${v.id}`}
      className="block rounded-2xl overflow-hidden transition-all duration-250 hover:scale-[1.01]"
      style={{ background: 'rgba(246,241,231,0.06)', border: '1px solid rgba(199,166,23,0.25)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(199,166,23,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(199,166,23,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(199,166,23,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

      {/* Cover image */}
      <div className="relative h-40 w-full overflow-hidden">
        {v.cover_image_url ? (
          <img src={v.cover_image_url} alt={v.shop_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a2d20 0%, #3a5a28 100%)' }}>
            <span className="text-6xl opacity-20">🍈</span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,38,28,0.85) 0%, transparent 55%)' }} />
        {v.is_open && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(94,127,31,0.9)', color: '#F6F1E7' }}>OPEN</span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Logo */}
          {v.logo_url ? (
            <img src={v.logo_url} alt="logo" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              style={{ border: '1.5px solid rgba(199,166,23,0.4)' }} />
          ) : (
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black"
              style={{ background: 'linear-gradient(135deg,#5E7F1F,#3a5a1a)', color: '#C7A617', border: '1.5px solid rgba(199,166,23,0.4)' }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm leading-tight mb-1 truncate" style={{ color: '#C7A617' }}>{v.shop_name}</h3>
            <StarRating rating={v.rating} />
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} style={{ color: 'rgba(246,241,231,0.45)' }} />
              <span className="text-xs truncate" style={{ color: 'rgba(246,241,231,0.5)' }}>{v.location}</span>
            </div>
          </div>
        </div>

        {/* Hours + Tags row */}
        <div className="flex items-center gap-1.5 mb-3">
          <Clock size={11} style={{ color: 'rgba(246,241,231,0.4)' }} />
          <span className="text-xs" style={{ color: 'rgba(246,241,231,0.45)' }}>{v.open_hours}</span>
          <span className="text-xs" style={{ color: 'rgba(246,241,231,0.3)' }}>·</span>
          <span className="text-xs" style={{ color: 'rgba(246,241,231,0.45)' }}>{v.open_days}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {(v.tags || []).slice(0,3).map(tag => (
              <span key={tag} className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(199,166,23,0.1)', color: '#C7A617', border: '1px solid rgba(199,166,23,0.2)' }}>
                <Crown size={8}/> {tag}
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: '#C7A617' }}>
            View Store <ArrowRight size={11}/>
          </span>
        </div>
      </div>
    </Link>
  )
}

const FEATURES = [
  {
    icon: TrendingUp,
    zh: { title: '实时价格参考', desc: '每日对比 DURIANEX 价格，定价更有把握' },
    en: { title: 'Real-time Pricing', desc: 'Daily DURIANEX price comparison for confident pricing' },
    bm: { title: 'Harga Masa Nyata', desc: 'Perbandingan harga DURIANEX harian' },
  },
  {
    icon: ShoppingCart,
    zh: { title: '一键下单', desc: '园主、批发商、零售商在同一平台交易' },
    en: { title: 'One-click Orders', desc: 'Orchards, wholesalers, retailers trade on one platform' },
    bm: { title: 'Pesanan Satu Klik', desc: 'Ladang, pemborong, peruncit di satu platform' },
  },
  {
    icon: Users,
    zh: { title: 'B2B2C 完整链条', desc: '从果园到消费者，每个环节都数字化' },
    en: { title: 'Full B2B2C Chain', desc: 'From orchard to consumer, fully digitized' },
    bm: { title: 'Rantaian B2B2C Penuh', desc: 'Dari ladang ke pengguna, sepenuhnya digital' },
  },
  {
    icon: Zap,
    zh: { title: 'AI 智能助理', desc: '阿妹/阿哥帮你接询问，主动推荐机会' },
    en: { title: 'AI Assistants', desc: 'AI handles inquiries and proactively suggests opportunities' },
    bm: { title: 'Pembantu AI', desc: 'AI mengendalikan pertanyaan dan mencadangkan peluang' },
  },
]

const ROLES = [
  { role: 'orchard', emoji: '🌳', zh: '我是园主', en: "Orchard Owner", bm: 'Pemilik Ladang', desc_zh: '上架产品，接批发商订单', desc_en: 'List products, receive wholesale orders', desc_bm: 'Senarai produk, terima pesanan borong' },
  { role: 'wholesaler', emoji: '⚖️', zh: '我是批发商', en: "Wholesaler", bm: 'Pemborong', desc_zh: '采购园主产品，批发给零售商', desc_en: 'Source from orchards, sell to retailers', desc_bm: 'Sumber dari ladang, jual ke peruncit' },
  { role: 'retailer', emoji: '🏪', zh: '我是零售商', en: "Retailer", bm: 'Peruncit', desc_zh: '进货批发商产品，卖给消费者', desc_en: 'Source from wholesalers, sell to consumers', desc_bm: 'Sumber dari pemborong, jual ke pengguna' },
  { role: 'consumer', emoji: '😋', zh: '我是消费者', en: "Consumer", bm: 'Pengguna', desc_zh: '找到最新鲜的榴莲', desc_en: 'Find the freshest durians', desc_bm: 'Cari durian paling segar' },
]

export default function HomePage() {
  const { language } = useAppStore()
  const tr = t[language]
  const [vendors, setVendors] = useState<FeaturedVendor[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('sbm_featured_vendors')
      .select('*')
      .eq('is_active', true)
      .order('rank', { ascending: true })
      .limit(10)
      .then(({ data }) => setVendors(data || []))
  }, [])

  return (
    <div className="min-h-screen durian-bg">
      {/* Hero */}
      <section className="relative px-4 pt-20 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sb-green/10 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src="https://klrfpzxjsacriaqtfssf.supabase.co/storage/v1/object/public/sbm-assets/logo.jpeg"
              alt="SB Durian Marketplace"
              className="h-28 w-28 rounded-2xl object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ color: '#C7A617' }}>
            SB Durian
            <span style={{ color: '#F6F1E7' }}> Marketplace</span>
          </h1>
          <p className="text-xl mb-8" style={{ color: 'rgba(246,241,231,0.65)' }}>{tr.slogan}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary flex items-center justify-center gap-2">
              {tr.register} <ArrowRight size={18} />
            </Link>
            <Link href="/marketplace" className="btn-ghost flex items-center justify-center gap-2">
              {tr.marketplace}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            const content = f[language]
            return (
              <div key={i} className="card flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(94,127,31,0.25)' }}>
                  <Icon size={20} style={{ color: '#C7A617' }} />
                </div>
                <h3 className="font-bold" style={{ color: '#F6F1E7' }}>{content.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(246,241,231,0.6)' }}>{content.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Role selection CTA */}
      <section className="px-4 py-16 border-y" style={{ background: 'rgba(20,38,28,0.6)', borderColor: 'rgba(199,166,23,0.15)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#C7A617' }}>
            {language === 'zh' ? '你是谁？' : language === 'en' ? 'Who are you?' : 'Siapa anda?'}
          </h2>
          <p className="text-center mb-10 text-sm" style={{ color: 'rgba(246,241,231,0.55)' }}>
            {language === 'zh' ? '选择你的身份，开始使用专属功能' : language === 'en' ? 'Select your role to access tailored features' : 'Pilih peranan anda untuk ciri yang disesuaikan'}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((r) => (
              <Link
                key={r.role}
                href={`/register?role=${r.role}`}
                className="card hover:border-brand-gold/50 hover:bg-brand-dark transition-all duration-200 text-center group cursor-pointer"
              >
                <div className="text-4xl mb-3">{r.emoji}</div>
                <h3 className="font-bold text-sm transition-colors" style={{ color: '#F6F1E7' }}>
                  {language === 'zh' ? r.zh : language === 'en' ? r.en : r.bm}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'rgba(246,241,231,0.45)' }}>
                  {language === 'zh' ? r.desc_zh : language === 'en' ? r.desc_en : r.desc_bm}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top 10 Featured Vendors ── */}
      {vendors.length > 0 && (
        <section className="px-4 py-12 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black" style={{ color: '#C7A617' }}>
                🏆 Top 10 Durian Stores
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(246,241,231,0.45)' }}>
                {language === 'zh' ? '精选榴莲商家' : language === 'en' ? 'Handpicked premium vendors' : 'Peniaga durian terpilih'}
              </p>
            </div>
            <Link href="/marketplace" className="text-xs font-semibold flex items-center gap-1"
              style={{ color: '#C7A617' }}>
              {language === 'zh' ? '全部' : 'See all'} <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-4">
            {vendors.map(v => <VendorCard key={v.id} v={v} />)}
          </div>
        </section>
      )}

      {/* DURIANEX link */}
      <section className="px-4 py-12 text-center">
        <p className="text-sm" style={{ color: 'rgba(246,241,231,0.4)' }}>
          {language === 'zh' ? '价格数据由 ' : language === 'en' ? 'Price data powered by ' : 'Data harga dikuasakan oleh '}
          <a
            href="https://durianex-web.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-gold hover:underline"
          >
            DURIANEX
          </a>
          {language === 'zh' ? ' 提供支持' : ''}
        </p>
      </section>
    </div>
  )
}
