import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getOrigin(request: Request) {
  const url = new URL(request.url)
  // Prefer configured site URL in production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  return url.origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const origin = getOrigin(request)

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth exchange error:', exchangeError.message)
      return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`)
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    // Ensure a users row exists (first Google/GitHub login)
    const { data: existing } = await supabase
      .from('users')
      .select('id, onboarding_complete')
      .eq('id', user.id)
      .maybeSingle()

    if (!existing) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Builder'

      const avatarUrl =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null

      const usernameBase = (user.email?.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20)

      // Best-effort profile create (ignore conflict if trigger already created it)
      await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          username: usernameBase,
          avatar_url: avatarUrl,
          onboarding_complete: false,
        },
        { onConflict: 'id' }
      )

      return NextResponse.redirect(`${origin}/onboarding`)
    }

    if (!existing.onboarding_complete) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    // Safe internal redirect only
    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') ? next : '/home'

    return NextResponse.redirect(`${origin}${safeNext}`)
  } catch (e) {
    console.error('Callback fatal error:', e)
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }
}