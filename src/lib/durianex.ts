import { createClient } from '@/lib/supabase/client'

// Mapping from sbm variety codes to durian_prices Chinese names
const VARIETY_TO_DURIANEX: Record<string, string> = {
  musang_king: '猫山王',
  black_thorn: '黑刺',
  kop: 'KP',
  d24: 'D24',
  red_prawn: '红虾',
  golden_phoenix: '金凤',
  ioi: 'IOI',
}

export interface DurianexPrice {
  variety: string
  grade: string | null
  price_rm: number
  recorded_at: string
}

export async function getDurianexPrices(): Promise<DurianexPrice[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('durian_prices')
    .select('variety, grade, price_rm, recorded_at')
    .order('recorded_at', { ascending: false })
  return (data ?? []) as DurianexPrice[]
}

// Get latest average price for a variety code (e.g. 'musang_king')
export async function getDurianexRefPrice(varietyCode: string): Promise<number | null> {
  const chineseName = VARIETY_TO_DURIANEX[varietyCode]
  if (!chineseName) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('durian_prices')
    .select('price_rm, recorded_at')
    .eq('variety', chineseName)
    .order('recorded_at', { ascending: false })
    .limit(5)

  if (!data || data.length === 0) return null
  const avg = data.reduce((sum, r) => sum + Number(r.price_rm), 0) / data.length
  return Math.round(avg * 100) / 100
}

// Get all latest prices as a map: varietyCode → avgPrice
export async function getDurianexPriceMap(): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data } = await supabase
    .from('durian_prices')
    .select('variety, price_rm, recorded_at')
    .order('recorded_at', { ascending: false })

  if (!data) return {}

  const map: Record<string, number[]> = {}
  for (const row of data) {
    if (!map[row.variety]) map[row.variety] = []
    if (map[row.variety].length < 3) map[row.variety].push(Number(row.price_rm))
  }

  const result: Record<string, number> = {}
  for (const [varCode, chineseName] of Object.entries(VARIETY_TO_DURIANEX)) {
    const prices = map[chineseName]
    if (prices && prices.length > 0) {
      result[varCode] = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
    }
  }
  return result
}

// Calculate price comparison label
export function getPriceComparison(yourPrice: number, refPrice: number | null) {
  if (!refPrice) return null
  const diff = ((yourPrice - refPrice) / refPrice) * 100
  if (Math.abs(diff) < 3) return { type: 'neutral', pct: 0 }
  return { type: diff > 0 ? 'above' : 'below', pct: Math.abs(Math.round(diff)) }
}
