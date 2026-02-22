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

  if (error) console.log('[Middleware] Error getting user:', error.message)

  const pathname = request.nextUrl.pathname

  // ─── Rotas públicas ─────────
  const publicRoutes = ['/', '/auth/callback', '/auth/confirm']
  if (publicRoutes.includes(pathname)) {
    if (user && pathname === '/') {
      // Usuário logado tentando acessar a tela de login → redirecionar
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

  // ─── Pegar role APENAS se acessar áreas exclusivas ─────────
  // Removido temporariamente / permanentemente a pedido do usuário
  // "Considere todos usuarios iguais no login"

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}