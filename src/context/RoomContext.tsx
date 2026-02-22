"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getCampaignConfig } from "@/lib/campaign";
import { getApprovedCharacters } from "@/lib/characters";
import {
  getRoomState,
  addParticipant,
  setParticipantReady,
  addSimulatedParticipant,
  setPhase,
  setRefinementQuestions,
  setRefinementAnswers,
  addMessage,
  setCurrentTurn,
  setIntroGenerated,
  setAiProcessing,
} from "@/lib/roomState";
import { getAiKey, getAiModel, getAiProvider } from "@/lib/ai-key";
import {
  buildNarratorContext,
  callNarratorApi,
  getSimulatedNarrative,
} from "@/lib/ai-narrator";
import type {
  RoomPhase,
  Participant,
  GameMessage,
  MessageKind,
} from "@/lib/types";
import type { AuthUser } from "@/lib/supabase/types";

type Checklist = {
  backendOk: boolean;
  campaignLoaded: boolean;
  charactersValid: boolean;
  playersReady: boolean;
};

type RoomContextValue = {
  roomId: string;
  isHost: boolean;
  currentUser: AuthUser | null;
  participants: Participant[];
  ready: Record<string, boolean>;
  phase: RoomPhase;
  checklist: Checklist;
  canStart: boolean;
  pendingReadyNames: string[];
  setReady: (ready: boolean) => void;
  toggleSimulatedReady: (participantId: string) => void;
  addTestParticipant: () => void;
  startCampaign: () => void;
  refinementQuestions: string[];
  refinementAnswers: string[];
  setRefinementAnswerByIndex: (index: number, value: string) => void;
  confirmRefinementAndPlay: () => void;
  messages: GameMessage[];
  currentTurnPlayerId: string | null;
  isAiProcessing: boolean;
  turnStatusLabel: string;
  sendAction: (content: string) => void;
  sendConsult: (content: string) => void;
  sendInteract: (content: string) => void;
  finalizeTurn: () => Promise<void>;
  passTurnToNextPlayer: (nextPlayerId: string) => void;
  refreshState: () => void;
  invalidateChecklist: () => void;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}

const INTRO_PLACEHOLDER = `A noite cai sobre a taverna "O Dragão Adormecido". O fogo crepita na lareira enquanto estranhos de todas as raças se agrupam em mesas de madeira. Um mensageiro entra, o capuz encharcado de chuva, e fixa o olhar em vocês.

— Há uma recompensa para quem levar esta carta até o castelo do norte. O caminho é perigoso. Quem se habilita?

Ele estende um envelope selado. O silêncio paira. Quem responde?`;

const REFINEMENT_QUESTIONS_PLACEHOLDER = [
  "Qual o tom predominante da campanha? (heroico, sombrio, humorístico)",
  "Há algum NPC recorrente que a IA deve conhecer?",
  "Alguma regra da casa que a IA deve respeitar além do sistema base?",
];

type RoomProviderProps = {
  roomId: string;
  isHost: boolean;
  children: React.ReactNode;
};

export function RoomProvider({ roomId, isHost, children }: RoomProviderProps) {
  const [state, setState] = useState(() => getRoomState(roomId));
  const [checklistTick, setChecklistTick] = useState(0);
  const { user: currentUser } = useAuth();

  const invalidateChecklist = useCallback(() => setChecklistTick((t) => t + 1), []);

  const refreshState = useCallback(() => {
    setState(getRoomState(roomId));
  }, [roomId]);

  useEffect(() => {
    if (!currentUser) return;
    addParticipant(roomId, {
      id: currentUser.id,
      userId: currentUser.id,
      name: currentUser.displayName || "Jogador Anônimo",
    });
    refreshState();
  }, [roomId, currentUser?.id, refreshState]);

  const setReady = useCallback(
    (ready: boolean) => {
      if (!currentUser) return;
      setParticipantReady(roomId, currentUser.id, ready);
      refreshState();
    },
    [roomId, currentUser?.id, refreshState]
  );

  const toggleSimulatedReady = useCallback(
    (participantId: string) => {
      const rs = getRoomState(roomId);
      const current = rs.ready[participantId];
      setParticipantReady(roomId, participantId, !current);
      refreshState();
    },
    [roomId, refreshState]
  );

  const addTestParticipant = useCallback(() => {
    addSimulatedParticipant(roomId);
    refreshState();
  }, [roomId, refreshState]);

  const campaignConfig = getCampaignConfig(roomId);
  const approvedChars = getApprovedCharacters(roomId);

  const checklist: Checklist = useMemo(() => {
    const backendOk = true;
    const campaignLoaded = !!(
      campaignConfig &&
      (campaignConfig.rulesAuthority?.trim() || campaignConfig.uploadedFileName)
    );
    const charactersValid = approvedChars.length > 0;
    const playersReady =
      state.participants.length > 0 &&
      state.participants.every((p) => state.ready[p.userId] === true);
    return { backendOk, campaignLoaded, charactersValid, playersReady };
  }, [
    campaignConfig,
    approvedChars.length,
    state.participants,
    state.ready,
  ]);

  const canStart =
    isHost &&
    state.phase === "lobby" &&
    checklist.backendOk &&
    checklist.campaignLoaded &&
    checklist.charactersValid &&
    checklist.playersReady;

  const pendingReadyNames = useMemo(
    () =>
      state.participants
        .filter((p) => !state.ready[p.userId])
        .map((p) => p.name),
    [state.participants, state.ready]
  );

  const startCampaign = useCallback(() => {
    if (!canStart) return;
    setPhase(roomId, "synchronizing");
    refreshState();
    setTimeout(() => {
      setRefinementQuestions(roomId, REFINEMENT_QUESTIONS_PLACEHOLDER);
      setPhase(roomId, "refinement");
      setRefinementAnswers(roomId, []);
      refreshState();
    }, 2500);
  }, [roomId, canStart, refreshState]);

  const setRefinementAnswerByIndex = useCallback(
    (index: number, value: string) => {
      const rs = getRoomState(roomId);
      const answers = [...(rs.refinementAnswers ?? [])];
      answers[index] = value;
      setRefinementAnswers(roomId, answers);
      refreshState();
    },
    [roomId, refreshState]
  );

  const confirmRefinementAndPlay = useCallback(() => {
    const rs = getRoomState(roomId);
    if (rs.phase !== "refinement") return;
    setPhase(roomId, "playing");
    setIntroGenerated(roomId, true);
    const firstPlayer = rs.participants.find((p) => !p.isSimulated);
    const targetId = firstPlayer?.userId ?? null;
    const targetName = firstPlayer?.name ?? "Jogador";
    addMessage(roomId, {
      id: "msg-intro-" + Date.now(),
      kind: "narrative",
      from: "ai",
      content: INTRO_PLACEHOLDER,
      targetPlayerId: targetId ?? undefined,
      targetPlayerName: targetName,
      timestamp: Date.now(),
    });
    setCurrentTurn(roomId, targetId);
    refreshState();
  }, [roomId, refreshState]);

  const sendMessage = useCallback(
    (kind: MessageKind, content: string) => {
      if (!currentUser) return;
      addMessage(roomId, {
        id: "msg-" + Date.now(),
        kind,
        from: currentUser.id,
        content,
        timestamp: Date.now(),
      });
      refreshState();
    },
    [roomId, currentUser?.id, refreshState]
  );

  const sendAction = useCallback(
    (content: string) => sendMessage("action", content),
    [sendMessage]
  );
  const sendConsult = useCallback(
    (content: string) => sendMessage("consult", content),
    [sendMessage]
  );
  const sendInteract = useCallback(
    (content: string) => sendMessage("interact", content),
    [sendMessage]
  );

  const isAiProcessing = state.isAiProcessing ?? false;

  const turnStatusLabel = useMemo(() => {
    if (isAiProcessing) return "A IA está narrando...";
    const currentId = state.currentTurnPlayerId;
    if (!currentId) return "Aguardando jogadores...";
    const p = state.participants.find((x) => x.userId === currentId);
    const name = p?.name ?? "Jogador";
    return currentUser?.id === currentId
      ? `Em turno do Jogador [${name}]`
      : `Aguardando [${name}]...`;
  }, [isAiProcessing, state.currentTurnPlayerId, state.participants, currentUser]);

  const getNextPlayerId = useCallback(
    (participantsList: Participant[], currentTurnId: string | null) => {
      const real = participantsList.filter((p) => !p.isSimulated);
      if (real.length === 0) return null;
      const idx = real.findIndex((p) => p.userId === currentTurnId);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % real.length;
      return real[nextIdx].userId;
    },
    []
  );

  const finalizeTurn = useCallback(async () => {
    const currentId = state.currentTurnPlayerId;
    if (!currentUser || !currentId || currentUser.id !== currentId) return;
    if (isAiProcessing) return;

    const msgs = state.messages ?? [];
    const lastAiIdx = [...msgs].reverse().findIndex((m) => m.from === "ai");
    const sinceIdx =
      lastAiIdx < 0 ? 0 : msgs.length - 1 - lastAiIdx;
    const turnMessages = msgs.slice(sinceIdx).filter((m) => m.from === currentId);
    const lastContent =
      turnMessages.length > 0
        ? turnMessages[turnMessages.length - 1].content
        : "";
    const playerName =
      state.participants.find((p) => p.userId === currentId)?.name ?? "Jogador";

    setAiProcessing(roomId, true);
    refreshState();

    const campaignConfig = getCampaignConfig(roomId);
    const rules = campaignConfig?.rulesAuthority ?? "";
    const participantNames = state.participants.map((p) => ({
      userId: p.userId,
      name: p.name,
    }));

    const context = buildNarratorContext(
      msgs,
      rules,
      participantNames
    );

    let narrative: string;
    const apiKey = getAiKey();
    const model = getAiModel();
    const provider = getAiProvider();
    if (apiKey) {
      const result = await callNarratorApi(context, apiKey, model, provider);
      narrative = result.narrative || getSimulatedNarrative(lastContent, playerName);
      if (result.error) console.warn("Narrator API error:", result.error);
      if (result.model) console.info("Modelo usado na narração:", result.model);
    } else {
      narrative = getSimulatedNarrative(lastContent, playerName);
    }

    const freshState = getRoomState(roomId);
    const nextPlayerId = getNextPlayerId(freshState.participants, currentId);
    const nextPlayer = freshState.participants.find((p) => p.userId === nextPlayerId);

    addMessage(roomId, {
      id: "msg-narr-" + Date.now(),
      kind: "narrative",
      from: "ai",
      content: narrative,
      targetPlayerId: nextPlayerId ?? undefined,
      targetPlayerName: nextPlayer?.name,
      timestamp: Date.now(),
    });
    setCurrentTurn(roomId, nextPlayerId);
    setAiProcessing(roomId, false);
    refreshState();
  }, [
    roomId,
    currentUser?.id,
    state.messages,
    state.currentTurnPlayerId,
    state.participants,
    isAiProcessing,
    getNextPlayerId,
    refreshState,
  ]);

  const passTurnToNextPlayer = useCallback(
    (nextPlayerId: string) => {
      if (!isHost) return;
      setCurrentTurn(roomId, nextPlayerId);
      refreshState();
    },
    [roomId, isHost, refreshState]
  );

  const value: RoomContextValue = useMemo(
    () => ({
      roomId,
      isHost,
      currentUser,
      participants: state.participants,
      ready: state.ready,
      phase: state.phase,
      checklist,
      canStart,
      pendingReadyNames,
      setReady,
      toggleSimulatedReady,
      addTestParticipant,
      startCampaign,
      refinementQuestions: state.refinementQuestions ?? [],
      refinementAnswers: state.refinementAnswers ?? [],
      setRefinementAnswerByIndex,
      confirmRefinementAndPlay,
      messages: state.messages ?? [],
      currentTurnPlayerId: state.currentTurnPlayerId,
      isAiProcessing,
      turnStatusLabel,
      sendAction,
      sendConsult,
      sendInteract,
      finalizeTurn,
      passTurnToNextPlayer,
      refreshState,
      invalidateChecklist,
    }),
    [
      roomId,
      isHost,
      currentUser,
      state.participants,
      state.ready,
      state.phase,
      state.refinementQuestions,
      state.refinementAnswers,
      state.messages,
      state.currentTurnPlayerId,
      state.isAiProcessing,
      checklist,
      canStart,
      pendingReadyNames,
      setReady,
      toggleSimulatedReady,
      addTestParticipant,
      startCampaign,
      setRefinementAnswerByIndex,
      confirmRefinementAndPlay,
      sendAction,
      sendConsult,
      sendInteract,
      isAiProcessing,
      turnStatusLabel,
      finalizeTurn,
      passTurnToNextPlayer,
      refreshState,
      invalidateChecklist,
    ]
  );

  return (
    <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
  );
}
