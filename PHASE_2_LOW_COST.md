# 🚀 Phase 2 - Low Cost Implementation Plan

**Maximum functionality, minimum cost**

---

## 💰 Cost Comparison Strategy

### AI Models (Monthly Estimate)
| Provider | Model | Cost/1M tokens | Phase 2 Budget | Status |
|----------|-------|--------|---------|--------|
| OpenAI | GPT-4o | $15 | $50-100 | ❌ Expensive |
| Anthropic | Claude 3 | $15 | $50-100 | ❌ Expensive |
| **Deepseek** | **R1** | **$0.55** | **$2-5** | ✅ **RECOMMENDED** |
| Open Source | Llama 2 7B | $0 | Self-host | ✅ **FREE** |
| Groq | LLama 70B | FREE (rate limited) | $0 | ✅ **FREE** |

### Vector Database (Monthly)
| Service | Cost | Tier | Status |
|---------|------|------|--------|
| Pinecone | $12-100+ | Starter+ | ❌ Paid |
| Weaviate Cloud | $8-50+ | Professional | ❌ Paid |
| **Chroma** | **$0** | **Self-hosted** | ✅ **FREE** |
| **Milvus** | **$0** | **Self-hosted** | ✅ **FREE** |
| **Qdrant** | **$0** | **Self-hosted** | ✅ **FREE** |

### Storage (Monthly)
| Service | Cost | Status |
|---------|------|--------|
| AWS S3 | $0.023/GB stored | ❌ Small cost |
| Google Drive API | $0 (native integration) | ⚠️ Free tier limited |
| Local Server | $0 | ✅ **FREE** |
| Railway/Render | $7-10 | ⚠️ Free tier + small cost |

### Estimated Phase 2 Monthly Cost

**Option 1: Maximum Budget (Premium)**
```
- OpenAI API:           $50-100/month
- Pinecone Vector DB:   $12-50/month
- AWS S3 Storage:       $5-10/month
- Server (Railway):     $7/month
─────────────────────────────────
TOTAL:                  $74-157/month
```

**Option 2: Balanced (Recommended)**
```
- Deepseek API:         $2-5/month
- Chroma (self-hosted): $0/month
- Local Storage:        $0/month
- Server (Free tier):   $0/month
─────────────────────────────────
TOTAL:                  $2-5/month ✅
```

**Option 3: Zero Cost (Hobbyist)**
```
- Open Source LLM:      $0/month
- Chroma (local):       $0/month
- Local Storage:        $0/month
- Localhost dev:        $0/month
─────────────────────────────────
TOTAL:                  $0/month ✅✅
```

---

## 🏗️ Phase 2 Low-Cost Architecture

### Recommended Tech Stack

```
┌─────────────────────────────────────────────┐
│        Frontend (Next.js)                    │
│  + Konva.js (free canvas lib)               │
│  + Socket.io (free)                         │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│        Backend (Express.js)                  │
│  + LangChain.js (free)                      │
│  + Chroma (free vector DB)                  │
│  + Socket.io (free)                         │
└────────────┬────────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│ Multiple Layers:                            │
├─────────────────────────────────────────────┤
│ 1. LLM Provider (Deepseek/Groq/Local)       │
│ 2. Vector Store (Chroma/Local)              │
│ 3. File Storage (Local/Disk)                │
│ 4. MongoDB (Local/Free tier)                │
└─────────────────────────────────────────────┘
```

---

## 📦 Phase 2 Implementation (Low-Cost)

### Feature 1: RAG (Retrieval Augmented Generation)

#### Tech Stack
- **LangChain.js**: Free orchestration framework
- **Chroma**: Free, open-source vector DB (SQLite backend)
- **Deepseek/Groq**: Free or ultra-cheap LLM
- **Node.js native**: Built-in text processing

#### Implementation Steps

**Step 1: Install Dependencies**
```bash
npm install langchain chroma-js @langchain/openai @langchain/community
# No cost - all open source
```

**Step 2: Create Vector Store Service**
```typescript
// backend/src/services/ragService.ts
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Use free embeddings (or self-hosted)
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.DEEPSEEK_API_KEY,
  modelName: "deepseek-r1", // Ultra-cheap
});

// Store vectors locally in SQLite (free)
const vectorStore = await Chroma.fromExistingCollection({
  embeddings,
  collectionName: "narrador_assets",
});
```

**Step 3: Index Assets on Upload**
```typescript
// When user uploads asset:
1. Extract text from PDF/document
2. Split into chunks
3. Generate embeddings (via Deepseek/free)
4. Store in local Chroma DB
5. Cost: ~$0.001 per asset
```

**Step 4: Query Assets with Context**
```typescript
// When AI needs context:
1. Convert player action to embedding
2. Similarity search in Chroma
3. Retrieve relevant assets
4. Pass to LLM as context
5. Cost: ~$0.001 per turn
```

#### Monthly Cost for RAG
```
Deepseek embeddings:  ~$0.10/month (low volume)
Chroma storage:       $0 (local SQLite)
LangChain:            $0 (free library)
Total:                ~$0.10/month ✅
```

---

### Feature 2: Combat Grid

#### Tech Stack
- **Konva.js**: Free, lightweight canvas library
- **HTML Canvas**: Browser native (free)
- **Socket.io**: Free real-time sync
- **No external services**: Everything local

#### Implementation Steps

**Step 1: Install Konva**
```bash
npm install konva react-konva
# ~200KB - no API costs
```

**Step 2: Create Grid Component**
```typescript
// frontend/src/components/CombatGrid.tsx
import { Stage, Layer, Rect, Circle, Group } from "react-konva";

// Free canvas rendering with:
// - Token placement
// - Drag & drop
// - Distance measurement
// - Line of sight
// - Initiative order
```

**Step 3: Grid Storage (Backend)**
```typescript
// Store grid state in MongoDB
// No external service needed
{
  roomId: string,
  gridState: {
    tokens: [{ x, y, tokenId, playerId }],
    walls: [{ x1, y1, x2, y2 }],
    lighting: "dim|bright|darkness",
  }
}
```

**Step 4: Real-time Sync (Socket.io)**
```typescript
// Free real-time updates
io.emit("combat:token_moved", { tokenId, x, y })
io.emit("combat:initiative_changed", { order: [...] })
```

#### Monthly Cost for Combat
```
Konva.js:              $0 (free library)
Socket.io:             $0 (free library)
MongoDB storage:       $0 (self-hosted)
Total:                 $0/month ✅✅
```

---

### Feature 3: Co-Narrator AI Chat

#### Tech Stack
- **Deepseek API**: $0.55/1M tokens (95% cheaper than OpenAI)
- **LangChain**: Free orchestration
- **Socket.io**: Free real-time chat
- **Local context**: Assets + game state

#### Implementation Steps

**Step 1: Setup Deepseek**
```bash
# 1. Get free Deepseek API key: https://api.deepseek.com/
# 2. No credit card required for low-volume
# 3. Free tier: $5 credit (lasts months)
```

**Step 2: Create Co-Narrator Service**
```typescript
// backend/src/services/coNarratorService.ts
import { ChatDeepseek } from "@langchain/community/chat_models/deepseek";

const llm = new ChatDeepseek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-chat", // $0.14/1M input tokens
});

// Cost breakdown per 100 messages:
// - Input: 50KB ≈ $0.00007
// - Output: 20KB ≈ $0.00021
// Total: ~$0.0003 per message ✅
```

**Step 3: Chat Events**
```typescript
// Player asks: "What's in this room?"
// AI searches assets (RAG) + game state
// Returns response via Socket.io
// Cost: ~$0.001 per message
```

#### Monthly Cost for Co-Narrator
```
Deepseek API:          ~$1-2/month (1000-2000 messages)
LangChain:             $0 (free)
Socket.io:             $0 (free)
Total:                 ~$1-2/month ✅
```

---

### Feature 4: Real-time Multiplayer Sync

#### Tech Stack
- **Socket.io**: Free
- **MongoDB**: Self-hosted free
- **No external services**: 100% local

#### Implementation Steps

**Step 1: Socket.io Rooms**
```typescript
// Group players by room
io.on("connection", (socket) => {
  socket.on("join:room", (roomId) => {
    socket.join(roomId);
  });
  
  socket.on("game:action", (data) => {
    io.to(roomId).emit("game:update", data);
  });
});
```

**Step 2: State Sync Events**
```typescript
// Free real-time updates:
- Player movement
- Combat actions
- Chat messages
- Grid updates
- Initiative changes
```

**Step 3: Persistence**
```typescript
// Save to MongoDB after each action
// Free storage (self-hosted)
// No external sync service needed
```

#### Monthly Cost for Real-time
```
Socket.io:             $0 (free)
MongoDB:               $0 (self-hosted)
Bandwidth:             $0 (local)
Total:                 $0/month ✅✅
```

---

## 📋 Phase 2 Implementation Plan (Low-Cost)

### Week 1-2: RAG Integration
```
Day 1-2:   Setup Chroma + LangChain
Day 3-4:   Implement PDF extraction + indexing
Day 5-6:   Create asset search endpoints
Day 7-8:   Test RAG with sample assets
Day 9-10:  Optimize indexing process
Day 11-14: Integration testing
```

**Cost**: ~$0.10 (Deepseek API testing)

### Week 3-4: Combat Grid
```
Day 1-2:   Setup Konva.js canvas
Day 3-4:   Implement token placement
Day 5-6:   Add drag & drop
Day 7-8:   Grid state persistence
Day 9-10:  Socket.io sync
Day 11-14: UI polish + testing
```

**Cost**: $0 (local development)

### Week 5-6: Co-Narrator Chat
```
Day 1-2:   Setup Deepseek integration
Day 3-4:   Create chat UI component
Day 5-6:   Implement context building
Day 7-8:   Socket.io chat sync
Day 9-10:  Game state context injection
Day 11-14: Testing + refinement
```

**Cost**: ~$1-2 (Deepseek API testing)

### Week 7-8: Real-time Sync
```
Day 1-2:   Enhance Socket.io architecture
Day 3-4:   Implement room state sync
Day 5-6:   Add conflict resolution
Day 7-8:   Optimize bandwidth
Day 9-14:  Full integration testing
```

**Cost**: $0 (local development)

---

## 🔄 Free Alternatives for Each Component

### LLM Options (Ranked by Cost)

```
1. Groq (FREE) ✅✅
   - Free with rate limit: 30 req/min
   - Cost: $0/month
   - Use: Testing, demo, hobbyist
   
2. Deepseek ($0.55/1M tokens) ✅
   - $5 free tier lasts months
   - Cost: $0-2/month
   - Use: Production, small servers
   
3. Ollama (FREE) ✅✅
   - Self-hosted, on-premise
   - Models: Llama 2, Mistral, etc
   - Cost: $0/month
   - Use: Private, no API calls
   
4. LM Studio (FREE) ✅✅
   - Desktop app, self-hosted
   - Easy setup, GUI
   - Cost: $0/month
   - Use: Development, testing
```

**Recommendation**: Start with **Groq (free)**, upgrade to **Deepseek** for production.

### Vector DB Options

```
1. Chroma (FREE) ✅✅
   - Local SQLite backend
   - Python/JS support
   - Cost: $0/month
   - Use: Recommended
   
2. Qdrant (FREE) ✅✅
   - Self-hosted
   - Docker available
   - Cost: $0/month
   - Use: Advanced needs
   
3. Milvus (FREE) ✅✅
   - Open source
   - Scalable
   - Cost: $0/month
   - Use: Large scale
```

**Recommendation**: **Chroma** (simplest setup).

### Hosting Options

```
1. Railway (FREE tier)
   - $5/month credit included
   - Cost: $0-7/month
   - Use: Recommended for Phase 2
   
2. Render (FREE tier)
   - Limited but free
   - Cost: $0-7/month
   
3. Fly.io (FREE tier)
   - 3 shared-cpu-1x 256MB VMs
   - Cost: $0-5/month
   
4. Self-hosted (FREE)
   - Your own server
   - Cost: $0/month
   - Use: Private deployment
```

---

## 💾 Complete Low-Cost Stack

### Services Needed
```
✅ Backend (Express.js)         - FREE
✅ Frontend (Next.js)           - FREE
✅ Database (MongoDB)           - Self-hosted (FREE) or Atlas free tier
✅ Vector Store (Chroma)        - FREE
✅ LLM (Deepseek/Groq)          - $0-2/month
✅ Real-time (Socket.io)        - FREE
✅ File Storage (Local)         - FREE
✅ Hosting (Railway/Render)     - $0-7/month
```

### Total Monthly Cost
```
Phase 2 Low-Cost:  $0-10/month
Phase 2 Premium:   $50-150/month
Savings:           ~95% ✅✅
```

---

## 🎯 Implementation Checklist

### Prerequisites
- [ ] MongoDB installed (or free Atlas tier)
- [ ] Node.js 18+ 
- [ ] Deepseek API key (free)
- [ ] Git

### RAG Integration
- [ ] Install Chroma + LangChain
- [ ] Implement PDF extraction
- [ ] Create indexing service
- [ ] Build search endpoints
- [ ] Test with assets

### Combat Grid
- [ ] Install Konva.js
- [ ] Create grid component
- [ ] Implement token movement
- [ ] Add persistence
- [ ] Socket.io sync

### Co-Narrator Chat
- [ ] Setup Deepseek
- [ ] Create chat service
- [ ] Build chat UI
- [ ] Integrate RAG context
- [ ] Socket.io broadcast

### Real-time Sync
- [ ] Enhance Socket.io
- [ ] Implement room sync
- [ ] Add state management
- [ ] Optimize performance
- [ ] Test multiplayer

---

## 📊 Cost Breakdown by Feature

| Feature | Library Cost | API Cost | Hosting | Total |
|---------|-------------|----------|---------|-------|
| RAG | $0 | $0.10 | $0 | $0.10 |
| Combat Grid | $0 | $0 | $0 | $0 |
| Co-Narrator | $0 | $1-2 | $0 | $1-2 |
| Real-time | $0 | $0 | $0 | $0 |
| **Total** | **$0** | **$1-2.10** | **$0** | **$1-2.10** |

**Plus Hosting**: $7/month (free tier) or $0 (self-hosted)

**Grand Total**: $8-10/month (or $1-2 if self-hosted)

---

## 🚀 Getting Started (Low-Cost Path)

### Step 1: Setup Environment
```bash
# 1. Install dependencies
npm install langchain chroma-js konva react-konva

# 2. Setup free API keys
GROQ_API_KEY=xxx  # Free tier
DEEPSEEK_API_KEY=xxx  # Free tier ($5 credit)

# 3. Start MongoDB locally
mongod

# 4. Start backend
cd backend && npm run dev

# 5. Start frontend
npm run dev
```

### Step 2: Implement RAG (Week 1-2)
```bash
# 1. Create RAG service
touch backend/src/services/ragService.ts

# 2. Test with Groq (free)
# 3. Switch to Deepseek for production
```

### Step 3: Add Combat Grid (Week 3-4)
```bash
# 1. Create grid component
touch src/components/CombatGrid.tsx

# 2. Add to room page
# 3. Test socket.io sync
```

### Step 4: Add Co-Narrator (Week 5-6)
```bash
# 1. Create chat service
touch backend/src/services/coNarratorService.ts

# 2. Add to room UI
# 3. Test with assets
```

---

## 💡 Pro Tips for Lowest Cost

1. **Use Groq for Testing** ($0)
   - Free tier: 30 requests/minute
   - Perfect for development
   - No card needed

2. **Self-host Everything** ($0)
   - Run MongoDB locally
   - Run Ollama for LLM
   - Run everything on your machine
   - Pay $0/month

3. **Batch Requests** ($0 saved)
   - Combine multiple queries
   - Reduce API calls
   - Save on per-request fees

4. **Local Embeddings** ($0)
   - Use open-source models
   - No API calls needed
   - Store vectors locally

5. **Compress Assets** ($0 saved)
   - Smaller files
   - Faster uploads
   - Less bandwidth

---

## 🎉 Summary

**Phase 2 with minimum cost:**

- **Free Components**: 100% (Konva, Socket.io, LangChain)
- **Cheap LLM**: Deepseek ($0.55/1M tokens vs OpenAI's $15/1M)
- **Free Vector DB**: Chroma (local SQLite)
- **Free Hosting**: Self-hosted or free tier
- **Free Sync**: Socket.io + local state

**Estimated Cost**: $1-10/month (vs $50-150 with premium)

**Time to Implement**: 4-6 weeks

**Quality**: Production-ready with open-source tech

---

**Ready to start Phase 2 with minimum cost?** ✅
