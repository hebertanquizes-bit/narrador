'use client'

import { getSupabaseClient } from './client'
import type { AuthUser, Profile } from './types'

const supabase = getSupabaseClient()

// ============================================================
// AUTH HELPERS
// ============================================================

/**
 * Retorna o usuário da sessão atual (composto de auth + profile).
 * Retorna null se não autenticado.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    // Verificação rápida local — se não tem sessão, retorna null sem chamar a rede
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    return fetchProfileForUser(session.user.id, session.user.email)
}

/**
 * Versão direta sem checagem de sessão — usada pelo refresh() quando sabemos que
 * o usuário está autenticado mas acabou de mudar dados no banco.
 */
export async function fetchCurrentAuthUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return fetchProfileForUser(user.id, user.email)
}

async function fetchProfileForUser(userId: string, email: string | undefined): Promise<AuthUser | null> {
    const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, role')
        .eq('id', userId)
        .single()

    // Cast explícito para evitar inferência `never` em alguns compiladores
    const profile = data as Pick<Profile, 'display_name' | 'avatar_url' | 'role'> | null

    return {
        id: userId,
        email,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        role: profile?.role ?? null,
    }
}

/**
 * Login com email e senha.
 */
export async function loginWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data.user
}

/**
 * Registro com email e senha.
 * Novos usuários são automaticamente definidos como `player`.
 */
export async function registerWithEmail(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    })
    if (error) throw new Error(error.message)

    // Não definimos mais role padrão automaticamente na criação.
    return data.user
}

/**
 * Login com Google OAuth.
 * Redireciona para o fluxo OAuth do Google.
 */
export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })
    if (error) throw new Error(error.message)
}

/**
 * Login anônimo. Cria uma sessão temporária sem conta.
 * Útil para visitantes que querem explorar.
 */
export async function loginAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw new Error(error.message)
    return data.user
}

/**
 * Logout.
 */
export async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
}

/**
 * Observa mudanças de sessão em tempo real.
 * Usado no AuthProvider para manter estado global.
 */
export function onAuthStateChange(callback: (user: AuthUser | null, debugInfo?: string) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (!session?.user) {
            callback(null, `event:${event}|session:false`)
            return
        }

        try {
            const user = session.user
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, role')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error("Erro no AuthState profile fetch:", error)
                callback(null, `event:${event}|profiles_err:${error.message}`)
                return
            }

            // Cast explícito para evitar inferência `never`
            const profile = data as Pick<Profile, 'display_name' | 'avatar_url' | 'role'> | null

            callback({
                id: user.id,
                email: user.email,
                displayName: profile?.display_name ?? null,
                avatarUrl: profile?.avatar_url ?? null,
                role: profile?.role ?? null,
            }, `event:${event}|success:user_fetched`)
        } catch (err) {
            console.error("Exception in onAuthStateChange:", err)
            // Em caso de erro de rede (ex: 429), não deslogar o usuário localmente.
            // Retorna a sessão básica. Isso evita um loop infinito de redirecionamentos.
            const errmsg = err instanceof Error ? err.message : "unknown_err";
            callback({
                id: session.user.id,
                email: session.user.email,
                displayName: session.user.email?.split('@')[0] || "Usuário",
                avatarUrl: null,
                role: null,
            }, `event:${event}|catch:${errmsg}`)
        }
    })
}

// ─── Papéis não são mais exigidos pelo fluxo de entrada ─────────
