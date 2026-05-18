'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Star, Upload, ImageIcon, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface Vendor {
  id: string
  shop_name: string
  location: string
  rating: number
  cover_image_url: string | null
  logo_url: string | null
  tags: string[]
  open_hours: string
  open_days: string
  is_open: boolean
  whatsapp: string | null
  description: string | null
  rank: number
  is_active: boolean
}

// ── Image Upload Button ─────────────────────────────────────────────────
function ImageUpload({
  label,
  currentUrl,
  storagePath,
  onUploaded,
  aspect = 'cover',
}: {
  label: string
  currentUrl: string | null
  storagePath: string
  onUploaded: (url: string) => void
  aspect?: 'cover' | 'logo'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const supabase = createClient()
      // Always overwrite same path so no duplicate files pile up
      const { error: uploadErr } = await supabase.storage
        .from('sbm-assets')
        .upload(storagePath, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('sbm-assets').getPublicUrl(storagePath)
      // Bust cache so the new image shows immediately
      onUploaded(data.publicUrl + '?t=' + Date.now())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isLogo = aspect === 'logo'

  return (
    <div>
      <label className="label text-xs">{label}</label>
      <div className="flex items-start gap-3">
        {/* Preview */}
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="preview"
            className={isLogo ? 'w-16 h-16 rounded-xl object-cover flex-shrink-0' : 'w-24 h-16 rounded-xl object-cover flex-shrink-0'}
            style={{ border: '1.5px solid rgba(199,166,23,0.4)' }}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-xl flex-shrink-0 ${isLogo ? 'w-16 h-16' : 'w-24 h-16'}`}
            style={{ background: 'rgba(94,127,31,0.1)', border: '1.5px dashed rgba(199,166,23,0.3)' }}
          >
            <ImageIcon size={18} style={{ color: 'rgba(199,166,23,0.4)' }} />
          </div>
        )}

        {/* Upload button */}
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.4)' }}
          >
            <Upload size={13} />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {currentUrl && (
            <p className="text-xs" style={{ color: 'rgba(246,241,231,0.3)' }}>✓ Photo saved</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => { loadVendors() }, [])

  async function loadVendors() {
    const supabase = createClient()
    const { data } = await supabase
      .from('sbm_featured_vendors')
      .select('*')
      .order('rank', { ascending: true })
    setVendors(data || [])
    setLoading(false)
  }

  function updateLocal(id: string, field: keyof Vendor, value: unknown) {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  async function saveVendor(vendor: Vendor) {
    setSaving(vendor.id)
    const supabase = createClient()
    await supabase.from('sbm_featured_vendors').update({
      shop_name:       vendor.shop_name,
      location:        vendor.location,
      rating:          vendor.rating,
      cover_image_url: vendor.cover_image_url,
      logo_url:        vendor.logo_url,
      open_hours:      vendor.open_hours,
      open_days:       vendor.open_days,
      is_open:         vendor.is_open,
      whatsapp:        vendor.whatsapp,
      description:     vendor.description,
      rank:            vendor.rank,
      is_active:       vendor.is_active,
      updated_at:      new Date().toISOString(),
    }).eq('id', vendor.id)
    setSaving(null)
    setSaved(vendor.id)
    setTimeout(() => setSaved(null), 2000)
  }

  async function moveRank(id: string, dir: 'up' | 'down') {
    const idx = vendors.findIndex(v => v.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === vendors.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const supabase = createClient()
    const a = vendors[idx], b = vendors[swapIdx]
    await Promise.all([
      supabase.from('sbm_featured_vendors').update({ rank: b.rank }).eq('id', a.id),
      supabase.from('sbm_featured_vendors').update({ rank: a.rank }).eq('id', b.id),
    ])
    loadVendors()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: 'rgba(246,241,231,0.5)' }}>Loading vendors...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: '#C7A617' }}>🍈 Vendor Management</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(246,241,231,0.5)' }}>
          Upload photos, edit store info, toggle open status & adjust ranking
        </p>
      </div>

      <div className="space-y-4">
        {vendors.map((v, idx) => (
          <div key={v.id} className="rounded-2xl p-5"
            style={{ background: 'rgba(20,38,28,0.95)', border: '1px solid rgba(199,166,23,0.25)' }}>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-black" style={{ color: '#C7A617' }}>#{v.rank}</span>
                <span className="font-bold" style={{ color: '#F6F1E7' }}>{v.shop_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={v.is_open
                    ? { background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.4)' }
                    : { background: 'rgba(179,58,46,0.15)', color: '#e05a4a', border: '1px solid rgba(179,58,46,0.3)' }}>
                  {v.is_open ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveRank(v.id, 'up')} disabled={idx === 0}
                  className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: 'rgba(94,127,31,0.15)', color: '#8bc34a' }}>
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => moveRank(v.id, 'down')} disabled={idx === vendors.length - 1}
                  className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: 'rgba(94,127,31,0.15)', color: '#8bc34a' }}>
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Shop Name</label>
                <input className="input text-sm" value={v.shop_name}
                  onChange={e => updateLocal(v.id, 'shop_name', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Location</label>
                <input className="input text-sm" value={v.location || ''}
                  onChange={e => updateLocal(v.id, 'location', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Open Hours</label>
                <input className="input text-sm" value={v.open_hours || ''}
                  onChange={e => updateLocal(v.id, 'open_hours', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Open Days</label>
                <input className="input text-sm" value={v.open_days || ''}
                  onChange={e => updateLocal(v.id, 'open_days', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Rating (0–5)</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" min="0" max="5" className="input text-sm"
                    value={v.rating}
                    onChange={e => updateLocal(v.id, 'rating', parseFloat(e.target.value))} />
                  <Star size={16} fill="#C7A617" stroke="#C7A617" />
                </div>
              </div>
              <div>
                <label className="label text-xs">WhatsApp Number</label>
                <input className="input text-sm" placeholder="+601234567890" value={v.whatsapp || ''}
                  onChange={e => updateLocal(v.id, 'whatsapp', e.target.value)} />
              </div>

              {/* ── Cover Photo Upload ── */}
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Cover Photo"
                  currentUrl={v.cover_image_url}
                  storagePath={`vendors/${v.id}/cover.jpg`}
                  aspect="cover"
                  onUploaded={url => updateLocal(v.id, 'cover_image_url', url)}
                />
              </div>

              {/* ── Logo Upload ── */}
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Logo / Profile Photo"
                  currentUrl={v.logo_url}
                  storagePath={`vendors/${v.id}/logo.jpg`}
                  aspect="logo"
                  onUploaded={url => updateLocal(v.id, 'logo_url', url)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label text-xs">Description</label>
                <textarea className="input text-sm resize-none" rows={2}
                  value={v.description || ''}
                  onChange={e => updateLocal(v.id, 'description', e.target.value)} />
              </div>
            </div>

            {/* Toggle + Save row */}
            <div className="flex items-center justify-between mt-4 pt-4"
              style={{ borderTop: '1px solid rgba(199,166,23,0.15)' }}>
              <div className="flex items-center gap-4">
                <button onClick={() => updateLocal(v.id, 'is_open', !v.is_open)}
                  className="flex items-center gap-2 text-sm font-medium transition-all">
                  {v.is_open
                    ? <ToggleRight size={24} style={{ color: '#8bc34a' }} />
                    : <ToggleLeft size={24} style={{ color: 'rgba(246,241,231,0.35)' }} />}
                  <span style={{ color: v.is_open ? '#8bc34a' : 'rgba(246,241,231,0.4)' }}>
                    {v.is_open ? 'Open' : 'Closed'}
                  </span>
                </button>
                <button onClick={() => updateLocal(v.id, 'is_active', !v.is_active)}
                  className="flex items-center gap-2 text-sm font-medium transition-all">
                  {v.is_active
                    ? <ToggleRight size={24} style={{ color: '#C7A617' }} />
                    : <ToggleLeft size={24} style={{ color: 'rgba(246,241,231,0.35)' }} />}
                  <span style={{ color: v.is_active ? '#C7A617' : 'rgba(246,241,231,0.4)' }}>
                    {v.is_active ? 'Active' : 'Hidden'}
                  </span>
                </button>
              </div>
              <Link href={`/admin/vendors/${v.id}/products`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(199,166,23,0.12)', color: '#C7A617', border: '1px solid rgba(199,166,23,0.3)' }}>
                <ShoppingBag size={13} /> Products
              </Link>
              <button onClick={() => saveVendor(v)} disabled={saving === v.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ background: saved === v.id ? 'rgba(94,127,31,0.3)' : '#5E7F1F', color: '#F6F1E7' }}>
                <Save size={14} />
                {saving === v.id ? 'Saving...' : saved === v.id ? '✓ Saved!' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
