/**
 * Barrel export do módulo Supabase.
 * Importar apenas o necessário para evitar importar o cliente server no browser.
 *
 * USO:
 *   Client components → import { getSupabaseClient } from '@/lib/supabase'
 *   Server components → import { createServerSupabaseClient } from '@/lib/supabase/server'
 *   Auth helpers →      import { loginWithEmail, loginWithGoogle } from '@/lib/supabase'
 *   Types →             import type { AuthUser, Room } from '@/lib/supabase'
 */

// Client
export { createClient, getSupabaseClient } from './client'

// Auth helpers (client-side)
export {
    getAuthUser,
    fetchCurrentAuthUser,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAnonymously,
    logout,
    onAuthStateChange,
    updateProfile,
    chooseWorkspaceType,
    ensurePlayerRole,
} from './auth'

// Types
export type {
    Database,
    Profile,
    PlayerWorkspace,
    NarratorWorkspace,
    Room,
    RoomParticipant,
    RpgSystem,
    ApiIntegrations,
    EnabledFeatures,
    CampaignConfig,
    PlayerToken,
    CharacterSheet,
    WorkspaceAsset,
    AuthUser,
    CampaignValidation,
    HostTransferResult,
} from './types'
