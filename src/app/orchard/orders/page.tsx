'use client'

import { useAppStore } from '@/store/useAppStore'
import OrderList from '@/components/orders/OrderList'

export default function OrchardOrdersPage() {
  const { language, user } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{label('订单管理', 'Order Management', 'Pengurusan Pesanan')}</h1>
        <p className="text-gray-400 text-sm mt-1">{label('批发商发来的采购订单', 'Purchase orders from wholesalers', 'Pesanan pembelian dari pemborong')}</p>
      </div>
      <OrderList mode="seller" userId={user.id} />
    </div>
  )
}
