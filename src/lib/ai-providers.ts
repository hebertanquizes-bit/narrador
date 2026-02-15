/**
 * Provedores de IA e modelos disponíveis para narração.
 * Usado na Config de IA (Host) e na rota /api/narrate.
 */

export type AiProviderId = "openai" | "gemini" | "anthropic" | "deepseek";

export type AiProviderOption = {
  id: AiProviderId;
  label: string;
  models: readonly string[];
  defaultModel: string;
  keyPlaceholder: string;
  keyHelpUrl: string;
};

export const AI_PROVIDERS: AiProviderOption[] = [
  {
    id: "openai",
    label: "OpenAI (GPT)",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    keyPlaceholder: "sk-...",
    keyHelpUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    models: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
    ],
    defaultModel: "gemini-2.0-flash",
    keyPlaceholder: "Chave API Google AI",
    keyHelpUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    defaultModel: "claude-3-5-sonnet-20241022",
    keyPlaceholder: "sk-ant-...",
    keyHelpUrl: "https://console.anthropic.com/",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    defaultModel: "deepseek-chat",
    keyPlaceholder: "sk-...",
    keyHelpUrl: "https://platform.deepseek.com/api_keys",
  },
];

export function getProvider(id: AiProviderId): AiProviderOption | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function getModelsForProvider(providerId: AiProviderId): readonly string[] {
  return getProvider(providerId)?.models ?? [];
}

export function getDefaultModelForProvider(providerId: AiProviderId): string {
  return getProvider(providerId)?.defaultModel ?? "gpt-4o-mini";
}
