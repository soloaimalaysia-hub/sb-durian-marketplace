'use client'

import { useEffect, useState, useCallback } from 'react'
import { CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

interface CreditRecord {
  id: string
  amount: number
  due_date: string
  status: 'outstanding' | 'paid' | 'overdue'
  created_at: string
  order_id: string
  creditor_id: string
  debtor_id: string
  creditor?: { full_name: string }
  debtor?: { full_name: string }
}

export default function WholesalerCreditPage() {
  const { language, user } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [receivables, setReceivables] = useState<CreditRecord[]>([])  // 应收 - we are creditor
  const [payables, setPayables] = useState<CreditRecord[]>([])        // 应付 - we are debtor
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const [{ data: rec }, { data: pay }] = await Promise.all([
      supabase.from('sbm_credit_records')
        .select('*, creditor:creditor_id(full_name), debtor:debtor_id(full_name)')
        .eq('creditor_id', user.id)
        .order('due_date'),
      supabase.from('sbm_credit_records')
        .select('*, creditor:creditor_id(full_name), debtor:debtor_id(full_name)')
        .eq('debtor_id', user.id)
        .order('due_date'),
    ])
    setReceivables((rec ?? []) as CreditRecord[])
    setPayables((pay ?? []) as CreditRecord[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const today = new Date().toISOString().slice(0, 10)

  const totalReceivable = receivables.filter(r => r.status === 'outstanding').reduce((s, r) => s + r.amount, 0)
  const totalPayable = payables.filter(r => r.status === 'outstanding').reduce((s, r) => s + r.amount, 0)
  const overdue = [...receivables, ...payables].filter(r => r.status === 'outstanding' && r.due_date < today)

  const statusIcon = (r: CreditRecord) => {
    if (r.status === 'paid') return <CheckCircle size={14} className="text-green-400" />
    if (r.due_date < today) return <AlertTriangle size={14} className="text-red-400" />
    return <Clock size={14} className="text-yellow-400" />
  }

  const statusColor = (r: CreditRecord) => {
    if (r.status === 'paid') return 'text-green-400'
    if (r.due_date < today) return 'text-red-400'
    return 'text-yellow-400'
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={22} className="text-brand-gold" />
          {label('账期管理', 'Credit Management', 'Pengurusan Kredit')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {label('应收账款 & 应付账款', 'Receivables & Payables', 'Penghutang & Pemiutang')}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-4">
          <div className="text-xl font-black text-green-400">RM {totalReceivable.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{label('待收款', 'Receivable', 'Perlu Terima')}</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-xl font-black text-red-400">RM {totalPayable.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{label('待付款', 'Payable', 'Perlu Bayar')}</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-xl font-black text-orange-400">{overdue.length}</div>
          <div className="text-xs text-gray-500 mt-1">{label('已逾期', 'Overdue', 'Tertunggak')}</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Receivables */}
          <div>
            <h2 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wider">
              {label('应收账款（别人欠我）', 'Receivables (Owed to me)', 'Penghutang')} ({receivables.length})
            </h2>
            {receivables.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 text-sm">{label('没有应收账款', 'No receivables', 'Tiada penghutang')}</div>
            ) : (
              <div className="space-y-2">
                {receivables.map(r => (
                  <div key={r.id} className="card flex items-center gap-3 py-3">
                    {statusIcon(r)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{(r.debtor as { full_name: string } | undefined)?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{label('到期', 'Due', 'Tarikh')}: {r.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${statusColor(r)}`}>RM {r.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">{r.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payables */}
          <div>
            <h2 className="text-sm font-bold text-red-400 mb-3 uppercase tracking-wider">
              {label('应付账款（我欠别人）', 'Payables (I owe)', 'Pemiutang')} ({payables.length})
            </h2>
            {payables.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 text-sm">{label('没有应付账款', 'No payables', 'Tiada pemiutang')}</div>
            ) : (
              <div className="space-y-2">
                {payables.map(r => (
                  <div key={r.id} className="card flex items-center gap-3 py-3">
                    {statusIcon(r)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{(r.creditor as { full_name: string } | undefined)?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{label('到期', 'Due', 'Tarikh')}: {r.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${statusColor(r)}`}>RM {r.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">{r.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
