"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!checking && user) {
      router.replace("/dashboard");
    }
  }, [checking, user, router]);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-rpg-muted">Carregando...</p>
      </main>
    );
  }

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-rpg-dark">
      <LoginForm />
    </main>
  );
}
