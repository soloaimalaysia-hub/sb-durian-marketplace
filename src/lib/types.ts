export type UserRole = 'orchard' | 'wholesaler' | 'retailer' | 'consumer' | 'admin'
export type Language = 'zh' | 'en' | 'bm'
export type UserStatus = 'pending' | 'active' | 'suspended'
export type PlatformRole = 'super_admin' | 'platform_admin' | 'user'
export type ProjectScope = 'all' | 'sb_durian' | 'saloon' | 'fnb' | 'livestream'

export interface SbmUser {
  id: string
  auth_id: string | null
  full_name: string
  email: string | null
  phone: string
  whatsapp: string | null
  role: UserRole
  platform_role?: PlatformRole
  project_scope?: ProjectScope
  language: Language
  status: UserStatus
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface SbmStore {
  id: string
  user_id: string
  store_name: string
  store_name_zh: string | null
  store_name_bm: string | null
  description: string | null
  description_zh: string | null
  description_bm: string | null
  state: string | null
  city: string | null
  address: string | null
  logo_url: string | null
  banner_url: string | null
  rating: number
  total_reviews: number
  total_transactions: number
  is_verified: boolean
  stripe_account_id: string | null
  created_at: string
  updated_at: string
}

export interface SbmProduct {
  id: string
  store_id: string
  seller_role: 'orchard' | 'wholesaler' | 'retailer'
  variety: string
  grade: string | null
  name_zh: string | null
  name_en: string | null
  name_bm: string | null
  description_zh: string | null
  description_en: string | null
  description_bm: string | null
  price_per_kg: number
  currency: string
  min_order_kg: number | null
  bulk_price_tiers: BulkPriceTier[] | null
  credit_terms_days: number
  stock_kg: number
  stock_unit: string
  low_stock_alert_kg: number
  status: 'active' | 'sold_out' | 'inactive'
  is_featured: boolean
  images: string[]
  origin_state: string | null
  accepts_b2b: boolean
  accepts_b2c: boolean
  durianex_reference_price: number | null
  total_sold_kg: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface BulkPriceTier {
  min_kg: number
  price: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type DeliveryStatus = 'pending' | 'arranging' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'

export interface SbmOrder {
  id: string
  order_number: string
  buyer_id: string
  seller_id: string
  buyer_store_id: string | null
  seller_store_id: string | null
  order_type: 'b2b' | 'b2c'
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total_amount: number
  currency: string
  payment_method: string | null
  payment_status: PaymentStatus
  stripe_payment_intent_id: string | null
  paid_at: string | null
  credit_term_days: number
  due_date: string | null
  delivery_method: string
  delivery_status: DeliveryStatus
  delivery_address: string | null
  delivery_tracking_id: string | null
  lalamove_order_id: string | null
  status: OrderStatus
  buyer_notes: string | null
  seller_notes: string | null
  created_at: string
  updated_at: string
}

export interface SbmPlatformSettings {
  id: string
  project: string
  primary_color: string
  secondary_color: string
  logo_url: string | null
  favicon_url: string | null
  banner_url: string | null
  site_name: string
  hero_slogan_zh: string
  hero_slogan_en: string
  hero_slogan_bm: string
  announcement_zh: string | null
  announcement_en: string | null
  announcement_bm: string | null
  show_announcement: boolean
  marketplace_enabled: boolean
  registration_enabled: boolean
  maintenance_mode: boolean
  created_at: string
  updated_at: string
}
