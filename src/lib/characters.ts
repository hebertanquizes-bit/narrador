"use client";

import { STORAGE_KEYS, getItem, setItem } from "./storage";
import type { Character } from "./types";

export function getCharacters(roomId: string): Character[] {
  const all = getItem<Character[]>(STORAGE_KEYS.CHARACTERS) ?? [];
  return all.filter((c) => c.roomId === roomId);
}

export function addCharacter(
  roomId: string,
  userId: string,
  userName: string,
  sheetFileName: string
): Character {
  const all = getItem<Character[]>(STORAGE_KEYS.CHARACTERS) ?? [];
  const char: Character = {
    id: "char-" + Date.now(),
    roomId,
    userId,
    userName,
    sheetFileName,
    approved: false,
    createdAt: Date.now(),
  };
  setItem(STORAGE_KEYS.CHARACTERS, [...all, char]);
  return char;
}

export function approveCharacter(characterId: string): void {
  const all = getItem<Character[]>(STORAGE_KEYS.CHARACTERS) ?? [];
  const updated = all.map((c) =>
    c.id === characterId ? { ...c, approved: true } : c
  );
  setItem(STORAGE_KEYS.CHARACTERS, updated);
}

export function getPendingCharacters(roomId: string): Character[] {
  return getCharacters(roomId).filter((c) => !c.approved);
}

export function getApprovedCharacters(roomId: string): Character[] {
  return getCharacters(roomId).filter((c) => c.approved);
}
