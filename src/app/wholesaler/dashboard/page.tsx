'use client'

import Link from 'next/link'
import { ShoppingCart, Package, CreditCard, TrendingUp, Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function WholesalerDashboard() {
  const { language, user } = useAppStore()

  const greeting = language === 'zh'
    ? `早安，${user?.full_name?.split(' ')[0] ?? '批发商'} ⚖️`
    : language === 'en'
    ? `Good morning, ${user?.full_name?.split(' ')[0] ?? 'Wholesaler'} ⚖️`
    : `Selamat pagi, ${user?.full_name?.split(' ')[0] ?? 'Pemborong'} ⚖️`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {language === 'zh' ? '采购 · 销售 · 账期管理' : language === 'en' ? 'Procurement · Sales · Credit Management' : 'Pembelian · Jualan · Pengurusan Kredit'}
          </p>
        </div>
        <Link href="/wholesaler/market" className="btn-primary flex items-center gap-2">
          <ShoppingCart size={18} />
          {language === 'zh' ? '去采购' : language === 'en' ? 'Buy Now' : 'Beli Sekarang'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/wholesaler/market', icon: ShoppingCart, zh: '采购市场', en: 'Procurement Market', bm: 'Pasaran Pembelian', desc_zh: '所有园主实时产品', desc_en: 'All orchard listings', desc_bm: 'Semua senarai ladang' },
          { href: '/wholesaler/orders', icon: Package, zh: '我的采购订单', en: 'My Purchase Orders', bm: 'Pesanan Pembelian Saya', desc_zh: '进行中和历史采购', desc_en: 'Active and past purchases', desc_bm: 'Pembelian aktif dan lalu' },
          { href: '/wholesaler/products', icon: Plus, zh: '我的产品', en: 'My Products', bm: 'Produk Saya', desc_zh: '卖给零售商的产品', desc_en: 'Products for retailers', desc_bm: 'Produk untuk peruncit' },
          { href: '/wholesaler/sales', icon: TrendingUp, zh: '我的销售', en: 'My Sales', bm: 'Jualan Saya', desc_zh: '零售商的订单', desc_en: 'Retailer orders', desc_bm: 'Pesanan peruncit' },
          { href: '/wholesaler/credit', icon: CreditCard, zh: '账期管理', en: 'Credit Management', bm: 'Pengurusan Kredit', desc_zh: '应收/应付账款', desc_en: 'Receivables & payables', desc_bm: 'Penghutang & pemiutang' },
          { href: '/wholesaler/settings', icon: Package, zh: '店面设置', en: 'Store Settings', bm: 'Tetapan Kedai', desc_zh: '更新资料', desc_en: 'Update profile', desc_bm: 'Kemaskini profil' },
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
