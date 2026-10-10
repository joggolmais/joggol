-- ============================================================================
-- JogGol — Schema Inicial (Limpeza + Criação Completa)
-- Versão: 1.0
-- Base: PRD Executivo v2.0 + Modelo de Dados v1.0
-- SGBD: PostgreSQL 15+ (Supabase)
-- ============================================================================
-- ⚠️ ATENÇÃO: Este script remove objetos existentes antes de recriar.
-- Execute apenas em ambiente de desenvolvimento ou após backup.
-- ============================================================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Limpeza segura (ordem reversa de dependências)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS arenas CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS rotation_states CASCADE;
DROP TABLE IF EXISTS game_events CASCADE;
DROP TABLE IF EXISTS match_periods CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS court_surface CASCADE;
DROP TYPE IF EXISTS competition_status CASCADE;
DROP TYPE IF EXISTS competition_format CASCADE;
DROP TYPE IF EXISTS payment_kind CASCADE;
DROP TYPE IF EXISTS payment_provider CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS game_event_type CASCADE;
DROP TYPE IF EXISTS team_side CASCADE;
DROP TYPE IF EXISTS player_position CASCADE;
DROP TYPE IF EXISTS participant_status CASCADE;
DROP TYPE IF EXISTS game_modality CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS org_member_role CASCADE;
DROP TYPE IF EXISTS org_plan CASCADE;

-- 3. Enums de Domínio

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
CREATE TYPE player_position AS ENUM (
  'goleiro', 'zagueiro', 'lateral', 'meia', 'atacante', 'pivo', 'ala', 'universal'
);

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

-- ============================================================================
-- 4. Tabelas — Núcleo de Identidade e Multi-Tenant
-- ============================================================================

-- 4.1 profiles
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           CITEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  nickname        TEXT,
  phone_e164      TEXT,
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

-- 4.2 organizations
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            CITEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  plan            org_plan NOT NULL DEFAULT 'free',
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_orgs_slug ON organizations(slug) WHERE deleted_at IS NULL;

-- 4.3 organization_members
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            org_member_role NOT NULL DEFAULT 'member',
  permissions     JSONB NOT NULL DEFAULT '{}'::jsonb,
  invited_by      UUID REFERENCES profiles(id),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_org_members_user ON organization_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE deleted_at IS NULL;

-- 4.4 players
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name    TEXT NOT NULL,
  phone_e164      TEXT,
  position        player_position,
  overall         SMALLINT NOT NULL DEFAULT 50 CHECK (overall BETWEEN 0 AND 100),
  elo             INTEGER NOT NULL DEFAULT 1000,
  tier            TEXT,
  xp              INTEGER NOT NULL DEFAULT 0,
  level           SMALLINT NOT NULL DEFAULT 1,
  stats           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_players_org ON players(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_user ON players(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_players_phone ON players(phone_e164) WHERE phone_e164 IS NOT NULL;

-- ============================================================================
-- 5. Tabelas — Núcleo de Partidas (Pelada)
-- ============================================================================

-- 5.1 games
CREATE TABLE games (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  arena_id              UUID,
  court_id              UUID,
  competition_id        UUID,
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

-- 5.2 game_participants
CREATE TABLE game_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status            participant_status NOT NULL DEFAULT 'pendente',
  team_id           UUID,
  position          player_position,
  is_goalkeeper     BOOLEAN NOT NULL DEFAULT FALSE,
  waitlist_position INTEGER,
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

-- 5.3 invitations
CREATE TABLE invitations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
  competition_id    UUID,
  token_hash        TEXT NOT NULL UNIQUE,
  status            invitation_status NOT NULL DEFAULT 'ativo',
  max_uses          INTEGER,
  uses_count        INTEGER NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_invitations_game ON invitations(game_id) WHERE status = 'ativo';
CREATE INDEX idx_invitations_token ON invitations(token_hash);

-- 5.4 teams
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

-- 5.5 match_periods
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

-- 5.6 game_events
CREATE TABLE game_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id             UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_id           UUID REFERENCES match_periods(id) ON DELETE SET NULL,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type          game_event_type NOT NULL,
  player_id           UUID REFERENCES players(id) ON DELETE SET NULL,
  secondary_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team_id             UUID REFERENCES teams(id) ON DELETE SET NULL,
  minute              SMALLINT,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_correction       BOOLEAN NOT NULL DEFAULT FALSE,
  corrects_event_id   UUID REFERENCES game_events(id) ON DELETE SET NULL,
  created_by          UUID NOT NULL REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_events_game ON game_events(game_id, created_at);
CREATE INDEX idx_events_player ON game_events(player_id);
CREATE INDEX idx_events_type ON game_events(game_id, event_type);

-- 5.7 rotation_states
CREATE TABLE rotation_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queue             JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_rotation_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id)
);

-- ============================================================================
-- 6. Tabelas — Competições
-- ============================================================================

-- 6.1 competitions
CREATE TABLE competitions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  format            competition_format NOT NULL,
  status            competition_status NOT NULL DEFAULT 'rascunho',
  start_date        DATE NOT NULL,
  end_date          DATE,
  rules             JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_competitions_org ON competitions(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_competitions_status ON competitions(status) WHERE deleted_at IS NULL;

-- Adicionar FK em games agora que competitions existe
ALTER TABLE games
  ADD CONSTRAINT fk_games_competition FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL;

-- 6.2 standings
CREATE TABLE standings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id    UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  team_id           UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id         UUID REFERENCES players(id) ON DELETE CASCADE,
  position          SMALLINT,
  points            INTEGER NOT NULL DEFAULT 0,
  wins              SMALLINT NOT NULL DEFAULT 0,
  draws             SMALLINT NOT NULL DEFAULT 0,
  losses            SMALLINT NOT NULL DEFAULT 0,
  goals_for         SMALLINT NOT NULL DEFAULT 0,
  goals_against     SMALLINT NOT NULL DEFAULT 0,
  matches_played    SMALLINT NOT NULL DEFAULT 0,
  extra_data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (team_id IS NOT NULL OR player_id IS NOT NULL)
);
CREATE INDEX idx_standings_competition ON standings(competition_id);
CREATE INDEX idx_standings_team ON standings(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_standings_player ON standings(player_id) WHERE player_id IS NOT NULL;

-- ============================================================================
-- 7. Tabelas — Arenas e Quadras
-- ============================================================================

-- 7.1 arenas
CREATE TABLE arenas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  zip_code          TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  phone             TEXT,
  email             TEXT,
  logo_url          TEXT,
  photos            JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_arenas_org ON arenas(organization_id) WHERE deleted_at IS NULL;

-- Adicionar FK em games agora que arenas existe
ALTER TABLE games
  ADD CONSTRAINT fk_games_arena FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE SET NULL;

-- 7.2 courts
CREATE TABLE courts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id          UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  surface           court_surface NOT NULL DEFAULT 'sintetico',
  capacity          SMALLINT,
  has_lighting      BOOLEAN NOT NULL DEFAULT TRUE,
  is_indoor         BOOLEAN NOT NULL DEFAULT FALSE,
  settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_courts_arena ON courts(arena_id) WHERE deleted_at IS NULL;

-- Adicionar FK em games agora que courts existe
ALTER TABLE games
  ADD CONSTRAINT fk_games_court FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE SET NULL;

-- 7.3 bookings
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id          UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  game_id           UUID REFERENCES games(id) ON DELETE SET NULL,
  booked_by         UUID NOT NULL REFERENCES profiles(id),
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  status            booking_status NOT NULL DEFAULT 'livre',
  notes             TEXT,
  cancel_reason     TEXT,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_bookings_court_time ON bookings(court_id, starts_at, ends_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_org ON bookings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_game ON bookings(game_id) WHERE game_id IS NOT NULL;

-- ============================================================================
-- 8. Tabelas — Financeiro
-- ============================================================================

-- 8.1 payments
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  game_id             UUID REFERENCES games(id) ON DELETE SET NULL,
  competition_id      UUID REFERENCES competitions(id) ON DELETE SET NULL,
  booking_id          UUID REFERENCES bookings(id) ON DELETE SET NULL,
  player_id           UUID REFERENCES players(id) ON DELETE SET NULL,
  payer_profile_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  kind                payment_kind NOT NULL,
  provider            payment_provider NOT NULL,
  amount_cents        INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency            TEXT NOT NULL DEFAULT 'BRL',
  status              payment_status NOT NULL DEFAULT 'pendente',
  external_id         TEXT,
  idempotency_key     TEXT UNIQUE,
  paid_at             TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_game ON payments(game_id) WHERE game_id IS NOT NULL;
CREATE INDEX idx_payments_player ON payments(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external ON payments(provider, external_id) WHERE external_id IS NOT NULL;

-- ============================================================================
-- 9. Tabelas — Assinaturas SaaS
-- ============================================================================

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                org_plan NOT NULL,
  status              subscription_status NOT NULL DEFAULT 'trial',
  provider            TEXT,
  external_id         TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_ends_at       TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- ============================================================================
-- 10. Tabelas — Comunicação
-- ============================================================================

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel           notification_channel NOT NULL,
  category          TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  status            notification_status NOT NULL DEFAULT 'pendente',
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  failure_reason    TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL AND status != 'falhou';

-- ============================================================================
-- 11. Tabelas — Disputas
-- ============================================================================

CREATE TABLE disputes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_id          UUID REFERENCES payments(id) ON DELETE SET NULL,
  game_id             UUID REFERENCES games(id) ON DELETE SET NULL,
  opened_by           UUID NOT NULL REFERENCES profiles(id),
  assigned_to         UUID REFERENCES profiles(id),
  status              dispute_status NOT NULL DEFAULT 'aberta',
  reason              TEXT NOT NULL,
  resolution_notes    TEXT,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_disputes_org ON disputes(organization_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_payment ON disputes(payment_id) WHERE payment_id IS NOT NULL;

-- ============================================================================
-- 12. Tabelas — Auditoria
-- ============================================================================

CREATE TABLE audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action              TEXT NOT NULL,
  entity_type         TEXT NOT NULL,
  entity_id           UUID,
  old_values          JSONB,
  new_values          JSONB,
  ip_address          INET,
  user_agent          TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================================================
-- 13. Trigger automático de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'organizations', 'organization_members', 'players',
    'games', 'game_participants', 'teams', 'match_periods',
    'competitions', 'standings', 'arenas', 'courts', 'bookings',
    'payments', 'subscriptions', 'disputes'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================================
-- 14. Comentários de documentação
-- ============================================================================

COMMENT ON TABLE profiles IS 'Espelha auth.users do Supabase. Perfil público do usuário.';
COMMENT ON TABLE organizations IS 'Tenant raiz do SaaS multi-tenant.';
COMMENT ON TABLE organization_members IS 'Vínculo usuário-organização com papel e permissões.';
COMMENT ON TABLE players IS 'Identidade esportiva (pode existir sem conta para convidados).';
COMMENT ON TABLE games IS 'Entidade central da pelada/partida.';
COMMENT ON TABLE game_participants IS 'Inscrição de jogador em uma pelada.';
COMMENT ON TABLE invitations IS 'Tokens de convite seguros com hash SHA-256.';
COMMENT ON TABLE teams IS 'Times formados dentro de uma pelada.';
COMMENT ON TABLE match_periods IS 'Períodos de jogo (tempo, prorrogação, pausas).';
COMMENT ON TABLE game_events IS 'Eventos atômicos da partida (gol, cartão, substituição).';
COMMENT ON TABLE rotation_states IS 'Estado do rodízio com fila de entrada/saída.';
COMMENT ON TABLE competitions IS 'Torneios, copas, ligas e campeonatos.';
COMMENT ON TABLE standings IS 'Classificação em competições (por time ou jogador).';
COMMENT ON TABLE arenas IS 'Instalações esportivas com múltiplas quadras.';
COMMENT ON TABLE courts IS 'Quadras individuais dentro de uma arena.';
COMMENT ON TABLE bookings IS 'Reservas de quadra com prevenção de conflito.';
COMMENT ON TABLE payments IS 'Registros financeiros idempotentes.';
COMMENT ON TABLE subscriptions IS 'Assinaturas SaaS por organização.';
COMMENT ON TABLE notifications IS 'Notificações multi-canal com preferências.';
COMMENT ON TABLE disputes IS 'Disputas financeiras ou de jogo.';
COMMENT ON TABLE audit_logs IS 'Log centralizado de ações críticas.';