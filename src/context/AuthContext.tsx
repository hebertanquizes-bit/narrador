'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChange, getAuthUser, fetchCurrentAuthUser } from '@/lib/supabase/auth'
import type { AuthUser } from '@/lib/supabase/types'

// ============================================================
// CONTEXTO
// ============================================================

type AuthContextType = {
    user: AuthUser | null
    loading: boolean
    isNarrator: boolean
    isPlayer: boolean
    hasRole: boolean
    refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isNarrator: false,
    isPlayer: false,
    hasRole: false,
    refresh: async () => { },
})

// ============================================================
// PROVIDER
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        const authUser = await fetchCurrentAuthUser()
        setUser(authUser)
    }, [])

    useEffect(() => {
        // onAuthStateChange dispara INITIAL_SESSION imediatamente com o estado atual
        // Isso é mais confiável que chamar getAuthUser() separado
        const { data: { subscription } } = onAuthStateChange((u) => {
            setUser(u)
            setLoading(false)
        })

        // Safety net: se o evento demorar mais de 2s, destravar a UI de qualquer forma
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 2000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [])

    const isNarrator = user?.role === 'narrator'
    const isPlayer = user?.role === 'player'
    const hasRole = isNarrator || isPlayer

    return (
        <AuthContext.Provider value={{ user, loading, isNarrator, isPlayer, hasRole, refresh }}>
            {children}
        </AuthContext.Provider>
    )
}

// ============================================================
// HOOK
// ============================================================

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
    return ctx
}
