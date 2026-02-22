/**
 * TYPES DO BANCO DE DADOS - Gerado para uso com Supabase Client
 * Reflete exatamente o schema.sql
 */

// ============================================================
// DATABASE TYPE (para o cliente Supabase tipado)
// ============================================================
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'created_at' | 'updated_at'>
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>
                Relationships: any[]
            }
            player_workspaces: {
                Row: PlayerWorkspace
                Insert: Omit<PlayerWorkspace, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<PlayerWorkspace, 'id' | 'user_id' | 'created_at'>>
                Relationships: any[]
            }
            narrator_workspaces: {
                Row: NarratorWorkspace
                Insert: Omit<NarratorWorkspace, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<NarratorWorkspace, 'id' | 'user_id' | 'created_at'>>
                Relationships: any[]
            }
            rooms: {
                Row: Room
                Insert: Omit<Room, 'id' | 'code' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Room, 'id' | 'owner_id' | 'created_at'>>
                Relationships: any[]
            }
            room_participants: {
                Row: RoomParticipant
                Insert: Omit<RoomParticipant, 'id' | 'joined_at'>
                Update: Partial<Pick<RoomParticipant, 'is_ready'>>
                Relationships: any[]
            }
            rpg_systems: {
                Row: RpgSystem
                Insert: Omit<RpgSystem, 'created_at'>
                Update: Partial<Omit<RpgSystem, 'id' | 'created_at'>>
                Relationships: any[]
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            user_role: 'player' | 'narrator'
            room_state: 'lobby' | 'in_game'
        }
    }
}

// ============================================================
// ENTIDADES PRINCIPAIS
// ============================================================

/** Perfil do usuário. role=null até escolher workspace. */
export type Profile = {
    id: string
    display_name: string | null
    avatar_url: string | null
    role: 'player' | 'narrator' | null
    created_at: string
    updated_at: string
}

/** Workspace do jogador */
export type PlayerWorkspace = {
    id: string
    user_id: string
    tokens: PlayerToken[]
    character_sheets: CharacterSheet[]
    created_at: string
    updated_at: string
}

/** Workspace do narrador */
export type NarratorWorkspace = {
    id: string
    user_id: string
    available_systems: string[]       // ex: ['dnd5e', 'tormenta20']
    api_integrations: ApiIntegrations
    api_keys_encrypted?: Record<string, string>  // NUNCA lido no cliente — optional pois tem default no banco
    assets: WorkspaceAsset[]
    created_at: string
    updated_at: string
}

/** Sala de campanha */
export type Room = {
    id: string
    owner_id: string
    code: string                      // 6 dígitos
    state: 'lobby' | 'in_game'
    enabled_features: EnabledFeatures
    campaign_config: CampaignConfig
    created_at: string
    updated_at: string
}

/** Participante de sala */
export type RoomParticipant = {
    id: string
    room_id: string
    user_id: string
    joined_at: string
    is_ready: boolean
}

/** Sistema de RPG disponível */
export type RpgSystem = {
    id: string
    name: string
    description: string | null
    is_native: boolean
    created_at: string
}

// ============================================================
// SUB-TIPOS (usados nos campos JSONB)
// ============================================================

export type ApiIntegrations = {
    aiChat: boolean
    music: boolean
    youtube: boolean
    imageGen: boolean
}

export type EnabledFeatures = {
    dice: boolean
    aiChat: boolean
    music: boolean
    grid: boolean
}

export type CampaignConfig = {
    roomName: string | null
    campaignName: string | null
    systemId: string | null
    mapUrl: string | null
    gridEnabled: boolean
    password: string | null
}

export type PlayerToken = {
    id: string
    name: string
    imageUrl: string
    size: 'small' | 'medium' | 'large'
    createdAt: string
}

export type CharacterSheet = {
    id: string
    name: string
    systemId: string
    data: Record<string, unknown>     // campos variam por sistema
    createdAt: string
    updatedAt: string
}

export type WorkspaceAsset = {
    id: string
    name: string
    type: 'pdf' | 'image' | 'link' | 'json'
    url: string                       // URL externa (Drive, Imgur) ou path no Storage
    description?: string
    tags?: string[]
    uploadedAt: string
}

// ============================================================
// TIPOS AUXILIARES PARA O FRONTEND
// ============================================================

/** Usuário autenticado (composição de auth + profile) */
export type AuthUser = {
    id: string
    email: string | undefined
    displayName: string | null
    avatarUrl: string | null
    role: 'player' | 'narrator' | null
}

/** Estado de validação da campanha antes de iniciar */
export type CampaignValidation = {
    hasRoomName: boolean
    hasCampaignName: boolean
    hasSystemId: boolean
    systemInWorkspace: boolean
    canStart: boolean
}

/** Resultado de transferência de host */
export type HostTransferResult = {
    success: boolean
    resetFeatures: string[]           // features desativadas por requiresAPI
    systemReset: boolean              // se systemId foi limpo
    message: string
}
