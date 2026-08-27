import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface CookieToSet {
  name: string
  value: string
  options?: CookieOptions
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  const publicAuth = ['/login', '/signup', '/reset-password', '/forgot-password']
  const isPublicAuth = publicAuth.some((p) => pathname.startsWith(p))
  const isPublicRoot = pathname === '/'

  if (!user) {
    if (!isPublicAuth && !isPublicRoot) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const { data: dsrtUser } = await supabase
    .from('users')
    .select('account_state, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  const state = dsrtUser?.account_state || 'EMAIL_VERIFICATION_REQUIRED'
  const onboarded = !!dsrtUser?.onboarding_complete

  // Suspended / locked
  if ((state === 'SUSPENDED' || state === 'LOCKED') && pathname !== '/account-locked') {
    return NextResponse.redirect(new URL('/account-locked', request.url))
  }

  if (state === 'EMAIL_VERIFICATION_REQUIRED' && !pathname.startsWith('/auth/verify-email')) {
    return NextResponse.redirect(new URL('/auth/verify-email', request.url))
  }

  if (state === 'USERNAME_REQUIRED' && !pathname.startsWith('/auth/username')) {
    return NextResponse.redirect(new URL('/auth/username', request.url))
  }

  if (
    (state === 'ONBOARDING_REQUIRED' || (!onboarded && state === 'ACTIVE' ? false : !onboarded && state !== 'EMAIL_VERIFICATION_REQUIRED' && state !== 'USERNAME_REQUIRED')) &&
    state !== 'EMAIL_VERIFICATION_REQUIRED' &&
    state !== 'USERNAME_REQUIRED' &&
    !pathname.startsWith('/onboarding')
  ) {
    if (!onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  if (
    (state === 'ACTIVE' && onboarded) &&
    (isPublicAuth || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding'))
  ) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}