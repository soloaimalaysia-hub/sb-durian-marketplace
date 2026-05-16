'use client'

import { useEffect, useState } from 'react'
import { Loader, Save, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { MALAYSIA_STATES } from '@/lib/constants'

export default function OrchardProfilePage() {
  const { language, user } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [storeId, setStoreId] = useState<string | null>(null)
  const [form, setForm] = useState({ store_name: '', state: '', city: '', address: '', description_zh: '', description_en: '', description_bm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('sbm_stores').select('*').eq('user_id', user!.id).single()
      if (data) {
        setStoreId(data.id)
        setForm({
          store_name: data.store_name ?? '',
          state: data.state ?? '',
          city: data.city ?? '',
          address: data.address ?? '',
          description_zh: data.description_zh ?? '',
          description_en: data.description_en ?? '',
          description_bm: data.description_bm ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (storeId) {
      await supabase.from('sbm_stores').update(payload).eq('id', storeId)
    } else {
      const { data } = await supabase.from('sbm_stores').insert({ ...payload, user_id: user.id }).select().single()
      if (data) setStoreId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="card animate-pulse h-96" /></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">{label('店面设置', 'Store Settings', 'Tetapan Kedai')}</h1>
      <div className="card space-y-5">
        <div>
          <label className="label">{label('店面名称', 'Store Name', 'Nama Kedai')} *</label>
          <input type="text" value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} className="input" placeholder={label('例：金山榴莲园', 'e.g. Golden Hill Orchard', 'cth: Ladang Bukit Emas')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{label('州属', 'State', 'Negeri')}</label>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input bg-brand-dark">
              <option value="">{label('-- 选择 --', '-- Select --', '-- Pilih --')}</option>
              {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{label('城市', 'City', 'Bandar')}</label>
            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input" placeholder={label('城市', 'City', 'Bandar')} />
          </div>
        </div>
        <div>
          <label className="label">{label('地址', 'Address', 'Alamat')}</label>
          <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input resize-none h-20" placeholder={label('详细地址', 'Full address', 'Alamat penuh')} />
        </div>
        <div>
          <label className="label">{label('店面简介', 'Store Description', 'Penerangan Kedai')}</label>
          <textarea value={form.description_zh} onChange={e => setForm(f => ({ ...f, description_zh: e.target.value }))} className="input resize-none h-20 mb-2" placeholder={label('华语简介', 'Chinese description', 'Penerangan Mandarin')} />
          <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} className="input resize-none h-20 mb-2" placeholder="English description" />
          <textarea value={form.description_bm} onChange={e => setForm(f => ({ ...f, description_bm: e.target.value }))} className="input resize-none h-20" placeholder="Penerangan BM" />
        </div>
        <button onClick={handleSave} disabled={saving || !form.store_name} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? label('已保存！', 'Saved!', 'Tersimpan!') : label('保存', 'Save', 'Simpan')}
        </button>
      </div>
    </div>
  )
}
