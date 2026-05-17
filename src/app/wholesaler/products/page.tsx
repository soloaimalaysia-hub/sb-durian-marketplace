'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Eye, EyeOff, Pencil, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES } from '@/lib/constants'
import type { SbmProduct } from '@/lib/types'

export default function WholesalerProductsPage() {
  const { language, user } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [products, setProducts] = useState<SbmProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data: store } = await supabase.from('sbm_stores').select('id').eq('user_id', user.id).single()
    if (!store) { setLoading(false); return }
    const { data } = await supabase.from('sbm_products').select('*').eq('store_id', store.id).eq('seller_role', 'wholesaler').order('created_at', { ascending: false })
    setProducts((data ?? []) as SbmProduct[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function toggleStatus(product: SbmProduct) {
    setToggling(product.id)
    const supabase = createClient()
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    await supabase.from('sbm_products').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
    setToggling(null)
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{label('我的产品', 'My Products', 'Produk Saya')}</h1>
          <p className="text-gray-400 text-sm mt-1">{label('卖给零售商的产品', 'Products for retailers', 'Produk untuk peruncit')}</p>
        </div>
        <Link href="/wholesaler/products/new" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <Plus size={16} />
          {label('上架产品', 'List Product', 'Senarai Produk')}
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">{label('还没有上架产品', 'No products listed yet', 'Belum ada produk')}</p>
          <p className="text-gray-600 text-sm mt-1">{label('上架产品给零售商采购', 'List products for retailers to purchase', 'Senarai produk untuk peruncit')}</p>
          <Link href="/wholesaler/products/new" className="btn-primary mt-6 inline-flex items-center gap-2">
            <Plus size={16} /> {label('上架第一个产品', 'List First Product', 'Senarai Produk Pertama')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
            const variety = DURIAN_VARIETIES.find(v => v.code === p.variety)
            const varietyName = variety ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm) : p.variety
            const images = (p.images as string[]) || []
            return (
              <div key={p.id} className="card flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-dark flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
                  {images[0] ? <img src={images[0]} alt="" className="w-full h-full object-cover" /> : '🍈'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{varietyName}</span>
                    {p.grade && <span className="badge text-xs bg-brand-gold/20 text-brand-gold">{p.grade}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                      {p.status === 'active' ? label('上架中', 'Active', 'Aktif') : label('已下架', 'Inactive', 'Tidak Aktif')}
                    </span>
                  </div>
                  <p className="text-brand-gold text-sm font-semibold mt-0.5">RM {p.price_per_kg.toFixed(2)}/kg</p>
                  <p className="text-xs text-gray-500">{label('库存', 'Stock', 'Stok')}: {p.stock_kg}kg · {label('起订', 'Min', 'Min')}: {p.min_order_kg}kg</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(p)}
                    disabled={toggling === p.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title={p.status === 'active' ? label('下架', 'Deactivate', 'Nyahaktif') : label('上架', 'Activate', 'Aktifkan')}
                  >
                    {p.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link href={`/wholesaler/products/${p.id}/edit`}
                    className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Pencil size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
