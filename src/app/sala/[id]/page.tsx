"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRoomById } from "@/lib/supabase/rooms";
import type { Room } from "@/lib/supabase/types";
import DashboardNav from "@/components/DashboardNav";
import CampaignConfig from "@/components/CampaignConfig";
import CharactersSection from "@/components/CharactersSection";
import PreGameChecklist from "@/components/PreGameChecklist";
import AiKeyConfig from "@/components/AiKeyConfig";
import { RoomProvider, useRoom } from "@/context/RoomContext";
import LobbySection from "@/components/LobbySection";
import SyncPhase from "@/components/SyncPhase";
import RefinementPhase from "@/components/RefinementPhase";
import GameChat from "@/components/GameChat";

export default function SalaPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  const [room, setRoom] = useState<Room | undefined | null>(undefined); // undefined = loading, null = not found

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    const fetchRoom = async () => {
      const data = await getRoomById(roomId);
      if (data) {
        setRoom(data);
      } else {
        setRoom(null);
      }
    };
    fetchRoom();
  }, [roomId, router, user, authLoading]);

  const isHost = !!user && !!room && room.owner_id === user.id;

  if (authLoading || (!user && room === undefined) || (!room && room !== null)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-rpg-muted">Carregando sala...</p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen bg-rpg-dark">
        <DashboardNav />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-rpg-danger">Sala não encontrada.</p>
          <Link href="/dashboard" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-rpg-dark">
      <DashboardNav />
      <RoomProvider roomId={roomId} isHost={isHost}>
        <SalaInner
          roomId={roomId}
          room={room}
          isHost={isHost}
        />
      </RoomProvider>
    </main>
  );
}

function SalaInner({
  roomId,
  room,
  isHost,
}: {
  roomId: string;
  room: Room;
  isHost: boolean;
}) {
  const { phase } = useRoom();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-rpg-muted hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às salas
        </Link>
        {isHost && (
          <span className="rounded bg-rpg-border px-3 py-1 font-mono text-sm text-rpg-gold">
            Código: {room.code}
          </span>
        )}
      </div>

      <h1 className="font-display text-3xl font-bold text-rpg-gold mb-2 flex items-center gap-2">
        <Swords className="h-8 w-8" />
        {room.campaign_config?.roomName || "Sala sem nome"}
      </h1>
      <p className="text-rpg-muted mb-8">
        {isHost ? "Você é o Host desta sala." : "Você entrou nesta sala como jogador."}
      </p>

      {phase === "lobby" && (
        <>
          <div className="space-y-6">
            <LobbySection />
            <PreGameChecklist roomId={roomId} isHost={isHost} />
            <CampaignConfig roomId={roomId} isHost={isHost} />
            <CharactersSection roomId={roomId} isHost={isHost} />
            <AiKeyConfig isHost={isHost} />
          </div>
        </>
      )}

      {phase === "synchronizing" && <SyncPhase />}

      {phase === "refinement" && <RefinementPhase />}

      {phase === "playing" && (
        <div className="space-y-6">
          <GameChat />
        </div>
      )}
    </div>
  );
}
