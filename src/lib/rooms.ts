"use client";

import { STORAGE_KEYS, getItem, setItem } from "./storage";
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
