export type User = {
  id: string;
  email: string;
  name: string;
  provider: "email" | "google";
};

export type Room = {
  id: string;
  code: string;
  name: string;
  hostId: string;
  createdAt: number;
};

export type CampaignConfig = {
  roomId: string;
  uploadedFileName: string | null;
  aiCanAskClarifications: boolean;
  rulesAuthority: string;
};

export type Character = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  sheetFileName: string;
  approved: boolean;
  createdAt: number;
};

// --- Lobby e fluxo de jogo ---

export type Participant = {
  id: string;
  userId: string;
  name: string;
  isSimulated?: boolean;
};

export type RoomPhase =
  | "lobby"
  | "synchronizing"
  | "refinement"
  | "playing";

export type MessageKind = "narrative" | "consult" | "action" | "interact" | "refinement";

export type GameMessage = {
  id: string;
  kind: MessageKind;
  from: "ai" | string;
  content: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  timestamp: number;
};

export type RoomState = {
  participants: Participant[];
  ready: Record<string, boolean>;
  phase: RoomPhase;
  messages: GameMessage[];
  currentTurnPlayerId: string | null;
  /** Enquanto true, a IA está gerando narração (input bloqueado, indicador "A IA está narrando..."). */
  isAiProcessing: boolean;
  refinementQuestions: string[];
  refinementAnswers: string[];
  introGenerated: boolean;
};
