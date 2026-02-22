"use client";

import { STORAGE_KEYS, getItem, setItem } from "./storage";
import type { GameSystem, SystemTemplate } from "./types";

/**
 * Sistemas pré-definidos (built-in)
 * Cada um tem um template com regras estruturadas
 */
const BUILTIN_SYSTEMS: Record<string, SystemTemplate> = {
  "dnd5e": {
    id: "dnd5e",
    name: "D&D 5e",
    version: "5.1",
    isBuiltIn: true,
    attributes: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
    skills: [
      "Acrobatics",
      "Animal Handling",
      "Arcana",
      "Athletics",
      "Deception",
      "History",
      "Insight",
      "Intimidation",
      "Investigation",
      "Medicine",
      "Nature",
      "Perception",
      "Performance",
      "Persuasion",
      "Religion",
      "Sleight of Hand",
      "Stealth",
      "Survival",
    ],
    spellLevels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    combatRules: {
      initiativeFormula: "DEX",
      actionEconomy: "1 action + 1 bonus action + 1 reaction",
      armorClasses: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    },
  },
  "gurps": {
    id: "gurps",
    name: "GURPS",
    version: "4e",
    isBuiltIn: true,
    attributes: ["ST", "DX", "IQ", "HT"],
    skills: ["Melee Weapons", "Ranged Weapons", "Magic", "Dodge", "Parry"],
    spellLevels: [],
    combatRules: {
      initiativeFormula: "HT",
      actionEconomy: "1 turn per round",
      armorClasses: [],
    },
  },
  "storyteller": {
    id: "storyteller",
    name: "Storyteller (World of Darkness)",
    version: "core",
    isBuiltIn: true,
    attributes: ["Strength", "Dexterity", "Stamina", "Charisma", "Manipulation", "Appearance", "Perception", "Intelligence", "Wits"],
    skills: ["Athletics", "Brawl", "Craft", "Drive", "Firearms", "Larceny", "Melee", "Occult", "Stealth", "Survival"],
    spellLevels: [],
    combatRules: {
      initiativeFormula: "Dexterity + Wits",
      actionEconomy: "1 action per turn",
      armorClasses: [],
    },
  },
};

/**
 * Obter todos os sistemas disponíveis (built-in + homebrews do usuário)
 */
export function getAvailableSystems(userId: string): GameSystem[] {
  const builtIn = Object.values(BUILTIN_SYSTEMS).map((t) => ({
    id: t.id,
    name: t.name,
    isBuiltIn: true,
    template: t,
  }));

  const homebrews = getItem<GameSystem[]>(
    `${STORAGE_KEYS.GAME_SYSTEMS}_${userId}`
  ) ?? [];

  return [...builtIn, ...homebrews];
}

/**
 * Obter sistema específico
 */
export function getSystem(systemId: string, userId?: string): GameSystem | null {
  // Verificar built-in
  const builtin = BUILTIN_SYSTEMS[systemId];
  if (builtin) {
    return {
      id: builtin.id,
      name: builtin.name,
      isBuiltIn: true,
      template: builtin,
    };
  }

  // Verificar homebrew do usuário
  if (userId) {
    const homebrews = getItem<GameSystem[]>(
      `${STORAGE_KEYS.GAME_SYSTEMS}_${userId}`
    ) ?? [];
    return homebrews.find((s) => s.id === systemId) ?? null;
  }

  return null;
}

/**
 * Adicionar homebrew (sistema custom do usuário)
 * Template pode ser JSON convertido de PDF ou criado manualmente
 */
export function addHomebrew(
  userId: string,
  system: Omit<GameSystem, "id">
): GameSystem {
  const homebrews = getItem<GameSystem[]>(
    `${STORAGE_KEYS.GAME_SYSTEMS}_${userId}`
  ) ?? [];

  const newSystem: GameSystem = {
    ...system,
    id: `homebrew-${Date.now()}`,
  };

  homebrews.push(newSystem);
  setItem(`${STORAGE_KEYS.GAME_SYSTEMS}_${userId}`, homebrews);
  return newSystem;
}

/**
 * Deletar homebrew
 */
export function deleteHomebrew(userId: string, systemId: string): void {
  const homebrews = getItem<GameSystem[]>(
    `${STORAGE_KEYS.GAME_SYSTEMS}_${userId}`
  ) ?? [];

  const filtered = homebrews.filter((s) => s.id !== systemId);
  setItem(`${STORAGE_KEYS.GAME_SYSTEMS}_${userId}`, filtered);
}

/**
 * Converter JSON de PDF para GameSystem
 * (Usado quando um PDF é processado pelo backend)
 */
export function parseSystemFromJSON(data: unknown): SystemTemplate {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid system JSON");
  }

  const obj = data as any;
  return {
    id: obj.id || `custom-${Date.now()}`,
    name: obj.name || "Custom System",
    version: obj.version || "1.0",
    isBuiltIn: false,
    attributes: obj.attributes || [],
    skills: obj.skills || [],
    spellLevels: obj.spellLevels || [],
    combatRules: obj.combatRules || {},
  };
}
