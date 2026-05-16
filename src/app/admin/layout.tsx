'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Palette, ShoppingBag, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, zh: '平台总览', en: 'Dashboard', bm: 'Papan Pemuka' },
  { href: '/admin/users', icon: Users, zh: '用户管理', en: 'Users', bm: 'Pengguna' },
  { href: '/admin/appearance', icon: Palette, zh: '外观设置', en: 'Appearance', bm: 'Penampilan' },
  { href: '/admin/orders', icon: ShoppingBag, zh: '所有订单', en: 'All Orders', bm: 'Semua Pesanan' },
  { href: '/admin/settings', icon: Settings, zh: '系统设置', en: 'Settings', bm: 'Tetapan' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { language, user, setUser } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  useEffect(() => {
    if (!user) return
    if (!['super_admin', 'platform_admin'].includes(user.platform_role ?? '')) {
      router.push('/')
    }
  }, [user, router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  if (!user || !['super_admin', 'platform_admin'].includes(user.platform_role ?? '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-400">{label('没有权限', 'No access', 'Tiada akses')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-brand-dark-card border-r border-brand-dark-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-brand-dark-border">
          <p className="text-xs text-gray-500 uppercase tracking-widest">{label('管理后台', 'Admin Panel', 'Panel Admin')}</p>
          <p className="text-white font-bold mt-0.5">SB Durian</p>
          {user.platform_role === 'super_admin' && (
            <span className="text-xs bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-full mt-1 inline-block">Super Admin</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-brand-dark'
                }`}
              >
                <item.icon size={17} />
                {label(item.zh, item.en, item.bm)}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div className="px-3 py-4 border-t border-brand-dark-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-400 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-600 truncate">{user.phone}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 w-full transition-colors"
          >
            <LogOut size={17} />
            {label('登出', 'Logout', 'Log Keluar')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-brand-dark">
        {children}
      </main>
    </div>
  )
}
