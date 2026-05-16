'use client'

import { useEffect, useState, useRef } from 'react'
import { Save, Upload, Loader, Check, Image as ImageIcon, Type, Megaphone, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import type { SbmPlatformSettings } from '@/lib/types'

export default function AdminAppearancePage() {
  const { language } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [settings, setSettings] = useState<Partial<SbmPlatformSettings>>({
    primary_color: '#F59E0B',
    secondary_color: '#1B4332',
    site_name: 'SB Durian Marketplace',
    hero_slogan_zh: '智能榴莲交易平台',
    hero_slogan_en: "Malaysia's Smart Durian Market",
    hero_slogan_bm: 'Platform Durian Pintar Malaysia',
    announcement_zh: null,
    announcement_en: null,
    announcement_bm: null,
    show_announcement: false,
    marketplace_enabled: true,
    registration_enabled: true,
    maintenance_mode: false,
  })
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sbm_platform_settings')
        .select('*')
        .eq('project', 'sb_durian')
        .single()
      if (data) {
        setSettings(data)
        setSettingsId(data.id)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const payload = { ...settings, project: 'sb_durian', updated_at: new Date().toISOString() }

    if (settingsId) {
      await supabase.from('sbm_platform_settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('sbm_platform_settings').insert(payload).select().single()
      if (data) setSettingsId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function uploadImage(file: File, field: 'logo_url' | 'banner_url') {
    const setter = field === 'logo_url' ? setLogoUploading : setBannerUploading
    setter(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `platform/${field.replace('_url', '')}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('sbm-products').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('sbm-products').getPublicUrl(path)
      setSettings(prev => ({ ...prev, [field]: urlData.publicUrl }))
    }
    setter(false)
  }

  const Section = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-brand-gold" />
      <h2 className="font-bold text-white">{title}</h2>
    </div>
  )

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse" />)}
    </div>
  )

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{label('外观设置', 'Appearance', 'Penampilan')}</h1>
          <p className="text-gray-400 text-sm mt-1">{label('自定义平台外观与内容', 'Customize platform appearance & content', 'Sesuaikan penampilan & kandungan platform')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? label('已保存！', 'Saved!', 'Disimpan!') : label('保存设置', 'Save Settings', 'Simpan Tetapan')}
        </button>
      </div>

      <div className="space-y-6">

        {/* Brand Colors */}
        <div className="card">
          <Section icon={Globe} title={label('品牌颜色', 'Brand Colors', 'Warna Jenama')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{label('主色（金色）', 'Primary Color', 'Warna Utama')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color ?? '#F59E0B'}
                  onChange={e => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-brand-dark-border bg-transparent"
                />
                <input
                  type="text"
                  value={settings.primary_color ?? '#F59E0B'}
                  onChange={e => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="input flex-1 font-mono text-sm"
                  placeholder="#F59E0B"
                />
              </div>
            </div>
            <div>
              <label className="label">{label('副色（绿色）', 'Secondary Color', 'Warna Sekunder')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.secondary_color ?? '#1B4332'}
                  onChange={e => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-brand-dark-border bg-transparent"
                />
                <input
                  type="text"
                  value={settings.secondary_color ?? '#1B4332'}
                  onChange={e => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="input flex-1 font-mono text-sm"
                  placeholder="#1B4332"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo & Banner */}
        <div className="card">
          <Section icon={ImageIcon} title={label('图片资源', 'Images & Assets', 'Imej & Aset')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Logo */}
            <div>
              <label className="label">{label('平台 Logo', 'Platform Logo', 'Logo Platform')}</label>
              {settings.logo_url && (
                <div className="mb-3 p-3 bg-brand-dark rounded-xl flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
                </div>
              )}
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo_url')} />
              <button
                onClick={() => logoRef.current?.click()}
                disabled={logoUploading}
                className="btn-ghost w-full flex items-center justify-center gap-2"
              >
                {logoUploading ? <Loader size={15} className="animate-spin" /> : <Upload size={15} />}
                {logoUploading ? label('上传中...', 'Uploading...', 'Memuat naik...') : label('上传 Logo', 'Upload Logo', 'Muat Naik Logo')}
              </button>
              {settings.logo_url && (
                <button onClick={() => setSettings(prev => ({ ...prev, logo_url: null }))}
                  className="text-xs text-gray-500 hover:text-red-400 mt-2 w-full text-center transition-colors">
                  {label('移除', 'Remove', 'Buang')}
                </button>
              )}
            </div>

            {/* Banner */}
            <div>
              <label className="label">{label('首页横幅', 'Hero Banner', 'Banner Utama')}</label>
              {settings.banner_url && (
                <div className="mb-3 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.banner_url} alt="Banner" className="w-full h-16 object-cover" />
                </div>
              )}
              <input ref={bannerRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner_url')} />
              <button
                onClick={() => bannerRef.current?.click()}
                disabled={bannerUploading}
                className="btn-ghost w-full flex items-center justify-center gap-2"
              >
                {bannerUploading ? <Loader size={15} className="animate-spin" /> : <Upload size={15} />}
                {bannerUploading ? label('上传中...', 'Uploading...', 'Memuat naik...') : label('上传横幅', 'Upload Banner', 'Muat Naik Banner')}
              </button>
              {settings.banner_url && (
                <button onClick={() => setSettings(prev => ({ ...prev, banner_url: null }))}
                  className="text-xs text-gray-500 hover:text-red-400 mt-2 w-full text-center transition-colors">
                  {label('移除', 'Remove', 'Buang')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Site Name & Hero Slogan */}
        <div className="card">
          <Section icon={Type} title={label('文字内容', 'Text Content', 'Kandungan Teks')} />
          <div className="space-y-4">
            <div>
              <label className="label">{label('平台名称', 'Site Name', 'Nama Tapak')}</label>
              <input
                type="text"
                value={settings.site_name ?? ''}
                onChange={e => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                className="input"
                placeholder="SB Durian Marketplace"
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="label">
                  <span className="text-red-400 text-xs mr-1">[中]</span>
                  {label('首页标语（中文）', 'Hero Slogan (Chinese)', 'Slogan Utama (Cina)')}
                </label>
                <input
                  type="text"
                  value={settings.hero_slogan_zh ?? ''}
                  onChange={e => setSettings(prev => ({ ...prev, hero_slogan_zh: e.target.value }))}
                  className="input"
                  placeholder="智能榴莲交易平台"
                />
              </div>
              <div>
                <label className="label">
                  <span className="text-blue-400 text-xs mr-1">[EN]</span>
                  {label('首页标语（英文）', 'Hero Slogan (English)', 'Slogan Utama (Inggeris)')}
                </label>
                <input
                  type="text"
                  value={settings.hero_slogan_en ?? ''}
                  onChange={e => setSettings(prev => ({ ...prev, hero_slogan_en: e.target.value }))}
                  className="input"
                  placeholder="Malaysia's Smart Durian Market"
                />
              </div>
              <div>
                <label className="label">
                  <span className="text-green-400 text-xs mr-1">[BM]</span>
                  {label('首页标语（马来文）', 'Hero Slogan (Malay)', 'Slogan Utama (Melayu)')}
                </label>
                <input
                  type="text"
                  value={settings.hero_slogan_bm ?? ''}
                  onChange={e => setSettings(prev => ({ ...prev, hero_slogan_bm: e.target.value }))}
                  className="input"
                  placeholder="Platform Durian Pintar Malaysia"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-brand-gold" />
              <h2 className="font-bold text-white">{label('公告栏', 'Announcement', 'Pengumuman')}</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-400">{label('显示公告', 'Show Announcement', 'Tunjuk Pengumuman')}</span>
              <div
                onClick={() => setSettings(prev => ({ ...prev, show_announcement: !prev.show_announcement }))}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${settings.show_announcement ? 'bg-brand-gold' : 'bg-brand-dark'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.show_announcement ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label"><span className="text-red-400 text-xs mr-1">[中]</span></label>
              <textarea
                value={settings.announcement_zh ?? ''}
                onChange={e => setSettings(prev => ({ ...prev, announcement_zh: e.target.value || null }))}
                className="input resize-none h-16"
                placeholder={label('中文公告内容...', 'Chinese announcement...', 'Pengumuman Cina...')}
              />
            </div>
            <div>
              <label className="label"><span className="text-blue-400 text-xs mr-1">[EN]</span></label>
              <textarea
                value={settings.announcement_en ?? ''}
                onChange={e => setSettings(prev => ({ ...prev, announcement_en: e.target.value || null }))}
                className="input resize-none h-16"
                placeholder="English announcement..."
              />
            </div>
            <div>
              <label className="label"><span className="text-green-400 text-xs mr-1">[BM]</span></label>
              <textarea
                value={settings.announcement_bm ?? ''}
                onChange={e => setSettings(prev => ({ ...prev, announcement_bm: e.target.value || null }))}
                className="input resize-none h-16"
                placeholder="Pengumuman Bahasa Malaysia..."
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="card">
          <Section icon={Globe} title={label('功能开关', 'Feature Flags', 'Suis Ciri')} />
          <div className="space-y-3">
            {([
              { key: 'marketplace_enabled', zh: '开放市场', en: 'Marketplace Open', bm: 'Pasaran Dibuka' },
              { key: 'registration_enabled', zh: '开放注册', en: 'Registration Open', bm: 'Pendaftaran Dibuka' },
              { key: 'maintenance_mode', zh: '维护模式', en: 'Maintenance Mode', bm: 'Mod Penyelenggaraan' },
            ] as const).map(f => (
              <div key={f.key} className="flex items-center justify-between py-2 border-b border-brand-dark-border last:border-0">
                <div>
                  <p className="text-sm text-white">{label(f.zh, f.en, f.bm)}</p>
                  {f.key === 'maintenance_mode' && (
                    <p className="text-xs text-gray-500 mt-0.5">{label('开启后用户将看到维护页面', 'Users will see a maintenance page', 'Pengguna akan melihat halaman penyelenggaraan')}</p>
                  )}
                </div>
                <div
                  onClick={() => setSettings(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${settings[f.key] ? (f.key === 'maintenance_mode' ? 'bg-red-500' : 'bg-brand-gold') : 'bg-brand-dark border border-brand-dark-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings[f.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button (bottom) */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? <Loader size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? label('已保存！', 'Saved!', 'Disimpan!') : label('保存所有设置', 'Save All Settings', 'Simpan Semua Tetapan')}
        </button>
      </div>
    </div>
  )
}
