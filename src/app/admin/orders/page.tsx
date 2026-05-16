'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { getStatusLabel, getStatusColor } from '@/lib/orders'
import type { OrderStatus } from '@/lib/types'

interface AdminOrder {
  id: string
  order_number: string
  status: OrderStatus
  total_amount: number
  currency: string
  payment_status: string
  delivery_method: string
  created_at: string
  buyer: { full_name: string; phone: string } | null
  seller: { full_name: string; phone: string } | null
}

type StatusFilter = 'all' | OrderStatus

export default function AdminOrdersPage() {
  const { language } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [totalRevenue, setTotalRevenue] = useState(0)

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',       label: label('全部', 'All', 'Semua') },
    { key: 'pending',   label: label('待确认', 'Pending', 'Menunggu') },
    { key: 'confirmed', label: label('已确认', 'Confirmed', 'Disahkan') },
    { key: 'completed', label: label('已完成', 'Completed', 'Selesai') },
    { key: 'cancelled', label: label('已取消', 'Cancelled', 'Dibatalkan') },
  ]

  const loadOrders = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('sbm_orders')
      .select(`
        id, order_number, status, total_amount, currency, payment_status, delivery_method, created_at,
        buyer:buyer_id(full_name, phone),
        seller:seller_id(full_name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)

    const { data } = await query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filtered = ((data as any[]) ?? []) as AdminOrder[]
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(s) ||
        (o.buyer as { full_name: string } | null)?.full_name?.toLowerCase().includes(s) ||
        (o.seller as { full_name: string } | null)?.full_name?.toLowerCase().includes(s)
      )
    }
    setOrders(filtered)

    // Revenue: sum of completed orders
    const { data: rev } = await supabase
      .from('sbm_orders')
      .select('total_amount')
      .eq('status', 'completed')
    setTotalRevenue(rev?.reduce((sum, r) => sum + (r.total_amount ?? 0), 0) ?? 0)

    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => {
    const timer = setTimeout(loadOrders, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [loadOrders, search])

  const PAYMENT_COLORS: Record<string, string> = {
    paid:    'text-green-400',
    pending: 'text-yellow-400',
    failed:  'text-red-400',
    refunded:'text-gray-400',
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{label('所有订单', 'All Orders', 'Semua Pesanan')}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {label('已完成营业额', 'Completed Revenue', 'Hasil Selesai')}:
            <span className="text-brand-gold font-bold ml-1">RM {totalRevenue.toFixed(2)}</span>
          </p>
        </div>
        <button onClick={loadOrders} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {label('刷新', 'Refresh', 'Muat Semula')}
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30'
                : 'text-gray-400 border border-brand-dark-border hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={label('搜索订单号、买家、卖家...', 'Search order no, buyer, seller...', 'Cari no. pesanan, pembeli, penjual...')}
          className="input pl-9 w-full"
        />
      </div>

      {/* Orders table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-brand-dark-border">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-dark rounded animate-pulse w-32" />
                  <div className="h-3 bg-brand-dark rounded animate-pulse w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">{label('暂无订单', 'No orders found', 'Tiada pesanan')}</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-dark-border">
            {orders.map(o => {
              const buyer = o.buyer as { full_name: string; phone: string } | null
              const seller = o.seller as { full_name: string; phone: string } | null
              return (
                <div key={o.id} className="p-4 hover:bg-brand-dark/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-brand-gold font-bold">{o.order_number}</span>
                        <span className={`badge text-xs border ${getStatusColor(o.status)}`}>
                          {getStatusLabel(o.status, language)}
                        </span>
                        <span className={`text-xs font-medium ${PAYMENT_COLORS[o.payment_status] ?? 'text-gray-400'}`}>
                          {o.payment_status === 'paid' ? label('已付款', 'Paid', 'Dibayar') :
                           o.payment_status === 'pending' ? label('待付款', 'Unpaid', 'Belum Bayar') :
                           o.payment_status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {label('买家', 'Buyer', 'Pembeli')}: <span className="text-gray-300">{buyer?.full_name ?? '—'}</span>
                        <span className="mx-2">·</span>
                        {label('卖家', 'Seller', 'Penjual')}: <span className="text-gray-300">{seller?.full_name ?? '—'}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(o.created_at).toLocaleString(language === 'zh' ? 'zh-MY' : 'en-MY')}
                        <span className="mx-2">·</span>
                        {o.delivery_method === 'pickup' ? label('自取', 'Pickup', 'Ambil Sendiri') : label('送货', 'Delivery', 'Penghantaran')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-brand-gold font-bold">RM {o.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 mt-3 text-right">{label('显示最近 100 条', 'Showing latest 100', 'Menunjukkan 100 terbaru')}</p>
    </div>
  )
}
