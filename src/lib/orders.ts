import { createClient } from '@/lib/supabase/client'

export async function generateOrderNumber(): Promise<string> {
  const supabase = createClient()
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  // Count today's orders to generate sequence
  const { count } = await supabase
    .from('sbm_orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString().slice(0, 10))

  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `SBM-${dateStr}-${seq}`
}

export const ORDER_STATUS_FLOW = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
  'completed',
] as const

export type OrderStatus = typeof ORDER_STATUS_FLOW[number] | 'cancelled'

export function getNextStatus(current: string): string | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current as typeof ORDER_STATUS_FLOW[number])
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return null
  return ORDER_STATUS_FLOW[idx + 1]
}

export function getStatusLabel(status: string, lang: 'zh' | 'en' | 'bm') {
  const labels: Record<string, Record<string, string>> = {
    pending:    { zh: '等待确认', en: 'Pending',    bm: 'Menunggu' },
    confirmed:  { zh: '已确认',   en: 'Confirmed',  bm: 'Disahkan' },
    preparing:  { zh: '备货中',   en: 'Preparing',  bm: 'Menyedia' },
    ready:      { zh: '准备好了', en: 'Ready',      bm: 'Sedia' },
    delivering: { zh: '配送中',   en: 'Delivering', bm: 'Penghantaran' },
    completed:  { zh: '已完成',   en: 'Completed',  bm: 'Selesai' },
    cancelled:  { zh: '已取消',   en: 'Cancelled',  bm: 'Dibatal' },
  }
  return labels[status]?.[lang] ?? status
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    confirmed:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
    preparing:  'text-purple-400 bg-purple-400/10 border-purple-400/30',
    ready:      'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    delivering: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    completed:  'text-green-400 bg-green-400/10 border-green-400/30',
    cancelled:  'text-gray-400 bg-gray-400/10 border-gray-400/30',
  }
  return colors[status] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/30'
}
