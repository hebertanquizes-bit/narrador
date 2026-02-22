"use client";

import { Loader2 } from "lucide-react";

export default function SyncPhase() {
  return (
    <div className="panel flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-rpg-accent mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">
        Sincronização
      </h2>
      <p className="text-rpg-muted text-center max-w-md">
        A IA está processando as informações da campanha e dos personagens para resolver ambiguidades.
      </p>
    </div>
  );
}
