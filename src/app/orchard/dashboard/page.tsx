'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ShoppingBag, DollarSign, AlertTriangle, Plus, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

interface Stats {
  totalProducts: number
  activeOrders: number
  todayRevenue: number
  lowStockCount: number
}

export default function OrchardDashboard() {
  const { language, user } = useAppStore()
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, activeOrders: 0, todayRevenue: 0, lowStockCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchStats() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const [products, orders, revenue, lowStock] = await Promise.all([
        supabase.from('sbm_products').select('id', { count: 'exact' }).eq('status', 'active')
          .in('store_id', await getStoreIds(supabase, user!.id)),
        supabase.from('sbm_orders').select('id', { count: 'exact' })
          .eq('seller_id', user!.id)
          .in('status', ['pending', 'confirmed', 'preparing', 'ready']),
        supabase.from('sbm_orders').select('total_amount')
          .eq('seller_id', user!.id)
          .eq('payment_status', 'paid')
          .gte('paid_at', today),
        supabase.from('sbm_products').select('id', { count: 'exact' })
          .lt('stock_kg', 10)
          .eq('status', 'active')
          .in('store_id', await getStoreIds(supabase, user!.id)),
      ])

      const todayRev = revenue.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0
      setStats({
        totalProducts: products.count ?? 0,
        activeOrders: orders.count ?? 0,
        todayRevenue: todayRev,
        lowStockCount: lowStock.count ?? 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [user])

  const greeting = language === 'zh'
    ? `早安，${user?.full_name?.split(' ')[0] ?? '园主'} 🌳`
    : language === 'en'
    ? `Good morning, ${user?.full_name?.split(' ')[0] ?? 'Orchard Owner'} 🌳`
    : `Selamat pagi, ${user?.full_name?.split(' ')[0] ?? 'Pemilik Ladang'} 🌳`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {language === 'zh' ? '今日市场动态' : language === 'en' ? "Today's market overview" : 'Gambaran pasaran hari ini'}
          </p>
        </div>
        <Link href="/orchard/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {language === 'zh' ? '上架产品' : language === 'en' ? 'List Product' : 'Senarai Produk'}
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Package}
          label={language === 'zh' ? '上架产品' : language === 'en' ? 'Listed Products' : 'Produk Disenarai'}
          value={loading ? '—' : stats.totalProducts.toString()}
          color="text-brand-gold"
          href="/orchard/products"
        />
        <StatCard
          icon={ShoppingBag}
          label={language === 'zh' ? '进行中订单' : language === 'en' ? 'Active Orders' : 'Pesanan Aktif'}
          value={loading ? '—' : stats.activeOrders.toString()}
          color="text-blue-400"
          href="/orchard/orders"
        />
        <StatCard
          icon={DollarSign}
          label={language === 'zh' ? '今日收入' : language === 'en' ? "Today's Revenue" : 'Pendapatan Hari Ini'}
          value={loading ? '—' : `RM ${stats.todayRevenue.toFixed(0)}`}
          color="text-green-400"
          href="/orchard/earnings"
        />
        <StatCard
          icon={AlertTriangle}
          label={language === 'zh' ? '库存预警' : language === 'en' ? 'Low Stock Alert' : 'Amaran Stok Rendah'}
          value={loading ? '—' : stats.lowStockCount.toString()}
          color="text-red-400"
          href="/orchard/products"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/orchard/products', icon: Package, zh: '管理产品', en: 'Manage Products', bm: 'Urus Produk', desc_zh: '上架/编辑/下架', desc_en: 'List, edit, remove', desc_bm: 'Senarai, edit, padam' },
          { href: '/orchard/orders', icon: ShoppingBag, zh: '订单管理', en: 'Orders', bm: 'Pesanan', desc_zh: '查看和确认订单', desc_en: 'View and confirm orders', desc_bm: 'Lihat dan sahkan pesanan' },
          { href: '/orchard/earnings', icon: DollarSign, zh: '收入记录', en: 'Earnings', bm: 'Pendapatan', desc_zh: '交易记录和账期', desc_en: 'Transactions and credit terms', desc_bm: 'Transaksi dan tempoh kredit' },
          { href: '/orchard/ai', icon: TrendingUp, zh: '阿妹设置', en: 'AI Assistant', bm: 'Pembantu AI', desc_zh: '配置 AI 回复设置', desc_en: 'Configure AI responses', desc_bm: 'Konfigurasi respons AI' },
          { href: '/marketplace', icon: TrendingUp, zh: '查看市场', en: 'View Marketplace', bm: 'Lihat Pasaran', desc_zh: '看看竞争对手的价格', desc_en: 'Check competitor pricing', desc_bm: 'Semak harga pesaing' },
          { href: '/orchard/profile', icon: Package, zh: '店面设置', en: 'Store Settings', bm: 'Tetapan Kedai', desc_zh: '更新店面资料', desc_en: 'Update store info', desc_bm: 'Kemaskini maklumat kedai' },
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

async function getStoreIds(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('sbm_stores').select('id').eq('user_id', userId)
  return data?.map(s => s.id) ?? []
}

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: React.ElementType; label: string; value: string; color: string; href: string
}) {
  return (
    <Link href={href} className="card hover:border-brand-gold/30 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <Icon size={18} className={color} />
      </div>
      <p className={`stat-number ${color}`}>{value}</p>
      <p className="stat-label">{label}</p>
    </Link>
  )
}
