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
        getAll() { return request.cookies.getAll() },
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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Bypass system routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  const publicAuthRoutes = ['/login', '/signup', '/reset-password', '/forgot-password']
  const isPublicAuth = publicAuthRoutes.some((p) => pathname.startsWith(p))
  const isPublicRoot = pathname === '/'

  // Unauthenticated user
  if (!user) {
    if (!isPublicAuth && !isPublicRoot) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Authenticated user - fetch identity state
  const { data: dsrtUser } = await supabase
    .from('users')
    .select('account_state, account_status, onboarding_complete, username, normalized_username')
    .eq('id', user.id)
    .maybeSingle()

  const state = dsrtUser?.account_state || 'USERNAME_REQUIRED'
  const isOnboarded = !!dsrtUser?.onboarding_complete
  const hasRealUsername = !!(dsrtUser?.normalized_username && !dsrtUser.normalized_username.startsWith('pending_'))

  // ADAPTIVE FLOW: NO email verification wall
  // User needs username → force to username selection
  if (!hasRealUsername && !pathname.startsWith('/auth/username')) {
    return NextResponse.redirect(new URL('/auth/username', request.url))
  }

  // User has username but no onboarding → force to onboarding
  if (hasRealUsername && !isOnboarded && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Fully onboarded user hitting auth pages → redirect home
  if (hasRealUsername && isOnboarded && (isPublicAuth || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}