import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface CookieToSet {
  name: string
  value: string
  options?: CookieOptions
}

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // 1. Explicit Unprotected / Callback / Password Reset exceptions
  const bypassRoutes = [
    '/callback',
    '/auth/callback',
    '/reset-password',
    '/forgot-password',
    '/api',
  ]

  const isBypass = bypassRoutes.some((route) => pathname.startsWith(route))
  if (isBypass) {
    return supabaseResponse
  }

  // 2. Protected App Routes
  const protectedRoutes = [
    '/home',
    '/feed',
    '/inbox',
    '/explore',
    '/community',
    '/pulse',
    '/projects',
    '/ventures',
    '/messages',
    '/notifications',
    '/profile',
    '/settings',
    '/onboarding',
  ]

  // 3. Auth pages
  const authRoutes = ['/login', '/signup']

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Unauthenticated user attempting to access protected route
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user attempting to access /login or /signup
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}