"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, DoorOpen, Hash } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getRooms,
  createRoom,
  findRoomByCode,
} from "@/lib/rooms";
import DashboardNav from "@/components/DashboardNav";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [rooms, setRooms] = useState(getRooms());
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (!u) {
      router.replace("/");
      return;
    }
    setRooms(getRooms());
  }, [router]);

  const handleCreateRoom = () => {
    if (!user) return;
    const room = createRoom(user.id);
    setRooms(getRooms());
    router.push(`/sala/${room.id}`);
    router.refresh();
  };

  const handleEnterWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    const room = findRoomByCode(code);
    if (!room) {
      setCodeError("Código não encontrado. Verifique e tente novamente.");
      return;
    }
    router.push(`/sala/${room.id}`);
    router.refresh();
  };

  const myRooms = rooms.filter((r) => r.hostId === user?.id);
  const otherRooms = rooms.filter((r) => r.hostId !== user?.id);

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-rpg-muted">Redirecionando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-rpg-dark">
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-rpg-gold mb-2">
          Minhas Salas
        </h1>
        <p className="text-rpg-muted mb-8">
          Crie uma sala ou entre com o código de 6 dígitos compartilhado pelo Host.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-rpg-accent" />
              Criar Sala
            </h2>
            <p className="text-sm text-rpg-muted mb-4">
              Gera uma nova campanha com código de 6 dígitos para os jogadores entrarem.
            </p>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Sala
            </button>
          </div>

          <div className="panel">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5 text-rpg-accent" />
              Entrar com Código
            </h2>
            <form onSubmit={handleEnterWithCode} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setCodeError("");
                }}
                placeholder="000000"
                maxLength={6}
                className="input-field text-center text-lg tracking-widest"
              />
              {codeError && (
                <p className="text-sm text-rpg-danger">{codeError}</p>
              )}
              <button type="submit" className="btn-secondary w-full flex items-center justify-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Entrar na Sala
              </button>
            </form>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-gray-200 mb-4">
            Salas que você criou
          </h2>
          {myRooms.length === 0 ? (
            <p className="text-rpg-muted">Nenhuma sala criada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {myRooms.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/sala/${room.id}`}
                    className="panel flex items-center justify-between hover:border-rpg-accent transition"
                  >
                    <span className="font-medium">{room.name}</span>
                    <span className="rounded bg-rpg-border px-2 py-1 font-mono text-sm text-rpg-gold">
                      {room.code}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {otherRooms.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-gray-200 mb-4">
              Outras salas
            </h2>
            <ul className="space-y-2">
              {otherRooms.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/sala/${room.id}`}
                    className="panel flex items-center justify-between hover:border-rpg-accent transition"
                  >
                    <span className="font-medium">{room.name}</span>
                    <span className="rounded bg-rpg-border px-2 py-1 font-mono text-sm text-rpg-gold">
                      {room.code}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
