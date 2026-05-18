'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Save, Trash2, Upload, ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react'

interface Product {
  id: string
  vendor_id: string
  name: string
  description: string
  price: number | null
  unit: string
  image_url: string | null
  is_available: boolean
  sort_order: number
}

interface Vendor {
  id: string
  shop_name: string
}

const EMPTY_PRODUCT: Omit<Product, 'id' | 'vendor_id'> = {
  name: '',
  description: '',
  price: null,
  unit: 'per kg',
  image_url: null,
  is_available: true,
  sort_order: 0,
}

// ── Image Upload ────────────────────────────────────────────────────────
function ProductImageUpload({ productId, vendorId, currentUrl, onUploaded }: {
  productId: string
  vendorId: string
  currentUrl: string | null
  onUploaded: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `vendors/${vendorId}/products/${productId}.jpg`
      await supabase.storage.from('sbm-assets').upload(path, file, { upsert: true, contentType: file.type })
      const { data } = supabase.storage.from('sbm-assets').getPublicUrl(path)
      onUploaded(data.publicUrl + '?t=' + Date.now())
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <img src={currentUrl} alt="product" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          style={{ border: '1.5px solid rgba(199,166,23,0.4)' }} />
      ) : (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(94,127,31,0.1)', border: '1.5px dashed rgba(199,166,23,0.3)' }}>
          <ImageIcon size={18} style={{ color: 'rgba(199,166,23,0.35)' }} />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.4)' }}>
        <Upload size={12} />
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </button>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function VendorProductsPage() {
  const { id } = useParams<{ id: string }>()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ ...EMPTY_PRODUCT })
  const [addingId, setAddingId] = useState<string | null>(null) // temp id for image upload before save

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const supabase = createClient()
    const [{ data: v }, { data: p }] = await Promise.all([
      supabase.from('sbm_featured_vendors').select('id, shop_name').eq('id', id).single(),
      supabase.from('sbm_vendor_products').select('*').eq('vendor_id', id).order('sort_order').order('created_at'),
    ])
    setVendor(v)
    setProducts(p || [])
    setLoading(false)
  }

  function updateProduct(productId: string, field: keyof Product, value: unknown) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p))
  }

  async function saveProduct(product: Product) {
    setSaving(product.id)
    const supabase = createClient()
    await supabase.from('sbm_vendor_products').update({
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      image_url: product.image_url,
      is_available: product.is_available,
      sort_order: product.sort_order,
      updated_at: new Date().toISOString(),
    }).eq('id', product.id)
    setSaving(null)
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Delete this product?')) return
    setDeleting(productId)
    const supabase = createClient()
    await supabase.from('sbm_vendor_products').delete().eq('id', productId)
    setProducts(prev => prev.filter(p => p.id !== productId))
    setDeleting(null)
  }

  async function addProduct() {
    if (!newProduct.name.trim()) return
    const supabase = createClient()
    const { data } = await supabase.from('sbm_vendor_products').insert({
      vendor_id: id,
      ...newProduct,
      sort_order: products.length,
    }).select().single()
    if (data) {
      setProducts(prev => [...prev, data])
      setNewProduct({ ...EMPTY_PRODUCT })
      setShowAddForm(false)
      setAddingId(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: 'rgba(246,241,231,0.5)' }}>Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/vendors"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-all"
          style={{ background: 'rgba(94,127,31,0.15)', color: '#8bc34a' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#C7A617' }}>🍈 Products</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(246,241,231,0.5)' }}>{vendor?.shop_name}</p>
      </div>

      {/* Add Product Button */}
      <button onClick={() => setShowAddForm(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold mb-6 transition-all"
        style={{ background: '#5E7F1F', color: '#F6F1E7' }}>
        <Plus size={16} />
        {showAddForm ? 'Cancel' : 'Add New Product'}
      </button>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(20,38,28,0.95)', border: '1px solid rgba(199,166,23,0.4)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: '#C7A617' }}>New Product</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label text-xs">Product Name *</label>
              <input className="input text-sm" placeholder="e.g. Musang King"
                value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Unit</label>
              <select className="input text-sm" value={newProduct.unit}
                onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}>
                <option value="per kg">per kg</option>
                <option value="per box">per box</option>
                <option value="per piece">per piece</option>
                <option value="per pack">per pack</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Price (RM)</label>
              <input type="number" step="0.50" min="0" className="input text-sm" placeholder="e.g. 35.00"
                value={newProduct.price ?? ''} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value ? parseFloat(e.target.value) : null }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs">Description</label>
              <input className="input text-sm" placeholder="Short description..."
                value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={addProduct}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: '#C7A617', color: '#14261c' }}>
              <Plus size={14} /> Add Product
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(20,38,28,0.6)', border: '1px dashed rgba(199,166,23,0.2)' }}>
          <p className="text-4xl mb-3">🍈</p>
          <p className="text-sm" style={{ color: 'rgba(246,241,231,0.4)' }}>No products yet. Add one above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(p => (
            <div key={p.id} className="rounded-2xl p-5"
              style={{ background: 'rgba(20,38,28,0.95)', border: '1px solid rgba(199,166,23,0.2)' }}>

              {/* Product image upload */}
              <div className="mb-4">
                <label className="label text-xs mb-2">Product Photo</label>
                <ProductImageUpload
                  productId={p.id} vendorId={id}
                  currentUrl={p.image_url}
                  onUploaded={url => updateProduct(p.id, 'image_url', url)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Product Name</label>
                  <input className="input text-sm" value={p.name}
                    onChange={e => updateProduct(p.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs">Unit</label>
                  <select className="input text-sm" value={p.unit}
                    onChange={e => updateProduct(p.id, 'unit', e.target.value)}>
                    <option value="per kg">per kg</option>
                    <option value="per box">per box</option>
                    <option value="per piece">per piece</option>
                    <option value="per pack">per pack</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Price (RM)</label>
                  <input type="number" step="0.50" min="0" className="input text-sm"
                    value={p.price ?? ''}
                    onChange={e => updateProduct(p.id, 'price', e.target.value ? parseFloat(e.target.value) : null)} />
                </div>
                <div>
                  <label className="label text-xs">Sort Order</label>
                  <input type="number" min="0" className="input text-sm"
                    value={p.sort_order}
                    onChange={e => updateProduct(p.id, 'sort_order', parseInt(e.target.value) || 0)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-xs">Description</label>
                  <input className="input text-sm" value={p.description || ''}
                    onChange={e => updateProduct(p.id, 'description', e.target.value)} />
                </div>
              </div>

              {/* Toggle + actions */}
              <div className="flex items-center justify-between mt-4 pt-4"
                style={{ borderTop: '1px solid rgba(199,166,23,0.15)' }}>
                <button onClick={() => updateProduct(p.id, 'is_available', !p.is_available)}
                  className="flex items-center gap-2 text-sm font-medium">
                  {p.is_available
                    ? <ToggleRight size={24} style={{ color: '#8bc34a' }} />
                    : <ToggleLeft size={24} style={{ color: 'rgba(246,241,231,0.35)' }} />}
                  <span style={{ color: p.is_available ? '#8bc34a' : 'rgba(246,241,231,0.4)' }}>
                    {p.is_available ? 'Available' : 'Sold Out'}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(179,58,46,0.15)', color: '#e05a4a', border: '1px solid rgba(179,58,46,0.3)' }}>
                    <Trash2 size={13} />
                    {deleting === p.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <button onClick={() => saveProduct(p)} disabled={saving === p.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    style={{ background: saving === p.id ? 'rgba(94,127,31,0.3)' : '#5E7F1F', color: '#F6F1E7' }}>
                    <Save size={13} />
                    {saving === p.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
