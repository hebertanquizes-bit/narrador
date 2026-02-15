"use client";

import { useState } from "react";
import { Send, Swords, MessageCircle, Users, Loader2, Flag } from "lucide-react";
import { useRoom } from "@/context/RoomContext";
import type { GameMessage } from "@/lib/types";

function MessageBubble({ msg, isNarrative, isConsult, isFromMe, senderName }: {
  msg: GameMessage;
  isNarrative: boolean;
  isConsult: boolean;
  isFromMe: boolean;
  senderName?: string;
}) {
  if (msg.from === "ai") {
    return (
      <div
        className={`rounded-lg p-4 ${
          isNarrative
            ? "bg-rpg-gold/10 border border-rpg-gold/30 text-amber-100"
            : "bg-rpg-accent/10 border border-rpg-accent/30 text-blue-100"
        }`}
      >
        <p className="text-xs font-medium text-rpg-muted mb-1">
          {isNarrative ? "Narração" : "IA (resposta à dúvida)"}
        </p>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.targetPlayerName && (
          <p className="mt-2 text-sm text-rpg-gold">
            → Direcionado a: {msg.targetPlayerName}
          </p>
        )}
      </div>
    );
  }

  const kindLabel =
    msg.kind === "action"
      ? "Agir"
      : msg.kind === "consult"
        ? "Consultar"
        : msg.kind === "interact"
          ? "Interagir"
          : "Mensagem";

  return (
    <div
      className={`rounded-lg p-3 ${
        isFromMe
          ? "ml-auto max-w-[85%] bg-rpg-accent/20 border border-rpg-accent/30"
          : "mr-auto max-w-[85%] bg-rpg-panel border border-rpg-border"
      }`}
    >
      <p className="text-xs font-medium text-rpg-muted mb-1">
        {kindLabel}
        {!isFromMe && senderName && ` — ${senderName}`}
      </p>
      <p className="whitespace-pre-wrap text-gray-200">{msg.content}</p>
    </div>
  );
}

export default function GameChat() {
  const {
    messages,
    participants,
    currentTurnPlayerId,
    currentUser,
    isAiProcessing,
    turnStatusLabel,
    isHost,
    sendAction,
    sendConsult,
    sendInteract,
    finalizeTurn,
    passTurnToNextPlayer,
  } = useRoom();

  const getSenderName = (userId: string) =>
    participants.find((p) => p.userId === userId)?.name ?? userId;

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"action" | "consult" | "interact">("action");
  const [finalizing, setFinalizing] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (isInputDisabled) return;
    if (mode === "action") sendAction(text);
    if (mode === "consult") sendConsult(text);
    if (mode === "interact") sendInteract(text);
    setInput("");
  };

  const isMyTurn = currentUser && currentTurnPlayerId === currentUser.id;
  const isInputDisabled = !isMyTurn || isAiProcessing;

  const handleFinalizeTurn = async () => {
    if (!isMyTurn || isAiProcessing || finalizing) return;
    setFinalizing(true);
    try {
      await finalizeTurn();
    } finally {
      setFinalizing(false);
    }
  };

  const realParticipants = participants.filter((p) => !p.isSimulated);

  return (
    <div className="panel flex flex-col h-[560px]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
          <Swords className="h-5 w-5 text-rpg-gold" />
          Narrativa
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {isAiProcessing && (
            <span className="rounded px-2 py-1 text-sm bg-amber-500/20 text-amber-200 flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              A IA está narrando...
            </span>
          )}
          {!isAiProcessing && (
            <span
              className={`rounded px-2 py-1 text-sm ${
                isMyTurn ? "bg-rpg-gold/20 text-rpg-gold" : "bg-rpg-border text-rpg-muted"
              }`}
            >
              {turnStatusLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <p className="text-rpg-muted text-sm">Aguardando a introdução da IA.</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isNarrative={msg.kind === "narrative"}
              isConsult={msg.kind === "consult" || (msg.from === "ai" && msg.kind !== "narrative")}
              isFromMe={currentUser?.id === msg.from}
              senderName={msg.from !== "ai" ? getSenderName(msg.from) : undefined}
            />
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { id: "action" as const, label: "Agir", icon: Swords },
              { id: "consult" as const, label: "Consultar", icon: MessageCircle },
              { id: "interact" as const, label: "Interagir", icon: Users },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              disabled={isInputDisabled}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                mode === id
                  ? "border-rpg-accent bg-rpg-accent/20 text-white"
                  : "border-rpg-border text-rpg-muted hover:border-rpg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isInputDisabled
                ? isAiProcessing
                  ? "A IA está narrando..."
                  : "Aguardando sua vez..."
                : mode === "action"
                  ? "Descreva sua ação..."
                  : mode === "consult"
                    ? "Pergunte à IA (fora do personagem)..."
                    : "Fale com o NPC..."
            }
            className="input-field flex-1 min-w-0"
            disabled={isInputDisabled}
          />
          <button
            type="submit"
            disabled={isInputDisabled}
            className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            Enviar
          </button>
          {isMyTurn && !isAiProcessing && (
            <button
              type="button"
              onClick={handleFinalizeTurn}
              disabled={finalizing}
              className="btn-secondary flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Devolver o turno à IA para narração da consequência e progressão"
            >
              {finalizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              {finalizing ? "Processando..." : "Finalizar Turno"}
            </button>
          )}
        </div>
        {isHost && realParticipants.length > 1 && !isAiProcessing && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-rpg-muted">Passar a bola (Host):</span>
            {realParticipants.map((p) => (
              <button
                key={p.userId}
                type="button"
                onClick={() => passTurnToNextPlayer(p.userId)}
                className={`rounded border px-2 py-1 text-xs transition ${
                  currentTurnPlayerId === p.userId
                    ? "border-rpg-gold bg-rpg-gold/20 text-rpg-gold"
                    : "border-rpg-border text-rpg-muted hover:border-rpg-muted"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
