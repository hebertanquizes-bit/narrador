# Phase 2 Quick Start Guide

**Estimated Setup Time**: 30 minutes  
**Cost**: $0  
**Required**: Ollama, MongoDB, Node.js 18+

## 5-Minute Quick Start

### 1. Install Ollama (if not already installed)
```bash
# macOS/Linux
curl https://ollama.ai/install.sh | sh

# Windows: Download https://ollama.ai/download/windows
```

### 2. Start Ollama with Mistral model
```bash
ollama serve
# In another terminal:
ollama pull mistral
```

### 3. Install backend dependencies
```bash
cd backend
npm install pdf-parse @langchain/community langchain axios
```

### 4. Install frontend dependencies
```bash
npm install konva react-konva
```

### 5. Start backend with Phase 2 features
```bash
cd backend
npm run dev
```

**Expected Output**:
```
✅ Connected to database
📚 Initializing RAG system...
✅ RAG initialized (Chroma local SQLite)
🤖 Ollama available and ready
✅ Backend listening on :5000
```

### 6. Start frontend
```bash
npm run dev
# Visit http://localhost:3000
```

---

## Testing Each Feature

### Test RAG System
```bash
curl -X POST http://localhost:5000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"dragon battle"}' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Co-Narrator Chat
```bash
curl -X POST http://localhost:5000/api/co-narrator/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"test1",
    "message":"What are the monster stats?",
    "campaign":"Dragon's Lair"
  }' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Combat Grid Socket.io
Open browser DevTools:
```javascript
// After connecting to room
socket.emit('combat:join', { 
  gridId: '123', 
  playerId: 'player1' 
});

// Add token
socket.emit('combat:token-add', {
  gridId: '123',
  name: 'Barbarian',
  x: 0,
  y: 0,
  color: '#FF6B6B'
});
```

---

## File Structure Reference

```
narrador/
├── backend/
│   └── src/
│       ├── services/
│       │   ├── ragService.ts        ← PDF indexing, search
│       │   ├── ollamaService.ts     ← LLM API calls
│       │   └── coNarratorService.ts ← Chat logic
│       ├── controllers/
│       │   ├── ragController.ts     ← /api/rag routes
│       │   └── coNarratorController.ts ← /api/co-narrator routes
│       ├── models/
│       │   ├── CombatGrid.ts        ← Battle schema
│       │   └── CoNarrator.ts        ← Chat sessions
│       ├── sockets/
│       │   └── combatEvents.ts      ← Real-time combat sync
│       └── server.ts                ← (MODIFIED)
├── src/
│   └── components/
│       ├── CombatGrid.tsx           ← Konva canvas
│       └── CoNarratorChat.tsx       ← Chat UI
└── PHASE_2_IMPLEMENTATION.md        ← Full guide
```

---

## Quick Troubleshooting

**Ollama connection error?**
```bash
curl http://localhost:11434/api/tags
# Should return list of models
```

**Chroma not initialized?**
```bash
# Clear and restart
rm -rf ~/.chroma
npm run dev
```

**Backend won't start?**
```bash
# Check MongoDB is running
mongod --version

# Clear compiled TypeScript
rm -rf backend/dist
npm run build
```

---

## Next Steps

1. ✅ All 4 components implemented
2. 📝 Run integration tests (1-2 hours)
3. 🔧 Optimize performance (if needed)
4. 📚 Add to Phase 1 workspace UI
5. 🧪 Full end-to-end testing

**Time to full Phase 2**: 4-6 weeks with testing

---

Questions? Check `PHASE_2_IMPLEMENTATION.md` for detailed API docs and troubleshooting.
