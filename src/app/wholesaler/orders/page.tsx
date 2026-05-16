'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import OrderList from '@/components/orders/OrderList'

export default function WholesalerOrdersPage() {
  const { language, user } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{label('我的采购订单', 'My Purchase Orders', 'Pesanan Pembelian Saya')}</h1>
          <p className="text-gray-400 text-sm mt-1">{label('向园主下的订单', 'Orders placed with orchards', 'Pesanan kepada ladang')}</p>
        </div>
        <Link href="/wholesaler/market" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <ShoppingCart size={16} />
          {label('去采购', 'Buy More', 'Beli Lagi')}
        </Link>
      </div>
      <OrderList mode="buyer" userId={user.id} />
    </div>
  )
}
