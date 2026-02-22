"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/LoginForm";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redireciona usuário autenticado para o dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  // Mostra loading breve enquanto verifica sessão
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-rpg-dark">
        <p className="text-rpg-muted animate-pulse">Verificando sessão...</p>
      </main>
    );
  }

  // Usuário já logado: useEffect vai redirecionar, mostra nada enquanto redireciona
  if (user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-rpg-dark">
        <p className="text-rpg-muted animate-pulse">Redirecionando...</p>
      </main>
    );
  }

  // Sem sessão: mostrar formulário de login
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-rpg-dark">
      <LoginForm />
    </main>
  );
}
