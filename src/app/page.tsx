'use client'

import Link from 'next/link'
import { ArrowRight, TrendingUp, ShoppingCart, Users, Zap } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'

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

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-20 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-green/20 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-6xl mb-6">🍈</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            SB Durian
            <span className="text-brand-gold"> Marketplace</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">{tr.slogan}</p>
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
                <div className="w-10 h-10 bg-brand-green/30 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-brand-gold" />
                </div>
                <h3 className="font-bold text-white">{content.title}</h3>
                <p className="text-sm text-gray-400">{content.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Role selection CTA */}
      <section className="px-4 py-16 bg-brand-dark-card border-y border-brand-dark-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {language === 'zh' ? '你是谁？' : language === 'en' ? 'Who are you?' : 'Siapa anda?'}
          </h2>
          <p className="text-center text-gray-400 mb-10 text-sm">
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
                <h3 className="font-bold text-white text-sm group-hover:text-brand-gold transition-colors">
                  {language === 'zh' ? r.zh : language === 'en' ? r.en : r.bm}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'zh' ? r.desc_zh : language === 'en' ? r.desc_en : r.desc_bm}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DURIANEX link */}
      <section className="px-4 py-12 text-center">
        <p className="text-gray-500 text-sm">
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
