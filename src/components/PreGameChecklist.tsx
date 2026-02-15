"use client";

import { useMemo } from "react";
import { Check, Circle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getRoomById } from "@/lib/rooms";
import { getApprovedCharacters } from "@/lib/characters";
import { hasAiKeyConfigured } from "@/lib/ai-key";

type Props = { roomId: string; isHost: boolean };

const steps = [
  { id: "auth", label: "Auth OK" },
  { id: "room", label: "Sala Criada" },
  { id: "sheets", label: "Fichas Aprovadas" },
  { id: "token", label: "Token IA Configurado" },
] as const;

export default function PreGameChecklist({ roomId, isHost }: Props) {
  const user = getCurrentUser();
  const room = useMemo(() => getRoomById(roomId), [roomId]);
  const approved = useMemo(() => getApprovedCharacters(roomId), [roomId]);
  const aiConfigured = useMemo(() => hasAiKeyConfigured(), []);

  const stepStatus = useMemo(() => {
    const authOk = !!user;
    const roomOk = !!room;
    const sheetsOk = approved.length > 0;
    const tokenOk = isHost ? aiConfigured : true;

    return {
      auth: authOk,
      room: roomOk,
      sheets: sheetsOk,
      token: tokenOk,
    };
  }, [user, room, approved.length, isHost, aiConfigured]);

  const stepList = [
    { ...steps[0], done: stepStatus.auth },
    { ...steps[1], done: stepStatus.room },
    { ...steps[2], done: stepStatus.sheets },
    { ...steps[3], done: stepStatus.token },
  ];

  return (
    <div className="panel">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Checklist Pré-Jogo
      </h2>
      <div className="flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-4">
        {stepList.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                step.done
                  ? "border-rpg-success bg-rpg-success/20 text-rpg-success"
                  : "border-rpg-border text-rpg-muted"
              }`}
            >
              {step.done ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            <span
              className={`text-sm ${
                step.done ? "text-gray-200" : "text-rpg-muted"
              }`}
            >
              {step.label}
            </span>
            {index < stepList.length - 1 && (
              <div className="hidden h-px flex-1 bg-rpg-border sm:block sm:w-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
