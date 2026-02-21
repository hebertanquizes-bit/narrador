import mongoose, { Document, Schema } from "mongoose";

export interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  initiativeModifier: number;
}

export interface CombatGridDocument extends Document {
  workspaceId: string;
  userId: string;
  name: string;
  gridSize: number;
  cellSize: number;
  background?: string;
  tokens: Token[];
  roundNumber: number;
  currentTurnTokenId?: string;
  battleLog: Array<{
    timestamp: Date;
    action: string;
    actor: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  size: { type: Number, default: 1 },
  color: { type: String, default: "#FF6B6B" },
  initiativeModifier: { type: Number, default: 0 },
});

const BattleLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  action: String,
  actor: String,
});

const CombatGridSchema = new Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    gridSize: { type: Number, default: 10 },
    cellSize: { type: Number, default: 50 },
    background: String,
    tokens: [TokenSchema],
    roundNumber: { type: Number, default: 1 },
    currentTurnTokenId: String,
    battleLog: [BattleLogSchema],
  },
  { timestamps: true }
);

// Compound index for workspace + user queries
CombatGridSchema.index({ workspaceId: 1, userId: 1 });

export const CombatGrid = mongoose.model<CombatGridDocument>(
  "CombatGrid",
  CombatGridSchema
);
