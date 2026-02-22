import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Rota de callback para OAuth (Google).
 * Supabase redireciona aqui após autenticação com o provider.
 * Troca o code por uma sessão válida.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const next = searchParams.get('next') ?? '/dashboard'

    // Tratar erros do OAuth
    if (error) {
        console.error('OAuth error:', error)
        return NextResponse.redirect(`${origin}/?error=oauth_error`)
    }

    if (code) {
        const supabase = await createServerSupabaseClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            return NextResponse.redirect(`${origin}/?error=auth_failed`)
        }

        // Sucesso — redirecionar para destino
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Sem code → voltar para login
    return NextResponse.redirect(`${origin}/?error=missing_code`)
}
