'use client'

import { useAppStore } from '@/store/useAppStore'
import OrderList from '@/components/orders/OrderList'
import { TrendingUp } from 'lucide-react'

export default function WholesalerSalesPage() {
  const { language, user } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={22} className="text-brand-gold" />
          {label('我的销售', 'My Sales', 'Jualan Saya')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {label('零售商向我下的订单', 'Orders placed by retailers', 'Pesanan daripada peruncit')}
        </p>
      </div>
      <OrderList mode="seller" userId={user.id} />
    </div>
  )
}
