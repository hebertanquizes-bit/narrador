"use client";

import { useState, useEffect } from "react";
import { FileUp, HelpCircle, Scale } from "lucide-react";
import {
  getOrCreateCampaignConfig,
  saveCampaignConfig,
} from "@/lib/campaign";
import type { CampaignConfig as CampaignConfigType } from "@/lib/types";
import { useRoom } from "@/context/RoomContext";

type Props = { roomId: string; isHost: boolean };

export default function CampaignConfig({ roomId, isHost }: Props) {
  const { invalidateChecklist } = useRoom();
  const [config, setConfig] = useState<CampaignConfigType | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  useEffect(() => {
    const c = getOrCreateCampaignConfig(roomId);
    setConfig(c);
    setUploadedName(c.uploadedFileName);
  }, [roomId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    setUploadedName(file.name);
    const next = { ...config, uploadedFileName: file.name };
    setConfig(next);
    saveCampaignConfig(next);
    invalidateChecklist();
  };

  const handleClarificationsChange = (checked: boolean) => {
    if (!config) return;
    const next = { ...config, aiCanAskClarifications: checked };
    setConfig(next);
    saveCampaignConfig(next);
    invalidateChecklist();
  };

  const handleRulesChange = (value: string) => {
    if (!config) return;
    const next = { ...config, rulesAuthority: value };
    setConfig(next);
    saveCampaignConfig(next);
    invalidateChecklist();
  };

  if (!config) return null;
  if (!isHost) {
    return (
      <div className="panel">
        <h2 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <Scale className="h-5 w-5 text-rpg-accent" />
          Configuração da Campanha
        </h2>
        <p className="text-rpg-muted text-sm">
          Apenas o Host pode editar a configuração da campanha.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <Scale className="h-5 w-5 text-rpg-accent" />
        Configuração da Campanha (Host)
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Upload de arquivo (apenas salva o nome)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-rpg-muted file:mr-4 file:rounded file:border-0 file:bg-rpg-accent file:px-4 file:py-2 file:text-white file:hover:opacity-90"
          />
          {uploadedName && (
            <p className="mt-2 text-sm text-rpg-success">
              Arquivo salvo: <strong>{uploadedName}</strong>
            </p>
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.aiCanAskClarifications}
            onChange={(e) => handleClarificationsChange(e.target.checked)}
            className="h-4 w-4 rounded border-rpg-border bg-rpg-dark text-rpg-accent focus:ring-rpg-accent"
          />
          <HelpCircle className="h-4 w-4 text-rpg-muted" />
          <span className="text-sm text-gray-300">
            IA pode pedir esclarecimentos
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Autoridade de regras (texto fixo)
          </label>
          <textarea
            value={config.rulesAuthority}
            onChange={(e) => handleRulesChange(e.target.value)}
            placeholder="Ex.: D&D 5e, sistema próprio..."
            rows={3}
            className="input-field resize-none"
          />
        </div>
      </div>
    </div>
  );
}
