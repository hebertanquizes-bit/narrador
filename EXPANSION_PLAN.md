# Arquitetura Refinada: Narrador VTT + Co-Narrativa IA

## 🎯 Visão Geral do Sistema

O **Narrador** evolui para uma **plataforma VTT completa** onde cada Mestre/Narrador tem seu próprio **Workspace** (biblioteca privada de materiais), cria **Salas de Campanha** (sessões isoladas), e a IA atua como **Co-Narrador** (chat privado, sugestões, NPC automation, geração de eventos).

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Next.js/React)                  │
│  ┌──────────────────┬──────────────────┬──────────────────┐ │
│  │   Workspace UI   │   Campaign Room  │  Combat Grid     │ │
│  │  (Asset Upload)  │  (Chat & Chat    │  (Konva.js)      │ │
│  │                  │   Bastidores)    │                  │ │
│  └──────────────────┴──────────────────┴──────────────────┘ │
│                            │                                  │
│                  Socket.io (real-time)                       │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│  ┌──────────────────┬──────────────────┬──────────────────┐  │
│  │  Workspace Mgr   │  Campaign State  │  AI Orchestrator │  │
│  │  (File Upload)   │  (Real-time)     │  (LangChain.js)  │  │
│  └──────────────────┴──────────────────┴──────────────────┘  │
│                             │                                 │
│     ┌─────────────────────────────────────────────┐           │
│     │    RAG Engine (LangChain + Embeddings)      │           │
│     │  - PDF/Markdown Parsing                     │           │
│     │  - Vector DB (Pinecone/Weaviate/Local)      │           │
│     │  - Rules Retrieval                          │           │
│     └─────────────────────────────────────────────┘           │
│                             │                                 │
│     ┌─────────────────────────────────────────────┐           │
│     │         Multi-Provider AI Layer             │           │
│     │  - OpenAI (Subscribed / BYOK)               │           │
│     │  - Anthropic Claude                         │           │
│     │  - Deepseek / Local Models                  │           │
│     └─────────────────────────────────────────────┘           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│              DATA LAYER (LocalStorage + Backend)              │
│  ┌──────────────────┬──────────────────┬──────────────────┐  │
│  │  User Workspace  │  Campaign/Session │  Vector Store    │  │
│  │  (/uploads/{userId})  │ (DB)        │  (Embeddings)    │  │
│  └──────────────────┴──────────────────┴──────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Pastas (Backend + Frontend)

### 2.1 Backend Node.js

```
narrador-backend/
├── src/
│   ├── middleware/
│   │   ├── auth.js                 # JWT + session validation
│   │   ├── errorHandler.js
│   │   └── socketAuth.js           # Socket.io auth
│   │
│   ├── controllers/
│   │   ├── workspaceController.js  # Upload, list, delete assets
│   │   ├── campaignController.js   # CRUD campaigns + state
│   │   ├── chatController.js       # Message persistence
│   │   └── combatController.js     # Grid state, NPC AI
│   │
│   ├── services/
│   │   ├── aiService.js            # Multi-provider AI orchestration
│   │   ├── ragService.js           # LangChain + Vector DB
│   │   ├── npcAIService.js         # NPC decision engine
│   │   ├── fileUploadService.js    # S3 / Local file management
│   │   ├── vectorDBService.js      # Embeddings + retrieval
│   │   └── historyService.js       # Adventure log generation
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Workspace.js            # Assets metadata
│   │   ├── Campaign.js
│   │   ├── CampaignAssets.js       # Assets used in campaign
│   │   ├── ChatMessage.js
│   │   ├── CombatState.js          # Grid + tokens
│   │   ├── NPC.js                  # NPC sheets + tactics
│   │   └── AdventureLog.js         # Auto-generated history
│   │
│   ├── sockets/
│   │   ├── campaignSocket.js       # Campaign room events
│   │   ├── combatSocket.js         # Combat grid sync
│   │   ├── chatSocket.js           # Chat + backstage events
│   │   └── narrativeSocket.js      # AI narrative events
│   │
│   ├── utils/
│   │   ├── fileUpload.js           # Multer + file validation
│   │   ├── aiPrompts.js            # Prompt templates
│   │   ├── combatRules.js          # Combat logic helpers
│   │   └── tokenGenerator.js       # Image → token conversion
│   │
│   ├── config/
│   │   ├── database.js             # MongoDB/Postgres
│   │   ├── vectorStore.js          # Pinecone/Weaviate/Qdrant
│   │   ├── ai.js                   # API keys + model configs
│   │   └── fileStorage.js          # S3 / local paths
│   │
│   └── server.js                   # Express + Socket.io entry
│
├── .env.example
├── package.json
└── README.md
```

### 2.2 Frontend Next.js (adições ao existente)

```
narrador/src/
├── app/
│   ├── workspace/
│   │   ├── page.tsx               # Workspace hub
│   │   ├── assets/
│   │   │   ├── page.tsx           # Asset library
│   │   │   └── upload/
│   │   │       └── page.tsx       # Upload form
│   │   └── [id]/
│   │       ├── page.tsx           # Edit workspace
│   │       └── assets/page.tsx    # Manage assets
│   │
│   ├── sala/[id]/
│   │   ├── page.tsx               # (existing, enhance)
│   │   ├── combat/
│   │   │   └── page.tsx           # Combat grid
│   │   ├── backstage/
│   │   │   └── page.tsx           # Master + AI chat
│   │   ├── asset-selector/
│   │   │   └── page.tsx           # Asset curation
│   │   └── adventure-log/
│   │       └── page.tsx           # AI-generated log
│   │
│   └── api/
│       ├── workspace/
│       │   ├── upload/route.ts    # File upload endpoint
│       │   ├── list/route.ts
│       │   └── delete/route.ts
│       ├── rag/query/route.ts     # RAG search
│       ├── npc/action/route.ts    # NPC AI decision
│       └── log/generate/route.ts  # Adventure log
│
├── components/
│   ├── WorkspaceUpload.tsx        # Drag-drop asset upload
│   ├── AssetLibrary.tsx           # Browse + organize assets
│   ├── AssetCurator.tsx           # Select assets for room
│   ├── CombatGrid.tsx             # Konva.js grid + tokens
│   ├── TokenDragDrop.tsx          # Token manipulation
│   ├── BackstageChat.tsx          # Master-AI private chat
│   ├── NarrativeGuidelines.tsx    # Master input form
│   ├── AdventureLogViewer.tsx     # Display generated log
│   ├── NPCSheet.tsx               # NPC card viewer
│   └── CombatFooter.tsx           # Turn indicators
│
├── context/
│   ├── WorkspaceContext.tsx       # Workspace state
│   ├── CombatContext.tsx          # Combat state
│   ├── AIContext.tsx              # AI config state
│   └── ChatContext.tsx            # (enhance existing)
│
├── lib/
│   ├── rag.ts                     # RAG query client
│   ├── npcAI.ts                   # NPC decision calls
│   ├── combatLogic.ts             # Grid + FOV helpers
│   ├── fileUpload.ts              # Upload helpers
│   ├── tokenizer.ts               # Image → token utils
│   └── hooks/
│       ├── useWorkspace.ts
│       ├── useCombat.ts
│       ├── useRag.ts
│       └── useNpcAI.ts
│
└── types/
    ├── workspace.ts               # Asset, Workspace types
    ├── combat.ts                  # Grid, Token, NPC types
    ├── rag.ts                     # Query, Document types
    └── ai.ts                      # AI provider types
```

---

## 3. Fases de Implementação

### Fase 1: Fundação (Semanas 1-2)
**Objetivo**: Estrutura backend + upload de assets

- [x] Configurar Express + Socket.io + TypeScript no backend
- [x] Setup MongoDB/Postgres para modelos
- [x] Implementar autenticação JWT
- [x] Criar endpoint `/api/workspace/upload` com Multer
- [x] Estrutura de pastas `/uploads/{userId}/` no S3 ou filesystem
- [x] Modelo `Workspace` + `WorkspaceAsset`
- [x] Frontend: página `/workspace` + componente `WorkspaceUpload.tsx`
- [x] Testes: upload de PDF, imagem, validação MIME

**Saída**: Usuários conseguem fazer upload e armazenar ativos privados

---

### Fase 2: RAG + IA (Semanas 3-4)
**Objetivo**: Configurar LangChain.js + Vector DB + Multi-provider AI

- [x] Instalar `langchain`, `@pinecone-database/pinecone` (ou Weaviate local)
- [x] Criar `ragService.js`: parse PDF → chunks → embeddings
- [x] Setup Vector DB (Pinecone/Weaviate gratuito ou local Qdrant)
- [x] Implementar retrieval: pergunta → busca docs relevantes
- [x] `aiService.js`: interface unificada para OpenAI, Anthropic, Deepseek
- [x] Suportar BYOK (bring your own key) no nível de Workspace
- [x] Endpoint `/api/rag/query` que usa RAG para responder
- [x] Testes: perguntar sobre regras → IA responde com contexto correto

**Saída**: IA consegue usar documentos do usuário para tomar decisões

---

### Fase 3: Backstage Chat + NPC AI (Semanas 5-6)
**Objetivo**: Canal privado Master-IA + decisões de NPC

- [x] Socket.io event: `backstage:narrative_directive` (Master → IA)
- [x] IA processa diretiva e cria plano executável
- [x] Endpoint `/api/npc/action`: NPC analisa contexto + fichas → decide ação
- [x] Grid: adicionar tokens e seus dados (HP, skills, etc)
- [x] Frontend: `BackstageChat.tsx` + `NarrativeGuidelines.tsx`
- [x] Log de bastidores: histórico do que foi planejado vs executado
- [x] Testes: Master diz "prepare uma emboscada" → IA cria trigger

**Saída**: Master controla a narrativa pelo backstage; IA executa em tempo certo

---

### Fase 4: Combat Grid (Semanas 7-8)
**Objetivo**: Grid visual + automação de NPCs

- [x] Instalar Konva.js ou PixiJS
- [x] Componente `CombatGrid.tsx`: grid alfanumérico + drag-and-drop
- [x] `TokenDragDrop.tsx`: arrastar personagens e NPCs
- [x] Modelo `CombatState`: posições, saúde, status efeitos
- [x] Socket.io: sync em tempo real da grid para todos jogadores
- [x] Endpoint `/api/npc/action` integrado com grid:
  - NPC lê posição, HP, adversários próximos
  - IA decide: atacar, mover, usar skill, fugir
- [x] Turno automático: NPC age quando é sua vez
- [x] Frontend: `CombatFooter.tsx` com turn order visual
- [x] Testes: múltiplos NPCs, cálculos automáticos

**Saída**: Combat visual e automação de ações de NPCs

---

### Fase 5: Adventure Log + Refinamentos (Semanas 9-10)
**Objetivo**: Histórico auto-gerado + polish

- [x] Endpoint `/api/log/generate`: pega todas mensagens + ações → IA resume
- [x] Histórico de NPCs conhecidos e quests feitas
- [x] Frontend: `AdventureLogViewer.tsx`
- [x] Asset curation: Master seleciona quais assets usar em qual sessão
- [x] Estado "Estou Pronto": reativar existente + melhorar UX
- [x] Persistência de state durante crashes
- [x] Deploy: considerar cloud (Vercel frontend, Render/Railway backend)

**Saída**: Plataforma completa de VTT

---

## 4. Fluxo de Dados Detalhado

### 4.1 Upload de Asset (Workspace)

```
Cliente                    Backend                    Storage
   │                          │                          │
   ├─ POST /workspace/upload─>│                          │
   │   (FormData: file, type) │                          │
   │                          ├─ Validar MIME           │
   │                          ├─ Parse (PDF/Markdown)   │
   │                          ├─ Gerar Chunks           │
   │                          ├─ Criar Embeddings       │
   │                          ├─ Store em Vector DB     │
   │                          ├─ Upload file → S3      <┤
   │                          │                          │
   │    <─ 200 OK ────────────┤                          │
   │      {assetId, url}      │                          │
   │                                                      │
```

### 4.2 Query RAG (During Backstage Chat)

```
Master              Frontend              Backend              Vector DB
   │                   │                    │                     │
   ├─ Pergunta ───────>│                    │                     │
   │                   ├─ Socket.io ──────>│                     │
   │                   │   backstage:query  │                     │
   │                   │                    ├─ Embed pergunta    │
   │                   │                    ├─ Search ───────────>│
   │                   │                    │   (cosine sim)       │
   │                   │                    │<─ Top 5 docs ───────┤
   │                   │                    ├─ Create LLM prompt
   │                   │                    ├─ Call OpenAI/Claude
   │                   │                    │
   │                   │<─ Socket.emit ─────┤
   │                   │   backstage:ai_response
   │<─ Display ────────┤
   │
```

### 4.3 NPC Turn (Combat Grid)

```
Current Turn: NPC              Backend                 Grid State
      │                           │                        │
      ├─ Socket emit ────────────>│                        │
      │   combat:npc_turn         │                        │
      │                           ├─ Load NPC data        │
      │                           ├─ Load grid state      │
      │                           ├─ Call /api/npc/action │
      │                           │   (RAG + LLM)         │
      │                           ├─ IA decide action     │
      │                           ├─ Validate action      │
      │                           ├─ Update grid ────────>│
      │                           │                        │
      │<─ Socket.emit ────────────┤
      │   combat:npc_acted
      │   {action, newPos, damage}
      │
```

### 4.4 Adventure Log Generation

```
End of Session              Backend                    AI Service
      │                        │                          │
      ├─ Generate log ────────>│                          │
      │                        ├─ Fetch all messages     │
      │                        ├─ Fetch all actions      │
      │                        ├─ Build context           │
      │                        ├─ Call OpenAI ───────────>│
      │                        │   (summarize + extract)   │
      │                        │<─ Summary + metadata ────┤
      │                        ├─ Store in DB             │
      │                        ├─ Extract NPCs, quests    │
      │                        │
      │<─ Adventure Log entry  │
      │
```

---

## 5. Modelos de Dados (MongoDB/Postgres)

### 5.1 Workspace

```typescript
interface WorkspaceAsset {
  id: string;
  userId: string;
  assetType: "pdf" | "image" | "markdown" | "character_sheet";
  fileName: string;
  originalPath: string;
  s3Key: string; // /uploads/{userId}/filename
  uploadedAt: Date;
  
  // Para PDFs + Markdown (RAG)
  vectorStoreId?: string; // ID no Pinecone/Weaviate
  chunks?: number; // quantos chunks
  metadata?: Record<string, any>;
}

interface Workspace {
  id: string;
  userId: string;
  name: string;
  description?: string;
  assets: WorkspaceAsset[];
  aiProvider: "openai" | "anthropic" | "deepseek" | "byok";
  apiKeyEncrypted?: string; // só se BYOK
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Campaign + Assets

```typescript
interface CampaignAssetSelection {
  campaignId: string;
  assetIds: string[]; // selecionados pelo Master
  context?: string; // instruções sobre como usar esses assets
}

interface Campaign {
  id: string;
  roomId: string;
  workspaceId: string;
  selectedAssets: CampaignAssetSelection;
  
  // Combat state
  combatActive: boolean;
  currentTurnNpcId?: string;
  gridState?: CombatGridState;
  
  // Backstage
  backstageHistory: BackstageMessage[];
  narrativeDirectives: NarrativeDirective[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface CombatGridState {
  width: number;
  height: number;
  tokens: Token[];
  obstacles?: Obstacle[];
  lighting?: LightingZone[];
}

interface Token {
  id: string;
  npcId?: string;
  playerId?: string;
  position: { x: number; y: number };
  imageUrl: string;
  stats: { hp: number; maxHp: number; ac: number };
  effects: StatusEffect[];
}
```

### 5.3 Adventure Log

```typescript
interface AdventureLogEntry {
  id: string;
  campaignId: string;
  sessionNumber: number;
  date: Date;
  
  summary: string; // IA-gerada
  importantEvents: string[];
  npcsEncountered: string[];
  questsUpdated: string[];
  
  fullLog: string; // transcrição completa
  createdAt: Date;
}
```

---

## 6. Endpoints API (Backend)

### 6.1 Workspace Management

```
POST   /api/workspace/upload
       Body: { file, type, workspaceId }
       Returns: { assetId, url, vectorStoreId }

GET    /api/workspace/:userId
       Returns: Workspace[]

GET    /api/workspace/:workspaceId/assets
       Returns: WorkspaceAsset[]

DELETE /api/workspace/:workspaceId/assets/:assetId
       Returns: { success }

POST   /api/workspace/:workspaceId/configure-rag
       Body: { assetIds, vectorStoreProvider }
       Returns: { configured, embeddingsCount }
```

### 6.2 Campaign Management

```
POST   /api/campaign/:campaignId/select-assets
       Body: { assetIds, context }
       Returns: { selectedAssets }

GET    /api/campaign/:campaignId/state
       Returns: CampaignState + CombatGridState

PATCH  /api/campaign/:campaignId/state
       Body: { gridState, combatActive, ... }
       Returns: updated state
```

### 6.3 RAG Queries

```
POST   /api/rag/query
       Body: { query, campaignId, context }
       Returns: { answer, sources, confidence }

POST   /api/rag/search
       Body: { query, assetIds, limit }
       Returns: Document[] (chunks + scores)
```

### 6.4 NPC AI

```
POST   /api/npc/action
       Body: {
         npcId,
         campaignId,
         gridState,
         context: "combat" | "roleplay",
         objectives: string[]
       }
       Returns: {
         action: "attack" | "move" | "cast" | "flee" | "dialog",
         targetId?: string,
         targetPosition?: { x, y },
         dialog?: string,
         abilityUsed?: string
       }

GET    /api/npc/:npcId/sheet
       Returns: NPC full data (stats, abilities, personality)
```

### 6.5 Backstage (Socket.io Events)

```javascript
// Master sends narrative directive
socket.emit('backstage:directive', {
  campaignId,
  directive: "Prepare ambush when party camps",
  triggerCondition: "party_rests"
})

// AI responds with execution plan
socket.on('backstage:plan_created', (plan) => {
  // plan: { id, directive, executionSteps, predictedOutcome }
})

// Master asks RAG question
socket.emit('backstage:query', {
  campaignId,
  query: "What are the rules for casting fireball in D&D 5e?"
})

// AI responds with RAG answer
socket.on('backstage:rag_response', (response) => {
  // response: { answer, sources }
})
```

### 6.6 Combat (Socket.io Events)

```javascript
// Master moves token
socket.emit('combat:move_token', {
  campaignId,
  tokenId,
  newPosition: { x, y }
})

// All players see movement
socket.on('combat:token_moved', (data) => {
  // update grid
})

// NPC turn
socket.emit('combat:npc_turn', {
  campaignId,
  npcId
})

// Backend decides action + broadcasts
socket.on('combat:npc_acted', (data) => {
  // data: { npcId, action, position, damage, dialog }
})
```

---

## 7. Configuração LangChain.js + RAG

### 7.1 Inicialização

```javascript
// ragService.js
import { RecursiveCharacterTextSplitter } from "langchain/text_splitters";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.Index(process.env.PINECONE_INDEX);
const embeddings = new OpenAIEmbeddings();

export async function indexPdfDocument(filePath, assetId, namespace) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const chunks = await splitter.splitDocuments(docs);
  
  // Add metadata
  chunks.forEach((chunk) => {
    chunk.metadata.assetId = assetId;
    chunk.metadata.source = filePath;
  });
  
  // Store in Pinecone
  await PineconeStore.fromDocuments(chunks, embeddings, {
    pineconeIndex: index,
    namespace,
  });
  
  return chunks.length;
}

export async function queryRag(query, namespace, k = 5) {
  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    { pineconeIndex: index, namespace }
  );
  
  const results = await vectorStore.similaritySearchWithScore(query, k);
  
  return results.map(([doc, score]) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
    score,
  }));
}
```

### 7.2 RAG Query com LLM

```javascript
// aiService.js
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

const llm = new OpenAI({
  openaiApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
  temperature: 0.7,
});

const ragTemplate = `You are a helpful D&D 5e rules assistant.
Based on the following rules documents, answer the question accurately.

Rules Context:
{rules}

User Question: {question}

Answer:`;

const prompt = PromptTemplate.fromTemplate(ragTemplate);
const chain = new LLMChain({ llm, prompt });

export async function answerWithRag(question, rules) {
  const result = await chain.call({
    rules: rules.map((r) => r.content).join("\n\n"),
    question,
  });
  
  return result.text;
}
```

### 7.3 NPC Decision Engine

```javascript
// npcAIService.js
import { OpenAI } from "langchain/llms/openai";
import { queryRag } from "./ragService.js";

const llm = new OpenAI({
  openaiApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
  temperature: 0.8, // mais criativo
});

export async function decideNpcAction(npc, gridState, combatContext, campaignId) {
  // Buscar regras de combate via RAG
  const combatRules = await queryRag(
    "What are the combat action rules?",
    `campaign_${campaignId}`,
    3
  );
  
  const prompt = `
    You are controlling an NPC in a tactical combat encounter.
    
    NPC: ${npc.name}
    - HP: ${npc.hp}/${npc.maxHp}
    - AC: ${npc.ac}
    - Position: (${npc.position.x}, ${npc.position.y})
    - Personality: ${npc.personality}
    - Tactics: ${npc.tactics}
    
    Nearby enemies:
    ${gridState.tokens
      .filter((t) => t.position.distance(npc.position) < 10)
      .map((t) => `- ${t.name} at (${t.position.x}, ${t.position.y})`)
      .join("\n")}
    
    Combat Rules:
    ${combatRules.map((r) => r.content).join("\n")}
    
    Decide your next action. Response must be JSON:
    {
      "action": "attack" | "move" | "cast_spell" | "dodge" | "flee" | "dialog",
      "targetId": "...",
      "targetPosition": { "x": ..., "y": ... },
      "dialog": "...",
      "reasoning": "..."
    }
  `;
  
  const response = await llm.call(prompt);
  return JSON.parse(response);
}
```

---

## 8. Estrutura Socket.io (Backend)

```javascript
// sockets/campaignSocket.js
export function setupCampaignSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join:campaign", (campaignId) => {
      socket.join(`campaign_${campaignId}`);
    });
    
    // Backstage chat
    socket.on("backstage:directive", async (data) => {
      const { campaignId, directive, triggerCondition } = data;
      
      // Salvar diretiva
      const saved = await NarrativeDirective.create({
        campaignId,
        directive,
        triggerCondition,
        createdBy: socket.userId,
      });
      
      // IA cria plano
      const plan = await aiService.createExecutionPlan(
        directive,
        campaignId
      );
      
      io.to(`campaign_${campaignId}`).emit("backstage:plan_created", {
        planId: saved.id,
        executionSteps: plan.steps,
        estimatedTriggerTime: plan.trigger,
      });
    });
    
    // RAG query
    socket.on("backstage:query", async (data) => {
      const { campaignId, query } = data;
      
      const ragResults = await ragService.queryRag(
        query,
        `campaign_${campaignId}`
      );
      
      const answer = await aiService.answerWithRag(query, ragResults);
      
      socket.emit("backstage:rag_response", {
        query,
        answer,
        sources: ragResults.map((r) => r.metadata.source),
      });
    });
  });
}

// sockets/combatSocket.js
export function setupCombatSocket(io) {
  io.on("connection", (socket) => {
    socket.on("combat:join", (campaignId) => {
      socket.join(`combat_${campaignId}`);
    });
    
    // NPC turn
    socket.on("combat:npc_turn", async (data) => {
      const { campaignId, npcId } = data;
      
      const npc = await NPC.findById(npcId);
      const campaign = await Campaign.findById(campaignId);
      
      const action = await npcAIService.decideNpcAction(
        npc,
        campaign.gridState,
        { round: campaign.currentRound },
        campaignId
      );
      
      // Validar e aplicar ação
      const result = await combatService.executeNpcAction(
        npc,
        action,
        campaign.gridState
      );
      
      // Broadcast
      io.to(`combat_${campaignId}`).emit("combat:npc_acted", {
        npcId,
        action: action.action,
        movement: result.movement,
        damage: result.damage,
        newGridState: result.newGridState,
      });
    });
  });
}
```

---

## 9. Frontend Components (React/Next.js)

### 9.1 Workspace Upload

```typescript
// components/WorkspaceUpload.tsx
"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function WorkspaceUpload({
  workspaceId,
  onUploadSuccess,
}: {
  workspaceId: string;
  onUploadSuccess: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", file.type);
      formData.append("workspaceId", workspaceId);

      setUploading(true);
      try {
        const res = await fetch("/api/workspace/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Uploaded:", data.assetId);
          onUploadSuccess();
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
        dragging ? "border-rpg-gold bg-rpg-gold/10" : "border-rpg-border"
      }`}
    >
      <Upload className="h-8 w-8 mx-auto mb-2" />
      <p className="text-sm text-rpg-muted">
        Arraste PDFs, imagens ou fichas de personagens aqui
      </p>
      {uploading && (
        <div className="mt-4 bg-rpg-border rounded-full overflow-hidden">
          <div
            className="bg-rpg-gold h-2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### 9.2 Combat Grid (Konva.js)

```typescript
// components/CombatGrid.tsx
"use client";

import { useEffect, useRef } from "react";
import Konva from "konva";
import { useSocket } from "@/hooks/useSocket";

export default function CombatGrid({
  campaignId,
  gridState,
  isHost,
}: {
  campaignId: string;
  gridState: CombatGridState;
  isHost: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Konva stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 800,
      height: 800,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Draw grid
    for (let i = 0; i <= gridState.width; i++) {
      const line = new Konva.Line({
        points: [i * 50, 0, i * 50, gridState.height * 50],
        stroke: "#2a3142",
        strokeWidth: 1,
      });
      layer.add(line);
    }

    // Draw tokens
    gridState.tokens.forEach((token) => {
      const image = new Konva.Image({
        x: token.position.x * 50,
        y: token.position.y * 50,
        width: 50,
        height: 50,
        draggable: isHost,
      });

      // Load image
      const img = new Image();
      img.src = token.imageUrl;
      img.onload = () => {
        image.image(img);
        layer.draw();
      };

      // Drag events
      if (isHost) {
        image.on("dragend", () => {
          const newPos = {
            x: Math.round(image.x() / 50),
            y: Math.round(image.y() / 50),
          };

          socket?.emit("combat:move_token", {
            campaignId,
            tokenId: token.id,
            newPosition: newPos,
          });
        });
      }

      layer.add(image);
    });

    layer.draw();
    stageRef.current = stage;

    return () => {
      stage.destroy();
    };
  }, [gridState, isHost, campaignId, socket]);

  return (
    <div
      ref={containerRef}
      className="border border-rpg-border rounded-lg overflow-hidden"
    />
  );
}
```

### 9.3 Backstage Chat

```typescript
// components/BackstageChat.tsx
"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function BackstageChat({
  campaignId,
}: {
  campaignId: string;
}) {
  const [messages, setMessages] = useState<BackstageMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("backstage:rag_response", (response) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: response.answer,
          sources: response.sources,
        },
      ]);
      setLoading(false);
    });

    socket.on("backstage:plan_created", (plan) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Plan created: ${plan.executionSteps.join(", ")}`,
          type: "plan",
        },
      ]);
    });
  }, [socket]);

  const handleQuery = () => {
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { role: "master", content: query }]);
    socket?.emit("backstage:query", {
      campaignId,
      query,
    });

    setQuery("");
    setLoading(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded ${
              msg.role === "master"
                ? "bg-rpg-accent/10 text-rpg-accent ml-auto max-w-xs"
                : "bg-rpg-gold/10 text-rpg-gold"
            }`}
          >
            <p>{msg.content}</p>
            {msg.sources && (
              <p className="text-xs mt-2 opacity-70">
                Fontes: {msg.sources.join(", ")}
              </p>
            )}
          </div>
        ))}
        {loading && <p className="text-rpg-muted animate-pulse">IA pensando...</p>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleQuery()}
          placeholder="Pergunta ou diretiva narrativa..."
          className="input-field flex-1"
        />
        <button
          onClick={handleQuery}
          disabled={loading}
          className="btn-primary px-4"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
```

---

## 10. Pacotes Necessários (package.json)

### Backend

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.6.0",
    "mongoose": "^7.0.0",
    "multer": "^1.4.5",
    "dotenv": "^16.0.0",
    "jwt-simple": "^0.5.6",
    "langchain": "^0.0.150",
    "@pinecone-database/pinecone": "^0.1.0",
    "pdf-parse": "^1.1.1",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "konva": "^9.0.0",
    "react-konva": "^18.0.0",
    "socket.io-client": "^4.6.0",
    "lucide-react": "^0.460.0"
  }
}
```

---

## 11. Roadmap de Desenvolvimento (10 Semanas)

| Semana | Fase | Tasks |
|--------|------|-------|
| 1-2 | Foundation | Backend setup, Auth, Upload, Workspace model |
| 3-4 | RAG + AI | LangChain, Vector DB, Multi-provider support |
| 5-6 | Backstage | Socket.io, NPC AI, Backstage chat |
| 7-8 | Combat | Konva grid, Token management, NPC automation |
| 9-10 | Polish | Adventure log, Asset curation, Deploy |

---

## 12. Checklist de Desenvolvimento

- [ ] Backend Express + Socket.io configurado
- [ ] JWT authentication implementado
- [ ] Multer + file upload para `/uploads/{userId}/`
- [ ] MongoDB schemas criados
- [ ] LangChain.js + Pinecone configurados
- [ ] RAG query funcionando
- [ ] Multi-provider AI (OpenAI, Anthropic, Deepseek)
- [ ] NPC AI decision engine pronto
- [ ] Socket.io events para backstage
- [ ] Socket.io events para combat
- [ ] Konva.js grid + drag-and-drop
- [ ] Frontend components (Workspace, Combat, Backstage)
- [ ] Adventure log generation
- [ ] Asset curation UI
- [ ] Testes end-to-end
- [ ] Deploy (Vercel + Render/Railway)

---

## 13. Dicas & Gotchas

1. **Isolamento de dados**: Sempre validar `userId` nas queries para evitar data leaks
2. **Vector DB**: Usar namespaces por `campaignId` para manter dados organizados
3. **Rate limiting**: Limitar chamadas de AI (caro!)
4. **WebSocket broadcasting**: Apenas notificar players da mesma room
5. **CORS**: Configurar CORS para Socket.io
6. **File storage**: Para MVP, filesystem está ok; scale later com S3
7. **Embeddings**: Cache embeddings em Vector DB; não recalcular sempre
8. **NPC decisions**: Adicionar "confidence" na resposta para feedback visual

---

## 14. Exemplo: Fluxo Completo de uma Rodada de Combate

```
1. Master cria Grid + coloca tokens no Konva
   → Socket: combat:token_placed

2. Turn order calculado
   → Current turn: NPC Goblin

3. Backend chama /api/npc/action
   → NPC AI lee: Goblin HP, posição, inimigos próximos
   → RAG busca: "Goblin tactics" + "D&D 5e combat rules"
   → LLM decide: Atacar player mais próximo

4. Ação validada e aplicada
   → Damage roll → player HP atualizado
   → Grid atualizada

5. Broadcast para todos
   → Socket: combat:npc_acted
   → Mostra animação + dano
   → Próximo turno

6. Fim da sessão: IA gera log
   → Summariza combate
   → Extrai NPCs + quests
   → Mostra em Adventure Log
```

---

Esse plano oferece uma estrutura **escalável, modular e centrada em dados**. Comece pela Fase 1, valide, e incremente! 🚀
