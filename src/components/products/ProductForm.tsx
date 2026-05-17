'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, Loader, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES, DURIAN_GRADES, MALAYSIA_STATES } from '@/lib/constants'
import { getDurianexRefPrice, getPriceComparison } from '@/lib/durianex'
import type { SbmProduct } from '@/lib/types'

interface ProductFormProps {
  storeId: string
  sellerRole: 'orchard' | 'wholesaler' | 'retailer'
  existing?: SbmProduct
  onSuccess?: () => void
}

interface FormState {
  variety: string
  grade: string
  price_per_kg: string
  stock_kg: string
  min_order_kg: string
  low_stock_alert_kg: string
  credit_terms_days: string
  origin_state: string
  description_zh: string
  description_en: string
  description_bm: string
  accepts_b2b: boolean
  accepts_b2c: boolean
}

export default function ProductForm({ storeId, sellerRole, existing, onSuccess }: ProductFormProps) {
  const { language, user } = useAppStore()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    variety: existing?.variety ?? '',
    grade: existing?.grade ?? '',
    price_per_kg: existing?.price_per_kg?.toString() ?? '',
    stock_kg: existing?.stock_kg?.toString() ?? '',
    min_order_kg: existing?.min_order_kg?.toString() ?? '',
    low_stock_alert_kg: existing?.low_stock_alert_kg?.toString() ?? '10',
    credit_terms_days: existing?.credit_terms_days?.toString() ?? '0',
    origin_state: existing?.origin_state ?? '',
    description_zh: existing?.description_zh ?? '',
    description_en: existing?.description_en ?? '',
    description_bm: existing?.description_bm ?? '',
    accepts_b2b: existing?.accepts_b2b ?? true,
    accepts_b2c: existing?.accepts_b2c ?? false,
  })

  const [images, setImages] = useState<string[]>((existing?.images as string[]) ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refPrice, setRefPrice] = useState<number | null>(null)
  const [priceWarning, setPriceWarning] = useState<string | null>(null)

  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  // Fetch DURIANEX reference price when variety changes
  useEffect(() => {
    if (!form.variety) { setRefPrice(null); return }
    getDurianexRefPrice(form.variety).then(p => {
      setRefPrice(p)
      checkPriceWarning(parseFloat(form.price_per_kg), p)
    })
  }, [form.variety])

  function checkPriceWarning(price: number, ref: number | null) {
    setPriceWarning(null)
    if (!ref || !price) return
    const diff = ((price - ref) / ref) * 100
    if (diff < -20) {
      setPriceWarning(label(
        `你的定价比市场价低 ${Math.abs(Math.round(diff))}%，确认吗？`,
        `Your price is ${Math.abs(Math.round(diff))}% below market. Are you sure?`,
        `Harga anda ${Math.abs(Math.round(diff))}% di bawah pasaran. Pasti?`
      ))
    }
  }

  function setField(key: keyof FormState, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
    if (key === 'price_per_kg') {
      checkPriceWarning(parseFloat(value as string), refPrice)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length || !user) return
    setUploading(true)
    setError('')
    try {
      const supabase = createClient()
      const newUrls: string[] = []
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { setError(label('图片不能超过 5MB', 'Image must be under 5MB', 'Imej mesti di bawah 5MB')); continue }
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('sbm-products').upload(path, file)
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('sbm-products').getPublicUrl(path)
        newUrls.push(publicUrl)
      }
      setImages(prev => [...prev, ...newUrls].slice(0, 5))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : label('图片上传失败', 'Upload failed', 'Muat naik gagal'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    setError('')
    if (!form.variety || !form.price_per_kg || !form.stock_kg) {
      setError(label('请填写必填项', 'Please fill required fields', 'Sila isi ruangan wajib'))
      return
    }
    if (images.length === 0) {
      setError(label('请至少上传一张图片', 'Please upload at least one image', 'Sila muat naik sekurang-kurangnya satu gambar'))
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        store_id: storeId,
        seller_role: sellerRole,
        variety: form.variety,
        grade: form.grade || null,
        price_per_kg: parseFloat(form.price_per_kg),
        stock_kg: parseFloat(form.stock_kg),
        min_order_kg: form.min_order_kg ? parseFloat(form.min_order_kg) : null,
        low_stock_alert_kg: parseFloat(form.low_stock_alert_kg || '10'),
        credit_terms_days: parseInt(form.credit_terms_days || '0'),
        origin_state: form.origin_state || null,
        description_zh: form.description_zh || null,
        description_en: form.description_en || null,
        description_bm: form.description_bm || null,
        accepts_b2b: form.accepts_b2b,
        accepts_b2c: form.accepts_b2c,
        images,
        durianex_reference_price: refPrice,
        status: 'active',
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        await supabase.from('sbm_products').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('sbm_products').insert(payload)
      }

      if (onSuccess) onSuccess()
      else router.push('/orchard/products')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : label('保存失败', 'Save failed', 'Simpan gagal'))
    } finally {
      setSaving(false)
    }
  }

  const cmp = getPriceComparison(parseFloat(form.price_per_kg), refPrice)

  return (
    <div className="space-y-6">
      {/* Variety + Grade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{label('品种', 'Variety', 'Varieti')} *</label>
          <select value={form.variety} onChange={e => setField('variety', e.target.value)} className="input bg-brand-dark">
            <option value="">{label('-- 选择品种 --', '-- Select --', '-- Pilih --')}</option>
            {DURIAN_VARIETIES.filter(v => v.code !== 'other').map(v => (
              <option key={v.code} value={v.code}>
                {language === 'zh' ? v.zh : language === 'en' ? v.en : v.bm}
              </option>
            ))}
            <option value="other">{label('其他', 'Others', 'Lain-lain')}</option>
          </select>
        </div>
        <div>
          <label className="label">{label('等级', 'Grade', 'Gred')}</label>
          <select value={form.grade} onChange={e => setField('grade', e.target.value)} className="input bg-brand-dark">
            <option value="">{label('-- 选择等级 --', '-- Select --', '-- Pilih --')}</option>
            {DURIAN_GRADES.map(g => (
              <option key={g.code} value={g.code}>
                {language === 'zh' ? g.zh : language === 'en' ? g.en : g.bm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price with DURIANEX reference */}
      <div>
        <label className="label">{label('价格 (RM/kg)', 'Price (RM/kg)', 'Harga (RM/kg)')} *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RM</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.price_per_kg}
            onChange={e => setField('price_per_kg', e.target.value)}
            className="input pl-12"
            placeholder="0.00"
          />
        </div>

        {/* DURIANEX reference */}
        {refPrice && (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-gray-400">
              DURIANEX {label('参考价', 'ref price', 'harga rujukan')}: <span className="text-white font-medium">RM {refPrice.toFixed(2)}/kg</span>
            </span>
            {cmp && form.price_per_kg && (
              <span className={`flex items-center gap-1 text-xs font-medium ${
                cmp.type === 'below' ? 'text-green-400' : cmp.type === 'above' ? 'text-orange-400' : 'text-gray-400'
              }`}>
                {cmp.type === 'below' ? <TrendingDown size={12} /> : cmp.type === 'above' ? <TrendingUp size={12} /> : <Minus size={12} />}
                {cmp.type === 'below' ? label(`低于市价 ${cmp.pct}%`, `${cmp.pct}% below market`, `${cmp.pct}% bawah pasaran`) :
                 cmp.type === 'above' ? label(`高于市价 ${cmp.pct}%`, `${cmp.pct}% above market`, `${cmp.pct}% atas pasaran`) :
                 label('符合市价', 'At market price', 'Sama harga pasaran')}
              </span>
            )}
          </div>
        )}

        {/* Price warning */}
        {priceWarning && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <AlertTriangle size={16} className="text-orange-400 flex-shrink-0" />
            <p className="text-orange-300 text-xs">{priceWarning}</p>
          </div>
        )}
      </div>

      {/* Stock + Min order */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{label('库存 (kg)', 'Stock (kg)', 'Stok (kg)')} *</label>
          <input type="number" min="0" step="1" value={form.stock_kg} onChange={e => setField('stock_kg', e.target.value)} className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">{label('起订量 (kg)', 'Min Order (kg)', 'Min Pesanan (kg)')}</label>
          <input type="number" min="0" step="1" value={form.min_order_kg} onChange={e => setField('min_order_kg', e.target.value)} className="input" placeholder={label('选填', 'Optional', 'Pilihan')} />
        </div>
      </div>

      {/* Origin State */}
      <div>
        <label className="label">{label('产地州属', 'Origin State', 'Negeri Asal')}</label>
        <select value={form.origin_state} onChange={e => setField('origin_state', e.target.value)} className="input bg-brand-dark">
          <option value="">{label('-- 选择州属 --', '-- Select State --', '-- Pilih Negeri --')}</option>
          {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* B2B / B2C toggles */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setField('accepts_b2b', !form.accepts_b2b)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-sm font-medium ${form.accepts_b2b ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}
        >
          <span>{label('接受B2B批发', 'Accept B2B', 'Terima B2B')}</span>
          <span className={`w-8 h-4 rounded-full transition-colors relative ${form.accepts_b2b ? 'bg-brand-gold' : 'bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.accepts_b2b ? 'right-0.5' : 'left-0.5'}`} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setField('accepts_b2c', !form.accepts_b2c)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-sm font-medium ${form.accepts_b2c ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}
        >
          <span>{label('接受B2C零售', 'Accept B2C', 'Terima B2C')}</span>
          <span className={`w-8 h-4 rounded-full transition-colors relative ${form.accepts_b2c ? 'bg-brand-gold' : 'bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.accepts_b2c ? 'right-0.5' : 'left-0.5'}`} />
          </span>
        </button>
      </div>

      {/* Low stock alert + Credit terms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{label('库存预警 (kg)', 'Low Stock Alert (kg)', 'Amaran Stok (kg)')}</label>
          <input type="number" min="0" value={form.low_stock_alert_kg} onChange={e => setField('low_stock_alert_kg', e.target.value)} className="input" placeholder="10" />
        </div>
        <div>
          <label className="label">{label('账期 (天)', 'Credit Terms (days)', 'Terma Kredit (hari)')}</label>
          <input type="number" min="0" value={form.credit_terms_days} onChange={e => setField('credit_terms_days', e.target.value)} className="input" placeholder="0" />
          <p className="text-xs text-gray-500 mt-1">{label('0 = 现款', '0 = Cash on delivery', '0 = Tunai')}</p>
        </div>
      </div>

      {/* Description (tri-lingual, collapsible) */}
      <div className="space-y-3">
        <label className="label">{label('产品描述（选填）', 'Description (Optional)', 'Penerangan (Pilihan)')}</label>
        <textarea value={form.description_zh} onChange={e => setField('description_zh', e.target.value)} className="input resize-none h-20" placeholder={label('华语描述', 'Chinese description', 'Penerangan Mandarin')} />
        <textarea value={form.description_en} onChange={e => setField('description_en', e.target.value)} className="input resize-none h-20" placeholder="English description" />
        <textarea value={form.description_bm} onChange={e => setField('description_bm', e.target.value)} className="input resize-none h-20" placeholder="Penerangan Bahasa Malaysia" />
      </div>

      {/* Image upload */}
      <div>
        <label className="label">{label('产品图片', 'Product Images', 'Gambar Produk')} * <span className="text-gray-500 text-xs">{label('(最多5张，每张≤5MB)', '(Max 5, each ≤5MB)', '(Maks 5, setiap ≤5MB)')}</span></label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-brand-dark">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
              >
                <Trash2 size={12} className="text-white" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-brand-dark-border hover:border-brand-gold/50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              {uploading ? <Loader size={20} className="animate-spin text-brand-gold" /> : <Upload size={20} className="text-gray-500" />}
              <span className="text-xs text-gray-500">{uploading ? label('上传中', 'Uploading', 'Memuat naik') : label('添加图片', 'Add Photo', 'Tambah Foto')}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || uploading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving && <Loader size={18} className="animate-spin" />}
        {existing ? label('保存修改', 'Save Changes', 'Simpan Perubahan') : label('上架产品', 'List Product', 'Senarai Produk')}
      </button>
    </div>
  )
}
