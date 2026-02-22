"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Swords, Library } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/supabase/auth";

export default function DashboardNav() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-rpg-border bg-rpg-panel/80 backdrop-blur">
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
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            Salas
          </Link>
          <Link
            href="/workspace"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
          >
            <Library className="h-4 w-4" />
            Workspace
          </Link>
          {user && (
            <span className="text-sm text-rpg-muted">
              {user.email}
            </span>
          )}
          {user && (
            <span className="text-sm text-rpg-muted">
              <span>{user?.displayName || 'Aventureiro'}</span>
            </span>
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
