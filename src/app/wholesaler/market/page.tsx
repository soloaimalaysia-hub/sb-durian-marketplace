'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin, Star, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES, MALAYSIA_STATES } from '@/lib/constants'
import { getPriceComparison } from '@/lib/durianex'
import OrderModal from '@/components/orders/OrderModal'
import type { SbmProduct, SbmStore } from '@/lib/types'

type ProductWithStore = SbmProduct & { sbm_stores: SbmStore }

export default function WholesalerMarketPage() {
  const { language, user } = useAppStore()
  const router = useRouter()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVariety, setFilterVariety] = useState('')
  const [filterState, setFilterState] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [orderProduct, setOrderProduct] = useState<ProductWithStore | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sbm_products')
        .select('*, sbm_stores(*)')
        .eq('status', 'active')
        .eq('seller_role', 'orchard')
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
        p.variety.includes(q) || p.sbm_stores?.store_name?.toLowerCase().includes(q) || p.sbm_stores?.state?.toLowerCase().includes(q)
      )
    }
    if (filterVariety) list = list.filter(p => p.variety === filterVariety)
    if (filterState) list = list.filter(p => p.sbm_stores?.state === filterState)
    return list
  }, [products, search, filterVariety, filterState])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{label('采购市场', 'Procurement Market', 'Pasaran Pembelian')}</h1>
        <p className="text-gray-400 text-sm mt-1">{label('所有园主实时产品', 'Live orchard listings', 'Senarai ladang langsung')}</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={label('搜索...', 'Search...', 'Cari...')} className="input pl-11" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'border-brand-gold text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}>
          <SlidersHorizontal size={16} /> {label('筛选', 'Filter', 'Tapis')}
        </button>
      </div>

      {showFilters && (
        <div className="card mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="label">{label('品种', 'Variety', 'Varieti')}</label>
            <select value={filterVariety} onChange={e => setFilterVariety(e.target.value)} className="input bg-brand-dark text-sm">
              <option value="">{label('全部', 'All', 'Semua')}</option>
              {DURIAN_VARIETIES.map(v => <option key={v.code} value={v.code}>{language === 'zh' ? v.zh : language === 'en' ? v.en : v.bm}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{label('州属', 'State', 'Negeri')}</label>
            <select value={filterState} onChange={e => setFilterState(e.target.value)} className="input bg-brand-dark text-sm">
              <option value="">{label('全部', 'All', 'Semua')}</option>
              {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🍈</div>
          <p>{label('暂无产品', 'No products found', 'Tiada produk')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const variety = DURIAN_VARIETIES.find(v => v.code === p.variety)
            const varietyName = variety ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm) : p.variety
            const cmp = getPriceComparison(p.price_per_kg, p.durianex_reference_price)
            const images = (p.images as string[]) || []
            const store = p.sbm_stores

            return (
              <div key={p.id} className="card flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-brand-dark flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
                  {images[0] ? <img src={images[0]} alt="" className="w-full h-full object-cover" /> : '🍈'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{varietyName}</span>
                    {p.grade && <span className="badge bg-brand-green/30 text-brand-gold">{p.grade}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                    <span className="text-brand-gold font-semibold">RM {p.price_per_kg.toFixed(2)}/kg</span>
                    {cmp && (
                      <span className={`text-xs ${cmp.type === 'below' ? 'text-green-400' : cmp.type === 'above' ? 'text-orange-400' : 'text-gray-500'}`}>
                        {cmp.type === 'neutral' ? label('符合市价', 'At market', 'Sama pasaran') : `${cmp.pct}% ${cmp.type === 'below' ? label('低于市价', 'below', 'bawah') : label('高于市价', 'above', 'atas')}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    {store && <span className="font-medium text-gray-400">{store.store_name}</span>}
                    {store?.state && <span className="flex items-center gap-1"><MapPin size={10} />{store.state}</span>}
                    {store?.rating > 0 && <span className="flex items-center gap-1 text-brand-gold/70"><Star size={10} />{store.rating.toFixed(1)}</span>}
                    <span>{label('库存', 'Stock', 'Stok')}: {p.stock_kg}kg</span>
                    {p.min_order_kg && <span>{label('起订', 'Min', 'Min')}: {p.min_order_kg}kg</span>}
                    {p.credit_terms_days > 0 && <span>{label('账期', 'Credit', 'Kredit')}: {p.credit_terms_days}{label('天', 'd', 'h')}</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!user) { router.push('/login'); return }
                    setOrderProduct(p)
                  }}
                  className="btn-primary flex items-center gap-2 flex-shrink-0 py-2 px-4 text-sm"
                >
                  <ShoppingCart size={16} />
                  {label('下单', 'Order', 'Pesan')}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Order modal */}
      {orderProduct && user && (
        <OrderModal
          product={orderProduct}
          buyer={user}
          onClose={() => setOrderProduct(null)}
          onSuccess={() => setOrderProduct(null)}
        />
      )}
    </div>
  )
}
