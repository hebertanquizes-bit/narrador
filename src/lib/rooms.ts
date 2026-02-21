"use client";

import { STORAGE_KEYS, getItem, setItem, removeItem } from "./storage";
import type { Room } from "./types";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getRooms(): Room[] {
  return getItem<Room[]>(STORAGE_KEYS.ROOMS) ?? [];
}

export function createRoom(hostId: string, name: string = "Nova Campanha"): Room {
  const rooms = getRooms();
  const room: Room = {
    id: "room-" + Date.now(),
    code: generateCode(),
    name,
    hostId,
    createdAt: Date.now(),
  };
  setItem(STORAGE_KEYS.ROOMS, [...rooms, room]);
  return room;
}

export function findRoomByCode(code: string): Room | undefined {
  return getRooms().find((r) => r.code === code.trim());
}

export function getRoomById(id: string): Room | undefined {
  return getRooms().find((r) => r.id === id);
}

/**
 * Deleta uma sala e seus dados associados (campanha, personagens, estado).
 * Apenas o host criador pode deletar.
 */
export function deleteRoom(roomId: string, userId: string): boolean {
  const room = getRoomById(roomId);
  if (!room || room.hostId !== userId) {
    return false; // Apenas host pode deletar
  }

  // Remove a sala da lista
  const rooms = getRooms();
  const updated = rooms.filter((r) => r.id !== roomId);
  setItem(STORAGE_KEYS.ROOMS, updated);

  // Remove dados associados à sala
  removeItem(`${STORAGE_KEYS.CAMPAIGN}:${roomId}`);
  removeItem(`${STORAGE_KEYS.CHARACTERS}:${roomId}`);
  removeItem(`${STORAGE_KEYS.ROOM_STATE}:${roomId}`);

  return true;
}

/**
 * Remove automaticamente salas vazias sem host e com mais de 30 dias.
 * Executa silenciosamente, sem confirmação do usuário.
 */
export function cleanupOldEmptyRooms(): void {
  const rooms = getRooms();
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const filtered = rooms.filter((room) => {
    const ageMs = now - room.createdAt;
    const isOldEnough = ageMs > thirtyDaysMs;
    
    // Mantém: salas recentes OU salas com host
    return !isOldEnough || !!room.hostId;
  });

  if (filtered.length < rooms.length) {
    setItem(STORAGE_KEYS.ROOMS, filtered);
    // Opcionalmente, limpar dados de salas removidas
    const removedIds = rooms
      .filter((r) => !filtered.some((f) => f.id === r.id))
      .map((r) => r.id);
    removedIds.forEach((id) => {
      removeItem(`${STORAGE_KEYS.CAMPAIGN}:${id}`);
      removeItem(`${STORAGE_KEYS.CHARACTERS}:${id}`);
      removeItem(`${STORAGE_KEYS.ROOM_STATE}:${id}`);
    });
  }
}
