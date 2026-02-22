/**
 * Helpers para LocalStorage – tudo fica só no navegador do usuário.
 * Chaves usadas no app (para você encontrar no DevTools > Application > Local Storage):
 * - narrador_user, narrador_rooms, narrador_campaign, narrador_characters, narrador_ai_key, narrador_ai_provider, narrador_ai_model, narrador_room_state
 */

const PREFIX = "narrador_";

export const STORAGE_KEYS = {
  USER: `${PREFIX}user`,
  ROOMS: `${PREFIX}rooms`,
  CAMPAIGN: `${PREFIX}campaign`,
  CHARACTERS: `${PREFIX}characters`,
  AI_KEY: `${PREFIX}ai_key`,
  AI_PROVIDER: `${PREFIX}ai_provider`,
  AI_MODEL: `${PREFIX}ai_model`,
  ROOM_STATE: `${PREFIX}room_state`,
  GAME_SYSTEMS: `${PREFIX}game_systems`,
} as const;

export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("LocalStorage setItem failed", e);
  }
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
