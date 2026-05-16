'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

interface PriceRow {
  variety: string
  grade: string | null
  price_rm: number
  recorded_at: string
}

export default function DurianexWidget() {
  const { language } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [prices, setPrices] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('durian_prices')
        .select('variety, grade, price_rm, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(20)
      setPrices((data ?? []) as PriceRow[])
      setLoading(false)
    }
    load()
  }, [])

  // Group by variety, take latest price per variety+grade
  const grouped = prices.reduce<Record<string, PriceRow[]>>((acc, row) => {
    const key = row.variety
    if (!acc[key]) acc[key] = []
    if (acc[key].length < 3) acc[key].push(row)
    return acc
  }, {})

  const latestDate = prices[0]?.recorded_at
    ? new Date(prices[0].recorded_at).toLocaleDateString(
        language === 'zh' ? 'zh-MY' : language === 'bm' ? 'ms-MY' : 'en-MY',
        { day: 'numeric', month: 'short' }
      )
    : '—'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-gold" />
          <h3 className="font-bold text-white text-sm">DURIANEX {label('今日行情', 'Today\'s Prices', 'Harga Hari Ini')}</h3>
        </div>
        <span className="text-xs text-gray-500">{latestDate}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-8 bg-brand-dark rounded-lg animate-pulse" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500 text-sm">{label('暂无价格数据', 'No price data', 'Tiada data harga')}</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([variety, rows]) => (
            <div key={variety} className="flex items-center justify-between py-2 border-b border-brand-dark-border last:border-0">
              <span className="text-gray-300 text-sm font-medium">{variety}</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {rows.map((row, i) => (
                  <span key={i} className="text-xs bg-brand-dark px-2 py-1 rounded-lg">
                    {row.grade && <span className="text-gray-500 mr-1">{row.grade}</span>}
                    <span className="text-brand-gold font-bold">RM {Number(row.price_rm).toFixed(2)}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-3">
        {label('数据来源：DURIANEX', 'Source: DURIANEX', 'Sumber: DURIANEX')}
      </p>
    </div>
  )
}
