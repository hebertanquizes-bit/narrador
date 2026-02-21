# Narrador — AI Copilot Instructions

## Project Overview

**Narrador** is a Next.js web app for AI-assisted tabletop RPG narration. It's a Portuguese-language MVP with no backend server—all state lives in browser LocalStorage and AI keys never leave the user's machine.

### Key Architecture Decisions
- **Client-only MVP**: No persistent backend; uses LocalStorage for all data (rooms, characters, campaign config, game state, AI keys)
- **Browser-side AI keys**: OpenAI/Anthropic/Deepseek/Gemini keys stored only in user's LocalStorage; API calls proxied through `/api/narrate` route
- **Room-based multiplayer**: Each game session is a "room" with a Host (room creator) and Players; simulated players for testing
- **Phase-driven state**: Rooms progress through `lobby → synchronizing → refinement → playing` phases
- **Turn-based messaging**: Players act in round-robin turns; IA only responds after explicit "Finalizar Turno" action

## Tech Stack & Conventions

**Framework**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Lucide React  
**State**: React Context API (RoomContext) + LocalStorage (no Redux/Zustand)  
**Styling**: Tailwind + dark RPG theme (`bg-rpg-*`, `text-rpg-*` color classes)

### Development Workflow
```bash
npm install      # Install dependencies
npm run dev      # Start local dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # TypeScript + ESLint checks
```

## File Organization & Patterns

### `/src/lib/` — Core Logic (No UI)
- **`types.ts`**: All TypeScript interfaces (`User`, `Room`, `RoomState`, `GameMessage`, etc.)
- **`storage.ts`**: LocalStorage helpers with `STORAGE_KEYS` constant (prefix `narrador_`)
- **`roomState.ts`**: State mutations for RoomState (participants, ready flags, phases, messages, current turn)
- **`ai-narrator.ts`**: Builds message history for AI context (`buildNarratorContext()`) and calls `/api/narrate` route
- **`ai-key.ts`**: Gets/sets AI provider credentials from LocalStorage
- **`ai-providers.ts`**: Model/provider metadata (supported models, endpoints)
- **`auth.ts`**: User login/registration (simulated Google OAuth)
- **`rooms.ts`**, **`campaign.ts`**, **`characters.ts`**: CRUD helpers for rooms, campaign config, character sheets

### `/src/context/RoomContext.tsx` — Central State
- Provides `useRoom()` hook to access room state + action methods across all components
- Lazy-loads data from LocalStorage on mount; syncs AI calls and phase transitions
- Manages turn order, ready checks, AI processing indicators

### `/src/components/` — UI Components
- **`GameChat.tsx`**: Message display with visual differentiation (narrative/consult/action/interact kinds)
- **`LobbySection.tsx`**: Ready check UI, participant list, "Iniciar Campanha" button (Host-only)
- **`SyncPhase.tsx`**: Shows "IA processando..." loading state during synchronization
- **`RefinementPhase.tsx`**: Display host questions from IA, collect answers before play starts
- **`PreGameChecklist.tsx`**: Stepper for backend OK → campaign loaded → characters valid → players ready
- **`CampaignConfig.tsx`**: Upload campaign file, toggle IA clarifications, rules authority field (Host-only)
- **`CharactersSection.tsx`**: Character sheet submissions & approval workflow
- **`AiKeyConfig.tsx`**: AI provider selector, API key input (Host-only)
- **`LoginForm.tsx`**: Email/password + simulated "Entrar com Google"

### `/src/app/` — Routes (App Router)
- **`page.tsx`**: Login page (redirects if already logged in)
- **`dashboard/page.tsx`**: Room list, create/join rooms
- **`layout.tsx`**: Global layout, nav, theme setup
- **`sala/[id]/page.tsx`**: Main room page (wraps RoomProvider, shows phase-specific UI)
- **`api/narrate/route.ts`**: POST endpoint that forwards AI calls to OpenAI/Anthropic/Deepseek/Gemini

## Data Flow Patterns

### Lobby Phase → Playing Phase
1. Host clicks "Iniciar Campanha" (only when checklist ✓ and all players ready)
2. Phase changes to `synchronizing`; show loading screen
3. Mock AI processes campaign + characters for 2-3 seconds
4. Phase → `refinement`; show host IA-generated questions
5. Host answers (optional), clicks "Confirmar"
6. Phase → `playing`; IA generates intro, directs first player

### Turn Flow (Playing Phase)
1. **Current player sees input** for action/consult/interact; other players see "Aguardando [Nome]..."
2. Player submits action → message added to history
3. **Player clicks "Finalizar Turno"** → `isAiProcessing = true` (input locked, "IA narrando..." shown)
4. `buildNarratorContext()` prepares message history → `callNarratorApi()` calls `/api/narrate`
5. IA response added as narrative message with target player
6. `currentTurnPlayerId` advances to next participant (round-robin)
7. `isAiProcessing = false`; new current player sees input

### Message Kinds
- **`narrative`**: Blocks from IA narration (styled with gold border)
- **`consult`**: Questions to IA outside character (styled with blue border)
- **`action`**: Player's in-character action
- **`interact`**: Player talking to NPC
- **`refinement`**: IA's refinement questions during setup phase

## Critical Implementation Details

### LocalStorage Schema
All keys live under `narrador_` prefix in `STORAGE_KEYS`:
```
narrador_user              → Current User
narrador_rooms             → Room[]
narrador_campaign          → CampaignConfig
narrador_characters        → Character[]
narrador_ai_key            → API key (encrypted in production)
narrador_ai_provider       → "openai" | "anthropic" | "deepseek" | "gemini"
narrador_ai_model          → Model name (e.g. "gpt-4o")
narrador_room_state        → RoomState (participants, phase, messages, turns)
```

### AI Context Building
`buildNarratorContext()` in `ai-narrator.ts` constructs a system prompt + message history:
- System: narrator instructions, rules authority, participant names
- Messages: interleaved player actions (`[Name] (Action): ...`) and IA responses
- Order matters: do NOT include IA response until "Finalizar Turno" is clicked

### UI Styling Conventions
- Dark RPG theme colors in `globals.css`/Tailwind config:
  - `bg-rpg-dark`: Main background
  - `text-rpg-light`: Primary text
  - `border-rpg-gold`: Narrative/important elements
  - `border-rpg-accent`: Consult/questions
  - Loading states use `animate-spin` + `Loader2` icon from lucide
  
## Common Patterns & Anti-Patterns

✅ **DO**:
- Use `useRoom()` hook for all room state access
- Call `setRoomState()` to persist changes to LocalStorage immediately
- Check `isHost` before showing Host-only controls
- Use message `kind` property for styling/filtering, not strings
- Mock IA delays for UX feel (use `setTimeout` in synchronizing phase)

❌ **DON'T**:
- Store sensitive data outside LocalStorage (no cookies/sessions)
- Add IA responses to history before turn is officially finished
- Mutate room state directly; use roomState.ts action functions
- Make simultaneous API calls when `isAiProcessing` is true
- Forget to handle `provider` in `callNarratorApi()` switch logic

## Adding New Features

**Example: Add a "Save Transcript" button**
1. Add export function in `lib/storage.ts` to serialize messages
2. Create component `ExportTranscript.tsx` with Lucide download icon
3. Add button to `GameChat.tsx` footer
4. Test: create room → play a few turns → click export
5. Verify localStorage persists across page reloads

**Example: Add a new AI provider**
1. Add provider to `ai-providers.ts` enum + model list
2. Add case in `route.ts` `callProviderName()` function (follow OpenAI pattern)
3. Update `AiKeyConfig.tsx` dropdown
4. Add tests for malformed API key handling

## Testing & Debugging

- **DevTools LocalStorage**: F12 → Application → Local Storage → `localhost:3000` to inspect/edit data
- **Simulated players**: Click "Simular jogador (teste)" to add test participants
- **Phase transitions**: Manually update `narrador_room_state.phase` in DevTools to skip to refinement/playing
- **AI delays**: Look for `setTimeout` calls in RoomContext for 2-3 second sync delays (adjustable for faster testing)

## Known Limitations (MVP)
- No database; all data lost on browser clear
- OAuth2 "Entrar com Google" is simulated (button succeeds but doesn't auth)
- Campaign/character files are stored as filenames only (no actual uploads)
- No real-time sync between players (assumes single-device testing or manual refresh)
