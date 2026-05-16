'use client'

import Link from 'next/link'
import { ShoppingCart, Store, BarChart3, Package } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function RetailerDashboard() {
  const { language, user } = useAppStore()

  const greeting = language === 'zh'
    ? `早安，${user?.full_name?.split(' ')[0] ?? '零售商'} 🏪`
    : language === 'en'
    ? `Good morning, ${user?.full_name?.split(' ')[0] ?? 'Retailer'} 🏪`
    : `Selamat pagi, ${user?.full_name?.split(' ')[0] ?? 'Peruncit'} 🏪`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {language === 'zh' ? '进货 · 销售 · 分析' : language === 'en' ? 'Sourcing · Sales · Analytics' : 'Sumber · Jualan · Analitik'}
          </p>
        </div>
        <Link href="/retailer/market" className="btn-primary flex items-center gap-2">
          <ShoppingCart size={18} />
          {language === 'zh' ? '去进货' : language === 'en' ? 'Source Stock' : 'Beli Stok'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/retailer/market', icon: ShoppingCart, zh: '进货市场', en: 'Sourcing Market', bm: 'Pasaran Sumber', desc_zh: '批发商产品', desc_en: 'Wholesaler products', desc_bm: 'Produk pemborong' },
          { href: '/retailer/purchase', icon: Package, zh: '进货订单', en: 'Purchase Orders', bm: 'Pesanan Pembelian', desc_zh: '进货记录', desc_en: 'Purchase history', desc_bm: 'Sejarah pembelian' },
          { href: '/retailer/shop', icon: Store, zh: '我的店面', en: 'My Shop', bm: 'Kedai Saya', desc_zh: '管理产品展示', desc_en: 'Manage product display', desc_bm: 'Urus paparan produk' },
          { href: '/retailer/orders', icon: ShoppingCart, zh: '顾客订单', en: 'Customer Orders', bm: 'Pesanan Pelanggan', desc_zh: '消费者订单', desc_en: 'Consumer orders', desc_bm: 'Pesanan pengguna' },
          { href: '/retailer/analytics', icon: BarChart3, zh: '销售分析', en: 'Sales Analytics', bm: 'Analitik Jualan', desc_zh: '今日营业额和趋势', desc_en: "Today's sales and trends", desc_bm: 'Jualan hari ini dan trend' },
          { href: '/retailer/profile', icon: Package, zh: '店面设置', en: 'Store Settings', bm: 'Tetapan Kedai', desc_zh: '更新资料', desc_en: 'Update profile', desc_bm: 'Kemaskini profil' },
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
