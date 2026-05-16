'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import ProductForm from '@/components/products/ProductForm'
import type { SbmProduct } from '@/lib/types'

export default function EditProductPage() {
  const { language } = useAppStore()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<SbmProduct | null>(null)
  const [loading, setLoading] = useState(true)

  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('sbm_products').select('*').eq('id', id).single()
      setProduct(data as SbmProduct)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="card animate-pulse h-96" /></div>
  if (!product) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white hover:bg-brand-dark-card rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">{label('编辑产品', 'Edit Product', 'Edit Produk')}</h1>
      </div>
      <div className="card">
        <ProductForm
          storeId={product.store_id}
          sellerRole={product.seller_role}
          existing={product}
          onSuccess={() => router.push('/orchard/products')}
        />
      </div>
    </div>
  )
}
