"use client";

import { useState, useEffect } from "react";
import { Upload, UserPlus, Check, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getCharacters,
  getPendingCharacters,
  addCharacter,
  approveCharacter,
} from "@/lib/characters";
import { useRoom } from "@/context/RoomContext";

type Props = { roomId: string; isHost: boolean };

export default function CharactersSection({ roomId, isHost }: Props) {
  const { invalidateChecklist } = useRoom();
  const [characters, setCharacters] = useState(getCharacters(roomId));
  const [pending, setPending] = useState(getPendingCharacters(roomId));
  const [uploadedFileName, setUploadedFileName] = useState("");
  const user = getCurrentUser();

  const refresh = () => {
    setCharacters(getCharacters(roomId));
    setPending(getPendingCharacters(roomId));
    invalidateChecklist();
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadedFileName.trim()) return;
    addCharacter(roomId, user.id, user.name, uploadedFileName.trim());
    setUploadedFileName("");
    refresh();
  };

  const handleApprove = (characterId: string) => {
    approveCharacter(characterId);
    refresh();
  };

  useEffect(() => {
    refresh();
  }, [roomId]);

  return (
    <div className="panel">
      <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-rpg-accent" />
        Personagens
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Simular upload de ficha
          </label>
          <form onSubmit={handleSimulateUpload} className="flex gap-2">
            <input
              type="text"
              value={uploadedFileName}
              onChange={(e) => setUploadedFileName(e.target.value)}
              placeholder="Nome do arquivo da ficha (ex.: ficha_guerreiro.pdf)"
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary flex items-center gap-2 shrink-0">
              <Upload className="h-4 w-4" />
              Enviar
            </button>
          </form>
          <p className="mt-1 text-xs text-rpg-muted">
            Neste MVP apenas o nome do arquivo é salvo (sem upload real).
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-rpg-gold" />
            Pendentes de aprovação (Host)
          </h3>
          {pending.length === 0 ? (
            <p className="text-rpg-muted text-sm">Nenhum personagem pendente.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-rpg-border bg-rpg-dark p-3"
                >
                  <div>
                    <span className="font-medium text-gray-200">{c.userName}</span>
                    <span className="ml-2 text-sm text-rpg-muted">
                      — {c.sheetFileName}
                    </span>
                  </div>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => handleApprove(c.id)}
                      className="flex items-center gap-1 rounded bg-rpg-success/20 px-2 py-1 text-sm text-rpg-success hover:bg-rpg-success/30"
                    >
                      <Check className="h-4 w-4" />
                      Aprovar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Check className="h-4 w-4 text-rpg-success" />
            Aprovados
          </h3>
          {characters.filter((c) => c.approved).length === 0 ? (
            <p className="text-rpg-muted text-sm">Nenhum personagem aprovado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {characters
                .filter((c) => c.approved)
                .map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-rpg-border bg-rpg-dark p-3"
                  >
                    <span className="font-medium text-gray-200">{c.userName}</span>
                    <span className="ml-2 text-sm text-rpg-muted">
                      — {c.sheetFileName}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
