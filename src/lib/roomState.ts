"use client";

import { STORAGE_KEYS, getItem, setItem } from "./storage";
import type { RoomState as RoomStateType, Participant, GameMessage } from "./types";

const defaultRoomState = (): RoomStateType => ({
  participants: [],
  ready: {},
  phase: "lobby",
  messages: [],
  currentTurnPlayerId: null,
  isAiProcessing: false,
  refinementQuestions: [],
  refinementAnswers: [],
  introGenerated: false,
});

export function getRoomState(roomId: string): RoomStateType {
  const all = getItem<Record<string, RoomStateType>>(STORAGE_KEYS.ROOM_STATE);
  const state = all?.[roomId];
  if (!state) return defaultRoomState();
  return {
    ...defaultRoomState(),
    ...state,
    participants: state.participants ?? [],
    ready: state.ready ?? {},
    messages: state.messages ?? [],
    refinementQuestions: state.refinementQuestions ?? [],
    refinementAnswers: state.refinementAnswers ?? [],
    isAiProcessing: state.isAiProcessing ?? false,
  };
}

export function setAiProcessing(roomId: string, value: boolean): void {
  const state = getRoomState(roomId);
  state.isAiProcessing = value;
  setRoomState(roomId, state);
}

export function setRoomState(roomId: string, state: RoomStateType): void {
  const all = getItem<Record<string, RoomStateType>>(STORAGE_KEYS.ROOM_STATE) ?? {};
  all[roomId] = state;
  setItem(STORAGE_KEYS.ROOM_STATE, all);
}

export function addParticipant(roomId: string, participant: Participant): void {
  const state = getRoomState(roomId);
  const exists = state.participants.some((p) => p.userId === participant.userId);
  if (exists) return;
  state.participants = [...state.participants, participant];
  setRoomState(roomId, state);
}

export function setParticipantReady(roomId: string, userId: string, ready: boolean): void {
  const state = getRoomState(roomId);
  state.ready = { ...state.ready, [userId]: ready };
  setRoomState(roomId, state);
}

export function addSimulatedParticipant(roomId: string): void {
  const state = getRoomState(roomId);
  const id = `sim-${Date.now()}`;
  state.participants = [
    ...state.participants,
    { id, userId: id, name: "Jogador Teste", isSimulated: true },
  ];
  setRoomState(roomId, state);
}

export function setPhase(roomId: string, phase: RoomStateType["phase"]): void {
  const state = getRoomState(roomId);
  state.phase = phase;
  setRoomState(roomId, state);
}

export function setRefinementQuestions(roomId: string, questions: string[]): void {
  const state = getRoomState(roomId);
  state.refinementQuestions = questions;
  setRoomState(roomId, state);
}

export function addRefinementAnswer(roomId: string, answer: string): void {
  const state = getRoomState(roomId);
  state.refinementAnswers = [...(state.refinementAnswers ?? []), answer];
  setRoomState(roomId, state);
}

export function setRefinementAnswers(roomId: string, answers: string[]): void {
  const state = getRoomState(roomId);
  state.refinementAnswers = answers;
  setRoomState(roomId, state);
}

export function addMessage(roomId: string, message: GameMessage): void {
  const state = getRoomState(roomId);
  state.messages = [...(state.messages ?? []), message];
  setRoomState(roomId, state);
}

export function setCurrentTurn(roomId: string, playerId: string | null): void {
  const state = getRoomState(roomId);
  state.currentTurnPlayerId = playerId;
  setRoomState(roomId, state);
}

export function setIntroGenerated(roomId: string, value: boolean): void {
  const state = getRoomState(roomId);
  state.introGenerated = value;
  setRoomState(roomId, state);
}
