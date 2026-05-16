'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'
import { DURIAN_VARIETIES } from '@/lib/constants'
import type { SbmProduct, SbmStore } from '@/lib/types'

type ProductWithStore = SbmProduct & { sbm_stores: SbmStore }

export default function MarketplacePage() {
  const { language } = useAppStore()
  const tr = t[language]
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVariety, setFilterVariety] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      let query = supabase
        .from('sbm_products')
        .select('*, sbm_stores(*)')
        .eq('status', 'active')
        .in('seller_role', ['orchard', 'wholesaler'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (filterVariety) query = query.eq('variety', filterVariety)

      const { data } = await query
      setProducts((data ?? []) as ProductWithStore[])
      setLoading(false)
    }
    load()
  }, [filterVariety])

  const filtered = products.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.variety.toLowerCase().includes(q) ||
      p.sbm_stores?.store_name?.toLowerCase().includes(q) ||
      p.sbm_stores?.state?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">{tr.marketplace}</h1>
        <p className="text-gray-400 text-sm">
          {language === 'zh' ? '园主和批发商的实时产品' : language === 'en' ? 'Live listings from orchards and wholesalers' : 'Senarai langsung dari ladang dan pemborong'}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'zh' ? '搜索品种、卖家、州属...' : language === 'en' ? 'Search variety, seller, state...' : 'Cari varieti, penjual, negeri...'}
            className="input pl-11"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={filterVariety}
            onChange={e => setFilterVariety(e.target.value)}
            className="input pl-11 bg-brand-dark appearance-none"
          >
            <option value="">{tr.all}</option>
            {DURIAN_VARIETIES.map(v => (
              <option key={v.code} value={v.code}>
                {language === 'zh' ? v.zh : language === 'en' ? v.en : v.bm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🍈</div>
          <p>{tr.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} language={language} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ product: p, language }: { product: ProductWithStore; language: string }) {
  const variety = DURIAN_VARIETIES.find(v => v.code === p.variety)
  const varietyName = variety
    ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm)
    : p.variety

  const priceDiff = p.durianex_reference_price
    ? ((p.price_per_kg - p.durianex_reference_price) / p.durianex_reference_price * 100)
    : null

  return (
    <Link href={`/products/${p.id}`} className="card hover:border-brand-gold/40 transition-all group flex flex-col gap-3">
      {/* Image placeholder */}
      <div className="aspect-square rounded-xl bg-brand-dark flex items-center justify-center text-4xl">
        🍈
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-white text-sm group-hover:text-brand-gold transition-colors">{varietyName}</h3>
        {p.grade && <p className="text-xs text-gray-500">{p.grade}</p>}
        <p className="text-xs text-gray-400 mt-1">{p.sbm_stores?.store_name}</p>
        {p.sbm_stores?.state && (
          <p className="text-xs text-gray-500">{p.sbm_stores.state}</p>
        )}
      </div>

      <div>
        <p className="text-brand-gold font-bold text-lg">RM {p.price_per_kg.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/kg</span></p>

        {priceDiff !== null && (
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${priceDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
            <TrendingUp size={11} />
            {Math.abs(priceDiff).toFixed(1)}% {priceDiff > 0 ? (language === 'zh' ? '高于市场' : 'above market') : (language === 'zh' ? '低于市场' : 'below market')}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">
          {language === 'zh' ? `库存 ${p.stock_kg}kg` : `${p.stock_kg}kg stock`}
        </p>
        {p.min_order_kg && (
          <p className="text-xs text-gray-500">
            {language === 'zh' ? `起订 ${p.min_order_kg}kg` : `Min ${p.min_order_kg}kg`}
          </p>
        )}
      </div>
    </Link>
  )
}
