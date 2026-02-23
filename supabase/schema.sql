/**
 * SCHEMA DO BANCO DE DADOS - Narrador VTT
 * ========================================
 * Gerado para Supabase (PostgreSQL)
 * Executar na seção SQL Editor do painel Supabase
 *
 * ORDEM DE EXECUÇÃO:
 * 1. profiles
 * 2. player_workspaces
 * 3. narrator_workspaces
 * 4. rooms
 * 5. room_participants
 * 6. (Policies de segurança no final)
 */

-- ============================================================
-- EXTENSÕES
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- Extensão da tabela auth.users do Supabase.
-- Criado automaticamente após o login via trigger.
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url   text,
  role         text check (role in ('player', 'narrator')) default null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

comment on table public.profiles is 'Perfis de usuário. role=null até o usuário escolher seu tipo de workspace.';

-- ============================================================
-- 2. PLAYER_WORKSPACES
-- Workspace do tipo Jogador.
-- ============================================================
create table if not exists public.player_workspaces (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade unique not null,
  tokens       jsonb default '[]'::jsonb,        -- tokens criados pelo jogador
  character_sheets jsonb default '[]'::jsonb,   -- fichas de personagem
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

comment on table public.player_workspaces is 'Workspace de jogadores: tokens e fichas.';

-- ============================================================
-- 3. NARRATOR_WORKSPACES
-- Workspace do tipo Narrador.
-- api_keys são criptografadas via pgcrypto antes de inserir.
-- ============================================================
create table if not exists public.narrator_workspaces (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade unique not null,

  -- Sistemas de regras disponíveis para este narrador
  available_systems  text[] default array[]::text[],

  -- Flags indicando quais integrações estão habilitadas (chave configurada)
  api_integrations  jsonb default '{
    "aiChat": false,
    "music":  false,
    "youtube": false,
    "imageGen": false
  }'::jsonb,

  -- Chaves de API criptografadas. NUNCA retornar em queries públicas.
  -- Chave mestra de criptografia vem de SUPABASE_ENCRYPTION_KEY (env var server-side only).
  api_keys_encrypted jsonb default '{}'::jsonb,

  -- Assets: links externos (Imgur, Google Drive) ou metadados de upload
  assets            jsonb default '[]'::jsonb,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

comment on table public.narrator_workspaces is 'Workspace de narradores. api_keys_encrypted NUNCA deve ser lido pelo cliente.';

-- ============================================================
-- 4. ROOMS
-- Salas de campanha. Criadas apenas por narradores.
-- ============================================================
create table if not exists public.rooms (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references public.profiles(id) on delete cascade not null,

  -- Código de 6 dígitos para jogadores entrarem
  code            char(6) unique not null,

  -- Máquina de estados formal
  state           text check (state in ('lobby', 'in_game')) default 'lobby' not null,

  -- Ferramentas ativas na sala (ON/OFF). API key nunca fica aqui.
  enabled_features jsonb default '{
    "dice":   false,
    "aiChat": false,
    "music":  false,
    "grid":   false
  }'::jsonb,

  -- Configuração da campanha definida no Lobby
  campaign_config jsonb default '{
    "roomName":     null,
    "campaignName": null,
    "systemId":     null,
    "mapUrl":       null,
    "gridEnabled":  false,
    "password":     null
  }'::jsonb,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.rooms is 'Salas de campanha. state é a máquina de estados central.';

-- Índice para busca rápida por código
create index if not exists idx_rooms_code on public.rooms(code);
create index if not exists idx_rooms_owner on public.rooms(owner_id);
create index if not exists idx_rooms_state on public.rooms(state);

-- ============================================================
-- 5. ROOM_PARTICIPANTS
-- Participantes de cada sala.
-- ============================================================
create table if not exists public.room_participants (
  id        uuid primary key default uuid_generate_v4(),
  room_id   uuid references public.rooms(id) on delete cascade not null,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  is_ready  boolean default false,
  unique(room_id, user_id)
);

comment on table public.room_participants is 'Participantes ativos em cada sala.';

create index if not exists idx_room_participants_room on public.room_participants(room_id);
create index if not exists idx_room_participants_user on public.room_participants(user_id);

-- ============================================================
-- FUNÇÃO: gerar código de sala (6 dígitos únicos)
-- ============================================================
create or replace function generate_room_code()
returns char(6) language plpgsql as $$
declare
  new_code char(6);
  exists_already boolean;
begin
  loop
    new_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    select exists(select 1 from public.rooms where code = new_code) into exists_already;
    exit when not exists_already;
  end loop;
  return new_code;
end;
$$;

-- ============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers de updated_at
create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at_column();

create or replace trigger player_workspaces_updated_at
  before update on public.player_workspaces
  for each row execute function update_updated_at_column();

create or replace trigger narrator_workspaces_updated_at
  before update on public.narrator_workspaces
  for each row execute function update_updated_at_column();

create or replace trigger rooms_updated_at
  before update on public.rooms
  for each row execute function update_updated_at_column();

-- ============================================================
-- FUNÇÃO: criar profile automaticamente após signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    null  -- sem role até o usuário escolher workspace
  );
  return new;
end;
$$;

-- Trigger: disparar ao criar usuário
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table public.profiles           enable row level security;
alter table public.player_workspaces  enable row level security;
alter table public.narrator_workspaces enable row level security;
alter table public.rooms              enable row level security;
alter table public.room_participants  enable row level security;

-- Remover políticas antigas para evitar conflitos ao reexecutar
drop policy if exists "Usuário vê próprio perfil" on public.profiles;
drop policy if exists "Usuário atualiza próprio perfil" on public.profiles;
drop policy if exists "Perfis básicos visíveis por usuários autenticados" on public.profiles;
drop policy if exists "Jogador acessa próprio workspace" on public.player_workspaces;
drop policy if exists "Narrador acessa próprio workspace" on public.narrator_workspaces;
drop policy if exists "Narrador atualiza próprio workspace" on public.narrator_workspaces;
drop policy if exists "Narrador cria próprio workspace" on public.narrator_workspaces;
drop policy if exists "Salas visíveis para todos os usuários autenticados" on public.rooms;
drop policy if exists "Usuários podem criar salas" on public.rooms;
drop policy if exists "Apenas owner atualiza sala" on public.rooms;
drop policy if exists "Apenas owner deleta sala" on public.rooms;
drop policy if exists "Participante vê participantes da mesma sala" on public.room_participants;
drop policy if exists "Usuário entra em sala" on public.room_participants;
drop policy if exists "Usuário sai da sala" on public.room_participants;

-- ---------- POLÍTICAS PERMISSIVAS ----------
-- As regras abaixo permitem que qualquer usuário autenticado leia/crie/edite qualquer conteúdo.
-- O ideal para ambiente de desenvolvimento livre de bloqueios.

create policy "Permitir tudo para autenticados em profiles"
  on public.profiles for all
  using (auth.role() = 'authenticated');

create policy "Permitir tudo para autenticados em player_workspaces"
  on public.player_workspaces for all
  using (auth.role() = 'authenticated');

create policy "Permitir tudo para autenticados em narrator_workspaces"
  on public.narrator_workspaces for all
  using (auth.role() = 'authenticated');

create policy "Permitir tudo para autenticados em rooms"
  on public.rooms for all
  using (auth.role() = 'authenticated');

create policy "Permitir tudo para autenticados em room_participants"
  on public.room_participants for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- DADOS INICIAIS: Sistemas de RPG nativos disponíveis
-- (Apenas referência — usado no frontend como constantes)
-- ============================================================
-- Os sistemas nativos são arquivos JSON no frontend.
-- Esta tabela é referência para validação.
create table if not exists public.rpg_systems (
  id          text primary key,  -- ex: 'dnd5e', 'tormenta20', 'gurps'
  name        text not null,
  description text,
  is_native   boolean default true,
  created_at  timestamptz default now()
);

insert into public.rpg_systems (id, name, description, is_native) values
  ('dnd5e',      'D&D 5ª Edição',          'Dungeons & Dragons 5th Edition (SRD)',           true),
  ('tormenta20', 'Tormenta 20',             'Sistema brasileiro de RPG pela Jambô Editora',   true),
  ('gurps',      'GURPS',                   'Generic Universal RolePlaying System (Steve Jackson Games)', true),
  ('call_cthulhu', 'Chamado de Cthulhu',    'Horror Lovecraftiano - Chaosium',                true),
  ('fate',       'Fate Core',               'Sistema narrativo da Evil Hat Productions',      true),
  ('savage',     'Savage Worlds',           'Sistema de aventura rápida e furious da PEG',    true),
  ('pathfinder2', 'Pathfinder 2e',          'Advanced Player Guide - Paizo',                  true),
  ('vampiro5',   'Vampiro: A Máscara 5e',   'World of Darkness - Renegade Game Studios',      true),
  ('homebrew',   'Sistema Homebrew',        'Sistema personalizado do Narrador',              false)
on conflict (id) do nothing;

-- Política de leitura: todos os usuários autenticados veem os sistemas
alter table public.rpg_systems enable row level security;

create policy "Sistemas visíveis para todos autenticados"
  on public.rpg_systems for select
  using (auth.role() = 'authenticated');
