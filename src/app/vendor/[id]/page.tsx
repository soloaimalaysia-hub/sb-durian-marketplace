'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Calendar, Star, MessageCircle, ArrowLeft, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Vendor {
  id: string
  shop_name: string
  location: string
  rating: number
  cover_image_url: string | null
  logo_url: string | null
  tags: string[]
  open_hours: string
  open_days: string
  is_open: boolean
  whatsapp: string | null
  description: string | null
  rank: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          fill={i <= Math.round(rating) ? '#C7A617' : 'none'}
          stroke={i <= Math.round(rating) ? '#C7A617' : 'rgba(199,166,23,0.4)'}
        />
      ))}
      <span className="text-sm font-bold ml-1" style={{ color: '#C7A617' }}>{rating.toFixed(1)}</span>
    </div>
  )
}

export default function VendorPage() {
  const { id } = useParams<{ id: string }>()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sbm_featured_vendors')
        .select('*')
        .eq('id', id)
        .single()
      setVendor(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🍈</div>
        <p style={{ color: 'rgba(246,241,231,0.5)' }}>Loading...</p>
      </div>
    </div>
  )

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl mb-4" style={{ color: '#C7A617' }}>店铺未找到</p>
        <Link href="/" className="btn-ghost text-sm">← 返回首页</Link>
      </div>
    </div>
  )

  const initials = vendor.shop_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const waLink = vendor.whatsapp
    ? `https://wa.me/${vendor.whatsapp.replace(/\D/g, '')}`
    : `https://wa.me/601234567890`

  return (
    <div className="min-h-screen pb-16">
      {/* Cover Image */}
      <div className="relative h-52 sm:h-72 w-full overflow-hidden">
        {vendor.cover_image_url ? (
          <img src={vendor.cover_image_url} alt={vendor.shop_name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a2d20 0%, #3a5a28 100%)' }}>
            <span className="text-8xl opacity-20">🍈</span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,45,34,0.9) 0%, transparent 60%)' }} />
        <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(26,45,34,0.8)', color: '#F6F1E7', border: '1px solid rgba(199,166,23,0.3)' }}>
          <ArrowLeft size={14} /> Back
        </Link>
        {vendor.is_open && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(94,127,31,0.9)', color: '#F6F1E7' }}>
            OPEN
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative">
        {/* Logo + Info Card */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(20,38,28,0.95)', border: '1px solid rgba(199,166,23,0.3)' }}>
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt="logo"
                  className="w-16 h-16 rounded-xl object-cover" style={{ border: '2px solid rgba(199,166,23,0.5)' }} />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black"
                  style={{ background: 'linear-gradient(135deg, #5E7F1F, #3a5a1a)', color: '#C7A617', border: '2px solid rgba(199,166,23,0.4)' }}>
                  {initials}
                </div>
              )}
            </div>
            {/* Name + Rating */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black leading-tight mb-1" style={{ color: '#C7A617' }}>
                {vendor.shop_name}
              </h1>
              <StarRating rating={vendor.rating} />
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin size={13} style={{ color: 'rgba(246,241,231,0.5)' }} />
                <span className="text-xs" style={{ color: 'rgba(246,241,231,0.6)' }}>{vendor.location}</span>
              </div>
            </div>
          </div>

          {/* Hours + Days */}
          <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(199,166,23,0.15)' }}>
            <div className="flex items-center gap-1.5">
              <Clock size={13} style={{ color: '#C7A617' }} />
              <span className="text-xs" style={{ color: 'rgba(246,241,231,0.7)' }}>{vendor.open_hours}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} style={{ color: '#C7A617' }} />
              <span className="text-xs" style={{ color: 'rgba(246,241,231,0.7)' }}>{vendor.open_days}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {(vendor.tags || []).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(199,166,23,0.12)', color: '#C7A617', border: '1px solid rgba(199,166,23,0.25)' }}>
                <Crown size={10} /> {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          {vendor.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(246,241,231,0.65)' }}>
              {vendor.description}
            </p>
          )}
        </div>

        {/* Products placeholder */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(20,38,28,0.95)', border: '1px solid rgba(199,166,23,0.2)' }}>
          <h2 className="text-base font-bold mb-3" style={{ color: '#C7A617' }}>🍈 Products</h2>
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'rgba(246,241,231,0.4)' }}>Products coming soon...</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(246,241,231,0.25)' }}>Owner is updating the store</p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all"
          style={{ background: '#25D366', color: '#fff' }}>
          <MessageCircle size={18} />
          Contact via WhatsApp
        </a>
      </div>
    </div>
  )
}
