import { NextRequest, NextResponse } from "next/server";
import type { AiProviderId } from "@/lib/ai-providers";

type Message = { role: "system" | "user" | "assistant"; content: string };

const FINAL_PROMPT =
  "Gere APENAS o bloco de narração em português (validação da ação, consequência no mundo, progressão da cena e direcionamento ao próximo jogador). Sem meta-comentários.";

function parseJsonError(body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return j.error?.message ?? j.message ?? body;
  } catch {
    return body || "Erro desconhecido";
  }
}

async function callOpenAI(
  messages: Message[],
  apiKey: string,
  model: string
): Promise<{ narrative: string; modelUsed: string }> {
  const payload = {
    model,
    messages: [
      ...messages,
      { role: "user" as const, content: FINAL_PROMPT },
    ],
    max_tokens: 800,
    temperature: 0.7,
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(parseJsonError(body));
  const data = JSON.parse(body) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const narrative = data.choices?.[0]?.message?.content?.trim() ?? "";
  return { narrative, modelUsed: data.model ?? model };
}

async function callDeepSeek(
  messages: Message[],
  apiKey: string,
  model: string
): Promise<{ narrative: string; modelUsed: string }> {
  const payload = {
    model,
    messages: [
      ...messages,
      { role: "user" as const, content: FINAL_PROMPT },
    ],
    max_tokens: 800,
    temperature: 0.7,
  };
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(parseJsonError(body));
  const data = JSON.parse(body) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const narrative = data.choices?.[0]?.message?.content?.trim() ?? "";
  return { narrative, modelUsed: data.model ?? model };
}

async function callGemini(
  messages: Message[],
  apiKey: string,
  model: string
): Promise<{ narrative: string; modelUsed: string }> {
  const systemMsg = messages.find((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system");
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const m of rest) {
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: m.content }] });
  }
  contents.push({ role: "user", parts: [{ text: FINAL_PROMPT }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.7,
    },
  };
  if (systemMsg?.content) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseBody = await res.text();
  if (!res.ok) throw new Error(parseJsonError(responseBody));
  const data = JSON.parse(responseBody) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return { narrative: text, modelUsed: model };
}

async function callAnthropic(
  messages: Message[],
  apiKey: string,
  model: string
): Promise<{ narrative: string; modelUsed: string }> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  chatMessages.push({ role: "user" as const, content: FINAL_PROMPT });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: system || undefined,
      messages: chatMessages,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(parseJsonError(body));
  const data = JSON.parse(body) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const narrative =
    data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
  return { narrative, modelUsed: model };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, apiKey, model, provider } = body as {
      messages?: Message[];
      apiKey?: string;
      model?: string;
      provider?: string;
    };

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "apiKey é obrigatória" },
        { status: 400 }
      );
    }
    if (!messages?.length) {
      return NextResponse.json(
        { error: "messages é obrigatório e não pode ser vazio" },
        { status: 400 }
      );
    }

    const providerId = (provider === "gemini" || provider === "anthropic" || provider === "deepseek"
      ? provider
      : "openai") as AiProviderId;
    const modelToUse =
      typeof model === "string" && model.trim().length > 0 ? model.trim() : "gpt-4o-mini";

    let result: { narrative: string; modelUsed: string };
    try {
      switch (providerId) {
        case "openai":
          result = await callOpenAI(messages, apiKey, modelToUse);
          break;
        case "deepseek":
          result = await callDeepSeek(messages, apiKey, modelToUse);
          break;
        case "gemini":
          result = await callGemini(messages, apiKey, modelToUse);
          break;
        case "anthropic":
          result = await callAnthropic(messages, apiKey, modelToUse);
          break;
        default:
          result = await callOpenAI(messages, apiKey, modelToUse);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: message, model: modelToUse },
        { status: 502 }
      );
    }

    return NextResponse.json({
      narrative: result.narrative,
      model: result.modelUsed,
    });
  } catch (e) {
    console.error("narrate API error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao chamar a IA" },
      { status: 500 }
    );
  }
}
