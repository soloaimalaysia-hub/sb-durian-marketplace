'use client'

import { useEffect, useState } from 'react'
import { Users, ShoppingBag, Package, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

interface Stats {
  totalUsers: number
  pendingUsers: number
  totalOrders: number
  totalProducts: number
  todaySignups: number
}

export default function AdminDashboard() {
  const { language } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [stats, setStats] = useState<Stats>({ totalUsers: 0, pendingUsers: 0, totalOrders: 0, totalProducts: 0, todaySignups: 0 })
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)

      const [users, pending, orders, products, todayUsers, recent] = await Promise.all([
        supabase.from('sbm_users').select('*', { count: 'exact', head: true }),
        supabase.from('sbm_users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('sbm_orders').select('*', { count: 'exact', head: true }),
        supabase.from('sbm_products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('sbm_users').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('sbm_users').select('id, full_name, phone, role, status, created_at').order('created_at', { ascending: false }).limit(10),
      ])

      setStats({
        totalUsers: users.count ?? 0,
        pendingUsers: pending.count ?? 0,
        totalOrders: orders.count ?? 0,
        totalProducts: products.count ?? 0,
        todaySignups: todayUsers.count ?? 0,
      })
      setRecentUsers(recent.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const ROLE_LABELS: Record<string, string> = {
    orchard: label('园主', 'Orchard', 'Ladang'),
    wholesaler: label('批发商', 'Wholesaler', 'Pemborong'),
    retailer: label('零售商', 'Retailer', 'Peruncit'),
    consumer: label('消费者', 'Consumer', 'Pengguna'),
    admin: 'Admin',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{label('平台总览', 'Platform Overview', 'Gambaran Platform')}</h1>
        <p className="text-gray-400 text-sm mt-1">SB Durian Marketplace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: label('总用户', 'Total Users', 'Jumlah Pengguna'), value: stats.totalUsers, color: 'text-blue-400', sub: `${stats.todaySignups} ${label('今日新增', 'new today', 'baru hari ini')}` },
          { icon: Clock, label: label('待审核', 'Pending Approval', 'Menunggu Kelulusan'), value: stats.pendingUsers, color: 'text-yellow-400', sub: label('需要处理', 'Need attention', 'Perlu perhatian') },
          { icon: ShoppingBag, label: label('总订单', 'Total Orders', 'Jumlah Pesanan'), value: stats.totalOrders, color: 'text-green-400', sub: '' },
          { icon: Package, label: label('上架产品', 'Active Products', 'Produk Aktif'), value: stats.totalProducts, color: 'text-brand-gold', sub: '' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-2 mb-3">
              <s.icon size={18} className={s.color} />
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="card">
        <h2 className="font-bold text-white mb-4">{label('最新注册用户', 'Recent Registrations', 'Pendaftaran Terbaru')}</h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-brand-dark rounded-lg animate-pulse" />)}</div>
        ) : recentUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">{label('暂无用户', 'No users yet', 'Tiada pengguna')}</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-brand-dark-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{u.full_name}</p>
                  <p className="text-xs text-gray-500">{u.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{ROLE_LABELS[u.role] ?? u.role}</span>
                  <span className={`badge text-xs border ${
                    u.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    u.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/30'
                  }`}>
                    {u.status === 'active' ? label('已激活', 'Active', 'Aktif') :
                     u.status === 'pending' ? label('待审核', 'Pending', 'Menunggu') :
                     label('已停用', 'Suspended', 'Digantung')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
