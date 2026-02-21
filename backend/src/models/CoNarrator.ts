import mongoose, { Document, Schema } from "mongoose";

export interface ChatMessage {
  role: "narrator" | "user";
  content: string;
  timestamp: Date;
}

export interface CoNarratorDocument extends Document {
  workspaceId: string;
  userId: string;
  sessionId: string;
  campaign: string;
  systemPrompt: string;
  chatHistory: ChatMessage[];
  lastUpdated: Date;
  createdAt: Date;
}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ["narrator", "user"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const CoNarratorSchema = new Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    campaign: { type: String, required: true },
    systemPrompt: String,
    chatHistory: [ChatMessageSchema],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index
CoNarratorSchema.index({ workspaceId: 1, userId: 1 });

export const CoNarrator = mongoose.model<CoNarratorDocument>(
  "CoNarrator",
  CoNarratorSchema
);
