"use client";

import { STORAGE_KEYS, getItem, setItem, removeItem } from "./storage";
import type { User } from "./types";

export function getCurrentUser(): User | null {
  return getItem<User>(STORAGE_KEYS.USER);
}

export function setCurrentUser(user: User): void {
  setItem(STORAGE_KEYS.USER, user);
}

export function logout(): void {
  removeItem(STORAGE_KEYS.USER);
}

export function loginWithEmail(email: string, _password: string): User {
  const user: User = {
    id: "usr-" + Date.now(),
    email,
    name: email.split("@")[0],
    provider: "email",
  };
  setCurrentUser(user);
  return user;
}

/** Simula login com Google – em produção você trocaria por OAuth real. */
export function loginWithGoogle(): User {
  const user: User = {
    id: "usr-google-" + Date.now(),
    email: "usuario.google@gmail.com",
    name: "Jogador Google",
    provider: "google",
  };
  setCurrentUser(user);
  return user;
}
