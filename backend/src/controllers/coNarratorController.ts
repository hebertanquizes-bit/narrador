import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  getCoNarratorResponse,
  getSuggestedEncounter,
  getRulesClarification,
} from "../services/coNarratorService";
import { CoNarrator } from "../models/CoNarrator";

const router = Router();

/**
 * POST /api/co-narrator/chat
 * Send message to Co-Narrator
 */
router.post(
  "/chat",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, message, campaign, searchAssets = true } = req.body;
      const userId = (req as any).userId;

      if (!message || !campaign) {
        return res.status(400).json({ error: "Message and campaign required" });
      }

      // Get or create session
      let session = await CoNarrator.findOne({
        sessionId,
        userId,
      });

      if (!session) {
        session = new CoNarrator({
          workspaceId: (req as any).workspaceId || "",
          userId,
          sessionId,
          campaign,
          chatHistory: [],
        });
      }

      // Add user message
      session.chatHistory.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });

      // Get response
      const response = await getCoNarratorResponse(
        message,
        session.chatHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        campaign,
        searchAssets
      );

      // Add narrator response
      session.chatHistory.push({
        role: "narrator",
        content: response,
        timestamp: new Date(),
      });

      session.lastUpdated = new Date();
      await session.save();

      return res.json({
        response,
        history: session.chatHistory,
      });
    } catch (error) {
      console.error("❌ Co-Narrator chat error:", error);
      return res.status(500).json({ error: "Chat failed" });
    }
  }
);

/**
 * POST /api/co-narrator/encounter
 * Get suggested encounter
 */
router.post(
  "/encounter",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { level, partySize, campaign, searchAssets = true } = req.body;

      if (!level || !partySize || !campaign) {
        return res
          .status(400)
          .json({ error: "Level, party size, and campaign required" });
      }

      const encounter = await getSuggestedEncounter(
        level,
        partySize,
        campaign,
        searchAssets
      );

      return res.json({ encounter });
    } catch (error) {
      console.error("❌ Encounter suggestion error:", error);
      return res.status(500).json({ error: "Failed to suggest encounter" });
    }
  }
);

/**
 * POST /api/co-narrator/rules
 * Get rules clarification
 */
router.post(
  "/rules",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { topic, context } = req.body;

      if (!topic) {
        return res.status(400).json({ error: "Topic required" });
      }

      const clarification = await getRulesClarification(topic, context);
      return res.json({ clarification });
    } catch (error) {
      console.error("❌ Rules clarification error:", error);
      return res.status(500).json({ error: "Failed to get clarification" });
    }
  }
);

/**
 * GET /api/co-narrator/history/:sessionId
 * Get chat history
 */
router.get(
  "/history/:sessionId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;

      const session = await CoNarrator.findOne({
        sessionId,
        userId,
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      return res.json({ history: session.chatHistory });
    } catch (error) {
      console.error("❌ History retrieval error:", error);
      return res.status(500).json({ error: "Failed to retrieve history" });
    }
  }
);

export default router;
