# Narrador — MVP RPG com IA

Web App para narrar RPG de mesa auxiliado por IA. **MVP com backend** usando Next.js, Express.js, MongoDB, Tailwind CSS e Lucide React.

> **Phase 1 Status**: Workspace + Asset Upload infrastructure complete and ready for local testing.

## 🚀 Quick Start (Phase 1)

### Prerequisites
- Node.js 18+
- MongoDB running locally or via Docker
- Git

### Setup (3 minutes)

**Option A: Automated (Unix/Mac)**
```bash
chmod +x setup-phase1.sh
./setup-phase1.sh
```

**Option B: Automated (Windows)**
```bash
setup-phase1.bat
```

**Option C: Manual**
```bash
# Frontend
npm install
npm run dev &

# Backend (new terminal)
cd backend
npm install
cp .env.example .env
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **Full Phase 1 Setup Guide**: See [PHASE_1_SETUP.md](PHASE_1_SETUP.md)
- **Architecture & Expansion Plan**: See [EXPANSION_PLAN.md](EXPANSION_PLAN.md)
- **AI Agent Instructions**: See [.github/copilot-instructions.md](.github/copilot-instructions.md)

## 📋 Phase 1 Features

✅ **User Authentication** - Register/login with JWT tokens  
✅ **Workspace Management** - Personal workspace per narrator  
✅ **Asset Upload** - Upload PDFs, images, rules documents  
✅ **Asset Library** - Browse, organize, delete assets with tags  
✅ **File Security** - MIME type validation, 100MB limit, user-isolated storage  
✅ **Backend API** - Full REST API with Socket.io ready  
✅ **MongoDB Integration** - Persistent data storage  

## 🎯 What's Next (Phase 2+)

- **RAG Integration**: LangChain.js + Vector DB (assets indexed for AI context)
- **Combat Grid**: Konva.js canvas with token-based combat
- **Co-Narrator AI**: Separate chat for campaign prep & rules questions
- **Real-time Sync**: Socket.io multiplayer game state sync
- **Cloud Storage**: Google Drive, Dropbox, AWS S3 integration
- **Payment Tiers**: Subscription model with usage tracking

## 🔑 Configurar APIs (Current MVP - Frontend Only)

- **API Key (OpenAI ou Anthropic)**  
  No app: entre em uma **sala que você criou (Host)** → role até **"Configuração de IA (Host)"** → cole sua chave no campo e clique em **"Salvar no navegador"**.  
  A chave fica só no seu navegador (LocalStorage), nunca é enviada ao servidor neste MVP.  
  Para obter chaves: [OpenAI API keys](https://platform.openai.com/api-keys) ou [Anthropic Console](https://console.anthropic.com/).

- **Login com Google (futuro)**  
  Hoje o botão "Entrar com Google" só simula o sucesso. Para usar OAuth de verdade: crie um projeto no [Google Cloud Console](https://console.cloud.google.com/), ative "Google+ API" (ou People API) e configure credenciais OAuth 2.0; depois integre no código da tela de login.

- **Dados no navegador**  
  Para ver/limpar dados do app: DevTools (F12) → **Application** → **Local Storage** → `localhost:3000`. Chaves: `narrador_user`, `narrador_rooms`, `narrador_campaign`, `narrador_characters`, `narrador_ai_key`, `narrador_room_state`.

## 📦 Estrutura de pastas

```
src/                          # Frontend (Next.js)
├── app/
│   ├── page.tsx             # Login page
│   ├── dashboard/           # Room list
│   ├── workspace/           # Asset library (Phase 1)
│   └── sala/[id]/          # Game room
├── components/
├── context/
├── lib/
└── app/globals.css

backend/                      # Backend (Express.js)
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.ts
├── package.json
└── .env.example
```

## 🏗️ Architecture (Phase 1)

```
Frontend (Next.js 14)
  ↓
  Workspace Page
  ├─→ Asset Upload Modal
  ├─→ Asset Grid Display
  └─→ Asset Management (delete)
  
Backend (Express.js)
  ↓
  REST API
  ├─→ POST /api/auth/register
  ├─→ POST /api/auth/login
  ├─→ POST /api/workspace/assets (multipart upload)
  ├─→ GET /api/workspace/assets
  └─→ DELETE /api/workspace/assets/:id
  
Database (MongoDB)
  ├─→ User collection
  ├─→ Workspace collection
  └─→ WorkspaceAsset collection

File Storage
  └─→ /uploads/{userId}/{filename}
```

## 📊 Data Models (Phase 1)

**User**
- email (unique)
- password (bcrypt hashed)
- name
- avatar (optional)

**Workspace**
- userId (indexed)
- name
- assets[] (references)
- storageProvider (local_server | google_drive | aws_s3)

**WorkspaceAsset**
- workspaceId
- userId (indexed)
- type (adventure | bestiary | system | item | npc | map)
- name, description, tags
- fileName, filePath, fileSize
- mimeType (validated)
- uploadedAt

  app/              # Rotas (App Router)
    page.tsx        # Login
    layout.tsx      # Layout global
    dashboard/      # Lista de salas
    sala/[id]/      # Página da sala (config, personagens, checklist, IA)
  components/       # Componentes reutilizáveis
  context/          # Estado centralizado (Context API)
    RoomContext.tsx # Estado da sala: lobby, ready check, fases, mensagens
  lib/              # Lógica e LocalStorage
    auth.ts
    rooms.ts
    roomState.ts    # Estado do lobby/jogo (participantes, ready, phase, messages)
    campaign.ts
    characters.ts
    ai-key.ts
    storage.ts
    types.ts
```

## Funcionalidades do MVP

- **Auth:** Login com e-mail/senha e botão "Entrar com Google" (simulado).
- **Dashboard:** Lista de salas, "Criar Sala" (código 6 dígitos), "Entrar com Código".
- **Configuração da Campanha (Host):** Upload (só nome do arquivo), checkbox "IA pode pedir esclarecimentos", campo de autoridade de regras.
- **Personagens:** Simular envio de ficha (nome do arquivo) e lista de personagens pendentes/aprovados pelo Host.
- **Checklist Pré-Jogo:** Stepper com Auth OK, Sala Criada, Fichas Aprovadas, Token IA Configurado.
- **Configuração de IA:** Campo para o Host salvar API Key (OpenAI/Anthropic) apenas no navegador.

### Fluxo de início da campanha (Lobby)

- **Botão "Iniciar Campanha":** Visível apenas para o Host; só fica ativo quando o checklist está OK e todos marcaram "Estou pronto".
- **Ready Check:** Cada jogador marca o checkbox "Estou pronto". O Host vê quem está pendente; pode usar "Simular jogador (teste)" para testar com mais de um jogador.
- **Checklist em tempo real (Host):** Sistema carregado (Backend OK), Campanha carregada, Personagens válidos (fichas aprovadas), Jogadores prontos.

### Fase de preparação da IA (Sincronização e Refinamento)

- **Sincronização:** Após clicar em "Iniciar Campanha", a tela mostra "IA processando campanha e personagens..." por alguns segundos.
- **Refinamento:** Em seguida aparecem perguntas pontuais ao Host (ex.: tom da campanha, NPCs, regras da casa). O Host pode responder (opcional) e clicar em "Confirmar e iniciar narração".

### Início da narrativa e loop de jogo

- **Introdução:** A IA gera o primeiro bloco narrativo e direciona uma pergunta a um jogador específico.
- **Opções de interação:** Cada jogador pode escolher:
  - **Agir:** Enviar uma ação para a história.
  - **Consultar:** Perguntas diretas à IA (fora do personagem).
  - **Interagir:** Conversar com NPCs (controlados pela IA).
- **Chat:** Mensagens de **narração** (estilo diferente, ex. borda dourada) e **respostas à dúvida** (estilo diferente, ex. borda azul) são diferenciadas visualmente.

### Devolver o turno à IA (Finalizar Turno)

- **Estado em turno:** Enquanto o jogador escreve ou interage, o indicador mostra **"Em turno do Jogador [Nome]"**.
- **Botão "Finalizar Turno":** Visível apenas para quem está na vez. Ao clicar:
  - O input do jogador é bloqueado (estado **Processing** / "A IA está narrando...").
  - O histórico da conversa (contexto) é atualizado com as mensagens do jogador e enviado à API da IA.
  - A IA valida a ação (conforme regras carregadas), narra a consequência e avança a cena, direcionando ao próximo jogador.
- **Indicadores visuais:**
  - **"A IA está narrando..."** — durante o processamento.
  - **"Em turno do Jogador [Nome]"** — quando é a sua vez.
  - **"Aguardando [Nome]..."** — quando é a vez de outro jogador.
- **Fila de turnos:** Após a narração da IA, o turno passa automaticamente ao próximo jogador (round-robin). O **Host** pode usar **"Passar a bola"** para escolher manualmente o próximo jogador.
- A IA **só** gera resposta quando o turno é oficialmente devolvido com **"Finalizar Turno"** (evita múltiplos turnos automáticos).

Estado centralizado via **Context API** (`RoomContext`); dados do lobby e do jogo persistem em LocalStorage (`narrador_room_state`).

Tema: cores escuras (RPG / Dark Mode).
# narrador
