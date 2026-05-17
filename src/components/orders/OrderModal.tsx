'use client'

import { useState } from 'react'
import { X, ShoppingCart, Loader, AlertTriangle, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { DURIAN_VARIETIES, PLATFORM_FEE_RATE } from '@/lib/constants'
import { generateOrderNumber } from '@/lib/orders'
import type { SbmProduct, SbmStore, SbmUser } from '@/lib/types'

type ProductWithStore = SbmProduct & { sbm_stores: SbmStore }

interface OrderModalProps {
  product: ProductWithStore
  buyer: SbmUser
  onClose: () => void
  onSuccess: (orderNumber: string) => void
}

export default function OrderModal({ product, buyer, onClose, onSuccess }: OrderModalProps) {
  const { language } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const minQty = product.min_order_kg ?? 10
  const [qty, setQty] = useState(minQty.toString())
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank_transfer' | 'credit_term'>('bank_transfer')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [orderNum, setOrderNum] = useState('')

  const variety = DURIAN_VARIETIES.find(v => v.code === product.variety)
  const varietyName = variety ? (language === 'zh' ? variety.zh : language === 'en' ? variety.en : variety.bm) : product.variety
  const qtyNum = parseFloat(qty) || 0
  const subtotal = qtyNum * (product.price_per_kg || 0)
  const platformFee = subtotal * PLATFORM_FEE_RATE
  const deliveryFee = 0 // manual for now
  const total = subtotal + deliveryFee
  const minOk = qtyNum >= minQty
  const stockOk = qtyNum <= product.stock_kg

  async function handleSubmit() {
    setError('')
    if (!qty || qtyNum <= 0) { setError(label('请输入数量', 'Enter quantity', 'Masukkan kuantiti')); return }
    if (!minOk) { setError(label(`起订量 ${product.min_order_kg}kg`, `Min order ${product.min_order_kg}kg`, `Min pesanan ${product.min_order_kg}kg`)); return }
    if (!stockOk) { setError(label(`库存不足，最多 ${product.stock_kg}kg`, `Max stock ${product.stock_kg}kg`, `Stok maks ${product.stock_kg}kg`)); return }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setError(label('请填写配送地址', 'Enter delivery address', 'Masukkan alamat penghantaran'))
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const orderNumber = await generateOrderNumber()

      // Get buyer's store id if any
      const { data: buyerStore } = await supabase.from('sbm_stores').select('id').eq('user_id', buyer.id).single()
      // Get seller's store id
      const sellerStoreId = product.store_id
      // Get seller user id via store
      const { data: sellerStore } = await supabase.from('sbm_stores').select('user_id').eq('id', sellerStoreId).single()
      const sellerId = sellerStore?.user_id

      const dueDate = paymentMethod === 'credit_term' && product.credit_terms_days > 0
        ? new Date(Date.now() + product.credit_terms_days * 86400000).toISOString().slice(0, 10)
        : null

      const { data: order, error: orderErr } = await supabase.from('sbm_orders').insert({
        order_number: orderNumber,
        buyer_id: buyer.id,
        seller_id: sellerId,
        buyer_store_id: buyerStore?.id ?? null,
        seller_store_id: sellerStoreId,
        order_type: 'b2b',
        subtotal,
        platform_fee: platformFee,
        delivery_fee: deliveryFee,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: 'pending',
        credit_term_days: paymentMethod === 'credit_term' ? product.credit_terms_days : 0,
        due_date: dueDate,
        delivery_method: deliveryMethod,
        delivery_status: 'pending',
        delivery_address: deliveryAddress || null,
        status: 'pending',
        buyer_notes: notes || null,
      }).select().single()

      if (orderErr) throw orderErr

      // Insert order item
      await supabase.from('sbm_order_items').insert({
        order_id: order.id,
        product_id: product.id,
        variety: product.variety,
        grade: product.grade,
        quantity_kg: qtyNum,
        price_per_kg: product.price_per_kg,
        subtotal,
      })

      // Update product stock
      await supabase.from('sbm_products').update({
        stock_kg: product.stock_kg - qtyNum,
        updated_at: new Date().toISOString(),
      }).eq('id', product.id)

      // Insert credit record if credit term
      if (paymentMethod === 'credit_term' && dueDate && sellerId) {
        await supabase.from('sbm_credit_records').insert({
          order_id: order.id,
          creditor_id: sellerId,
          debtor_id: buyer.id,
          amount: total,
          due_date: dueDate,
          status: 'outstanding',
        })
      }

      setOrderNum(orderNumber)
      setDone(true)
      onSuccess(orderNumber)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : label('下单失败', 'Order failed', 'Pesanan gagal'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-brand-dark-card border border-brand-dark-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-dark-border">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-brand-gold" />
            <h2 className="font-bold text-white">{label('确认下单', 'Place Order', 'Buat Pesanan')}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{label('下单成功！', 'Order Placed!', 'Pesanan Berjaya!')}</h3>
            <p className="text-gray-400 text-sm">{label('订单号', 'Order No.', 'No. Pesanan')}: <span className="text-brand-gold font-mono font-bold">{orderNum}</span></p>
            <p className="text-gray-500 text-sm">{label('卖家将在 24 小时内确认', 'Seller will confirm within 24 hours', 'Penjual akan mengesahkan dalam 24 jam')}</p>
            <button onClick={onClose} className="btn-primary w-full">{label('完成', 'Done', 'Selesai')}</button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-brand-dark-card flex items-center justify-center text-xl flex-shrink-0">
                {(product.images as string[])?.[0]
                  ? <img src={(product.images as string[])[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                  : '🍈'}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{varietyName} {product.grade && `(${product.grade})`}</p>
                <p className="text-brand-gold text-sm">RM {product.price_per_kg.toFixed(2)}/kg</p>
                <p className="text-gray-500 text-xs">{product.sbm_stores?.store_name}</p>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="label">{label('数量 (kg)', 'Quantity (kg)', 'Kuantiti (kg)')} *</label>
              <input
                type="number"
                min={minQty}
                max={product.stock_kg}
                step="1"
                value={qty}
                onChange={e => setQty(e.target.value || minQty.toString())}
                className="input text-lg font-bold"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                {product.min_order_kg && <span>{label('起订量', 'Min order', 'Min')}: {product.min_order_kg}kg</span>}
                <span>{label('库存', 'Stock', 'Stok')}: {product.stock_kg}kg</span>
              </div>
            </div>

            {/* Delivery method */}
            <div>
              <label className="label">{label('交货方式', 'Delivery Method', 'Kaedah Penghantaran')}</label>
              <div className="grid grid-cols-2 gap-3">
                {(['pickup', 'delivery'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setDeliveryMethod(m)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-colors ${deliveryMethod === m ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}
                  >
                    {m === 'pickup' ? label('🏠 自取', '🏠 Self Pick-up', '🏠 Ambil Sendiri') : label('🚚 送货上门', '🚚 Delivery', '🚚 Penghantaran')}
                  </button>
                ))}
              </div>
              {deliveryMethod === 'delivery' && (
                <div className="mt-3 p-3 rounded-xl border-2 border-brand-gold/50 bg-brand-gold/5">
                  <label className="text-xs font-bold text-brand-gold mb-2 flex items-center gap-1">
                    📍 {label('配送地址（必填）', 'Delivery Address (Required)', 'Alamat Penghantaran (Wajib)')}
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder={label('例：No. 123, Jalan ABC, Taman XYZ, 50000 Kuala Lumpur', 'E.g. No. 123, Jalan ABC, Taman XYZ, 50000 KL', 'Cth: No. 123, Jalan ABC, Taman XYZ, 50000 KL')}
                    className="input resize-none h-24 text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Payment method */}
            <div>
              <label className="label">{label('付款方式', 'Payment Method', 'Kaedah Pembayaran')}</label>
              <div className="space-y-2">
                {/* Bank transfer */}
                {(['bank_transfer', ...(product.credit_terms_days > 0 ? ['credit_term'] : [])] as const).map(id => {
                  const labels = {
                    bank_transfer: { zh: '银行转账', en: 'Bank Transfer', bm: 'Pindahan Bank' },
                    credit_term:   { zh: `账期 ${product.credit_terms_days} 天`, en: `${product.credit_terms_days}-Day Credit`, bm: `Kredit ${product.credit_terms_days} Hari` },
                  }
                  const l = labels[id as keyof typeof labels]
                  return (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id as 'bank_transfer' | 'credit_term')}
                      className={`w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors ${paymentMethod === id ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-brand-dark-border text-gray-400'}`}
                    >
                      {language === 'zh' ? l.zh : language === 'en' ? l.en : l.bm}
                    </button>
                  )
                })}
                {/* Stripe - coming soon */}
                <div className="w-full py-3 px-4 rounded-xl border border-brand-dark-border text-sm text-left flex items-center justify-between opacity-50 cursor-not-allowed">
                  <span className="text-gray-500">Stripe {label('在线付款', 'Online Payment', 'Bayaran Dalam Talian')}</span>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{label('即将推出', 'Coming Soon', 'Akan Datang')}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">{label('备注（选填）', 'Notes (Optional)', 'Nota (Pilihan)')}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={label('特别要求、交货时间等', 'Special requests, delivery time, etc.', 'Permintaan khas, masa penghantaran, dll.')}
                className="input resize-none h-20"
              />
            </div>

            {/* Order summary */}
            <div className="card space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>{qtyNum}kg × RM {product.price_per_kg.toFixed(2)}</span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>{label('配送费', 'Delivery', 'Penghantaran')}</span>
                  <span>RM {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white border-t border-brand-dark-border pt-2">
                <span>{label('总计', 'Total', 'Jumlah')}</span>
                <span className="text-brand-gold text-lg">RM {total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || qtyNum <= 0}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader size={18} className="animate-spin" />}
              {label('确认下单', 'Place Order', 'Sahkan Pesanan')} — RM {total.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
