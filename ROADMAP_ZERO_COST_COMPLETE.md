# 🎭 NARRADOR - Roadmap Completo "Zero Cost Forever"

**Objetivo**: Plataforma RPG completa com custo $0/mês, mesmo em produção  
**Data**: Fevereiro 19, 2026  
**Versão**: v1.0 → v2.0 (Fases 3-5)

---

## 🎯 Visão Geral

```
✅ Phase 1 - Workspace & Assets (COMPLETO)
✅ Phase 2 - RAG + Combat + Co-Narrator (COMPLETO)
⏳ Phase 3 - Advanced Features (4-6 weeks)
⏳ Phase 4 - Production & Scale (2-3 weeks)
⏳ Phase 5 - Community & Polish (2-4 weeks)

Total: 8-13 weeks de trabalho = v2.0 Production Ready
```

---

## 📋 Phase 3 - Advanced Features (4-6 weeks)

### 3.1 Initiative Tracker & Turn Order (1 week)

**Features**:
```
✅ Initiative calculator (d20 + modifier)
✅ Auto-sort turn order
✅ Skip/remove combatants
✅ Active indicator on grid
✅ Round timer (optional)
✅ Persistent across sessions
```

**Tech Stack (Free)**:
- React hooks + Context API
- MongoDB (local or Atlas free tier)
- Socket.io broadcasts

**Files to Create**:
```
src/components/InitiativeTracker.tsx
src/components/TurnOrderPanel.tsx
backend/src/services/combatService.ts
backend/src/models/Initiative.ts
```

---

### 3.2 Character Sheet Integration (1 week)

**Features**:
```
✅ D&D 5e stat block generator
✅ Health tracking with damage
✅ Spell/ability slots
✅ Equipment management
✅ Leveling system
✅ Export to PDF (free: puppeteer)
```

**Tech Stack (Free)**:
- React forms
- Puppeteer (PDF generation - free)
- MongoDB storage

**Files to Create**:
```
src/components/CharacterSheet.tsx
src/components/SpellManager.tsx
src/components/EquipmentManager.tsx
backend/src/services/characterService.ts
backend/src/services/pdfExportService.ts
```

---

### 3.3 NPC Database & Management (1 week)

**Features**:
```
✅ NPC templates (enemies, allies, merchants)
✅ Quick spawn on combat grid
✅ Stat templates for quick generation
✅ Search/filter by type
✅ Custom NPC creator
✅ Reusable library
```

**Tech Stack (Free)**:
- React + search
- MongoDB
- Ollama (generate NPC descriptions)

**Files to Create**:
```
src/components/NPCLibrary.tsx
src/components/NPCCreator.tsx
src/components/NPCQuickSpawn.tsx
backend/src/services/npcService.ts
backend/src/models/NPC.ts
```

---

### 3.4 Campaign Timeline & Notes (1 week)

**Features**:
```
✅ Timeline view (sessions, events)
✅ Session notes with rich editor
✅ Location management
✅ Quest tracker
✅ NPC relationships
✅ Campaign stats
```

**Tech Stack (Free)**:
- React Timeline lib (free: react-big-calendar or custom)
- Monaco editor (free, built-in VS Code)
- MongoDB

**Files to Create**:
```
src/components/CampaignTimeline.tsx
src/components/SessionNotes.tsx
src/components/QuestTracker.tsx
backend/src/models/Session.ts
backend/src/models/Quest.ts
```

---

### 3.5 Multi-Language Support (0.5 weeks)

**Features**:
```
✅ Portuguese (PT-BR)
✅ English (EN)
✅ Spanish (ES)
✅ German (DE)
✅ Easy i18n system
```

**Tech Stack (Free)**:
- next-intl (free)
- JSON translations

**Files to Create**:
```
src/i18n/
  ├── en.json
  ├── pt-br.json
  ├── es.json
  └── de.json
src/lib/i18n.ts
```

---

### 3.6 Audio Narration (1 week) - OPTIONAL

**Features** (free options):
```
✅ Text-to-Speech (free: ElevenLabs API tier)
✅ Or use system TTS
✅ Background ambience (free: freesound.org)
✅ Sound effects library
```

**Tech Stack (Free)**:
- Web Audio API (browser native)
- FreeTTS (free, self-hosted, less quality)
- Or: User pays for ElevenLabs credits (optional)

**Files to Create**:
```
src/components/NarrationAudio.tsx
src/lib/audioService.ts
backend/src/services/ttsService.ts
```

---

## 📦 Phase 4 - Production & Scale (2-3 weeks)

### 4.1 Docker Containerization (3 days)

```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
EXPOSE 5000
CMD ["npm", "start"]

# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - mongo
      - ollama
  
  frontend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - backend
  
  mongo:
    image: mongo:6-alpine
    volumes:
      - mongo_data:/data/db
  
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama

volumes:
  mongo_data:
  ollama_data:
```

**Deploy Options (FREE)**:
- **Railway.app** - $0/month (1GB RAM, generous free tier)
- **Render.com** - Free tier (auto-sleep but works)
- **Fly.io** - $0/month (3 shared-cpu-1x VMs free)
- **Self-hosted** - VPS $5-10/month (Digital Ocean, Linode, Vultr)

---

### 4.2 CI/CD Pipeline (GitHub Actions) - FREE

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ubuntu
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/narrador
            git pull
            docker-compose up -d --build
```

---

### 4.3 Monitoring & Logging (FREE)

**Stack (All Free)**:
```
✅ Winston (logging library - free)
✅ ELK Stack (self-hosted - free)
   - Elasticsearch
   - Logstash
   - Kibana
✅ Prometheus (metrics - free, self-hosted)
✅ Grafana (visualization - free, self-hosted)
```

**Files to Create**:
```
backend/src/config/logger.ts
backend/src/middleware/logging.ts
docker-compose.monitoring.yml
```

---

### 4.4 Database Backup (FREE)

**Strategy**:
```bash
# Automated MongoDB backup
#!/bin/bash
mongodump --uri="mongodb://localhost:27017" \
  --out=/backups/$(date +%Y%m%d)

# Upload to free storage:
# - GitHub (private repo, up to 100GB)
# - AWS S3 free tier (5GB)
# - Backblaze B2 (10GB free)
```

---

### 4.5 Reverse Proxy & SSL (FREE)

```nginx
# nginx.conf
server {
    listen 80;
    server_name api.narrador.local;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.narrador.local;
    
    # Free SSL with Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/narrador/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/narrador/privkey.pem;
    
    # Proxy to backend
    location / {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Setup (FREE)**:
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate cert (free from Let's Encrypt)
sudo certbot certonly --standalone -d narrador.com

# Auto-renewal (via cron)
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🎮 Phase 5 - Community & Polish (2-4 weeks)

### 5.1 User Profiles & Social (1 week)

**Features**:
```
✅ User profiles
✅ Friends/followers
✅ Public campaign sharing
✅ Campaign ratings
✅ Comments on campaigns
```

**Files to Create**:
```
src/components/UserProfile.tsx
src/components/PublicCampaigns.tsx
backend/src/models/UserProfile.ts
backend/src/models/CampaignReview.ts
```

---

### 5.2 Content Management (1 week)

**Features**:
```
✅ Content marketplace (free campaigns)
✅ Rating system
✅ Search/filtering
✅ Trending campaigns
✅ Featured content
```

**Files to Create**:
```
src/components/CampaignMarketplace.tsx
src/components/CampaignCard.tsx
backend/src/services/marketplaceService.ts
```

---

### 5.3 API Documentation (1 week)

**Tools (FREE)**:
```
✅ Swagger UI (free)
✅ Postman collection
✅ OpenAPI 3.0 spec
✅ Interactive API docs
```

**Setup**:
```
npm install swagger-ui-express swagger-jsdoc

# src/api-docs.ts
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Narrador API', version: '1.0.0' }
  },
  apis: ['./src/routes/*.ts']
}
```

---

### 5.4 Performance Optimization (1-2 weeks)

**Strategies (FREE)**:
```
✅ Image compression (ImageMagick, free)
✅ Lazy loading components
✅ Code splitting
✅ Caching with Redis (free, self-hosted)
✅ CDN caching (cloudflare free tier)
✅ Database indexing
✅ Query optimization
```

---

### 5.5 Testing Suite (1 week)

**Stack (FREE)**:
```
✅ Jest (unit tests)
✅ React Testing Library (component tests)
✅ Supertest (API tests)
✅ Playwright (E2E tests)
✅ Coverage reports
```

**Example**:
```typescript
// __tests__/api/rag.test.ts
describe('RAG API', () => {
  it('should search documents', async () => {
    const res = await request(app)
      .post('/api/rag/search')
      .send({ query: 'dragon' })
    expect(res.status).toBe(200)
    expect(res.body.results).toBeDefined()
  })
})
```

---

## 💰 Cost Analysis: Phase 3-5

| Component | Cost | Alternative |
|-----------|------|-------------|
| **Hosting** | $0/mo | Railway (free tier) or self-hosted |
| **Database** | $0/mo | Self-hosted MongoDB |
| **LLM** | $0/mo | Ollama (local) |
| **Vector DB** | $0/mo | Chroma (local) |
| **Storage** | $0/mo | GitHub + self-hosted backups |
| **Email** | $0/mo | SendGrid free tier (100/day) |
| **DNS** | $0/mo | Cloudflare free tier |
| **SSL** | $0/mo | Let's Encrypt |
| **CDN** | $0/mo | Cloudflare free tier |
| **Monitoring** | $0/mo | Self-hosted ELK |
| **Logging** | $0/mo | Self-hosted ELK |
| **CI/CD** | $0/mo | GitHub Actions free |
| **TOTAL** | **$0/mo** | Even at scale! |

---

## 📊 Complete Feature Matrix

### MVP (Phase 1-2) ✅
```
✅ User authentication
✅ Workspace creation
✅ Asset uploads
✅ Campaign configuration
✅ RAG search
✅ Combat grid
✅ Co-narrator chat
✅ Real-time sync
```

### Phase 3 Features (4-6 weeks)
```
⏳ Initiative tracker
⏳ Character sheet integration
⏳ NPC database
⏳ Campaign timeline
⏳ Multi-language
⏳ Audio narration (optional)
```

### Phase 4 Production (2-3 weeks)
```
⏳ Docker setup
⏳ CI/CD pipeline
⏳ Monitoring & logging
⏳ Database backups
⏳ SSL certificates
⏳ Reverse proxy
```

### Phase 5 Community (2-4 weeks)
```
⏳ User profiles
⏳ Campaign sharing
⏳ Content marketplace
⏳ API documentation
⏳ Performance optimization
⏳ Testing suite
```

---

## 🚀 Deployment Guide (FREE)

### Option A: Railway.app (Easiest)
```bash
# 1. Create GitHub repo
git remote add origin https://github.com/user/narrador
git push -u origin main

# 2. Connect to Railway
# Visit railway.app → New Project → Deploy from GitHub

# 3. Set environment
MONGODB_URI=mongodb://user:pass@host
OLLAMA_URL=http://localhost:11434

# 4. Done! Auto-deploys on git push
```

### Option B: Self-Hosted (Most Control)
```bash
# 1. Rent VPS ($5-10/mo or free trial)
# DigitalOcean, Vultr, Linode, AWS free tier

# 2. Setup Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# 3. Clone and deploy
git clone https://github.com/user/narrador
cd narrador
docker-compose up -d

# 4. Setup SSL
sudo certbot certonly --standalone -d yourdom.com

# 5. Setup reverse proxy (nginx)
# Copy nginx.conf and reload
```

### Option C: Fly.io (Balanced)
```bash
# 1. Install fly CLI
curl https://fly.io/install.sh | sh

# 2. Deploy
fly launch
fly deploy

# 3. Scale as needed (3 shared CPU VMs free)
```

---

## 📈 Timeline & Effort

| Phase | Duration | Effort | Team |
|-------|----------|--------|------|
| Phase 1 | 2 weeks | 80 hours | 1-2 dev |
| Phase 2 | 2 weeks | 80 hours | 1-2 dev |
| Phase 3 | 4-6 weeks | 160-240 hours | 1-2 dev |
| Phase 4 | 2-3 weeks | 80-120 hours | 1 dev |
| Phase 5 | 2-4 weeks | 80-160 hours | 1 dev |
| **TOTAL** | **12-17 weeks** | **480-680 hours** | **1-2 devs** |

**Translation**: ~3-4 months solo, or 1.5-2 months com 2 devs

---

## 🎓 Tech Skills Required

### Frontend
- React (proficiency: intermediate+)
- TypeScript (intermediate)
- Tailwind CSS (beginner+)
- Next.js (intermediate)

### Backend
- Node.js/Express (intermediate+)
- MongoDB (intermediate)
- Socket.io (intermediate)
- REST APIs (intermediate+)

### DevOps
- Docker (beginner+)
- Linux/VPS (beginner)
- Git/GitHub (intermediate)
- CI/CD (beginner)

---

## 📚 Resources (All FREE)

### Learning
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com)
- [MongoDB University](https://university.mongodb.com) - FREE courses
- [Docker Docs](https://docs.docker.com)
- [Kubernetes for Beginners](https://kubernetes.io/docs) - if scaling needed

### Tools
- GitHub (free private repos)
- VS Code (free)
- Postman (free tier)
- Figma (free tier)
- NotionAI (note-taking)

### Communities
- GitHub Discussions
- Stack Overflow
- Discord communities
- Reddit r/webdev

---

## ✅ Implementation Checklist

### Phase 3 Pre-requisites
- [ ] Phase 1 & 2 fully tested & working
- [ ] GitHub repo setup
- [ ] Development environment documented
- [ ] Team aligned on roadmap

### Phase 3 Implementation
- [ ] Initiative tracker (1 week)
- [ ] Character sheets (1 week)
- [ ] NPC database (1 week)
- [ ] Timeline & notes (1 week)
- [ ] Localization (0.5 weeks)
- [ ] Audio (1 week optional)
- [ ] Code review & testing (1 week)

### Phase 4 Deployment
- [ ] Dockerize everything
- [ ] Setup GitHub Actions
- [ ] Deploy to Railway/Fly/Self-hosted
- [ ] Configure DNS & SSL
- [ ] Setup monitoring
- [ ] Create backup strategy

### Phase 5 Polish
- [ ] User profiles & social
- [ ] Marketplace
- [ ] API docs
- [ ] Performance optimization
- [ ] Full test coverage
- [ ] Production hardening

---

## 🎯 Success Criteria

**When Phase 3-5 is COMPLETE**:

✅ Feature-rich RPG platform  
✅ Production-ready deployment  
✅ Multi-language support  
✅ Community features  
✅ Zero hosting costs  
✅ Scalable architecture  
✅ Comprehensive documentation  
✅ Full test coverage  
✅ Performance optimized  
✅ Battle-tested & stable  

---

## 🚦 Next Steps

**Immediate (This Week)**:
1. Choose deployment platform (Railway, Fly, or self-hosted)
2. Start Phase 3a - Initiative tracker
3. Setup CI/CD pipeline
4. Create test plan

**Short Term (This Month)**:
- Complete Phase 3 (all features)
- Deploy Phase 4 (production)
- Begin Phase 5 (polish)

**Long Term (Next Quarter)**:
- Scale to community
- Gather user feedback
- Plan Phase 6+ (if needed)

---

**Ready to start Phase 3?** Let me know which feature first! 🎮
