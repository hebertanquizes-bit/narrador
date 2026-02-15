"use client";

import { MessageSquare, Play } from "lucide-react";
import { useRoom } from "@/context/RoomContext";

export default function RefinementPhase() {
  const {
    isHost,
    refinementQuestions,
    refinementAnswers,
    setRefinementAnswerByIndex,
    confirmRefinementAndPlay,
  } = useRoom();

  return (
    <div className="panel space-y-6">
      <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-rpg-accent" />
        Refinamento — Perguntas ao Host
      </h2>
      <p className="text-sm text-rpg-muted">
        A IA pode fazer perguntas pontuais antes do início da narração. Responda abaixo (opcional) e confirme para iniciar.
      </p>

      <ul className="space-y-4">
        {refinementQuestions.map((q, i) => (
          <li key={i} className="rounded-lg border border-rpg-border bg-rpg-dark p-3">
            <p className="text-sm font-medium text-gray-200 mb-2">{q}</p>
            <input
              type="text"
              value={refinementAnswers[i] ?? ""}
              onChange={(e) => setRefinementAnswerByIndex(i, e.target.value)}
              placeholder="Sua resposta (opcional)"
              className="input-field"
              disabled={!isHost}
            />
          </li>
        ))}
      </ul>

      {isHost && (
        <button
          type="button"
          onClick={confirmRefinementAndPlay}
          className="btn-primary flex items-center gap-2"
        >
          <Play className="h-5 w-5" />
          Confirmar e iniciar narração
        </button>
      )}

      {!isHost && (
        <p className="text-sm text-rpg-muted">
          Aguardando o Host confirmar e iniciar a narração.
        </p>
      )}
    </div>
  );
}
