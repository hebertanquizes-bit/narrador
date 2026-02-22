import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ─── Renovar sessão / pegar usuário ─────────
  const { data, error } = await supabase.auth.getUser()
  const user = data.user

  console.log('[Middleware] User:', user)
  if (error) console.log('[Middleware] Error getting user:', error.message)

  const pathname = request.nextUrl.pathname

  // ─── Rotas públicas ─────────
  const publicRoutes = ['/', '/auth/callback', '/auth/confirm']
  if (publicRoutes.includes(pathname)) {
    if (user && pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // ─── Redirecionar não autenticados ─────────
  if (!user) {
    console.log('[Middleware] No user, redirecting to login')
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Pegar role do usuário ─────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  if (profileError) console.log('[Middleware] Error fetching profile:', profileError.message)

  console.log('[Middleware] Role:', role)

  // ─── Redirecionar se ainda não escolheu role ─────────
  if (!role && pathname !== '/workspace/selecionar') {
    console.log('[Middleware] No role, redirecting to /workspace/selecionar')
    return NextResponse.redirect(new URL('/workspace/selecionar', request.url))
  }

  // ─── Jogadores não podem acessar áreas de narrador ─────────
  if (role === 'player') {
    const narratorOnlyPaths = ['/workspace/narrador', '/sala/criar']
    const isNarratorOnly = narratorOnlyPaths.some(p => pathname.startsWith(p))
    if (isNarratorOnly) {
      console.log('[Middleware] Player tried to access narrator area, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}