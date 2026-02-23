"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/LoginForm";
import Link from "next/link";
import { LogOut, ArrowRight, Swords } from "lucide-react";
import { logout } from "@/lib/supabase/auth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // Mostra loading breve enquanto verifica sessão
  if (loading || loggingOut) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-rpg-dark">
        <p className="text-rpg-muted animate-pulse">
          {loggingOut ? "Encerrando sessão..." : "Verificando sessão..."}
        </p>
      </main>
    );
  }

  // Usuário já logado: dá a opção de ir para o dashboard ou Sair
  // Removemos o redirecionamento forçado para que o usuário sinta controle
  // e possa trocar de conta se a sessão estiver "presa".
  if (user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-rpg-dark relative">
        <div className="panel w-full max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-2">
            <Swords className="h-12 w-12 text-rpg-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-rpg-light mb-2">
              Você já está no Narrador
            </h1>
            <p className="text-rpg-muted text-sm">
              Sessão ativa como <strong className="text-white">{user.email}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Link href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Ir para o Dashboard
            </Link>

            <button
              onClick={async () => {
                setLoggingOut(true);
                await logout();
                // Limpa e recarrega para voltar à tela de LoginForm
                window.location.href = '/';
              }}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-rpg-muted hover:text-rpg-danger hover:border-rpg-danger"
            >
              <LogOut className="h-4 w-4" />
              Sair e usar outra conta
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Sem sessão: mostrar formulário de login
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-rpg-dark animate-in fade-in duration-500">
      <LoginForm />
    </main>
  );
}
