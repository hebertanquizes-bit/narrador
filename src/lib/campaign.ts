"use client";

import { STORAGE_KEYS, getItem, setItem } from "./storage";
import type { CampaignConfig } from "./types";

export function getCampaignConfig(roomId: string): CampaignConfig | null {
  const all = getItem<Record<string, CampaignConfig>>(STORAGE_KEYS.CAMPAIGN);
  return all?.[roomId] ?? null;
}

export function saveCampaignConfig(config: CampaignConfig): void {
  const all = getItem<Record<string, CampaignConfig>>(STORAGE_KEYS.CAMPAIGN) ?? {};
  all[config.roomId] = config;
  setItem(STORAGE_KEYS.CAMPAIGN, all);
}

export function getOrCreateCampaignConfig(roomId: string): CampaignConfig {
  const existing = getCampaignConfig(roomId);
  if (existing) return existing;
  const config: CampaignConfig = {
    roomId,
    uploadedFileName: null,
    aiCanAskClarifications: true,
    rulesAuthority: "",
  };
  saveCampaignConfig(config);
  return config;
}
