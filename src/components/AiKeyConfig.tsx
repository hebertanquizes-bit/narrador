"use client";

import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, AlertCircle, Cpu, Server } from "lucide-react";
import {
  getAiKey,
  setAiKey,
  clearAiKey,
  hasAiKeyConfigured,
  getAiModel,
  setAiModel,
  getAiProvider,
  setAiProvider,
} from "@/lib/ai-key";
import { AI_PROVIDERS, getProvider, getDefaultModelForProvider } from "@/lib/ai-providers";
import type { AiProviderId } from "@/lib/ai-providers";

type Props = { isHost: boolean };

export default function AiKeyConfig({ isHost }: Props) {
  const [key, setKey] = useState("");
  const [provider, setProviderState] = useState<AiProviderId>(getAiProvider());
  const [model, setModelState] = useState(getAiModel());
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKey(getAiKey() ?? "");
    setProviderState(getAiProvider());
    setModelState(getAiModel());
    setSaved(hasAiKeyConfigured());
  }, []);

  const currentProviderConfig = getProvider(provider);
  const models = currentProviderConfig?.models ?? [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      setAiKey(key.trim());
      setAiProvider(provider);
      setAiModel(model);
      setSaved(true);
    } else {
      clearAiKey();
      setSaved(false);
    }
  };

  const handleProviderChange = (value: AiProviderId) => {
    setProviderState(value);
    setAiProvider(value);
    const defaultModel = getDefaultModelForProvider(value);
    setModelState(defaultModel);
    setAiModel(defaultModel);
  };

  const handleModelChange = (value: string) => {
    setModelState(value);
    setAiModel(value);
  };

  const handleClear = () => {
    clearAiKey();
    setKey("");
    setSaved(false);
  };

  if (!isHost) {
    return (
      <div className="panel">
        <h2 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <Key className="h-5 w-5 text-rpg-accent" />
          Configuração de IA
        </h2>
        <p className="text-rpg-muted text-sm">
          Apenas o Host pode configurar a API Key da IA.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
        <Key className="h-5 w-5 text-rpg-accent" />
        Configuração de IA (Host)
      </h2>
      <p className="text-rpg-muted text-sm mb-4">
        Sua API Key fica salva apenas no seu navegador (LocalStorage).
      </p>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4">
        <p className="text-sm text-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Provedores:</strong> OpenAI (GPT), Google Gemini, Anthropic (Claude) e DeepSeek. Escolha o provedor, o modelo e cole a chave correspondente. Links: OpenAI API keys, Google AI Studio, Anthropic Console, DeepSeek Platform.
          </span>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <Server className="h-4 w-4" />
            Provedor de IA
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as AiProviderId)}
            className="input-field"
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Modelo que será usado na narração
          </label>
          <select
            value={models.includes(model) ? model : currentProviderConfig?.defaultModel ?? ""}
            onChange={(e) => handleModelChange(e.target.value)}
            className="input-field"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-rpg-muted">
            O token da sua conta define quais modelos estão disponíveis. Se der erro, troque o modelo ou o provedor.
          </p>
        </div>

        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rpg-muted" />
          <input
            type={visible ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={currentProviderConfig?.keyPlaceholder ?? "API Key"}
            className="input-field pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-rpg-muted hover:text-gray-300"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {currentProviderConfig?.keyHelpUrl && (
          <p className="text-xs text-rpg-muted">
            Obter chave:{" "}
            <a
              href={currentProviderConfig.keyHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rpg-accent hover:underline"
            >
              {currentProviderConfig.keyHelpUrl}
            </a>
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Key className="h-4 w-4" />
            Salvar no navegador
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary"
          >
            Limpar
          </button>
        </div>
      </form>
      {saved && (
        <p className="mt-2 text-sm text-rpg-success">
          API Key salva. Provedor: <strong>{currentProviderConfig?.label ?? provider}</strong>. Modelo: <strong>{getAiModel()}</strong>.
        </p>
      )}
    </div>
  );
}
