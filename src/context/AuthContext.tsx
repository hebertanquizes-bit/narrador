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
    debugContext: string
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isNarrator: false,
    isPlayer: false,
    hasRole: false,
    refresh: async () => { },
    debugContext: "init"
})

// ============================================================
// PROVIDER
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [debugContext, setDebugContext] = useState<string>("init")

    const refresh = useCallback(async () => {
        const authUser = await fetchCurrentAuthUser()
        setUser(authUser)
    }, [])

    useEffect(() => {
        let mounted = true;

        // Setup subscription
        const { data: { subscription } } = onAuthStateChange((u, debugInfo) => {
            if (!mounted) return;
            setUser(u)
            setDebugContext(debugInfo || "no_debug")
            setLoading(false)
        })

        // Instantly try to fetch user manually if the event doesn't fire fast enough
        fetchCurrentAuthUser().then((u) => {
            if (!mounted) return;
            // Only use this manual fallback if loading is still true
            setLoading(prev => {
                if (prev) {
                    setUser(u);
                    setDebugContext(ctx => ctx === "init" ? "init | manual_fetch_success" : ctx);
                    return false;
                }
                return prev;
            });
        }).catch(err => {
            console.error(err);
        });

        const timeout = setTimeout(() => {
            if (!mounted) return;
            setLoading(prev => {
                if (prev) {
                    setDebugContext(ctx => ctx + " | timed_out_fallback");
                    return false;
                }
                return prev;
            });
        }, 2500)

        return () => {
            mounted = false;
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [])

    const isNarrator = user?.role === 'narrator'
    const isPlayer = user?.role === 'player'
    const hasRole = isNarrator || isPlayer

    return (
        <AuthContext.Provider value={{ user, loading, isNarrator, isPlayer, hasRole, refresh, debugContext }}>
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
