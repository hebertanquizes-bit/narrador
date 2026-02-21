# ⚙️ Phase 3 - Detalhado & Pronto para Implementar

**Duração**: 4-6 weeks  
**Custo**: $0  
**Features**: 6 grandes + múltiplos componentes

---

## 🎯 Phase 3a: Initiative Tracker (Week 1)

### Objetivo
Sistema de ordem de iniciativa com UI clara para turnos em combate.

### 1.1 Backend: Initiative Schema

```typescript
// backend/src/models/Initiative.ts
import mongoose from 'mongoose';

interface InitiativeEntry {
  tokenId: string;
  name: string;
  initiative: number;      // d20 + modifier
  hitPoints: number;
  maxHitPoints: number;
  armor: number;
  conditions: string[];     // poisoned, stunned, etc
  order?: number;           // calculated after roll
}

interface InitiativeTrackerDoc {
  combatGridId: string;
  userId: string;
  entries: InitiativeEntry[];
  currentTurnIndex: number;
  roundNumber: number;
  state: 'setup' | 'rolling' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

const InitiativeEntrySchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  name: { type: String, required: true },
  initiative: { type: Number, required: true },
  hitPoints: { type: Number, required: true },
  maxHitPoints: { type: Number, required: true },
  armor: { type: Number, default: 10 },
  conditions: [String],
  order: Number,
});

const InitiativeTrackerSchema = new mongoose.Schema(
  {
    combatGridId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    entries: [InitiativeEntrySchema],
    currentTurnIndex: { type: Number, default: 0 },
    roundNumber: { type: Number, default: 1 },
    state: {
      type: String,
      enum: ['setup', 'rolling', 'active', 'ended'],
      default: 'setup',
    },
  },
  { timestamps: true }
);

export const InitiativeTracker = mongoose.model('InitiativeTracker', InitiativeTrackerSchema);
```

### 1.2 Backend: Initiative Service

```typescript
// backend/src/services/initiativeService.ts

export async function createInitiativeTracker(
  combatGridId: string,
  userId: string,
  combatants: Array<{ tokenId: string; name: string; maxHP: number; ac: number }>
) {
  const entries = combatants.map((c) => ({
    tokenId: c.tokenId,
    name: c.name,
    initiative: 0, // Will be rolled
    hitPoints: c.maxHP,
    maxHitPoints: c.maxHP,
    armor: c.ac,
    conditions: [],
  }));

  const tracker = new InitiativeTracker({
    combatGridId,
    userId,
    entries,
    state: 'setup',
  });

  return tracker.save();
}

export async function rollInitiatives(
  trackerId: string,
  rolls: { tokenId: string; initiative: number }[]
) {
  const tracker = await InitiativeTracker.findById(trackerId);
  if (!tracker) throw new Error('Tracker not found');

  // Update initiatives
  rolls.forEach((roll) => {
    const entry = tracker.entries.find((e) => e.tokenId === roll.tokenId);
    if (entry) entry.initiative = roll.initiative;
  });

  // Sort by initiative (DESC)
  tracker.entries.sort((a, b) => b.initiative - a.initiative);

  // Assign order
  tracker.entries.forEach((entry, index) => {
    entry.order = index;
  });

  tracker.state = 'active';
  tracker.currentTurnIndex = 0;

  return tracker.save();
}

export async function nextTurn(trackerId: string) {
  const tracker = await InitiativeTracker.findById(trackerId);
  if (!tracker) throw new Error('Tracker not found');

  // Move to next combatant
  tracker.currentTurnIndex = (tracker.currentTurnIndex + 1) % tracker.entries.length;

  // If back to first, increment round
  if (tracker.currentTurnIndex === 0) {
    tracker.roundNumber++;
  }

  return tracker.save();
}

export async function applyDamage(
  trackerId: string,
  tokenId: string,
  damage: number
) {
  const tracker = await InitiativeTracker.findById(trackerId);
  if (!tracker) throw new Error('Tracker not found');

  const entry = tracker.entries.find((e) => e.tokenId === tokenId);
  if (entry) {
    entry.hitPoints = Math.max(0, entry.hitPoints - damage);
  }

  return tracker.save();
}

export async function addCondition(
  trackerId: string,
  tokenId: string,
  condition: string
) {
  const tracker = await InitiativeTracker.findById(trackerId);
  if (!tracker) throw new Error('Tracker not found');

  const entry = tracker.entries.find((e) => e.tokenId === tokenId);
  if (entry && !entry.conditions.includes(condition)) {
    entry.conditions.push(condition);
  }

  return tracker.save();
}
```

### 1.3 Backend: Initiative Controller

```typescript
// backend/src/controllers/initiativeController.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createInitiativeTracker,
  rollInitiatives,
  nextTurn,
  applyDamage,
  addCondition,
} from '../services/initiativeService';
import { InitiativeTracker } from '../models/Initiative';

const router = Router();

router.post('/create', authenticate, async (req, res) => {
  try {
    const { combatGridId, combatants } = req.body;
    const tracker = await createInitiativeTracker(
      combatGridId,
      (req as any).userId,
      combatants
    );
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/roll', authenticate, async (req, res) => {
  try {
    const { trackerId, rolls } = req.body;
    const tracker = await rollInitiatives(trackerId, rolls);
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/next-turn', authenticate, async (req, res) => {
  try {
    const { trackerId } = req.body;
    const tracker = await nextTurn(trackerId);
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/damage', authenticate, async (req, res) => {
  try {
    const { trackerId, tokenId, damage } = req.body;
    const tracker = await applyDamage(trackerId, tokenId, damage);
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/condition', authenticate, async (req, res) => {
  try {
    const { trackerId, tokenId, condition } = req.body;
    const tracker = await addCondition(trackerId, tokenId, condition);
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:trackerId', authenticate, async (req, res) => {
  try {
    const tracker = await InitiativeTracker.findById(req.params.trackerId);
    res.json(tracker);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
```

### 1.4 Frontend: Initiative Tracker Component

```typescript
// src/components/InitiativeTracker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Heart, Shield, AlertCircle } from 'lucide-react';

interface InitiativeEntry {
  tokenId: string;
  name: string;
  initiative: number;
  hitPoints: number;
  maxHitPoints: number;
  armor: number;
  conditions: string[];
  order?: number;
}

export function InitiativeTracker({
  entries,
  currentTurnIndex,
  roundNumber,
  onNextTurn,
  onApplyDamage,
}: {
  entries: InitiativeEntry[];
  currentTurnIndex: number;
  roundNumber: number;
  onNextTurn: () => void;
  onApplyDamage: (tokenId: string, damage: number) => void;
}) {
  const sortedEntries = [...entries].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));

  return (
    <div className="bg-rpg-darker border border-rpg-accent rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-rpg-gold">
          Round {roundNumber} - Initiative Order
        </h3>
        <button
          onClick={onNextTurn}
          className="bg-rpg-accent text-rpg-dark px-4 py-2 rounded font-semibold hover:opacity-90"
        >
          Next Turn
        </button>
      </div>

      {/* Initiative List */}
      <div className="space-y-2">
        {sortedEntries.map((entry, index) => (
          <div
            key={entry.tokenId}
            className={`p-3 rounded border-2 transition ${
              index === currentTurnIndex
                ? 'bg-rpg-accent text-rpg-dark border-rpg-gold'
                : 'bg-rpg-dark border-rpg-accent text-rpg-light'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Name & Initiative */}
              <div className="flex items-center gap-3">
                <div className="font-bold text-xl w-8">{entry.initiative}</div>
                <div>
                  <p className="font-semibold">{entry.name}</p>
                  <div className="flex gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {entry.hitPoints}/{entry.maxHitPoints}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={14} /> AC {entry.armor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Conditions & Actions */}
              <div className="flex items-center gap-2">
                {entry.conditions.length > 0 && (
                  <div className="flex gap-1">
                    {entry.conditions.map((cond) => (
                      <span
                        key={cond}
                        className="bg-red-900 text-red-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => onApplyDamage(entry.tokenId, 1)}
                  className="p-2 hover:bg-rpg-accent rounded"
                  title="Apply 1 damage"
                >
                  -1 HP
                </button>
              </div>
            </div>

            {/* Dead indicator */}
            {entry.hitPoints <= 0 && (
              <div className="mt-2 p-2 bg-red-900 text-red-100 rounded text-center font-bold">
                UNCONSCIOUS / DEAD
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Turn Indicator */}
      <div className="mt-4 p-3 bg-rpg-accent text-rpg-dark rounded text-center font-bold">
        Current Turn: {sortedEntries[currentTurnIndex]?.name}
      </div>
    </div>
  );
}
```

### 1.5 API Endpoints
```
POST   /api/initiative/create      → Criar tracker
POST   /api/initiative/roll        → Rolar iniciativa
POST   /api/initiative/next-turn   → Próximo turno
POST   /api/initiative/damage      → Aplicar dano
POST   /api/initiative/condition   → Adicionar condição
GET    /api/initiative/:id         → Obter tracker
```

---

## 📋 Próximas Features (Phase 3b-3f)

### 3b: Character Sheet Integration (Week 2)
- D&D 5e stat blocks
- Spell slots
- Equipment
- Leveling

### 3c: NPC Database (Week 3)
- Templates
- Quick spawn
- Reusable library

### 3d: Campaign Timeline (Week 4)
- Session notes
- Quests
- Events

### 3e: Localization (Week 4.5)
- PT-BR, EN, ES, DE
- i18n setup

### 3f: Audio Narration (Week 5) - OPTIONAL
- Text-to-speech
- Sound effects

---

## 🧪 Testing Phase 3a

```typescript
// __tests__/initiative.test.ts
describe('Initiative Tracker', () => {
  it('should create tracker', async () => {
    const tracker = await createInitiativeTracker('grid1', 'user1', [
      { tokenId: 't1', name: 'Fighter', maxHP: 50, ac: 16 },
    ]);
    expect(tracker).toBeDefined();
  });

  it('should roll initiatives', async () => {
    const tracker = await rollInitiatives('trackerId', [
      { tokenId: 't1', initiative: 15 },
    ]);
    expect(tracker.state).toBe('active');
  });

  it('should apply damage', async () => {
    const tracker = await applyDamage('trackerId', 't1', 10);
    expect(tracker.entries[0].hitPoints).toBe(40);
  });
});
```

---

## ✅ Phase 3a Checklist

- [ ] Create Initiative model
- [ ] Implement backend service
- [ ] Create REST controller
- [ ] Build React component
- [ ] Test locally
- [ ] Deploy to Railway
- [ ] Test live
- [ ] Document API

---

**Pronto para começar Phase 3a?** 🎮
