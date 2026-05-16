'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import ProductForm from '@/components/products/ProductForm'

export default function NewProductPage() {
  const { language, user } = useAppStore()
  const router = useRouter()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  useEffect(() => {
    if (!user) return
    async function getStore() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sbm_stores')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (!data) {
        // No store yet — need to create one first
        router.push('/orchard/profile')
        return
      }
      setStoreId(data.id)
      setLoading(false)
    }
    getStore()
  }, [user])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card animate-pulse h-96" />
    </div>
  )

  if (!storeId) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white hover:bg-brand-dark-card rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{label('上架新产品', 'List New Product', 'Senarai Produk Baru')}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{label('填写资料后立刻上架到市场', 'Goes live on marketplace immediately', 'Akan langsung disenarai di pasaran')}</p>
        </div>
      </div>

      <div className="card">
        <ProductForm
          storeId={storeId}
          sellerRole="orchard"
          onSuccess={() => router.push('/orchard/products')}
        />
      </div>
    </div>
  )
}
