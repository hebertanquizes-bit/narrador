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

  // ─── Pegar role do usuário ─────────
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Cast explícito para evitar inferência `never` em versões antigas do compilador
  const profile = profileData as { role: 'player' | 'narrator' | null } | null
  const role = profile?.role ?? null

  if (profileError) console.log('[Middleware] Error fetching profile:', profileError.message)

  console.log('[Middleware] User:', user.id, 'Role:', role, 'Path:', pathname)

  // ─── Permitir acesso à página de seleção de workspace sempre ─────────
  // (Necessário para troca de papel dentro do workspace)
  if (pathname === '/workspace/selecionar') {
    return supabaseResponse
  }

  // ─── Redirecionar se ainda não escolheu role ─────────
  // Novos usuários sem role são raros agora (registerWithEmail define player por padrão)
  // mas mantemos como fallback
  if (!role) {
    console.log('[Middleware] No role, redirecting to /workspace/selecionar')
    return NextResponse.redirect(new URL('/workspace/selecionar', request.url))
  }

  // ─── Jogadores não podem acessar áreas exclusivas de narrador ─────────
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