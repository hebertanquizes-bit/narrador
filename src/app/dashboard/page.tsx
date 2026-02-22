"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, DoorOpen, Hash, X, Trash2 } from "lucide-react";
import {
  getRooms,
  createRoom,
  findRoomByCode,
  deleteRoom,
  cleanupOldEmptyRooms,
} from "@/lib/supabase/rooms";
import type { Room } from "@/lib/supabase/types";
import { useAuth } from "@/context/AuthContext";
import DashboardNav from "@/components/DashboardNav";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }

    const fetchRooms = async () => {
      // Limpeza automática de salas antigas (agora não faz nada no DB)
      await cleanupOldEmptyRooms();
      const dbRooms = await getRooms();
      setRooms(dbRooms);
    };

    fetchRooms();
  }, [router, user]);

  const handleDeleteRoom = async (roomId: string) => {
    if (!user) return;
    setLoadingAction(true);
    const success = await deleteRoom(roomId, user.id);
    if (success) {
      const dbRooms = await getRooms();
      setRooms(dbRooms);
      setDeleteConfirm(null);
    }
    setLoadingAction(false);
  };

  const handleCreateRoom = async () => {
    if (!user || user.role !== "narrator") {
      setRoomName("Você precisa ser narrador!");
      return;
    }
    setLoadingAction(true);
    const finalName = roomName.trim() || "Nova Campanha";
    const newRoom = await createRoom(user.id, finalName);

    if (newRoom) {
      const dbRooms = await getRooms();
      setRooms(dbRooms);
      setShowCreateDialog(false);
      setRoomName("");
      router.push(`/sala/${newRoom.id}`);
      router.refresh();
    } else {
      setLoadingAction(false);
    }
  };

  const handleEnterWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setLoadingAction(true);
    const room = await findRoomByCode(code);
    if (!room) {
      setCodeError("Código não encontrado. Verifique e tente novamente.");
      setLoadingAction(false);
      return;
    }
    router.push(`/sala/${room.id}`);
    router.refresh();
  };

  const myRooms = rooms.filter((r) => r.owner_id === user?.id);

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
              onClick={() => setShowCreateDialog(true)}
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
                <li key={room.id} className="panel flex items-center justify-between group hover:border-rpg-accent transition p-4">
                  <Link
                    href={`/sala/${room.id}`}
                    className="flex-1"
                  >
                    <span className="font-medium">{room.campaign_config?.roomName || "Sala sem nome"}</span>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(room.id)}
                    className="ml-4 p-2 text-rpg-muted hover:text-rpg-danger hover:bg-rpg-danger/10 rounded transition opacity-0 group-hover:opacity-100"
                    title="Excluir sala"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Modal de criar sala */}
        {showCreateDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-lg bg-rpg-darker border border-rpg-border p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-rpg-gold">Criar Nova Sala</h3>
                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    setRoomName("");
                  }}
                  className="text-rpg-muted hover:text-rpg-light transition"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rpg-light mb-2">
                    Nome da Sala
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Ex: Aventura das Ruínas Perdidas"
                    maxLength={100}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateRoom();
                      }
                    }}
                    className="input-field w-full"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      setRoomName("");
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={loadingAction}
                    onClick={handleCreateRoom}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {loadingAction ? '...' : 'Criar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-lg bg-rpg-darker border border-rpg-border p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-rpg-danger">Excluir Sala</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-rpg-muted hover:text-rpg-light transition"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-rpg-light mb-6">
                Tem certeza que deseja excluir esta sala? Esta ação não pode ser desfeita e removerá todos os dados associados.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  disabled={loadingAction}
                  onClick={() => {
                    handleDeleteRoom(deleteConfirm);
                  }}
                  className="btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {loadingAction ? '...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
