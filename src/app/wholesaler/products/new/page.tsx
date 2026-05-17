'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase/client'
import ProductForm from '@/components/products/ProductForm'

export default function WholesalerNewProductPage() {
  const { user } = useAppStore()
  const [storeId, setStoreId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('sbm_stores').select('id').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setStoreId(data.id) })
  }, [user])

  if (!user || !storeId) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <ProductForm storeId={storeId} sellerRole="wholesaler" />
    </div>
  )
}
