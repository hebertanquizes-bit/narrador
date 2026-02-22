import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware Next.js para gerenciar sessões Supabase.
 * 
 * Responsabilidades:
 * 1. Renovar tokens de sessão expirados automaticamente
 * 2. Redirecionar usuários não autenticados para o login
 * 3. Redirecionar usuários sem role definido para escolha de workspace
 * 4. Impedir narradores de acessar áreas exclusivas de jogador e vice-versa
 */
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
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Renovar sessão (obrigatório em middlewares Supabase)
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ─── Rotas públicas (sem autenticação necessária) ───────────
    const publicRoutes = ['/', '/auth/callback', '/auth/confirm']
    const isPublicRoute = publicRoutes.some(route => pathname === route)

    if (isPublicRoute) {
        // Se já autenticado e na raiz, redirecionar para dashboard
        if (user && pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return supabaseResponse
    }

    // ─── Usuário não autenticado → redirecionar para login ──────
    if (!user) {
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ─── Verificar role do usuário ───────────────────────────────
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role

    // Se ainda não escolheu workspace e não está na página de escolha
    if (!role && pathname !== '/workspace/selecionar') {
        return NextResponse.redirect(new URL('/workspace/selecionar', request.url))
    }

    // Jogadores não podem criar salas nem acessar workspace de narrador
    if (role === 'player') {
        const narratorOnlyPaths = ['/workspace/narrador', '/sala/criar']
        const isNarratorOnly = narratorOnlyPaths.some(p => pathname.startsWith(p))
        if (isNarratorOnly) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Aplicar middleware em todas as rotas exceto:
         * - _next/static (arquivos estáticos)
         * - _next/image (otimização de imagem)
         * - favicon.ico
         * - arquivos públicos (imagens, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
