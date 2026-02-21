import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { searchContext, indexAsset } from "../services/ragService";
import { generateNarrative, getAdvice } from "../services/ollamaService";

const router = Router();

/**
 * POST /api/rag/search
 * Search indexed assets for relevant context
 */
router.post("/search", authenticate, async (req: Request, res: Response) => {
  try {
    const { query, k = 5 } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "Query too short" });
    }

    const results = await searchContext(query, k);
    return res.json({ results });
  } catch (error) {
    console.error("❌ RAG search error:", error);
    return res.status(500).json({ error: "Search failed" });
  }
});

/**
 * POST /api/rag/narrative
 * Generate narrative using context from indexed assets
 */
router.post(
  "/narrative",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { prompt, searchQuery, style = "dramatic" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt required" });
      }

      // Search for relevant context if query provided
      let context = "";
      if (searchQuery) {
        const results = await searchContext(searchQuery, 3);
        context = results
          .map(
            (r) =>
              `${r.name}: ${r.content.substring(0, 200)}`
          )
          .join("\n\n");
      }

      // Generate narrative
      const narrative = await generateNarrative(prompt, {
        context,
        style: style as "formal" | "casual" | "dramatic",
        maxTokens: 500,
      });

      return res.json({
        narrative,
        contextUsed: !!context,
        tokensEstimated: Math.ceil(narrative.length / 4),
      });
    } catch (error) {
      console.error("❌ Narrative generation error:", error);
      return res.status(500).json({ error: "Narrative generation failed" });
    }
  }
);

/**
 * POST /api/rag/advice
 * Get advice on rules/mechanics with optional context
 */
router.post("/advice", authenticate, async (req: Request, res: Response) => {
  try {
    const { topic, searchQuery } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic required" });
    }

    let context: string | undefined;
    if (searchQuery) {
      const results = await searchContext(searchQuery, 2);
      context = results.map((r) => r.content).join("\n");
    }

    const advice = await getAdvice(topic, context);
    return res.json({ advice, contextUsed: !!context });
  } catch (error) {
    console.error("❌ Advice error:", error);
    return res.status(500).json({ error: "Advice generation failed" });
  }
});

export default router;
