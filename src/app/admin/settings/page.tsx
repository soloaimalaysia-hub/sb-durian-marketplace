'use client'

import { useAppStore } from '@/store/useAppStore'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  const { language } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{label('系统设置', 'System Settings', 'Tetapan Sistem')}</h1>
        <p className="text-gray-400 text-sm mt-1">{label('进阶配置（Week 3）', 'Advanced config (Week 3)', 'Konfigurasi lanjutan (Minggu 3)')}</p>
      </div>

      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <Settings size={40} className="text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">{label('即将推出', 'Coming Soon', 'Akan Datang')}</p>
        <p className="text-gray-600 text-sm mt-2">{label('Stripe、WhatsApp 通知等设置', 'Stripe, WhatsApp notification settings', 'Tetapan Stripe, pemberitahuan WhatsApp')}</p>
      </div>
    </div>
  )
}
