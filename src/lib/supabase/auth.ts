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

    // Se o usuário foi criado, definir automaticamente como player
    if (data.user) {
        try {
            await ensurePlayerRole(data.user.id)
        } catch (e) {
            // Não bloqueia o registro se falhar (trigger pode já ter criado)
            console.warn('Aviso ao definir role inicial:', e)
        }
    }

    return data.user
}

/**
 * Garante que o usuário tem o role `player` caso não tenha role definido ainda.
 * Chamado após registro para simplificar o onboarding.
 */
export async function ensurePlayerRole(userId: string): Promise<void> {
    // Verificar se já tem role
    const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    const profile = data as Pick<Profile, 'role'> | null

    // Se já tem role, não fazer nada
    if (profile?.role) return

    // Definir como player (padrão)
    await chooseWorkspaceType(userId, 'player')
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
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, role')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error("Erro no AuthState profile fetch:", error)
            }

            // Cast explícito para evitar inferência `never`
            const profile = data as Pick<Profile, 'display_name' | 'avatar_url' | 'role'> | null

            callback({
                id: user.id,
                email: user.email,
                displayName: profile?.display_name ?? null,
                avatarUrl: profile?.avatar_url ?? null,
                role: profile?.role ?? null,
            })
        } catch (err) {
            console.error("Exception in onAuthStateChange:", err)
            // Em caso de erro de rede (ex: 429), não deslogar o usuário localmente.
            // Retorna a sessão básica. Isso evita um loop infinito de redirecionamentos.
            callback({
                id: session.user.id,
                email: session.user.email,
                displayName: session.user.email?.split('@')[0] || "Usuário",
                avatarUrl: null,
                role: null,
            })
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
        .update(data as never)
        .eq('id', userId)

    if (error) throw new Error(error.message)
}

/**
 * Define o role do usuário e cria o workspace correspondente.
 * Pode ser chamado múltiplas vezes para trocar de papel.
 */
export async function chooseWorkspaceType(userId: string, role: 'player' | 'narrator') {
    // 1. Definir o role
    await updateProfile(userId, { role })

    // 2. Criar ou atualizar o workspace correspondente
    if (role === 'player') {
        // Verifica se o workspace já existe
        const { data: existingPlayer } = await supabase
            .from('player_workspaces')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (!existingPlayer) {
            const { error } = await supabase
                .from('player_workspaces')
                .insert({ user_id: userId, tokens: [], character_sheets: [] } as never)

            if (error) {
                throw new Error(`Erro ao criar workspace de jogador: ${error.message}`)
            }
        }
    } else {
        // Verifica se o workspace de narrador já existe
        const { data: existingNarrator } = await supabase
            .from('narrator_workspaces')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (!existingNarrator) {
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
                } as never)

            if (error) {
                throw new Error(`Erro ao criar workspace de narrador: ${error.message}`)
            }
        }
    }

    return role
}
