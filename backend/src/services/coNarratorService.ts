import { getAdvice, generateNarrative } from "./ollamaService";
import { searchContext } from "./ragService";

interface CoNarratorMessage {
  role: "narrator" | "user";
  content: string;
}

/**
 * Build conversation context for Co-Narrator
 */
function buildContext(history: CoNarratorMessage[]): string {
  return history
    .map((msg) => `${msg.role === "narrator" ? "🎭 Narrator" : "👤 You"}: ${msg.content}`)
    .join("\n");
}

/**
 * Get Co-Narrator response in chat
 */
export async function getCoNarratorResponse(
  userMessage: string,
  history: CoNarratorMessage[],
  campaign: string,
  searchAssets: boolean = true
): Promise<string> {
  try {
    // Build context from conversation
    const conversationContext = buildContext(
      history.slice(-4) // Last 4 messages for context
    );

    // Optionally search assets for context
    let assetContext = "";
    if (searchAssets) {
      const results = await searchContext(userMessage, 2);
      assetContext = results
        .map((r) => `[${r.name}] ${r.content.substring(0, 150)}...`)
        .join("\n");
    }

    const prompt = `
You are a helpful co-narrator for a D&D campaign: "${campaign}".
Your role is to:
- Answer questions about the campaign
- Suggest interesting plot elements
- Help resolve rule disputes
- Provide atmosphere and immersion

Recent conversation:
${conversationContext}

User message: ${userMessage}

${assetContext ? `\nRelevant campaign material:\n${assetContext}` : ""}

Provide a concise, engaging response (2-3 sentences).
    `.trim();

    return await generateNarrative(prompt, {
      context: assetContext,
      style: "dramatic",
      maxTokens: 200,
    });
  } catch (error) {
    console.error("❌ Co-Narrator error:", error);
    throw error;
  }
}

/**
 * Get encounter suggestions
 */
export async function getSuggestedEncounter(
  level: number,
  party_size: number,
  campaign: string,
  searchAssets: boolean = true
): Promise<string> {
  try {
    const prompt = `Create an interesting D&D encounter for a ${party_size}-person party at level ${level} in campaign: "${campaign}".
Include: brief description, difficulty estimate, one twist.
Keep response concise (150 words max).`;

    let context = "";
    if (searchAssets) {
      const results = await searchContext(campaign, 2);
      context = results.map((r) => r.content).join("\n");
    }

    return await generateNarrative(prompt, {
      context,
      style: "dramatic",
      maxTokens: 150,
    });
  } catch (error) {
    console.error("❌ Encounter suggestion error:", error);
    throw error;
  }
}

/**
 * Get rules clarification
 */
export async function getRulesClarification(
  topic: string,
  context?: string
): Promise<string> {
  try {
    return await getAdvice(`Rules clarification: ${topic}`, context);
  } catch (error) {
    console.error("❌ Rules clarification error:", error);
    throw error;
  }
}
