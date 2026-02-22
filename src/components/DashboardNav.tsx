"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard, Swords, Library, Shield, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/supabase/auth";

export default function DashboardNav() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Hard redirect para garantir que o middleware releia os cookies sem sessão
    window.location.href = '/';
  };

  const roleLabel = user?.role === "narrator" ? "Narrador" : user?.role === "player" ? "Jogador" : null;
  const RoleIcon = user?.role === "narrator" ? Wand2 : Shield;
  const roleBadgeClass =
    user?.role === "narrator"
      ? "border-purple-500/50 bg-purple-900/20 text-purple-300"
      : "border-blue-500/50 bg-blue-900/20 text-blue-300";

  return (
    <header className="border-b border-rpg-border bg-rpg-panel/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-display text-xl font-bold text-rpg-gold"
        >
          <Swords className="h-6 w-6" />
          Narrador
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            Salas
          </Link>
          <Link
            href="/workspace"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
          >
            <Library className="h-4 w-4" />
            Workspace
          </Link>

          {/* Perfil do usuário — badge NÃO clicável aqui, troca de papel só no Workspace */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-rpg-border">
              <span className="text-sm font-medium text-gray-200 hidden sm:block">
                {user.displayName || user.email?.split("@")[0] || "Aventureiro"}
              </span>
              {roleLabel && (
                <span
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${roleBadgeClass}`}
                >
                  <RoleIcon className="h-3 w-3" />
                  {roleLabel}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-rpg-border px-3 py-1.5 text-sm text-gray-300 transition hover:border-rpg-danger hover:text-rpg-danger"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
