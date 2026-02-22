"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Wand2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chooseWorkspaceType } from "@/lib/supabase/auth";

export default function WorkspaceSelectionPage() {
    const { user, refresh } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Se o usuário já tiver uma Role definida, volta pro Workspace
    if (user && user.role) {
        router.replace('/workspace');
        return null; // Evita renderização de componentes
    }

    const handleSelect = async (role: "player" | "narrator") => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            await chooseWorkspaceType(user.id, role);
            await refresh(); // Atualiza o contexto global de Auth
            router.push('/workspace'); // Redireciona logo em seguida pro workspace
        } catch (err) {
            console.error("Erro ao escolher workspace:", err);
            setError(err instanceof Error ? err.message : "Erro desconhecido ao configurar seu espaço.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-rpg-darker flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-rpg-gold mb-4">
                        Acessar Workspace
                    </h1>
                    <p className="text-xl text-rpg-light/80">
                        Para utilizarmos o Workspace da plataforma, defina o seu papel de atuação.
                    </p>
                    <p className="text-sm text-rpg-danger mt-2 font-bold animate-pulse">
                        ⚠️ Atenção: Esta escolha é permanente para esta conta.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded text-red-200 text-center">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Jogador */}
                    <button
                        onClick={() => handleSelect("player")}
                        disabled={loading}
                        className="group relative bg-rpg-dark border-2 border-rpg-border hover:border-rpg-gold rounded-xl p-8 text-left transition-all duration-300 hover:transform hover:-translate-y-1 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <Shield className="w-16 h-16 text-blue-400 mb-6" />
                            <h2 className="font-display text-2xl font-bold text-rpg-light mb-3">
                                Sou Jogador
                            </h2>
                            <ul className="text-rpg-muted space-y-2 mb-6 text-sm">
                                <li>• Acessar salas via código</li>
                                <li>• Criar e salvar fichas de personagem</li>
                                <li>• Gerenciar seus tokens pessoais</li>
                                <li>• Lançar dados e rolar perícias</li>
                            </ul>
                            <div className="flex items-center text-blue-400 font-bold text-sm">
                                Escolher Caminho
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Narrador */}
                    <button
                        onClick={() => handleSelect("narrator")}
                        disabled={loading}
                        className="group relative bg-rpg-dark border-2 border-rpg-border hover:border-rpg-gold rounded-xl p-8 text-left transition-all duration-300 hover:transform hover:-translate-y-1 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <Wand2 className="w-16 h-16 text-purple-400 mb-6" />
                            <h2 className="font-display text-2xl font-bold text-rpg-light mb-3">
                                Sou Narrador
                            </h2>
                            <ul className="text-rpg-muted space-y-2 mb-6 text-sm">
                                <li>• Criar infinitas salas e campanhas</li>
                                <li>• Organizar ativos (mapas, bestiário) no Workspace</li>
                                <li>• Configurar Chaves de API de IA e Música</li>
                                <li>• Controle total e moderação in-game</li>
                            </ul>
                            <div className="flex items-center text-purple-400 font-bold text-sm">
                                Escolher Caminho
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
