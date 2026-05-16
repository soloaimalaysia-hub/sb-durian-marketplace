import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code).then(async () => {
      return await supabase.auth.getUser()
    })

    if (user) {
      // Check if sbm_users profile exists
      const { data: profile } = await supabase
        .from('sbm_users')
        .select('role, platform_role, status')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
        // Admin → admin dashboard
        if (['super_admin', 'platform_admin'].includes(profile.platform_role ?? '')) {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        }
        // Role dashboard
        const dashboards: Record<string, string> = {
          orchard: '/orchard/dashboard',
          wholesaler: '/wholesaler/dashboard',
          retailer: '/retailer/dashboard',
          consumer: '/consumer/dashboard',
        }
        return NextResponse.redirect(`${origin}${dashboards[profile.role] ?? '/'}`)
      } else {
        // No profile yet → complete registration
        return NextResponse.redirect(`${origin}/register?email_verified=1`)
      }
    }
  }

  // Fallback → home
  return NextResponse.redirect(`${origin}/`)
}
