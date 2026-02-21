import axios from "axios";

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface NarrativeOptions {
  context?: string;
  style?: "formal" | "casual" | "dramatic";
  maxTokens?: number;
}

/**
 * Call Ollama local LLM for narrative generation
 */
export async function generateNarrative(
  prompt: string,
  options: NarrativeOptions = {}
): Promise<string> {
  const {
    context = "",
    style = "dramatic",
    maxTokens = 500,
  } = options;

  const systemPrompt = `You are a master RPG narrator. Style: ${style}. Keep responses under ${maxTokens} tokens.`;
  const fullPrompt = context
    ? `${systemPrompt}\n\nContext:\n${context}\n\nNarrative prompt:\n${prompt}`
    : `${systemPrompt}\n\n${prompt}`;

  try {
    const response = await axios.post<OllamaResponse>(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt: fullPrompt,
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
      },
      { timeout: 60000 }
    );

    return response.data.response.trim();
  } catch (error) {
    console.error("❌ Ollama generation error:", error);
    throw new Error("Failed to generate narrative");
  }
}

/**
 * Get advice from Ollama (rules, mechanics, etc.)
 */
export async function getAdvice(
  topic: string,
  context?: string
): Promise<string> {
  const prompt = context
    ? `As a D&D rules expert, provide concise advice about ${topic}.\n\nContext: ${context}`
    : `As a D&D rules expert, provide concise advice about ${topic}.`;

  try {
    const response = await axios.post<OllamaResponse>(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt,
        stream: false,
        temperature: 0.3,
      },
      { timeout: 30000 }
    );

    return response.data.response.trim();
  } catch (error) {
    console.error("❌ Ollama advice error:", error);
    throw new Error("Failed to get advice");
  }
}

/**
 * Check if Ollama is running
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    await axios.get("http://localhost:11434/api/tags", {
      timeout: 5000,
    });
    return true;
  } catch (error) {
    console.warn("⚠️  Ollama not available at http://localhost:11434");
    return false;
  }
}

/**
 * Pull a model from Ollama registry
 */
export async function pullModel(modelName: string): Promise<void> {
  try {
    console.log(`📥 Pulling ${modelName} from Ollama registry...`);
    await axios.post(
      "http://localhost:11434/api/pull",
      { name: modelName },
      { timeout: 300000 } // 5 minutes
    );
    console.log(`✅ Model ${modelName} ready`);
  } catch (error) {
    console.error(`❌ Failed to pull ${modelName}:`, error);
    throw error;
  }
}
