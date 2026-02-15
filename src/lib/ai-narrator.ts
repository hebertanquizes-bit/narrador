"use client";

import type { GameMessage } from "./types";

export type NarratorContextMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Monta o histórico da conversa para enviar à IA.
 * Inclui regras e mensagens na ordem correta (jogador → IA só após "Finalizar Turno").
 */
export function buildNarratorContext(
  messages: GameMessage[],
  rulesAuthority: string,
  participantNames: { userId: string; name: string }[]
): NarratorContextMessage[] {
  const systemParts: string[] = [
    "Você é o Narrador de um RPG de mesa. Sua resposta deve ser APENAS um bloco de narração em português, sem meta-comentários.",
    "Faça: (1) Valide se a ação do jogador teve sucesso conforme as regras; (2) Descreva a consequência no mundo do jogo; (3) Avance a cena e direcione o foco para o próximo jogador ou para o grupo.",
    "Responda em um único parágrafo ou poucos parágrafos, no estilo narrativo.",
  ];
  if (rulesAuthority?.trim()) {
    systemParts.push(`Autoridade de regras do sistema: ${rulesAuthority.trim()}`);
  }
  systemParts.push(
    `Jogadores na mesa: ${participantNames.map((p) => `${p.name} (id: ${p.userId})`).join(", ")}.`
  );

  const result: NarratorContextMessage[] = [
    { role: "system", content: systemParts.join("\n\n") },
  ];

  for (const msg of messages) {
    if (msg.from === "ai") {
      result.push({ role: "assistant", content: msg.content });
    } else {
      const name = participantNames.find((p) => p.userId === msg.from)?.name ?? msg.from;
      const kind =
        msg.kind === "action"
          ? "Ação"
          : msg.kind === "consult"
            ? "Consulta (fora do personagem)"
            : msg.kind === "interact"
              ? "Interação com NPC"
              : "Mensagem";
      result.push({
        role: "user",
        content: `[${name}] (${kind}): ${msg.content}`,
      });
    }
  }

  return result;
}

export type NarratorApiResult = {
  narrative: string;
  model?: string;
  error?: string;
};

/**
 * Chama a API de narração (via rota do projeto).
 * O histórico já deve estar atualizado com a resposta do jogador antes de chamar.
 * provider: openai | gemini | anthropic | deepseek
 */
export async function callNarratorApi(
  context: NarratorContextMessage[],
  apiKey: string,
  model: string,
  provider: string
): Promise<NarratorApiResult> {
  const res = await fetch("/api/narrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: context.map((m) => ({ role: m.role, content: m.content })),
      apiKey,
      model: model || "gpt-4o-mini",
      provider: provider || "openai",
    }),
  });

  const raw = await res.text();
  let data: { narrative?: string; model?: string; error?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    return { narrative: "", error: raw || res.statusText };
  }

  if (!res.ok) {
    return {
      narrative: "",
      model: data.model,
      error: data.error || raw || res.statusText,
    };
  }
  if (data.error) return { narrative: "", model: data.model, error: data.error };
  return {
    narrative: data.narrative ?? "",
    model: data.model,
    error: data.error,
  };
}

/**
 * Resposta simulada quando não há API key ou para fallback.
 */
export function getSimulatedNarrative(
  lastPlayerContent: string,
  playerName: string
): string {
  return (
    `A ação de ${playerName} reverbera na taverna. ` +
    `"${lastPlayerContent.slice(0, 80)}${lastPlayerContent.length > 80 ? "…" : ""}" — ` +
    `o Narrador considera as regras e o momento. A cena se desenrola: algo muda no ambiente, e os olhares se voltam para o que vem a seguir. ` +
    `Quem age agora?`
  );
}
