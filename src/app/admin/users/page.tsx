'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronDown, Check, X, RefreshCw, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole, UserStatus, PlatformRole } from '@/lib/types'

interface AdminUser {
  id: string
  full_name: string
  phone: string
  email: string | null
  role: UserRole
  platform_role: PlatformRole | null
  status: UserStatus
  created_at: string
}

type StatusFilter = 'all' | UserStatus
type RoleFilter = 'all' | UserRole

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400 border-green-500/30',
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/30',
}

export default function AdminUsersPage() {
  const { language, user: adminUser } = useAppStore()
  const label = (zh: string, en: string, bm: string) =>
    language === 'zh' ? zh : language === 'en' ? en : bm

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [counts, setCounts] = useState({ all: 0, pending: 0, active: 0, suspended: 0 })

  const isSuperAdmin = adminUser?.platform_role === 'super_admin'

  const ROLE_LABELS: Record<string, string> = {
    orchard:    label('园主', 'Orchard', 'Ladang'),
    wholesaler: label('批发商', 'Wholesaler', 'Pemborong'),
    retailer:   label('零售商', 'Retailer', 'Peruncit'),
    consumer:   label('消费者', 'Consumer', 'Pengguna'),
    admin:      'Admin',
  }

  const STATUS_LABELS: Record<string, string> = {
    active:    label('已激活', 'Active', 'Aktif'),
    pending:   label('待审核', 'Pending', 'Menunggu'),
    suspended: label('已停用', 'Suspended', 'Digantung'),
  }

  const PLATFORM_ROLE_LABELS: Record<string, string> = {
    super_admin:    'Super Admin',
    platform_admin: 'Platform Admin',
    user:           label('普通用户', 'User', 'Pengguna'),
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('sbm_users')
      .select('id, full_name, phone, email, role, platform_role, status, created_at')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (roleFilter !== 'all') query = query.eq('role', roleFilter)
    if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`)

    const { data } = await query
    setUsers((data as AdminUser[]) ?? [])

    // Count tabs
    const [all, pending, active, suspended] = await Promise.all([
      supabase.from('sbm_users').select('*', { count: 'exact', head: true }),
      supabase.from('sbm_users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('sbm_users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('sbm_users').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    ])
    setCounts({
      all: all.count ?? 0,
      pending: pending.count ?? 0,
      active: active.count ?? 0,
      suspended: suspended.count ?? 0,
    })

    setLoading(false)
  }, [statusFilter, roleFilter, search])

  useEffect(() => {
    const timer = setTimeout(loadUsers, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [loadUsers, search])

  async function updateStatus(userId: string, status: UserStatus) {
    setUpdating(userId)
    const supabase = createClient()
    await supabase.from('sbm_users').update({
      status,
      verified_at: status === 'active' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
    await loadUsers()
    setUpdating(null)
  }

  async function updateRole(userId: string, role: UserRole) {
    setUpdating(userId)
    const supabase = createClient()
    await supabase.from('sbm_users').update({ role, updated_at: new Date().toISOString() }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    setUpdating(null)
  }

  async function updatePlatformRole(userId: string, platform_role: PlatformRole) {
    setUpdating(userId)
    const supabase = createClient()
    await supabase.from('sbm_users').update({ platform_role, updated_at: new Date().toISOString() }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, platform_role } : u))
    setUpdating(null)
  }

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',       label: label('全部', 'All', 'Semua') },
    { key: 'pending',   label: label('待审核', 'Pending', 'Menunggu') },
    { key: 'active',    label: label('已激活', 'Active', 'Aktif') },
    { key: 'suspended', label: label('已停用', 'Suspended', 'Digantung') },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{label('用户管理', 'User Management', 'Pengurusan Pengguna')}</h1>
        <p className="text-gray-400 text-sm mt-1">{label('审核注册、管理角色与权限', 'Approve registrations, manage roles & permissions', 'Luluskan pendaftaran, urus peranan & kebenaran')}</p>
      </div>

      {/* Status tab filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30'
                : 'text-gray-400 border border-brand-dark-border hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-dark text-gray-500'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + role filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={label('搜索姓名...', 'Search name...', 'Cari nama...')}
            className="input pl-9 w-full"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as RoleFilter)}
            className="input pr-8 appearance-none cursor-pointer"
          >
            <option value="all">{label('所有角色', 'All Roles', 'Semua Peranan')}</option>
            <option value="orchard">{label('园主', 'Orchard', 'Ladang')}</option>
            <option value="wholesaler">{label('批发商', 'Wholesaler', 'Pemborong')}</option>
            <option value="retailer">{label('零售商', 'Retailer', 'Peruncit')}</option>
            <option value="consumer">{label('消费者', 'Consumer', 'Pengguna')}</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <button onClick={loadUsers} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {label('刷新', 'Refresh', 'Muat Semula')}
        </button>
      </div>

      {/* User list */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-brand-dark-border">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-brand-dark animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-dark rounded animate-pulse w-40" />
                  <div className="h-3 bg-brand-dark rounded animate-pulse w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">{label('暂无用户', 'No users found', 'Tiada pengguna')}</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-dark-border">
            {users.map(u => (
              <div key={u.id} className={`p-4 transition-colors ${updating === u.id ? 'opacity-60' : 'hover:bg-brand-dark/50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-gold font-bold text-sm">{u.full_name?.[0] ?? '?'}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white truncate">{u.full_name}</p>
                        {u.platform_role && u.platform_role !== 'user' && (
                          <span className="flex items-center gap-1 text-xs bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-full">
                            <Shield size={10} />
                            {PLATFORM_ROLE_LABELS[u.platform_role]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.phone} {u.email ? `· ${u.email}` : ''}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{new Date(u.created_at).toLocaleDateString(language === 'zh' ? 'zh-MY' : 'en-MY')}</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Role selector */}
                    <div className="relative">
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value as UserRole)}
                        disabled={updating === u.id}
                        className="text-xs bg-brand-dark border border-brand-dark-border text-gray-300 rounded-lg px-2 py-1.5 appearance-none pr-6 cursor-pointer hover:border-gray-500 transition-colors disabled:opacity-50"
                      >
                        <option value="orchard">{label('园主', 'Orchard', 'Ladang')}</option>
                        <option value="wholesaler">{label('批发商', 'Wholesaler', 'Pemborong')}</option>
                        <option value="retailer">{label('零售商', 'Retailer', 'Peruncit')}</option>
                        <option value="consumer">{label('消费者', 'Consumer', 'Pengguna')}</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Platform role (super_admin only) */}
                    {isSuperAdmin && (
                      <div className="relative">
                        <select
                          value={u.platform_role ?? 'user'}
                          onChange={e => updatePlatformRole(u.id, e.target.value as PlatformRole)}
                          disabled={updating === u.id}
                          className="text-xs bg-brand-dark border border-brand-dark-border text-gray-300 rounded-lg px-2 py-1.5 appearance-none pr-6 cursor-pointer hover:border-gray-500 transition-colors disabled:opacity-50"
                        >
                          <option value="user">{label('普通用户', 'User', 'Pengguna')}</option>
                          <option value="platform_admin">Platform Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`badge text-xs border px-2 py-1 ${STATUS_COLORS[u.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                      {STATUS_LABELS[u.status] ?? u.status}
                    </span>

                    {/* Action buttons */}
                    {u.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(u.id, 'active')}
                          disabled={updating === u.id}
                          className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <Check size={12} />
                          {label('批准', 'Approve', 'Luluskan')}
                        </button>
                        <button
                          onClick={() => updateStatus(u.id, 'suspended')}
                          disabled={updating === u.id}
                          className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <X size={12} />
                          {label('拒绝', 'Reject', 'Tolak')}
                        </button>
                      </>
                    )}
                    {u.status === 'active' && (
                      <button
                        onClick={() => updateStatus(u.id, 'suspended')}
                        disabled={updating === u.id}
                        className="text-xs text-gray-500 border border-brand-dark-border px-3 py-1.5 rounded-lg hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {label('停用', 'Suspend', 'Gantung')}
                      </button>
                    )}
                    {u.status === 'suspended' && (
                      <button
                        onClick={() => updateStatus(u.id, 'active')}
                        disabled={updating === u.id}
                        className="text-xs text-gray-500 border border-brand-dark-border px-3 py-1.5 rounded-lg hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      >
                        {label('重新激活', 'Reactivate', 'Aktifkan Semula')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
