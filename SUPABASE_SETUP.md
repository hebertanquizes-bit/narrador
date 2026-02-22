# 🚀 Guia de Setup Supabase — Narrador VTT

## O que foi criado nesta sessão

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts      ← Cliente browser (singleton)
│       ├── server.ts      ← Cliente server (Next.js Server Components)
│       ├── auth.ts        ← Login/logout/registro/Google OAuth
│       ├── types.ts       ← Todos os tipos TypeScript do banco
│       └── index.ts       ← Barrel export
│
├── context/
│   └── AuthContext.tsx    ← Provider global: useAuth()
│
└── app/
    └── auth/
        └── callback/
            └── route.ts   ← Handler OAuth Google

middleware.ts              ← Proteção de rotas + sessões automáticas
supabase/
└── schema.sql             ← Schema completo do banco (executar no Supabase)
.env.local                 ← Variáveis de ambiente (preencher!)
```

---

## ✅ PASSO 1 — Criar projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Defina:
   - **Name:** `narrador-vtt`
   - **Database Password:** (anote em um lugar seguro)
   - **Region:** South America (São Paulo) — `sa-east-1`
4. Aguarde ~2 minutos para o projeto provisionar

---

## ✅ PASSO 2 — Preencher as variáveis de ambiente

No painel do Supabase, vá em:
**Project Settings → API**

Copie e cole em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## ✅ PASSO 3 — Executar o Schema SQL

1. No painel Supabase, vá em **SQL Editor**
2. Clique em **"New Query"**
3. Cole o conteúdo de `supabase/schema.sql`
4. Clique em **"Run"** (▶)

Isso cria:
- ✅ Tabela `profiles` (auto-criada no signup)
- ✅ Tabela `player_workspaces`
- ✅ Tabela `narrator_workspaces`
- ✅ Tabela `rooms`
- ✅ Tabela `room_participants`
- ✅ Tabela `rpg_systems` (com dados iniciais)
- ✅ Triggers automáticos (updated_at, criar profile no signup)
- ✅ Row Level Security (RLS) em todas as tabelas

---

## ✅ PASSO 4 — Ativar Google OAuth no Supabase

1. Vá em **Authentication → Providers → Google**
2. Ative o toggle **"Enable Google provider"**
3. Configure seu Google OAuth App:
   - Acesse: https://console.cloud.google.com/apis/credentials
   - Crie um projeto ou use um existente
   - **Authorized redirect URIs:** 
     ```
     https://SEU-PROJETO.supabase.co/auth/v1/callback
     ```
4. Copie o **Client ID** e **Client Secret** para o painel Supabase

---

## ✅ PASSO 5 — Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🔄 Estado da Migração

| Componente | Status |
|---|---|
| Supabase instalado | ✅ |
| Cliente configurado | ✅ |
| Schema do banco | ✅ (aguardando execução no painel) |
| Auth (email + Google) | ✅ (código pronto) |
| Middleware de rotas | ✅ |
| AuthProvider global | ✅ |
| Variáveis de ambiente | ⏳ (preencher .env.local) |
| Página de Login nova | 🔜 Próxima etapa |
| Escolha de Workspace | 🔜 Próxima etapa |
| Dashboard atualizado | 🔜 Próxima etapa |
| Backend Express | 🔜 Deprecar gradualmente |

---

## ⚠️ Notas Importantes

- O backend Express ainda existe e funciona — não o quebre
- Os componentes existentes continuam funcionando com localStorage
- A migração é **gradual** — página por página
- Quando uma página for migrada, ela passa a usar Supabase
- Páginas não migradas continuam usando o sistema antigo

---

## 🏗️ Próximas etapas (próxima sessão)

1. **Nova página de Login** (`/`) — com botão Google + email/senha
2. **Página de Escolha de Workspace** (`/escolha-workspace`) — Jogador 🛡 ou Narrador 🧙
3. **Dashboard migrado** — usando `useAuth()` e dados do Supabase
4. **Workspace do Narrador** — visual "Sala de Forja"
