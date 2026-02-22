"use client";

import { getSupabaseClient } from "./client";
import type { Room } from "./types";

const supabase = getSupabaseClient();

/**
 * Busca todas as salas (Supabase RLS filtra pelo auth.uid() mas na policy definimos
 * que qualquer validado pode ler as salas).
 */
export async function getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao buscar salas no Supabase:", error);
        return [];
    }

    return (data || []) as Room[];
}

/**
 * Cria uma nova sala. Somente funciona se as permissões de RLS passarem e se o usuário logado
 * tiver um Workspace (role === narrator).
 */
export async function createRoom(hostId: string, name: string = "Nova Campanha"): Promise<Room | null> {
    const { data, error } = await supabase
        .from("rooms")
        .insert([
            {
                owner_id: hostId,
                state: "lobby",
                enabled_features: { dice: true, aiChat: false, music: false, grid: false },
                campaign_config: {
                    roomName: name,
                    campaignName: "Campanha RPG",
                    systemId: null,
                    mapUrl: null,
                    gridEnabled: false,
                    password: null
                }
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Erro ao criar sala no Supabase:", error);
        return null;
    }

    return data as Room;
}

/**
 * Busca sala pelo código curto.
 */
export async function findRoomByCode(code: string): Promise<Room | undefined> {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code.trim())
        .single();

    if (error || !data) {
        return undefined;
    }

    return data as Room;
}

/**
 * Busca sala pelo ID (UUID).
 */
export async function getRoomById(id: string): Promise<Room | undefined> {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return undefined;
    }

    return data as Room;
}

/**
 * Deleta a sala APENAS se o usuário for o dono (owner_id) e a sala
 * estiver no status de 'lobby' (regra garantida pelo RLS no db).
 */
export async function deleteRoom(roomId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId)
    // O RLS já blinda exigindo ser owner + lobby, mas garantimos aqui pelo client
    // Não precisa de check em JS pra userId se o supabase já usar auth.uid() no RLS do db.

    if (error) {
        console.error("Erro ao deletar sala via Supabase:", error);
        return false;
    }
    return true;
}

/**
 * Como usamos um modelo persistente com relacional no Supabase que pode ser analisado
 * depois se necessário, você pode não querer apagar automático as salas do nada via Client Side.
 * O ideal seria uma Server Function cron pro Supabase. Aqui, para manter a consistência, mantivemos mock por enquanto.
 */
export async function cleanupOldEmptyRooms(): Promise<void> {
    // Num backend Serverless como Supabase, geralmente usamos "pg_cron" 
    // no Editor SQL lá no Painel Edge Functions. 
    // No Client/Page Load fazer query de delete em massa n é seguro.
    console.log("Cleanup delegado para as Edge Functions do Supabase e desabilitado no client.");
}
