"use client";

import { Check, Circle, Play, UserCheck, UserPlus } from "lucide-react";
import { useRoom } from "@/context/RoomContext";

const LOBBY_CHECKLIST_ITEMS = [
  { key: "backendOk" as const, label: "Sistema carregado (Backend OK)" },
  { key: "campaignLoaded" as const, label: "Campanha carregada (Dados de cenário carregados)" },
  { key: "charactersValid" as const, label: "Personagens válidos (Fichas preenchidas)" },
  { key: "playersReady" as const, label: "Jogadores prontos (Ready check finalizado)" },
] as const;

export default function LobbySection() {
  const {
    isHost,
    participants,
    ready,
    checklist,
    canStart,
    pendingReadyNames,
    setReady,
    toggleSimulatedReady,
    addTestParticipant,
    startCampaign,
    currentUser,
  } = useRoom();

  return (
    <div className="panel space-y-6">
      <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-rpg-accent" />
        Lobby — Início da Campanha
      </h2>

      {isHost && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-sm text-amber-200">
            <strong>Checklist em tempo real</strong> — Todas as condições abaixo devem estar OK e todos os jogadores devem marcar &quot;Estou pronto&quot; para o botão &quot;Iniciar Campanha&quot; ser liberado.
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Checklist (Host)</h3>
        <ul className="space-y-2">
          {LOBBY_CHECKLIST_ITEMS.map(({ key, label }) => {
            const done = checklist[key];
            return (
              <li key={key} className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-rpg-success bg-rpg-success/20 text-rpg-success"
                      : "border-rpg-border text-rpg-muted"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <span className={done ? "text-gray-200" : "text-rpg-muted"}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Jogadores na sala</h3>
        <ul className="space-y-2">
          {participants.map((p) => {
            const isReady = ready[p.userId];
            const isMe = currentUser?.id === p.userId;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-rpg-border bg-rpg-dark p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      isReady
                        ? "border-rpg-success bg-rpg-success/20 text-rpg-success"
                        : "border-rpg-border text-rpg-muted"
                    }`}
                  >
                    {isReady ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <span className="font-medium text-gray-200">
                    {p.name}
                    {p.isSimulated && (
                      <span className="ml-2 text-xs text-rpg-muted">(teste)</span>
                    )}
                    {isMe && (
                      <span className="ml-2 text-xs text-rpg-accent">(você)</span>
                    )}
                  </span>
                </div>
                {isMe ? (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!isReady}
                      onChange={(e) => setReady(e.target.checked)}
                      className="h-4 w-4 rounded border-rpg-border bg-rpg-dark text-rpg-accent focus:ring-rpg-accent"
                    />
                    <span className="text-sm text-gray-300">Estou pronto</span>
                  </label>
                ) : (
                  p.isSimulated &&
                  isHost && (
                    <button
                      type="button"
                      onClick={() => toggleSimulatedReady(p.userId)}
                      className="text-sm text-rpg-accent hover:underline"
                    >
                      {isReady ? "Marcar não pronto" : "Marcar como pronto"}
                    </button>
                  )
                )}
              </li>
            );
          })}
        </ul>
        {participants.length === 0 && (
          <p className="text-rpg-muted text-sm">Nenhum jogador na sala ainda.</p>
        )}
      </div>

      {pendingReadyNames.length > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <strong>Pendentes no Ready Check:</strong> {pendingReadyNames.join(", ")}
        </p>
      )}

      {isHost && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startCampaign}
            disabled={!canStart}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-5 w-5" />
            Iniciar Campanha
          </button>
          {!canStart && (
            <span className="text-sm text-rpg-muted">
              {!checklist.playersReady
                ? "Todos os jogadores devem marcar &quot;Estou pronto&quot;."
                : "Complete o checklist acima."}
            </span>
          )}
          <button
            type="button"
            onClick={addTestParticipant}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Simular jogador (teste)
          </button>
        </div>
      )}
    </div>
  );
}
