"use client";

import { useState } from "react";
import { Shield, Wand2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chooseWorkspaceType } from "@/lib/supabase/auth";

export default function WorkspaceSelectionPage() {
    const { user, loading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Não redireciona automaticamente — o usuário veio aqui para trocar de papel
    // O acesso a esta página é controlado pelo Workspace

    const handleSelect = async (role: "player" | "narrator") => {
        if (!user) return;
        setSaving(true);
        setError(null);

        try {
            await chooseWorkspaceType(user.id, role);
            // Hard redirect: força o AuthContext a reiniciar com o novo role
            // sem depender do refresh() que pode travar
            window.location.href = '/dashboard';
        } catch (err) {
            console.error("Erro ao escolher workspace:", err);
            setError(err instanceof Error ? err.message : "Erro desconhecido ao configurar seu espaço.");
            setSaving(false);
        }
    };

    // Mostrar loading enquanto verifica sessão
    if (loading) {
        return (
            <div className="min-h-screen bg-rpg-darker flex items-center justify-center">
                <p className="text-rpg-muted">Carregando...</p>
            </div>
        );
    }

    // Usuário não logado
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-rpg-darker flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-rpg-gold mb-4">
                        Escolha seu Papel
                    </h1>
                    <p className="text-xl text-rpg-light/80">
                        Como você vai jogar nesta sessão?
                    </p>
                    <p className="text-sm text-rpg-muted mt-2">
                        Você pode trocar de papel a qualquer momento voltando aqui.
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
                        disabled={saving}
                        className="group relative bg-rpg-dark border-2 border-rpg-border hover:border-blue-500 rounded-xl p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden"
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
                                {saving ? "Salvando..." : "Escolher Caminho"}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Narrador */}
                    <button
                        onClick={() => handleSelect("narrator")}
                        disabled={saving}
                        className="group relative bg-rpg-dark border-2 border-rpg-border hover:border-purple-500 rounded-xl p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <Wand2 className="w-16 h-16 text-purple-400 mb-6" />
                            <h2 className="font-display text-2xl font-bold text-rpg-light mb-3">
                                Sou Narrador
                            </h2>
                            <ul className="text-rpg-muted space-y-2 mb-6 text-sm">
                                <li>• Criar novas salas e campanhas</li>
                                <li>• Organizar ativos (mapas, bestiário)</li>
                                <li>• Configurar Chaves de API de IA e Música</li>
                                <li>• Controle total e moderação in-game</li>
                            </ul>
                            <div className="flex items-center text-purple-400 font-bold text-sm">
                                {saving ? "Salvando..." : "Escolher Caminho"}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
