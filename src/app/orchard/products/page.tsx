'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit2, EyeOff, Eye, Package, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES } from '@/lib/constants'
import { getPriceComparison } from '@/lib/durianex'
import type { SbmProduct } from '@/lib/types'

type ProductWithRef = SbmProduct & { _refPrice?: number | null }

export default function OrchardProductsPage() {
  const { language, user } = useAppStore()
  const [products, setProducts] = useState<ProductWithRef[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  async function loadProducts() {
    if (!user) return
    const supabase = createClient()
    const { data: stores } = await supabase.from('sbm_stores').select('id').eq('user_id', user.id)
    if (!stores?.length) { setLoading(false); return }
    const storeIds = stores.map(s => s.id)
    const { data } = await supabase
      .from('sbm_products')
      .select('*')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false })
    setProducts((data ?? []) as SbmProduct[])
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [user])

  async function toggleStatus(product: SbmProduct) {
    setToggling(product.id)
    const supabase = createClient()
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    await supabase.from('sbm_products').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
    setToggling(null)
  }

  const active = products.filter(p => p.status === 'active')

  const label = (zh: string, en: string, bm: string) => language === 'zh' ? zh : language === 'en' ? en : bm

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{label('我的产品', 'My Products', 'Produk Saya')}</h1>
          <p className="text-gray-400 text-sm mt-1">{active.length} {label('个上架中', 'active', 'aktif')}</p>
        </div>
        <Link href="/orchard/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {label('上架产品', 'List Product', 'Senarai Produk')}
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-6">{label('还没有上架任何产品', 'No products listed yet', 'Belum ada produk disenarai')}</p>
          <Link href="/orchard/products/new" className="btn-primary">{label('上架第一个产品', 'List Your First Product', 'Senarai Produk Pertama')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
            const variety = DURIAN_VARIETIES.find(v => v.code === p.variety)
            const varietyName = variety ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm) : p.variety
            const cmp = getPriceComparison(p.price_per_kg, p.durianex_reference_price)
            const isLowStock = p.stock_kg <= p.low_stock_alert_kg

            return (
              <div key={p.id} className={`card flex items-center gap-4 ${p.status !== 'active' ? 'opacity-50' : ''}`}>
                {/* Image */}
                <div className="w-14 h-14 rounded-xl bg-brand-dark flex items-center justify-center text-2xl flex-shrink-0">
                  {p.images && (p.images as string[]).length > 0
                    ? <img src={(p.images as string[])[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                    : '🍈'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{varietyName}</span>
                    {p.grade && <span className="badge bg-brand-green/30 text-brand-gold">{p.grade}</span>}
                    {p.status !== 'active' && <span className="badge bg-gray-800 text-gray-400">{label('已下架', 'Inactive', 'Tidak aktif')}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-brand-gold font-semibold">RM {p.price_per_kg.toFixed(2)}/kg</span>
                    {cmp && (
                      <span className={`text-xs ${cmp.type === 'below' ? 'text-green-400' : cmp.type === 'above' ? 'text-orange-400' : 'text-gray-500'}`}>
                        {cmp.type === 'below' ? `↓ ${cmp.pct}%` : cmp.type === 'above' ? `↑ ${cmp.pct}%` : '≈'} {label('市价', 'market', 'pasaran')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className={isLowStock ? 'text-red-400 flex items-center gap-1' : ''}>
                      {isLowStock && <AlertTriangle size={11} />}
                      {label('库存', 'Stock', 'Stok')}: {p.stock_kg}kg
                    </span>
                    {p.min_order_kg && <span>{label('起订', 'Min', 'Min')}: {p.min_order_kg}kg</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/orchard/products/${p.id}/edit`} className="p-2 text-gray-400 hover:text-white hover:bg-brand-dark rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </Link>
                  <button
                    onClick={() => toggleStatus(p)}
                    disabled={toggling === p.id}
                    className="p-2 text-gray-400 hover:text-white hover:bg-brand-dark rounded-lg transition-colors"
                    title={p.status === 'active' ? label('下架', 'Deactivate', 'Nyahaktif') : label('上架', 'Activate', 'Aktif')}
                  >
                    {p.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
