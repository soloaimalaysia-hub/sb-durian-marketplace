'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES } from '@/lib/constants'
import { getStatusLabel, getStatusColor, getNextStatus } from '@/lib/orders'

interface OrderListProps {
  mode: 'seller' | 'buyer'
  userId: string
}

export default function OrderList({ mode, userId }: OrderListProps) {
  const { language } = useAppStore()
  const lang = language as 'zh' | 'en' | 'bm'
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  async function loadOrders() {
    const supabase = createClient()
    const col = mode === 'seller' ? 'seller_id' : 'buyer_id'
    const { data } = await supabase
      .from('sbm_orders')
      .select(`*, sbm_order_items(*), ${mode === 'seller' ? 'buyer:buyer_id(full_name, phone)' : 'seller:seller_id(full_name, phone)'}`)
      .eq(col, userId)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [userId, mode])

  async function advanceStatus(orderId: string, currentStatus: string) {
    const next = getNextStatus(currentStatus)
    if (!next) return
    setAdvancing(orderId)
    const supabase = createClient()
    await supabase.from('sbm_orders').update({ status: next, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o))
    setAdvancing(null)
  }

  async function cancelOrder(orderId: string) {
    if (!confirm(label('确认取消订单？', 'Cancel this order?', 'Batalkan pesanan ini?'))) return
    const supabase = createClient()
    await supabase.from('sbm_orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
  }

  const STATUS_TABS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled']
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filter === s ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-400 hover:border-gray-500'}`}
          >
            {s === 'all' ? label('全部', 'All', 'Semua') : getStatusLabel(s, lang)}
            {s !== 'all' && <span className="ml-1 text-gray-500">({orders.filter(o => o.status === s).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>{label('暂无订单', 'No orders', 'Tiada pesanan')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isExpanded = expanded === order.id
            const nextStatus = getNextStatus(order.status)
            const canAdvance = mode === 'seller' && nextStatus && order.status !== 'cancelled'
            const counterparty = mode === 'seller' ? order.buyer : order.seller

            return (
              <div key={order.id} className="card overflow-hidden">
                {/* Order header */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-gray-300">{order.order_number}</span>
                      <span className={`badge border ${getStatusColor(order.status)} text-xs`}>
                        {getStatusLabel(order.status, lang)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="text-brand-gold font-semibold text-sm">RM {order.total_amount.toFixed(2)}</span>
                      {counterparty && <span>{counterparty.full_name}</span>}
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-gray-500 flex-shrink-0">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-brand-dark-border space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {(order.sbm_order_items ?? []).map((item: Record<string, unknown>) => {
                        const variety = DURIAN_VARIETIES.find(v => v.code === (item.variety as string))
                        const varietyName = variety ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm) : (item.variety as string)
                        return (
                          <div key={item.id as string} className="flex justify-between text-sm">
                            <span className="text-gray-300">{varietyName} {item.grade ? `(${String(item.grade)})` : ''} × {item.quantity_kg as number}kg</span>
                            <span className="text-white font-medium">RM {(item.subtotal as number).toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Order details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div><span className="text-gray-400">{label('付款方式', 'Payment', 'Pembayaran')}:</span> {order.payment_method}</div>
                      <div><span className="text-gray-400">{label('交货方式', 'Delivery', 'Penghantaran')}:</span> {order.delivery_method}</div>
                      {order.delivery_address && <div className="col-span-2"><span className="text-gray-400">{label('地址', 'Address', 'Alamat')}:</span> {order.delivery_address}</div>}
                      {order.buyer_notes && <div className="col-span-2"><span className="text-gray-400">{label('备注', 'Notes', 'Nota')}:</span> {order.buyer_notes}</div>}
                      {order.due_date && <div className="col-span-2"><span className="text-gray-400">{label('账期到期', 'Due Date', 'Tarikh Akhir')}:</span> <span className="text-orange-400">{order.due_date}</span></div>}
                    </div>

                    {/* Status progression */}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <div className="flex gap-2 pt-2">
                        {canAdvance && (
                          <button
                            onClick={() => advanceStatus(order.id, order.status)}
                            disabled={advancing === order.id}
                            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm flex-1"
                          >
                            {advancing === order.id && <Loader size={14} className="animate-spin" />}
                            {label('更新为', 'Advance to', 'Kemaskini ke')}: {getStatusLabel(nextStatus!, lang)}
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="btn-ghost py-2 px-4 text-sm text-red-400 hover:text-red-300 border-red-500/30"
                          >
                            {label('取消', 'Cancel', 'Batal')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
