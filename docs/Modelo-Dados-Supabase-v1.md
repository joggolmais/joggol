# Modelo de Banco de Dados — JogGol (Supabase/PostgreSQL)

**Versão:** 1.0
**Base:** PRD Executivo JogGol v2.0 + Documento de Planejamento de Interface v1.0
**SGBD:** PostgreSQL 15+ (Supabase)
**Estratégia:** Multi-tenant com isolamento via RLS, backend como fonte de verdade, idempotência em operações mutáveis, auditoria de ações críticas.

---

## 1. Visão Geral da Arquitetura de Dados

### 1.1 Princípios Aplicados
- **Multi-tenant por `organization_id`:** toda entidade de domínio carrega o tenant para permitir RLS eficiente.
- **Soft-delete controlado:** colunas `deleted_at` em entidades sensíveis (política de não destruição).
- **Idempotência:** `idempotency_key` em operações financeiras e webhooks.
- **Auditoria:** `audit_log` centralizado + `created_by`/`updated_by` nas tabelas mutáveis.
- **Máquinas de estado:** implementadas via `ENUM` ou `CHECK` para Pelada, Participante e Pagamento.
- **Tokens de convite:** armazenados como hash (SHA-256), com expiração e revogação.

### 1.2 Convenções
- Chaves primárias: `UUID` (`gen_random_uuid()`), exceto tabelas de referência.
- Timestamps: `TIMESTAMPTZ` com `DEFAULT now()`.
- Nomes: `snake_case`, plural para tabelas.
- Enums: prefixados por domínio (`game_status`, `participant_status`, `payment_status`).

### 1.3 Extensões Necessárias
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca textual
```

---

## 2. Enums de Domínio

```sql
-- Organização / SaaS
CREATE TYPE org_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE org_member_role AS ENUM (
  'owner', 'admin', 'organizer', 'referee', 'arena_operator', 'member'
);

-- Pelada (Game)
CREATE TYPE game_status AS ENUM (
  'rascunho', 'aberta', 'confirmacoes_fechadas',
  'em_andamento', 'finalizada', 'encerrada', 'cancelada'
);
CREATE TYPE game_modality AS ENUM ('futsal', 'society', 'campo', 'futebol_7', 'outro');

-- Participante
CREATE TYPE participant_status AS ENUM (
  'convidado', 'pendente', 'confirmado', 'lista_espera',
  'em_campo', 'banco', 'finalizado',
  'desistente', 'lesionado', 'no_show'
);
CREATE TYPE player_position AS ENUM ('goleiro', 'zagueiro', 'lateral', 'meia', 'atacante', 'pivo', 'ala', 'universal');

-- Times
CREATE TYPE team_side AS ENUM ('A', 'B', 'C', 'D');

-- Eventos de jogo
CREATE TYPE game_event_type AS ENUM (
  'gol', 'gol_contra', 'assistencia', 'cartao_amarelo', 'cartao_vermelho',
  'substituicao', 'falta', 'penalti', 'defesa', 'inicio_periodo',
  'fim_periodo', 'pausa', 'retomada', 'encerramento', 'correcao'
);

-- Pagamentos
CREATE TYPE payment_status AS ENUM (
  'pendente', 'processando', 'confirmado',
  'divergente', 'falhou', 'parcial', 'estornado', 'cancelado'
);
CREATE TYPE payment_provider AS ENUM ('pix_manual', 'asaas', 'mercadopago', 'dinheiro', 'outro');
CREATE TYPE payment_kind AS ENUM ('pelada', 'inscricao_torneio', 'reserva_arena', 'assinatura_saas');

-- Competições
CREATE TYPE competition_format AS ENUM ('pontos_corridos', 'mata_mata', 'grupos_mata_mata', 'repescagem', 'copa');
CREATE TYPE competition_status AS ENUM ('rascunho', 'inscricoes', 'em_andamento', 'finalizada', 'cancelada');

-- Arena
CREATE TYPE court_surface AS ENUM ('sintetico', 'saibro', 'cimento', 'madeira', 'grama_natural', 'outro');
CREATE TYPE booking_status AS ENUM ('livre', 'reservado', 'bloqueado', 'cancelado', 'concluido');

-- Notificações
CREATE TYPE notification_channel AS ENUM ('in_app', 'whatsapp', 'email', 'push');
CREATE TYPE notification_status AS ENUM ('pendente', 'enviada', 'entregue', 'lida', 'falhou');

-- Convites
CREATE TYPE invitation_status AS ENUM ('ativo', 'expirado', 'revogado', 'consumido');

-- Disputas
CREATE TYPE dispute_status AS ENUM ('aberta', 'em_analise', 'resolvida', 'arquivada');

-- Assinatura
CREATE TYPE subscription_status AS ENUM ('trial', 'ativa', 'inadimplente', 'cancelada', 'suspensa');
```

---

## 3. Tabelas — Núcleo de Identidade e Multi-Tenant

### 3.1 `profiles`
Espelha `auth.users` do Supabase. Fonte de verdade do perfil público.

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           CITEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  nickname        TEXT,
  phone_e164      TEXT,                          -- WhatsApp
  avatar_url      TEXT,
  birth_date      DATE,
  preferred_position player_position,
  bio             TEXT,
  is_super_admin  BOOLEAN NOT NULL DEFAULT FALSE,
  locale          TEXT NOT NULL DEFAULT 'pt-BR',
  timezone        TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_profiles_email ON profiles(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_phone ON profiles(phone_e164) WHERE phone_e164 IS NOT NULL;
```

### 3.2 `organizations`
Tenant raiz do SaaS.

```sql
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            CITEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  plan            org_plan NOT NULL DEFAULT 'free',
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- integrações, preferências
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_orgs_slug ON organizations(slug) WHERE deleted_at IS NULL;
```

### 3.3 `organization_members`
Vínculo usuário ↔ organização com papel.

```sql
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            org_member_role NOT NULL DEFAULT 'member',
  permissions     JSONB NOT NULL DEFAULT '{}'::jsonb,   -- overrides finos
  invited_by      UUID REFERENCES profiles(id),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_org_members_user ON organization_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE deleted_at IS NULL;
```

### 3.4 `players`
Identidade esportiva do usuário (pode existir sem conta — convidado).

```sql
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL = convidado
  display_name    TEXT NOT NULL,
  phone_e164      TEXT,
  position        player_position,
  overall         SMALLINT NOT NULL DEFAULT 50 CHECK (overall BETWEEN 0 AND 100),
  elo             INTEGER NOT NULL DEFAULT 1000,
  tier            TEXT,                                -- bronze/prata/ouro/...
  xp              INTEGER NOT NULL DEFAULT 0,
  level           SMALLINT NOT NULL DEFAULT 1,
  stats           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- gols, assistências, cartões
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_players_org ON players(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_user ON players(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_players_phone ON players(phone_e164) WHERE phone_e164 IS NOT NULL;
```

---

## 4. Tabelas — Núcleo de Partidas (Pelada)

### 4.1 `games`
Entidade central da pelada.

```sql
CREATE TABLE games (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  arena_id              UUID,                          -- FK adicionada após arenas
  court_id              UUID,
  competition_id        UUID,                          -- FK adicionada após competitions
  created_by            UUID NOT NULL REFERENCES profiles(id),
  title                 TEXT NOT NULL,
  description           TEXT,
  modality              game_modality NOT NULL DEFAULT 'futsal',
  status                game_status NOT NULL DEFAULT 'rascunho',
  scheduled_start_at    TIMESTAMPTZ NOT NULL,
  scheduled_end_at      TIMESTAMPTZ,
  actual_start_at       TIMESTAMPTZ,
  actual_end_at         TIMESTAMPTZ,
  location_name         TEXT,
  location_address      TEXT,
  location_lat          NUMERIC(10,7),
  location_lng          NUMERIC(10,7),
  max_players           SMALLINT NOT NULL DEFAULT 14,
  min_players           SMALLINT NOT NULL DEFAULT 10,
  team_size             SMALLINT NOT NULL DEFAULT 5,
  has_goalkeepers       BOOLEAN NOT NULL DEFAULT TRUE,
  period_duration_min   SMALLINT NOT NULL DEFAULT 10,
  rotation_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  fee_amount_cents      INTEGER NOT NULL DEFAULT 0,
  fee_currency          TEXT NOT NULL DEFAULT 'BRL',
  rules                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);
CREATE INDEX idx_games_org_status ON games(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_games_scheduled ON games(scheduled_start_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_games_created_by ON games(created_by);
```

### 4.2 `game_participants`
Inscrição de um jogador em uma pelada.

```sql
CREATE TABLE game_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status            participant_status NOT NULL DEFAULT 'pendente',
  team_id           UUID,                          -- FK após teams
  position          player_position,
  is_goalkeeper     BOOLEAN NOT NULL DEFAULT FALSE,
  waitlist_position INTEGER,                       -- ordem na lista de espera
  checked_in_at     TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at           TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, player_id)
);
CREATE INDEX idx_gp_game_status ON game_participants(game_id, status);
CREATE INDEX idx_gp_player ON game_participants(player_id);
CREATE INDEX idx_gp_waitlist ON game_participants(game_id, waitlist_position)
  WHERE status = 'lista_espera';
```

### 4.3 `invitations`
Tokens de convite para entrada sem cadastro.

```sql
CREATE TABLE invitations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
  competition_id    UUID,                          -- FK após competitions
  token_hash        TEXT NOT NULL UNIQUE,          -- SHA-256 do token
  status            invitation_status NOT NULL DEFAULT 'ativo',
  max_uses          INTEGER,                       -- NULL = ilimitado
  uses_count        INTEGER NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_invitations_game ON invitations(game_id) WHERE status = 'ativo';
CREATE INDEX idx_invitations_token ON invitations(token_hash);
```

### 4.4 `teams`
Times formados dentro de uma pelada.

```sql
CREATE TABLE teams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  side              team_side NOT NULL,
  name              TEXT,
  color             TEXT,
  avg_overall       NUMERIC(5,2),
  avg_elo           NUMERIC(7,2),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, side)
);
CREATE INDEX idx_teams_game ON teams(game_id);

ALTER TABLE game_participants
  ADD CONSTRAINT fk_gp_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
```

### 4.5 `match_periods`
Períodos de jogo (tempo, prorrogação, pausas).

```sql
CREATE TABLE match_periods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_number     SMALLINT NOT NULL,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_sec      INTEGER,
  score_a           SMALLINT NOT NULL DEFAULT 0,
  score_b           SMALLINT NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, period_number)
);
CREATE INDEX idx_periods_game ON match_periods(game_id);
```

### 4.6 `game_events`
Eventos atômicos da partida (gol, cartão, substituição, etc.).

```sql
CREATE TABLE game_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_id         UUID REFERENCES match_periods(id) ON DELETE SET NULL,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type        game_event_type NOT NULL,
  player_id         UUID REFERENCES players(id) ON DELETE SET NULL,
  secondary_player_id UUID REFERENCES players(id) ON DELETE SET NULL,  -- assistência, substituído
  team_id           UUID REFERENCES teams(id) ON DELETE SET NULL,
  minute            SMALLINT,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_correction     BOOLEAN NOT NULL DEFAULT FALSE,
  corrects_event_id UUID REFERENCES game_events(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_events_game ON game_events(game_id, created_at);
CREATE INDEX idx_events_player ON game_events(player_id);
CREATE INDEX idx_events_type ON game_events(game_id, event_type);
```

### 4.7 `rotation_states`
Estado do rodízio (fila de entrada/saída).

```sql
CREATE TABLE rotation_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queue             JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{player_id, entered_at, ...}]
  last_rotation_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id)
);
```