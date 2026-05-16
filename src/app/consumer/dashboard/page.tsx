'use client'

import Link from 'next/link'
import { MapPin, ShoppingBag, Heart } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function ConsumerDashboard() {
  const { language, user } = useAppStore()

  const greeting = language === 'zh'
    ? `你好，${user?.full_name?.split(' ')[0] ?? '榴莲爱好者'} 😋`
    : language === 'en'
    ? `Hello, ${user?.full_name?.split(' ')[0] ?? 'Durian Lover'} 😋`
    : `Hai, ${user?.full_name?.split(' ')[0] ?? 'Peminat Durian'} 😋`

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{greeting}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {language === 'zh' ? '今天想吃什么榴莲？' : language === 'en' ? "Which durian today?" : 'Durian apa hari ini?'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/retailers', icon: MapPin, zh: '找零售商', en: 'Find Retailers', bm: 'Cari Peruncit', desc_zh: '附近的新鲜榴莲', desc_en: 'Fresh durians nearby', desc_bm: 'Durian segar berdekatan' },
          { href: '/consumer/orders', icon: ShoppingBag, zh: '我的订单', en: 'My Orders', bm: 'Pesanan Saya', desc_zh: '查看订单历史', desc_en: 'Order history', desc_bm: 'Sejarah pesanan' },
          { href: '/marketplace', icon: Heart, zh: '探索市场', en: 'Explore Market', bm: 'Jelajahi Pasaran', desc_zh: '今日最值得买的品种', desc_en: "Today's best buys", desc_bm: 'Pembelian terbaik hari ini' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card hover:border-brand-gold/40 transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-green/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className="text-brand-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-brand-gold transition-colors text-sm">
                  {language === 'zh' ? item.zh : language === 'en' ? item.en : item.bm}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh' ? item.desc_zh : language === 'en' ? item.desc_en : item.desc_bm}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
