'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload, ImageIcon, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from 'lucide-react'

interface Card {
  id: string
  section: string
  title: string
  subtitle: string | null
  action_label: string | null
  emoji: string | null
  image_url: string | null
  href: string
  bg_gradient: string | null
  is_active: boolean
  sort_order: number
}

function ImageUpload({ cardId, currentUrl, onUploaded }: {
  cardId: string
  currentUrl: string | null
  onUploaded: (url: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `homepage/${cardId}.jpg`
      await supabase.storage.from('sbm-assets').upload(path, file, { upsert: true, contentType: file.type })
      const { data } = supabase.storage.from('sbm-assets').getPublicUrl(path)
      onUploaded(data.publicUrl + '?t=' + Date.now())
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <img src={currentUrl} alt="preview" className="w-20 h-14 rounded-xl object-cover flex-shrink-0"
          style={{ border: '1.5px solid rgba(199,166,23,0.4)' }} />
      ) : (
        <div className="w-20 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(94,127,31,0.1)', border: '1.5px dashed rgba(199,166,23,0.3)' }}>
          <ImageIcon size={16} style={{ color: 'rgba(199,166,23,0.35)' }} />
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50"
        style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a', border: '1px solid rgba(94,127,31,0.4)' }}>
        <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload Photo'}
      </button>
    </div>
  )
}

function CardEditor({ card, onUpdate, onSave, onMove, saving, saved, isFirst, isLast }: {
  card: Card
  onUpdate: (field: keyof Card, value: unknown) => void
  onSave: () => void
  onMove: (dir: 'up' | 'down') => void
  saving: boolean
  saved: boolean
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(20,38,28,0.95)', border: '1px solid rgba(199,166,23,0.22)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{card.emoji ?? '🍈'}</span>
          <span className="font-bold text-sm" style={{ color: '#F6F1E7' }}>{card.title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(94,127,31,0.2)', color: '#8bc34a' }}>
            {card.section}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove('up')} disabled={isFirst}
            className="p-1.5 rounded-lg disabled:opacity-30"
            style={{ background: 'rgba(94,127,31,0.15)', color: '#8bc34a' }}>
            <ArrowUp size={13} />
          </button>
          <button onClick={() => onMove('down')} disabled={isLast}
            className="p-1.5 rounded-lg disabled:opacity-30"
            style={{ background: 'rgba(94,127,31,0.15)', color: '#8bc34a' }}>
            <ArrowDown size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <label className="label text-xs">Title</label>
          <input className="input text-sm" value={card.title}
            onChange={e => onUpdate('title', e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Emoji</label>
          <input className="input text-sm" value={card.emoji ?? ''}
            onChange={e => onUpdate('emoji', e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Subtitle / Description</label>
          <input className="input text-sm" value={card.subtitle ?? ''}
            onChange={e => onUpdate('subtitle', e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Action Label (growth only)</label>
          <input className="input text-sm" value={card.action_label ?? ''}
            onChange={e => onUpdate('action_label', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label text-xs">Link (href)</label>
          <input className="input text-sm" value={card.href}
            onChange={e => onUpdate('href', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label text-xs">Background Gradient (CSS)</label>
          <input className="input text-sm font-mono text-xs" value={card.bg_gradient ?? ''}
            onChange={e => onUpdate('bg_gradient', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label text-xs mb-2">Background Photo</label>
          <ImageUpload cardId={card.id} currentUrl={card.image_url}
            onUploaded={url => onUpdate('image_url', url)} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(199,166,23,0.12)' }}>
        <button onClick={() => onUpdate('is_active', !card.is_active)}
          className="flex items-center gap-2 text-sm font-medium">
          {card.is_active
            ? <ToggleRight size={22} style={{ color: '#C7A617' }} />
            : <ToggleLeft size={22} style={{ color: 'rgba(246,241,231,0.3)' }} />}
          <span style={{ color: card.is_active ? '#C7A617' : 'rgba(246,241,231,0.35)' }}>
            {card.is_active ? 'Visible' : 'Hidden'}
          </span>
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: saved ? 'rgba(94,127,31,0.3)' : '#5E7F1F', color: '#F6F1E7' }}>
          <Save size={13} />
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default function AdminHomepagePage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => { loadCards() }, [])

  async function loadCards() {
    const supabase = createClient()
    const { data } = await supabase.from('sbm_homepage_cards').select('*').order('section').order('sort_order')
    setCards(data || [])
    setLoading(false)
  }

  function updateCard(id: string, field: keyof Card, value: unknown) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  async function saveCard(card: Card) {
    setSaving(card.id)
    const supabase = createClient()
    await supabase.from('sbm_homepage_cards').update({
      title: card.title, subtitle: card.subtitle, action_label: card.action_label,
      emoji: card.emoji, image_url: card.image_url, href: card.href,
      bg_gradient: card.bg_gradient, is_active: card.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', card.id)
    setSaving(null)
    setSaved(card.id)
    setTimeout(() => setSaved(null), 2000)
  }

  async function moveCard(id: string, dir: 'up' | 'down') {
    const sectionCards = (() => {
      const card = cards.find(c => c.id === id)!
      return cards.filter(c => c.section === card.section)
    })()
    const idx = sectionCards.findIndex(c => c.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === sectionCards.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const supabase = createClient()
    const a = sectionCards[idx], b = sectionCards[swapIdx]
    await Promise.all([
      supabase.from('sbm_homepage_cards').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('sbm_homepage_cards').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    loadCards()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: 'rgba(246,241,231,0.5)' }}>Loading...</p>
    </div>
  )

  const growthCards = cards.filter(c => c.section === 'growth')
  const roleCards = cards.filter(c => c.section === 'role')

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: '#C7A617' }}>🏠 Homepage Config</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(246,241,231,0.5)' }}>
          Edit titles, photos, links and visibility for homepage cards
        </p>
      </div>

      {/* Growth Loop Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: '#8bc34a' }} />
          <h2 className="font-bold" style={{ color: '#8bc34a' }}>Growth Loop Cards (4 in a row)</h2>
        </div>
        <div className="space-y-3">
          {growthCards.map((c, i) => (
            <CardEditor key={c.id} card={c}
              onUpdate={(f, v) => updateCard(c.id, f, v)}
              onSave={() => saveCard(c)}
              onMove={dir => moveCard(c.id, dir)}
              saving={saving === c.id} saved={saved === c.id}
              isFirst={i === 0} isLast={i === growthCards.length - 1} />
          ))}
        </div>
      </div>

      {/* Role Cards Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: '#C7A617' }} />
          <h2 className="font-bold" style={{ color: '#C7A617' }}>Role Cards (3-column grid)</h2>
        </div>
        <div className="space-y-3">
          {roleCards.map((c, i) => (
            <CardEditor key={c.id} card={c}
              onUpdate={(f, v) => updateCard(c.id, f, v)}
              onSave={() => saveCard(c)}
              onMove={dir => moveCard(c.id, dir)}
              saving={saving === c.id} saved={saved === c.id}
              isFirst={i === 0} isLast={i === roleCards.length - 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
