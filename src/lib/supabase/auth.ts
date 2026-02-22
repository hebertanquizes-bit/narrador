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
    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, role')
        .eq('id', userId)
        .single()

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
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (!session?.user) {
            callback(null)
            return
        }

        try {
            const user = session.user
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, role')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error("Erro no AuthState profile fetch:", error)
            }

            callback({
                id: user.id,
                email: user.email,
                displayName: profile?.display_name ?? null,
                avatarUrl: profile?.avatar_url ?? null,
                role: profile?.role ?? null,
            })
        } catch (err) {
            console.error("Exception in onAuthStateChange:", err)
            callback(null)
        }
    })
}

// ============================================================
// PROFILE HELPERS
// ============================================================

/**
 * Atualiza o perfil do usuário.
 */
export async function updateProfile(userId: string, data: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'role'>>) {
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)

    if (error) throw new Error(error.message)
}

/**
 * Define o role do usuário e cria o workspace correspondente.
 * Esta ação é PERMANENTE — role não pode ser alterado depois.
 */
export async function chooseWorkspaceType(userId: string, role: 'player' | 'narrator') {
    // 1. Definir o role
    await updateProfile(userId, { role })

    // 2. Criar o workspace correspondente
    if (role === 'player') {
        const { error } = await supabase
            .from('player_workspaces')
            .insert({ user_id: userId, tokens: [], character_sheets: [] })

        if (error && error.code !== '23505') { // ignorar conflito (já existe)
            throw new Error(`Erro ao criar workspace de jogador: ${error.message}`)
        }
    } else {
        const { error } = await supabase
            .from('narrator_workspaces')
            .insert({
                user_id: userId,
                available_systems: [],
                api_integrations: {
                    aiChat: false,
                    music: false,
                    youtube: false,
                    imageGen: false,
                },
                assets: [],
            })

        if (error && error.code !== '23505') {
            throw new Error(`Erro ao criar workspace de narrador: ${error.message}`)
        }
    }

    return role
}
