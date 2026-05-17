'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Search, RefreshCw, Upload, Download, Send, CheckCircle, Clock, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  purchase_history: string | null
  notes: string | null
  status: 'pending' | 'invited' | 'registered'
  invited_at: string | null
  created_at: string
}

const STATUS_CONFIG = {
  pending:    { label: '待邀请', color: '#F59E0B', bg: '#F59E0B20', icon: Clock },
  invited:    { label: '已邀请', color: '#3B82F6', bg: '#3B82F620', icon: Send },
  registered: { label: '已注册', color: '#10B981', bg: '#10B98120', icon: CheckCircle },
}

export default function AdminLeadsPage() {
  const { language } = useAppStore()
  const label = (zh: string, en: string) => language === 'zh' ? zh : en

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; skip: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('sbm_leads').select('*').order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (sourceFilter !== 'all') q = q.eq('source', sourceFilter)
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`)
    const { data } = await q
    setLeads((data ?? []) as Lead[])
    setLoading(false)
  }, [statusFilter, sourceFilter, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  async function markInvited(id: string) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('sbm_leads').update({
      status: 'invited',
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'invited', invited_at: new Date().toISOString() } : l))
    setUpdating(null)
  }

  // CSV/Text bulk import parser
  // Format: name,phone,email,purchase_history,notes (one per line)
  async function handleImport() {
    if (!importText.trim()) return
    setImporting(true)
    setImportResult(null)
    const supabase = createClient()
    const lines = importText.trim().split('\n').filter(l => l.trim())
    const rows: Omit<Lead, 'id' | 'created_at' | 'invited_at'>[] = []

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (!parts[0]) continue
      rows.push({
        name: parts[0],
        phone: parts[1] || null,
        email: parts[2] || null,
        source: parts[3] || 'tiktok',
        purchase_history: parts[4] || null,
        notes: parts[5] || null,
        status: 'pending',
      })
    }

    if (rows.length === 0) { setImporting(false); return }

    // Use upsert with phone as conflict key to avoid duplicates
    const { data, error } = await supabase.from('sbm_leads').upsert(rows, {
      onConflict: 'phone',
      ignoreDuplicates: true,
    }).select()

    const inserted = data?.length ?? 0
    const skipped = rows.length - inserted
    setImportResult({ success: inserted, skip: skipped })
    setImporting(false)
    setImportText('')
    load()
  }

  function exportCSV() {
    const header = 'Name,Phone,Email,Source,Purchase History,Notes,Status,Created'
    const rows = leads.map(l =>
      [l.name, l.phone ?? '', l.email ?? '', l.source, l.purchase_history ?? '', l.notes ?? '', l.status, l.created_at.slice(0,10)].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sbm-leads-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const stats = {
    total: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    invited: leads.filter(l => l.status === 'invited').length,
    registered: leads.filter(l => l.status === 'registered').length,
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-brand-gold" />
            {label('种子用户管理', 'Seed Leads')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {label('TikTok 付费顾客导入 · 邀请注册 SBM', 'TikTok paid customers · Invite to register SBM')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
            <Download size={14} /> {label('导出', 'Export')}
          </button>
          <button onClick={() => setShowImport(!showImport)}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-3">
            <Upload size={14} /> {label('批量导入', 'Bulk Import')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '总顾客', value: stats.total, color: '#F59E0B' },
          { label: '待邀请', value: stats.pending, color: '#F59E0B' },
          { label: '已邀请', value: stats.invited, color: '#3B82F6' },
          { label: '已注册', value: stats.registered, color: '#10B981' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-4">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="card mb-6 border border-brand-gold/30">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Upload size={16} className="text-brand-gold" />
            {label('批量导入顾客数据', 'Bulk Import Customer Data')}
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            {label(
              '格式：每行一个顾客，用逗号分隔：姓名, 电话, Email, 来源, 购买记录, 备注',
              'Format: One customer per line, comma separated: name, phone, email, source, purchase_history, notes'
            )}
          </p>
          <p className="text-xs text-gray-500 mb-3 font-mono bg-brand-dark rounded-lg p-2">
            张三, 60123456789, zhang@email.com, tiktok, 猫山王2kg×3次, VIP客户{'\n'}
            李四, 60198765432, , tiktok, 黑刺1kg×1次,
          </p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            className="input resize-none h-32 font-mono text-xs"
            placeholder={label('在这里粘贴顾客数据...', 'Paste customer data here...')}
          />
          {importResult && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle size={14} /> {importResult.success} {label('条导入成功', 'imported')}
              </span>
              {importResult.skip > 0 && (
                <span className="text-gray-500">{importResult.skip} {label('条已存在跳过', 'skipped (duplicate)')}</span>
              )}
            </div>
          )}
          <div className="flex gap-3 mt-3">
            <button onClick={handleImport} disabled={importing || !importText.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? label('导入中...', 'Importing...') : label('确认导入', 'Import')}
            </button>
            <button onClick={() => { setShowImport(false); setImportText(''); setImportResult(null) }}
              className="btn-ghost text-sm py-2 px-4">
              {label('取消', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={label('搜索姓名...', 'Search name...')} className="input pl-9 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'invited', 'registered'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${statusFilter === s ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}>
              {s === 'all' ? '全部' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
            </button>
          ))}
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="input bg-brand-dark text-sm w-32">
          <option value="all">{label('所有来源', 'All Sources')}</option>
          <option value="tiktok">TikTok</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="manual">{label('手动', 'Manual')}</option>
        </select>
        <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-white"
          style={{ background: '#1C2333' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{label('加载中...', 'Loading...')}</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">{label('暂无顾客数据', 'No leads yet')}</p>
            <p className="text-gray-600 text-xs mt-1">{label('点击"批量导入"上传 TikTok 顾客数据', 'Click "Bulk Import" to upload TikTok customer data')}</p>
          </div>
        ) : (
          <div>
            {leads.map((l, i) => {
              const cfg = STATUS_CONFIG[l.status]
              const Icon = cfg.icon
              const waLink = l.phone
                ? `https://wa.me/${l.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`你好 ${l.name}！我是 SB Durian Marketplace 的 Captain K，诚邀您加入我们的平台！注册链接：https://sb-durian-marketplace.vercel.app/register`)}`
                : null

              return (
                <div key={l.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-brand-dark-border last:border-0"
                  style={{ opacity: updating === l.id ? 0.6 : 1 }}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: '#F59E0B22', color: '#F59E0B' }}>
                    {l.name?.[0] ?? '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{l.name}</p>
                    <p className="text-xs text-gray-500">
                      {l.phone && <span className="mr-2">{l.phone}</span>}
                      {l.email && <span className="mr-2">{l.email}</span>}
                      <span className="text-gray-600">{l.source}</span>
                    </p>
                    {l.purchase_history && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{l.purchase_history}</p>
                    )}
                  </div>

                  {/* Status */}
                  <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={10} /> {cfg.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {l.status === 'pending' && waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        onClick={() => markInvited(l.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E44' }}>
                        <Send size={11} /> WhatsApp 邀请
                      </a>
                    )}
                    {l.status === 'pending' && !waLink && (
                      <button onClick={() => markInvited(l.id)} disabled={!!updating}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F644' }}>
                        <UserCheck size={11} /> {label('标记已邀请', 'Mark Invited')}
                      </button>
                    )}
                    {l.status === 'invited' && (
                      <span className="text-xs text-gray-600">
                        {l.invited_at ? new Date(l.invited_at).toLocaleDateString('zh-MY') : ''}
                      </span>
                    )}
                    {l.status === 'registered' && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle size={11} /> {label('已入驻', 'Joined')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        {label(`共 ${stats.total} 个潜在顾客 · ${stats.registered} 个已注册 SBM`, `${stats.total} leads total · ${stats.registered} registered`)}
      </p>
    </div>
  )
}
