'use client'

import { useEffect, useState } from 'react'
import { Settings, Loader, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { MALAYSIA_STATES } from '@/lib/constants'

export default function WholesalerSettingsPage() {
  const { language, user, setUser } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [storeName, setStoreName] = useState('')
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [storeId, setStoreId] = useState('')

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name ?? '')
    setPhone(user.phone ?? '')
    const supabase = createClient()
    supabase.from('sbm_stores').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setStoreId(data.id)
          setStoreName(data.store_name ?? '')
          setState(data.state ?? '')
          setAddress(data.address ?? '')
          setBankName(data.bank_name ?? '')
          setBankAccount(data.bank_account ?? '')
          setBankHolder(data.bank_holder ?? '')
        }
        setLoading(false)
      })
  }, [user])

  async function handleSave() {
    if (!user || !storeId) return
    setSaving(true)
    const supabase = createClient()
    await Promise.all([
      supabase.from('sbm_users').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', user.id),
      supabase.from('sbm_stores').update({
        store_name: storeName, state, address,
        bank_name: bankName, bank_account: bankAccount, bank_holder: bankHolder,
        updated_at: new Date().toISOString(),
      }).eq('id', storeId),
    ])
    setUser({ ...user, full_name: fullName, phone })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={22} className="text-brand-gold" />
          {label('店面设置', 'Store Settings', 'Tetapan Kedai')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{label('更新公司资料与付款方式', 'Update company info & payment details', 'Kemaskini maklumat syarikat')}</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Personal info */}
          <div className="card space-y-4">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">{label('个人资料', 'Personal Info', 'Maklumat Peribadi')}</h2>
            <div>
              <label className="label">{label('姓名', 'Full Name', 'Nama Penuh')}</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{label('电话', 'Phone', 'Telefon')}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="input" type="tel" />
            </div>
          </div>

          {/* Store info */}
          <div className="card space-y-4">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">{label('公司资料', 'Company Info', 'Maklumat Syarikat')}</h2>
            <div>
              <label className="label">{label('公司/店名', 'Company / Store Name', 'Nama Syarikat')}</label>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{label('州属', 'State', 'Negeri')}</label>
              <select value={state} onChange={e => setState(e.target.value)} className="input bg-brand-dark">
                <option value="">-- {label('选择州属', 'Select State', 'Pilih Negeri')} --</option>
                {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{label('地址', 'Address', 'Alamat')}</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} className="input resize-none h-20" />
            </div>
          </div>

          {/* Bank info */}
          <div className="card space-y-4">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">{label('收款资料', 'Payment Info', 'Maklumat Pembayaran')}</h2>
            <p className="text-xs text-gray-500">{label('买家银行转账将使用此账号', 'Buyers will transfer to this account', 'Pembeli akan pindahkan ke akaun ini')}</p>
            <div>
              <label className="label">{label('银行名称', 'Bank Name', 'Nama Bank')}</label>
              <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Maybank, CIMB, Public Bank" className="input" />
            </div>
            <div>
              <label className="label">{label('账号', 'Account Number', 'No. Akaun')}</label>
              <input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="e.g. 1234567890" className="input" />
            </div>
            <div>
              <label className="label">{label('账户名称', 'Account Holder', 'Nama Pemegang Akaun')}</label>
              <input value={bankHolder} onChange={e => setBankHolder(e.target.value)} className="input" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Settings size={16} />}
            {saved ? label('已保存！', 'Saved!', 'Disimpan!') : saving ? label('保存中...', 'Saving...', 'Menyimpan...') : label('保存设置', 'Save Settings', 'Simpan Tetapan')}
          </button>
        </div>
      )}
    </div>
  )
}
