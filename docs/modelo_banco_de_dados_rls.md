# Modelo de Banco de Dados Oficial (Supabase) + RLS

Este documento detalha o modelo relacional em PostgreSQL para o Supabase, incluindo os **Tipos Customizados (Enums)**, as **Tabelas Principais**, os **Índices de Performance**, e as rigorosas **Políticas de RLS (Row Level Security)** necessárias para garantir a governança estrutural documentada no Fluxo Oficial.

---

## 1️⃣ Estrutura de Domínio (Enums)

Tipificar a máquina de estados e as roles no próprio SQL garante que a integridade nunca seja violada.

```sql
-- Define os papéis disponíveis no sistema
CREATE TYPE user_role AS ENUM ('player', 'narrator');

-- Define os estados fixos da máquina de estados de uma Sala
CREATE TYPE room_state AS ENUM ('lobby', 'in_game');
```

---

## 2️⃣ Tabelas e Relacionamentos

### Tabela de Perfis Globais (`users`)
Extensão da tabela padrão `auth.users` do Supabase.

```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Workspaces (Isolamento de Papéis)
O conceito de Workspace é traduzido em duas tabelas separadas. O usuário só possui linha criada aqui baseada em sua escolha inicial.

```sql
CREATE TABLE public.player_workspaces (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  tokens JSONB DEFAULT '[]'::jsonb,             -- Lista de tokens (imagens, tamanhos, dados)
  character_sheets JSONB DEFAULT '[]'::jsonb,   -- Referências para fichas do jogador
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.narrator_workspaces (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  available_systems TEXT[] DEFAULT '{}',        -- Ex: ["dnd5e", "tormenta20"]
  api_integrations JSONB DEFAULT '{"aiChat": false, "music": false}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela ultra-protegida para chaves isoladas e criptografadas via pgcrypto / Supabase Vault
CREATE TABLE public.narrator_api_keys (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  openai_key TEXT,         -- Recomenda-se criptografia nativa no insert (pgcrypto pgp_sym_encrypt)
  music_service_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela de Salas (`rooms`)
Armazena a máquina de estado e configurações vitais da campanha.

```sql
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  state room_state DEFAULT 'lobby' NOT NULL,
  
  -- Campaign Config
  room_name TEXT,
  campaign_name TEXT,
  system_id TEXT,
  map_url TEXT,
  has_password BOOLEAN DEFAULT false,
  password_hash TEXT, -- Se a sala for privada
  
  -- Enabled Features (na sala)
  feature_dice BOOLEAN DEFAULT false,
  feature_ai_chat BOOLEAN DEFAULT false,
  feature_music BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Participantes da Sala (`room_participants`)
Responsável por conectar usuários e salas.

```sql
CREATE TABLE public.room_participants (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);
```

---

## 3️⃣ Índices para Performance e Escalabilidade (B-Tree)

Para otimizar os gatilhos e pesquisas mais comuns (como listar todas as salas de um jogador).

```sql
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_rooms_owner_id ON public.rooms(owner_id);
CREATE INDEX idx_rooms_state ON public.rooms(state);
CREATE INDEX idx_participants_user_id ON public.room_participants(user_id);
```

---

## 4️⃣ Segurança de Nível de Linha (Row Level Security - RLS)

É aqui que garantimos a Governança e a Regra de Negócios da Máquina de Estados. Se a segurança não for garantida aqui, um usuário mal intencionado poderia explorar as APIs pelo Client.

```sql
-- Habilita RLS em tudo
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrator_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrator_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
```

### Políticas para Perfil Central (`users`)
- **Select:** Todos podem ver o perfil de todos (necessário para listar jogadores nas salas).
- **Update:** Usuários só atualizam o próprio perfil.

```sql
CREATE POLICY "Leitura pública de perfis" ON public.users 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas próprio usuário atualiza" ON public.users 
  FOR UPDATE USING (auth.uid() = id);
```

### Políticas para Workspaces (Isolamento Absoluto)
- **Select / Update / Insert:** Somente o próprio dono.

```sql
-- PLAYER WORKSPACE
CREATE POLICY "Player lê próprio workspace" ON public.player_workspaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Player mod próprio workspace" ON public.player_workspaces FOR ALL USING (auth.uid() = user_id);

-- NARRATOR WORKSPACE
CREATE POLICY "Narrador lê próprio workspace" ON public.narrator_workspaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Narrador mod próprio workspace" ON public.narrator_workspaces FOR ALL USING (auth.uid() = user_id);

-- API KEYS (Crítico)
CREATE POLICY "Acesso estrito às Api Keys" ON public.narrator_api_keys FOR ALL USING (auth.uid() = user_id);
```

### Políticas para Salas (`rooms`)
Implementação da regra de bloqueio estrutural usando RLS.

- **Select:** Qualquer usuário autenticado pode ver (para buscar e entrar).
- **Insert:** Qualquer usuário autenticado (a checagem de role "narrador" ocorrerá no código/middleware e em trigger opcional que checa workspace).
- **Update:** APENAS o `owner_id`.
- **Delete:** APENAS o `owner_id` e APENAS em estado 'lobby'.

```sql
CREATE POLICY "Leitura pública autenticada de salas" 
  ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Qualquer host logado cria sua sala" 
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- A REGRA DE OURO DO HOST: Só o Host pode editar a sala
CREATE POLICY "Host edita a própria sala" 
  ON public.rooms FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Host deleta a sala apenas no lobby" 
  ON public.rooms FOR DELETE USING (auth.uid() = owner_id AND state = 'lobby');
```

---

## 5️⃣ Functions (Triggers) de Governança Estrita

As proteções lógicas de máquina de estado (Bloqueios e Transferência de Host) que não são possíveis apenas em RLS precisam ser implementadas como Triggers PostgreSQL (Functions).

### Trigger: Bloqueio de Alteração Estrutural Quando `in_game`
Impede modificação de Host ou Sistema de Regras após a campanha começar.

```sql
CREATE OR REPLACE FUNCTION protect_in_game_mutations()
RETURNS TRIGGER AS $$
BEGIN
  -- Se já estiver jogando, ou a query estiver tentando mudar PARA jogando
  IF OLD.state = 'in_game' OR NEW.state = 'in_game' THEN
    
    -- Só permite UPDATE se os campos estruturais não mudaram.
    IF OLD.owner_id <> NEW.owner_id OR OLD.system_id <> NEW.system_id THEN
      RAISE EXCEPTION 'Ação Bloqueada: Não é permitido transferir host ou trocar o sistema durante a campanha (in_game). Retorne ao Lobby primeiro.';
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER block_in_game_structural_mutations
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION protect_in_game_mutations();
```

### Trigger: Reset de Ferramentas na Transferência de Host
Executa o reset de ferramentas API ao trocar de Narrador (para não queimar saldo indevido do antigo host).

```sql
CREATE OR REPLACE FUNCTION reset_api_features_on_host_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o estado for Lobby E houve mudança de dono
  IF OLD.state = 'lobby' AND OLD.owner_id <> NEW.owner_id THEN
    -- Desativa ferramentas agressivas financeiramente
    NEW.feature_ai_chat := false;
    NEW.feature_music := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_host_transfer
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION reset_api_features_on_host_transfer();
```

---
Esse modelo solidifica completamente o **Fluxo Oficial** direto na infraestrutura do banco de dados, protegendo contra violações e garantindo que o sistema rodará dentro da governança projetada independentemente do código Front-End / Client.
