# 🆓 Phase 2 - Zero Cost Implementation

**Complete Phase 2 with $0 cost - 100% Open Source**

---

## 🎯 Zero-Cost Stack

```
✅ Ollama (Local LLM)      - FREE, on-premise
✅ Chroma (Vector DB)      - FREE, self-hosted
✅ Konva.js (Grid Canvas)  - FREE, open-source
✅ Socket.io (Real-time)   - FREE, open-source
✅ MongoDB (Database)      - FREE, self-hosted
✅ LangChain.js (RAG)      - FREE, open-source
✅ Node.js (Backend)       - FREE, open-source
✅ Next.js (Frontend)      - FREE, open-source
─────────────────────────────────────────
TOTAL COST:                $0/month ✅✅
```

---

## 📦 Installation (Zero Cost)

### Step 1: Install Ollama (Local LLM)

**What it is**: Run AI models locally on your computer (no internet needed, no API)

**Download**: https://ollama.ai

**Installation**:
```bash
# macOS / Linux / Windows
# Download and install from https://ollama.ai
# ~2.5GB for base model
```

**Supported Models (Free)**:
- Llama 2 7B (9GB RAM needed)
- Mistral 7B (8GB RAM needed)
- Neural Chat (8GB RAM needed)
- Starling 7B (8GB RAM needed)

**Start Ollama**:
```bash
# macOS
brew install ollama
ollama serve

# Linux
curl https://ollama.ai/install.sh | sh
ollama serve

# Windows (Desktop app)
# Run the downloaded app
```

**Test it**:
```bash
# In another terminal
ollama run mistral "Hello, world!"

# Output should show AI response (takes ~5 seconds first time)
```

### Step 2: Install MongoDB (Local Database)

**Option A: Docker (Easiest)**
```bash
docker run -d -p 27017:27017 --name narrador-mongo mongo:latest
```

**Option B: Direct Install**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Windows
# Download: https://www.mongodb.com/try/download/community
# Run installer
```

**Verify**:
```bash
mongo
# Should connect and show: MongoDB version X.X.X
```

### Step 3: Backend Dependencies

```bash
cd backend

# Install LLM + Vector DB packages
npm install ollama langchain chroma-js

# Also install text extraction (free)
npm install pdf-parse pdfjs-dist

npm run dev
```

### Step 4: Frontend Dependencies

```bash
npm install konva react-konva

npm run dev
```

**Total Install Time**: ~30 minutes (mostly downloads)  
**Total Cost**: $0

---

## 🧠 Part 1: RAG with Ollama + Chroma (Zero Cost)

### Architecture

```
Asset Upload
    ↓
PDF/Text Extraction
    ↓
Chunking (free, local)
    ↓
Ollama Embeddings (free, local)
    ↓
Chroma Vector Store (free, local SQLite)
    ↓
Player Action
    ↓
Similarity Search
    ↓
Context → Ollama LLM
    ↓
Narrative Response
```

### Implementation

**1. Create RAG Service**

```typescript
// backend/src/services/ragService.ts
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import pdfParse from "pdf-parse";
import fs from "fs-extra";

// Initialize Ollama (runs locally)
const embeddings = new OllamaEmbeddings({
  model: "mistral", // Free, local model
  baseUrl: "http://localhost:11434", // Ollama server
});

// Initialize Chroma (local SQLite)
let vectorStore: Chroma;

export async function initializeRAG() {
  vectorStore = await Chroma.fromExistingCollection({
    embeddings,
    collectionName: "narrador_assets",
    url: "http://localhost:8000", // Chroma server (or local)
  });
}

export async function indexAsset(assetPath: string, metadata: any) {
  // Extract text from PDF
  const buffer = await fs.readFile(assetPath);
  const pdfData = await pdfParse(buffer);
  const text = pdfData.text;

  // Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitText(text);

  // Add to vector store (locally)
  await vectorStore.addDocuments(
    chunks.map((chunk) => ({
      pageContent: chunk,
      metadata: { assetId: metadata.assetId, ...metadata },
    }))
  );

  console.log(`✅ Indexed ${chunks.length} chunks from ${metadata.name}`);
}

export async function searchContext(query: string, k = 5) {
  // Find relevant assets (similarity search, local)
  const results = await vectorStore.similaritySearch(query, k);
  
  return results.map((r) => ({
    content: r.pageContent,
    assetId: r.metadata.assetId,
    relevance: 1, // Simplified
  }));
}
```

**2. Create Ollama LLM Service**

```typescript
// backend/src/services/ollamaService.ts
import { Ollama } from "ollama";

const ollama = new Ollama({
  model: "mistral",
  baseUrl: "http://localhost:11434",
});

export async function generateNarrative(
  playerAction: string,
  context: string,
  characters: string
): Promise<string> {
  const systemPrompt = `
You are a D&D dungeon master assistant.
Players: ${characters}

Recent context:
${context}

Generate an engaging narrative response to the player's action.
Keep response to 2-3 sentences.
  `;

  const response = await ollama.generate({
    model: "mistral",
    prompt: `${systemPrompt}\n\nPlayer action: ${playerAction}`,
    stream: false,
  });

  return response.response;
}

export async function coNarratorAdvice(
  topic: string,
  gameState: string
): Promise<string> {
  const response = await ollama.generate({
    model: "mistral",
    prompt: `
As a D&D co-narrator assistant:
Topic: ${topic}
Game State: ${gameState}

Provide helpful advice or suggestion (1-2 sentences).
    `,
    stream: false,
  });

  return response.response;
}
```

**3. API Endpoint**

```typescript
// backend/src/controllers/ragController.ts
import { Request, Response, NextFunction } from "express";
import * as ragService from "../services/ragService";
import * as ollamaService from "../services/ollamaService";

export async function queryNarrative(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { playerAction, characters } = req.body;

    // Search relevant assets
    const context = await ragService.searchContext(playerAction);
    const contextText = context
      .map((c) => c.content)
      .join("\n---\n");

    // Generate narrative with Ollama
    const narrative = await ollamaService.generateNarrative(
      playerAction,
      contextText,
      characters
    );

    res.json({
      narrative,
      sources: context.map((c) => c.assetId),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCoNarratorAdvice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { topic, gameState } = req.body;

    const advice = await ollamaService.coNarratorAdvice(topic, gameState);

    res.json({ advice });
  } catch (error) {
    next(error);
  }
}
```

**4. Frontend Integration**

```typescript
// src/components/RagChat.tsx
import { useState } from "react";
import { Send } from "lucide-react";

export function RagChat() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("narrador_auth_token");

      const res = await fetch("http://localhost:5000/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerAction: query,
          characters: ["Player 1", "Player 2"],
        }),
      });

      const data = await res.json();
      setResponse(data.narrative);
      setQuery("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-rpg-darker rounded border border-rpg-light/20">
      <h3 className="text-lg font-bold text-rpg-gold">RAG Assistant</h3>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe player action..."
        className="w-full h-20 bg-rpg-dark border border-rpg-light/20 rounded p-2 text-rpg-light"
      />

      <button
        onClick={handleQuery}
        disabled={loading || !query}
        className="w-full flex items-center justify-center gap-2 bg-rpg-gold text-rpg-darker px-4 py-2 rounded font-bold hover:bg-rpg-gold/80 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {loading ? "Thinking..." : "Get Context"}
      </button>

      {response && (
        <div className="p-3 bg-rpg-gold/10 border border-rpg-gold rounded text-rpg-light">
          {response}
        </div>
      )}
    </div>
  );
}
```

**Cost so far**: $0 ✅

---

## ⚔️ Part 2: Combat Grid with Konva (Zero Cost)

### Implementation

**1. Combat Grid Component**

```typescript
// src/components/CombatGrid.tsx
import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Text, Group, Line } from "react-konva";
import Konva from "konva";

interface Token {
  id: string;
  x: number;
  y: number;
  playerId: string;
  name: string;
  color: string;
}

export function CombatGrid() {
  const stageRef = useRef<Konva.Stage>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [gridSize, setGridSize] = useState(5); // 5x5 grid
  const cellSize = 50;

  // Draw grid
  const gridLines = [];
  for (let i = 0; i <= gridSize; i++) {
    // Vertical lines
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * cellSize, 0, i * cellSize, gridSize * cellSize]}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={1}
      />
    );
    // Horizontal lines
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * cellSize, gridSize * cellSize, i * cellSize]}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={1}
      />
    );
  }

  // Handle token drag
  const handleTokenDrag = (id: string, x: number, y: number) => {
    setTokens(
      tokens.map((t) =>
        t.id === id ? { ...t, x, y } : t
      )
    );
    
    // Emit socket event for real-time sync
    window.io?.emit("combat:token_moved", { tokenId: id, x, y });
  };

  // Add token
  const addToken = (name: string, color: string) => {
    const newToken: Token = {
      id: `token-${Date.now()}`,
      x: Math.random() * gridSize * cellSize,
      y: Math.random() * gridSize * cellSize,
      playerId: "player-1",
      name,
      color,
    };
    setTokens([...tokens, newToken]);
  };

  return (
    <div className="space-y-4 p-4 bg-rpg-darker rounded border border-rpg-light/20">
      <div className="flex gap-2">
        <h3 className="text-lg font-bold text-rpg-gold flex-1">Combat Grid</h3>
        <button
          onClick={() => addToken("Enemy", "#ff0000")}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Add Enemy
        </button>
        <button
          onClick={() => addToken("Player", "#00ff00")}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Add Player
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          border: "2px solid #d4af37",
        }}
      >
        <Layer>
          {/* Grid background */}
          {gridLines}

          {/* Tokens */}
          {tokens.map((token) => (
            <Group
              key={token.id}
              x={token.x}
              y={token.y}
              draggable
              onDragEnd={(e) => {
                handleTokenDrag(token.id, e.target.x(), e.target.y());
              }}
            >
              <Circle
                radius={15}
                fill={token.color}
                stroke="white"
                strokeWidth={2}
              />
              <Text
                text={token.name.substring(0, 1)}
                fontSize={12}
                fill="white"
                offsetX={6}
                offsetY={6}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      <div className="text-sm text-rpg-light/60">
        {tokens.length} tokens on grid • Drag to move
      </div>
    </div>
  );
}
```

**2. Backend Grid State**

```typescript
// backend/src/models/CombatGrid.ts
import mongoose from "mongoose";

const combatGridSchema = new mongoose.Schema({
  roomId: String,
  gridSize: Number,
  tokens: [
    {
      id: String,
      x: Number,
      y: Number,
      playerId: String,
      name: String,
      color: String,
      hp: Number,
    },
  ],
  walls: [
    {
      x1: Number,
      y1: Number,
      x2: Number,
      y2: Number,
    },
  ],
  lighting: String, // "dim", "bright", "darkness"
  updatedAt: { type: Date, default: Date.now },
});

export const CombatGrid = mongoose.model("CombatGrid", combatGridSchema);
```

**3. Socket.io Events**

```typescript
// backend/src/server.ts (add to Socket.io handler)
io.on("connection", (socket) => {
  socket.on("join:combat", (roomId) => {
    socket.join(`combat-${roomId}`);
  });

  socket.on("combat:token_moved", (data) => {
    // Broadcast to all players in room
    io.to(`combat-${socket.rooms[1]}`).emit("combat:token_updated", data);
  });

  socket.on("combat:add_token", (data) => {
    io.to(`combat-${socket.rooms[1]}`).emit("combat:token_added", data);
  });

  socket.on("combat:initiative_order", (data) => {
    io.to(`combat-${socket.rooms[1]}`).emit("combat:initiative_changed", data);
  });
});
```

**Cost so far**: $0 ✅

---

## 💬 Part 3: Co-Narrator Chat (Zero Cost)

### Implementation

**1. Chat Service with Ollama**

```typescript
// backend/src/services/coNarratorService.ts
import { Ollama } from "ollama";

const ollama = new Ollama({
  model: "mistral",
  baseUrl: "http://localhost:11434",
});

interface ChatContext {
  gameState: string;
  players: string[];
  assets: string[];
  recentEvents: string[];
}

export async function coNarratorChat(
  message: string,
  context: ChatContext
): Promise<string> {
  const systemPrompt = `
You are Co-Narrator, an AI assistant for D&D game masters.

Current Game State:
${context.gameState}

Players: ${context.players.join(", ")}

Available Assets/Rules:
${context.assets.join("\n")}

Recent Events:
${context.recentEvents.join("\n")}

Provide helpful advice, suggestions, or answer questions about the game.
Keep responses concise (1-3 sentences) and focused on gameplay.
  `;

  const response = await ollama.generate({
    model: "mistral",
    prompt: `${systemPrompt}\n\nGM Question: ${message}`,
    stream: false,
  });

  return response.response;
}

export async function suggestEncounter(
  currentLevel: number,
  partySize: number
): Promise<string> {
  const response = await ollama.generate({
    model: "mistral",
    prompt: `
Suggest a D&D encounter for:
- Party Level: ${currentLevel}
- Party Size: ${partySize}

Include: Monster type, difficulty, and tactics (2-3 sentences).
    `,
    stream: false,
  });

  return response.response;
}

export async function ruleLookup(rule: string): Promise<string> {
  const response = await ollama.generate({
    model: "mistral",
    prompt: `
Explain this D&D 5e rule:
${rule}

Provide a clear, concise explanation (1-2 sentences).
    `,
    stream: false,
  });

  return response.response;
}
```

**2. API Endpoints**

```typescript
// backend/src/controllers/coNarratorController.ts
import { Request, Response, NextFunction } from "express";
import * as coNarratorService from "../services/coNarratorService";

export async function chatWithCoNarrator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { message, context } = req.body;

    const response = await coNarratorService.coNarratorChat(
      message,
      context
    );

    res.json({ response });
  } catch (error) {
    next(error);
  }
}

export async function getEncounterSuggestion(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { level, partySize } = req.body;

    const suggestion = await coNarratorService.suggestEncounter(
      level,
      partySize
    );

    res.json({ suggestion });
  } catch (error) {
    next(error);
  }
}

export async function lookupRule(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { rule } = req.body;

    const explanation = await coNarratorService.ruleLookup(rule);

    res.json({ explanation });
  } catch (error) {
    next(error);
  }
}
```

**3. Frontend Chat Component**

```typescript
// src/components/CoNarratorChat.tsx
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

export function CoNarratorChat() {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("narrador_auth_token");
      const res = await fetch("http://localhost:5000/api/co-narrator/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          context: {
            gameState: "In progress",
            players: ["Player 1", "Player 2"],
            assets: [],
            recentEvents: [],
          },
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-rpg-darker rounded border border-rpg-accent/30 h-96 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-rpg-accent" />
        <h3 className="font-bold text-rpg-light">Co-Narrator AI</h3>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${
              msg.role === "user"
                ? "text-rpg-light text-right"
                : "text-rpg-accent text-left"
            }`}
          >
            <div
              className={`inline-block px-3 py-2 rounded max-w-xs ${
                msg.role === "user"
                  ? "bg-rpg-gold/20"
                  : "bg-rpg-accent/20"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-rpg-accent/60 italic">
            Co-Narrator thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Co-Narrator..."
          disabled={loading}
          className="flex-1 bg-rpg-dark border border-rpg-light/20 rounded px-3 py-2 text-rpg-light placeholder:text-rpg-light/40 focus:outline-none focus:border-rpg-accent disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-rpg-accent text-rpg-darker px-3 py-2 rounded font-bold hover:bg-rpg-accent/80 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**Cost so far**: $0 ✅

---

## 🔄 Part 4: Real-time Sync (Zero Cost)

Already implemented via Socket.io - nothing to add!

### Events Already Set Up

```typescript
// Combat sync
socket.on("combat:token_moved") → broadcast to room
socket.on("combat:initiative_changed") → broadcast to room

// Game state sync
socket.on("game:action") → broadcast to room
socket.on("game:state_updated") → broadcast to room

// Chat sync
socket.on("message:send") → broadcast to room
```

**Cost**: $0 ✅

---

## 🚀 Complete Setup Guide (Zero Cost)

### System Requirements

```
Minimum:
- 8GB RAM (for Ollama + MongoDB + Node.js)
- 50GB disk (for models + data)
- 2GB internet download (for Ollama models)

Recommended:
- 16GB RAM
- 100GB disk
- Modern CPU
```

### Step-by-Step Installation

**1. Install Ollama** (5 minutes)
```bash
# Download from https://ollama.ai
# Choose your OS
# Install and start

# Verify
ollama run mistral "Test"
```

**2. Pull Models** (10 minutes)
```bash
# Download Mistral (free, 7B parameters)
ollama pull mistral

# Or use Llama 2
ollama pull llama2

# Keep Ollama running in background
ollama serve
```

**3. Install MongoDB** (5 minutes)
```bash
# Docker (easiest)
docker run -d -p 27017:27017 --name narrador mongo:latest

# Or local install (see earlier)
```

**4. Setup Backend** (5 minutes)
```bash
cd backend

# Create services
touch src/services/ragService.ts
touch src/services/ollamaService.ts
touch src/services/coNarratorService.ts

# Add code from above
# Install packages
npm install ollama langchain chroma-js pdf-parse

npm run dev
```

**5. Setup Frontend** (5 minutes)
```bash
npm install konva react-konva

# Add components
touch src/components/CombatGrid.tsx
touch src/components/RagChat.tsx
touch src/components/CoNarratorChat.tsx

# Add code from above
npm run dev
```

**Total setup time**: ~30 minutes  
**Total cost**: $0

---

## 📊 Performance Expectations (Local)

```
Ollama Response Time:    3-5 seconds (first time)
                        1-2 seconds (cached)

Chroma Search:          <100ms (local SQLite)

Combat Grid Update:     <50ms (local)

Socket.io Broadcast:    <10ms (local)

RAG Search + Generate:  5-10 seconds total
```

---

## 🎯 Implementation Roadmap (Zero Cost)

### Week 1: Setup & RAG
```
Day 1-2:  Install Ollama + MongoDB
Day 3-4:  Implement RAG service
Day 5-6:  Test asset indexing
Day 7:    Integration testing
```

### Week 2: Combat Grid
```
Day 1-2:  Build Konva grid component
Day 3-4:  Add token movement
Day 5-6:  Implement Socket.io sync
Day 7:    Integration testing
```

### Week 3: Co-Narrator Chat
```
Day 1-2:  Create chat service
Day 3-4:  Build chat UI
Day 5-6:  Add context building
Day 7:    Integration testing
```

### Week 4: Polish & Testing
```
Day 1-3:  Full system testing
Day 4-5:  Performance optimization
Day 6-7:  Documentation + deployment
```

---

## 🔧 Troubleshooting (Zero Cost)

### Ollama Not Running
```bash
# Check if Ollama is running
curl http://localhost:11434

# Restart Ollama
ollama serve
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongo

# Restart Docker
docker restart narrador-mongo
```

### Out of Memory
```
Ollama needs 6-8GB RAM minimum
MongoDB needs 2-3GB
Node.js needs 1-2GB

Total: 12GB+ recommended

If you have less:
- Use smaller model: ollama pull neural-chat (3B)
- Close other apps
- Increase swap space
```

### Slow Ollama Response
```
First response: 3-5 seconds (model loading)
Subsequent: 1-2 seconds (model cached)

To speed up:
- Use smaller model (7B instead of 13B)
- Increase RAM
- Use GPU acceleration (if available)
```

---

## 📈 Scalability (Future)

When you want to scale from local to production:

```
Local ($0)           → Production ($0)
─────────────────────────────────────
Ollama local    →  Ollama in Docker
MongoDB local   →  MongoDB Cloud (free tier)
Chroma local    →  Chroma server
Node.js dev     →  Node.js in container
                    (self-hosted or free tier)
```

**No changes needed to code!** Just swap environment variables.

---

## 💡 Pro Tips

1. **Model Selection**
   - Mistral 7B: Best balance (8GB RAM, fast)
   - Llama 2 7B: Compatible (8GB RAM)
   - Neural Chat 3B: Lightweight (4GB RAM)

2. **Optimize Ollama**
   ```bash
   # Use GPU if available
   ollama run mistral --gpu
   ```

3. **Cache Models**
   ```bash
   # Keep models loaded in RAM
   # Set OLLAMA_NUM_PARALLEL=1
   # Set OLLAMA_NUM_GPU=all (if GPU available)
   ```

4. **Batch Processing**
   - Process multiple queries at once
   - Save on model load time

5. **Local Network**
   - Expose Ollama on local network
   - Use from multiple devices
   - Share resources

---

## 🎉 Complete Zero-Cost Phase 2

### What You Get

✅ **RAG System**
- Local text extraction
- Free embeddings (Ollama)
- SQLite vector storage
- Similarity search

✅ **Combat Grid**
- Drag-drop tokens
- Real-time sync
- Free rendering (Konva)
- Socket.io broadcast

✅ **Co-Narrator Chat**
- Local LLM (Mistral)
- No API keys needed
- No rate limits
- Full privacy

✅ **Real-time Multiplayer**
- Local Socket.io
- Instant updates
- No external services

### Resources

```
Memory: 12-16GB
Disk: 50-100GB
Bandwidth: Only first-time downloads
Processing: Local CPU/GPU
Cost: $0 ✅✅✅
```

---

## ✨ Start Here

1. **Install Ollama** → https://ollama.ai
2. **Run MongoDB** → `docker run -d -p 27017:27017 mongo:latest`
3. **Copy code above** → Into your backend/src/
4. **Install packages** → `npm install ollama langchain chroma-js`
5. **Start servers** → Backend + Frontend
6. **Test RAG** → Upload asset, query it
7. **Test Combat** → Add tokens, drag them
8. **Test Chat** → Ask Co-Narrator a question

**Total time: ~1 hour**  
**Total cost: $0**  
**Total value: Infinite** 🚀

Ready to code?
