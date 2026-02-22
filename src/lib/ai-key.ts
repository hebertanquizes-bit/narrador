"use client";

import { STORAGE_KEYS, getItem, setItem, removeItem } from "./storage";
import type { AiProviderId } from "./ai-providers";
import {
  getDefaultModelForProvider,
  getModelsForProvider,
} from "./ai-providers";

/** API Key fica apenas no LocalStorage do navegador do Host. */
export function getAiKey(): string | null {
  return getItem<string>(STORAGE_KEYS.AI_KEY) ?? null;
}

export function setAiKey(key: string): void {
  setItem(STORAGE_KEYS.AI_KEY, key.trim());
}

export function clearAiKey(): void {
  removeItem(STORAGE_KEYS.AI_KEY);
}

export function hasAiKeyConfigured(): boolean {
  const key = getAiKey();
  return typeof key === "string" && key.length > 0;
}

/** Provedor de IA (OpenAI, Gemini, Anthropic, DeepSeek). */
const DEFAULT_PROVIDER: AiProviderId = "openai";

export function getAiProvider(): AiProviderId {
  const stored = getItem<string>(STORAGE_KEYS.AI_PROVIDER);
  const valid: AiProviderId[] = ["openai", "gemini", "anthropic", "deepseek"];
  if (typeof stored === "string" && valid.includes(stored as AiProviderId)) {
    return stored as AiProviderId;
  }
  return DEFAULT_PROVIDER;
}

export function setAiProvider(provider: AiProviderId): void {
  setItem(STORAGE_KEYS.AI_PROVIDER, provider);
}

/** Modelo usado na narração (validado para o provedor atual). */
export function getAiModel(): string {
  const provider = getAiProvider();
  const stored = getItem<string>(STORAGE_KEYS.AI_MODEL);
  const models = getModelsForProvider(provider);
  if (typeof stored === "string" && stored.length > 0 && models.includes(stored)) {
    return stored;
  }
  return getDefaultModelForProvider(provider);
}

export function setAiModel(model: string): void {
  const provider = getAiProvider();
  const models = getModelsForProvider(provider);
  const toSave = model.trim();
  setItem(
    STORAGE_KEYS.AI_MODEL,
    toSave && models.includes(toSave) ? toSave : getDefaultModelForProvider(provider)
  );
}
