'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Star, MessageCircle, ShoppingCart, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES } from '@/lib/constants'
import { getPriceComparison } from '@/lib/durianex'
import type { SbmProduct, SbmStore } from '@/lib/types'

type ProductDetail = SbmProduct & { sbm_stores: SbmStore }

export default function ProductDetailPage() {
  const { language, user } = useAppStore()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sbm_products')
        .select('*, sbm_stores(*)')
        .eq('id', id)
        .single()
      if (data) {
        setProduct(data as ProductDetail)
        // Track view
        supabase.from('sbm_products').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 space-y-4"><div className="card animate-pulse h-80" /><div className="card animate-pulse h-40" /></div>
  if (!product) return <div className="text-center py-20 text-gray-400">{label('产品不存在', 'Product not found', 'Produk tidak dijumpai')}</div>

  const variety = DURIAN_VARIETIES.find(v => v.code === product.variety)
  const varietyName = variety ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm) : product.variety
  const cmp = getPriceComparison(product.price_per_kg, product.durianex_reference_price)
  const images = (product.images as string[]) || []
  const store = product.sbm_stores
  const waLink = `https://wa.me/?text=${encodeURIComponent(label(`你好！我想询问关于 ${varietyName} 的详情。`, `Hi! I'm interested in your ${varietyName}.`, `Hai! Saya berminat dengan ${varietyName} anda.`))}`

  const desc = language === 'zh' ? product.description_zh : language === 'en' ? product.description_en : product.description_bm

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={18} /> {label('返回', 'Back', 'Kembali')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-brand-dark-card flex items-center justify-center text-6xl">
            {images.length > 0
              ? <img src={images[imgIdx]} alt={varietyName} className="w-full h-full object-cover" />
              : '🍈'}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((url, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-brand-gold' : 'border-transparent'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{varietyName}</h1>
              {product.grade && <span className="badge bg-brand-green/30 text-brand-gold text-sm px-3 py-1">{product.grade}</span>}
            </div>
            {store && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="font-medium text-gray-300">{store.store_name}</span>
                {store.state && <span className="flex items-center gap-1"><MapPin size={12} />{store.state}</span>}
                {store.rating > 0 && <span className="flex items-center gap-1 text-brand-gold"><Star size={12} />{store.rating.toFixed(1)}</span>}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="card">
            <div className="text-3xl font-bold text-brand-gold mb-1">RM {product.price_per_kg.toFixed(2)}<span className="text-base text-gray-400 font-normal">/kg</span></div>
            {product.durianex_reference_price && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>DURIANEX {label('参考', 'ref', 'rujukan')}: RM {product.durianex_reference_price.toFixed(2)}/kg</span>
                {cmp && (
                  <span className={`flex items-center gap-1 font-medium ${cmp.type === 'below' ? 'text-green-400' : cmp.type === 'above' ? 'text-orange-400' : 'text-gray-400'}`}>
                    {cmp.type === 'below' ? <TrendingDown size={11} /> : cmp.type === 'above' ? <TrendingUp size={11} /> : <Minus size={11} />}
                    {cmp.type === 'below' ? `${cmp.pct}% ${label('低于市价', 'below market', 'bawah pasaran')}` :
                     cmp.type === 'above' ? `${cmp.pct}% ${label('高于市价', 'above market', 'atas pasaran')}` :
                     label('符合市价', 'At market price', 'Sama harga pasaran')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="card py-3 px-4">
              <p className="text-gray-500 text-xs mb-1">{label('库存', 'Stock', 'Stok')}</p>
              <p className="font-bold text-white">{product.stock_kg} kg</p>
            </div>
            {product.min_order_kg && (
              <div className="card py-3 px-4">
                <p className="text-gray-500 text-xs mb-1">{label('起订量', 'Min Order', 'Min Pesanan')}</p>
                <p className="font-bold text-white">{product.min_order_kg} kg</p>
              </div>
            )}
            {product.credit_terms_days > 0 && (
              <div className="card py-3 px-4">
                <p className="text-gray-500 text-xs mb-1">{label('账期', 'Credit Term', 'Terma Kredit')}</p>
                <p className="font-bold text-white">{product.credit_terms_days} {label('天', 'days', 'hari')}</p>
              </div>
            )}
            <div className="card py-3 px-4">
              <p className="text-gray-500 text-xs mb-1">{label('已售', 'Sold', 'Terjual')}</p>
              <p className="font-bold text-white">{product.total_sold_kg} kg</p>
            </div>
          </div>

          {/* Description */}
          {desc && <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>}

          {/* CTA buttons */}
          <div className="space-y-3">
            {user && user.id !== (store as { user_id?: string })?.user_id && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full flex items-center justify-center gap-2">
                <MessageCircle size={18} />
                {label('WhatsApp 联系卖家', 'Contact via WhatsApp', 'Hubungi via WhatsApp')}
              </a>
            )}
            {user && ['wholesaler', 'retailer'].includes(user.role) && (
              <button className="btn-secondary w-full flex items-center justify-center gap-2">
                <ShoppingCart size={18} />
                {label('下单', 'Place Order', 'Buat Pesanan')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
