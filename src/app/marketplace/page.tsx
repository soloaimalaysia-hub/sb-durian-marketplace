'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, Minus, MessageCircle, Star, MapPin, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n/translations'
import { DURIAN_VARIETIES, MALAYSIA_STATES } from '@/lib/constants'
import { getPriceComparison } from '@/lib/durianex'
import type { SbmProduct, SbmStore } from '@/lib/types'

type ProductWithStore = SbmProduct & { sbm_stores: SbmStore }

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating'

export default function MarketplacePage() {
  const { language } = useAppStore()
  const tr = t[language]
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVariety, setFilterVariety] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('sbm_products')
        .select('*, sbm_stores(*)')
        .eq('status', 'active')
        .in('seller_role', ['orchard', 'wholesaler'])
        .order('created_at', { ascending: false })
        .limit(100)
      setProducts((data ?? []) as ProductWithStore[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...products]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.variety.toLowerCase().includes(q) ||
        p.sbm_stores?.store_name?.toLowerCase().includes(q) ||
        p.sbm_stores?.state?.toLowerCase().includes(q)
      )
    }
    if (filterVariety) list = list.filter(p => p.variety === filterVariety)
    if (filterState) list = list.filter(p => p.sbm_stores?.state === filterState)
    if (filterMaxPrice) list = list.filter(p => p.price_per_kg <= parseFloat(filterMaxPrice))

    switch (sortBy) {
      case 'price_asc': return list.sort((a, b) => a.price_per_kg - b.price_per_kg)
      case 'price_desc': return list.sort((a, b) => b.price_per_kg - a.price_per_kg)
      case 'rating': return list.sort((a, b) => (b.sbm_stores?.rating ?? 0) - (a.sbm_stores?.rating ?? 0))
      default: return list
    }
  }, [products, search, filterVariety, filterState, filterMaxPrice, sortBy])

  const activeFilters = [filterVariety, filterState, filterMaxPrice].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">{tr.marketplace}</h1>
        <p className="text-gray-400 text-sm">
          {loading ? '—' : filtered.length} {label('个产品', 'products', 'produk')}
        </p>
      </div>

      {/* Search + Sort bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={label('搜索品种、卖家、州属...', 'Search variety, seller, state...', 'Cari varieti, penjual, negeri...')}
            className="input pl-11"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm font-medium ${showFilters || activeFilters > 0 ? 'border-brand-gold text-brand-gold bg-brand-gold/10' : 'border-brand-dark-border text-gray-400 hover:border-gray-500'}`}
        >
          <SlidersHorizontal size={16} />
          {label('筛选', 'Filter', 'Tapis')}
          {activeFilters > 0 && <span className="w-5 h-5 bg-brand-gold text-brand-dark rounded-full text-xs flex items-center justify-center font-bold">{activeFilters}</span>}
        </button>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="input bg-brand-dark w-40 text-sm"
        >
          <option value="newest">{label('最新', 'Newest', 'Terbaru')}</option>
          <option value="price_asc">{label('价格低→高', 'Price ↑', 'Harga ↑')}</option>
          <option value="price_desc">{label('价格高→低', 'Price ↓', 'Harga ↓')}</option>
          <option value="rating">{label('评分最高', 'Top Rated', 'Penilaian Tinggi')}</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">{label('品种', 'Variety', 'Varieti')}</label>
            <select value={filterVariety} onChange={e => setFilterVariety(e.target.value)} className="input bg-brand-dark text-sm">
              <option value="">{tr.all}</option>
              {DURIAN_VARIETIES.map(v => (
                <option key={v.code} value={v.code}>{language === 'zh' ? v.zh : language === 'en' ? v.en : v.bm}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{label('州属', 'State', 'Negeri')}</label>
            <select value={filterState} onChange={e => setFilterState(e.target.value)} className="input bg-brand-dark text-sm">
              <option value="">{tr.all}</option>
              {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{label('最高价格 (RM/kg)', 'Max Price (RM/kg)', 'Harga Maks (RM/kg)')}</label>
            <input
              type="number"
              min="0"
              value={filterMaxPrice}
              onChange={e => setFilterMaxPrice(e.target.value)}
              placeholder={label('不限', 'No limit', 'Tiada had')}
              className="input text-sm"
            />
          </div>
          {activeFilters > 0 && (
            <div className="sm:col-span-3">
              <button
                onClick={() => { setFilterVariety(''); setFilterState(''); setFilterMaxPrice('') }}
                className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
              >
                <X size={14} /> {label('清除筛选', 'Clear filters', 'Kosongkan penapis')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="card animate-pulse h-64" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🍈</div>
          <p className="text-gray-400">{tr.noData}</p>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterVariety(''); setFilterState(''); setFilterMaxPrice(''); setSearch('') }} className="mt-4 text-brand-gold hover:underline text-sm">
              {label('清除所有筛选', 'Clear all filters', 'Kosongkan semua penapis')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} language={language} />)}
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

  const cmp = getPriceComparison(p.price_per_kg, p.durianex_reference_price)
  const images = (p.images as string[]) || []
  const store = p.sbm_stores
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const waMsg = encodeURIComponent(label(
    `你好！我想询问关于 ${varietyName} (RM${p.price_per_kg}/kg) 的详情。`,
    `Hi! I'm interested in your ${varietyName} at RM${p.price_per_kg}/kg.`,
    `Hai! Saya berminat dengan ${varietyName} anda pada RM${p.price_per_kg}/kg.`
  ))

  return (
    <div className="card hover:border-brand-gold/40 transition-all group flex flex-col gap-3 p-4">
      {/* Image */}
      <Link href={`/products/${p.id}`}>
        <div className="aspect-square rounded-xl overflow-hidden bg-brand-dark flex items-center justify-center text-4xl">
          {images.length > 0
            ? <img src={images[0]} alt={varietyName} className="w-full h-full object-cover" />
            : '🍈'}
        </div>
      </Link>

      <Link href={`/products/${p.id}`} className="flex-1 space-y-1">
        <h3 className="font-bold text-white text-sm group-hover:text-brand-gold transition-colors leading-tight">{varietyName}</h3>
        {p.grade && <span className="text-xs text-gray-500">{p.grade}</span>}

        {store && (
          <div className="text-xs text-gray-500 space-y-0.5">
            <p className="text-gray-400 font-medium truncate">{store.store_name}</p>
            {store.state && (
              <p className="flex items-center gap-1"><MapPin size={10} />{store.state}</p>
            )}
            {store.rating > 0 && (
              <p className="flex items-center gap-1 text-brand-gold/80"><Star size={10} />{store.rating.toFixed(1)}</p>
            )}
          </div>
        )}
      </Link>

      {/* Price & comparison */}
      <div>
        <p className="text-brand-gold font-bold text-base">
          RM {p.price_per_kg.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/kg</span>
        </p>
        {cmp && p.durianex_reference_price && (
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${cmp.type === 'below' ? 'text-green-400' : cmp.type === 'above' ? 'text-orange-400' : 'text-gray-500'}`}>
            {cmp.type === 'below' ? <TrendingDown size={11} /> : cmp.type === 'above' ? <TrendingUp size={11} /> : <Minus size={11} />}
            {cmp.type === 'neutral'
              ? label('符合市价', 'At market', 'Sama pasaran')
              : `${cmp.pct}% ${cmp.type === 'below' ? label('低于市价', 'below', 'bawah') : label('高于市价', 'above', 'atas')}`}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">{label('库存', 'Stock', 'Stok')}: {p.stock_kg}kg</p>
        {p.min_order_kg && <p className="text-xs text-gray-500">{label('起订', 'Min', 'Min')}: {p.min_order_kg}kg</p>}
      </div>

      {/* WhatsApp button */}
      <a
        href={`https://wa.me/?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 transition-colors text-xs font-medium"
      >
        <MessageCircle size={13} />
        {label('WhatsApp 联系', 'Contact', 'Hubungi')}
      </a>
    </div>
  )
}
