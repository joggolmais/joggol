/**
 * Tipos gerados manualmente com base no schema SQL do JogGol v1.0
 * Mantenha sincronizado com supabase/migrations/00000000000000_init_schema.sql
 * Para regenerar automaticamente: npx supabase gen types typescript --db-url <url> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          nickname: string | null;
          phone_e164: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          preferred_position: Database['public']['Enums']['player_position'] | null;
          bio: string | null;
          is_super_admin: boolean;
          locale: string;
          timezone: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          plan: Database['public']['Enums']['org_plan'];
          settings: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['org_member_role'];
          permissions: Json;
          invited_by: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['organization_members']['Row'], 'id' | 'joined_at' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
      };
      players: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          display_name: string;
          phone_e164: string | null;
          position: Database['public']['Enums']['player_position'] | null;
          overall: number;
          elo: number;
          tier: string | null;
          xp: number;
          level: number;
          stats: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };
      games: {
        Row: {
          id: string;
          organization_id: string;
          arena_id: string | null;
          court_id: string | null;
          competition_id: string | null;
          created_by: string;
          title: string;
          description: string | null;
          modality: Database['public']['Enums']['game_modality'];
          status: Database['public']['Enums']['game_status'];
          scheduled_start_at: string;
          scheduled_end_at: string | null;
          actual_start_at: string | null;
          actual_end_at: string | null;
          location_name: string | null;
          location_address: string | null;
          location_lat: number | null;
          location_lng: number | null;
          max_players: number;
          min_players: number;
          team_size: number;
          has_goalkeepers: boolean;
          period_duration_min: number;
          rotation_enabled: boolean;
          fee_amount_cents: number;
          fee_currency: string;
          rules: Json;
          settings: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['games']['Insert']>;
      };
      game_participants: {
        Row: {
          id: string;
          game_id: string;
          player_id: string;
          organization_id: string;
          status: Database['public']['Enums']['participant_status'];
          team_id: string | null;
          position: Database['public']['Enums']['player_position'] | null;
          is_goalkeeper: boolean;
          waitlist_position: number | null;
          checked_in_at: string | null;
          confirmed_at: string | null;
          joined_at: string;
          left_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['game_participants']['Row'], 'id' | 'joined_at' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['game_participants']['Insert']>;
      };
      teams: {
        Row: {
          id: string;
          game_id: string;
          organization_id: string;
          side: Database['public']['Enums']['team_side'];
          name: string | null;
          color: string | null;
          avg_overall: number | null;
          avg_elo: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
      };
      match_periods: {
        Row: {
          id: string;
          game_id: string;
          period_number: number;
          started_at: string | null;
          ended_at: string | null;
          duration_sec: number | null;
          score_a: number;
          score_b: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['match_periods']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['match_periods']['Insert']>;
      };
      game_events: {
        Row: {
          id: string;
          game_id: string;
          period_id: string | null;
          organization_id: string;
          event_type: Database['public']['Enums']['game_event_type'];
          player_id: string | null;
          secondary_player_id: string | null;
          team_id: string | null;
          minute: number | null;
          payload: Json;
          is_correction: boolean;
          corrects_event_id: string | null;
          created_by: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['game_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['game_events']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          game_id: string | null;
          competition_id: string | null;
          booking_id: string | null;
          player_id: string | null;
          payer_profile_id: string | null;
          kind: Database['public']['Enums']['payment_kind'];
          provider: Database['public']['Enums']['payment_provider'];
          amount_cents: number;
          currency: string;
          status: Database['public']['Enums']['payment_status'];
          external_id: string | null;
          idempotency_key: string | null;
          paid_at: string | null;
          failed_at: string | null;
          refunded_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
    Enums: {
      org_plan: 'free' | 'starter' | 'pro' | 'enterprise';
      org_member_role: 'owner' | 'admin' | 'organizer' | 'referee' | 'arena_operator' | 'member';
      game_status: 'rascunho' | 'aberta' | 'confirmacoes_fechadas' | 'em_andamento' | 'finalizada' | 'encerrada' | 'cancelada';
      game_modality: 'futsal' | 'society' | 'campo' | 'futebol_7' | 'outro';
      participant_status: 'convidado' | 'pendente' | 'confirmado' | 'lista_espera' | 'em_campo' | 'banco' | 'finalizado' | 'desistente' | 'lesionado' | 'no_show';
      player_position: 'goleiro' | 'zagueiro' | 'lateral' | 'meia' | 'atacante' | 'pivo' | 'ala' | 'universal';
      team_side: 'A' | 'B' | 'C' | 'D';
      game_event_type: 'gol' | 'gol_contra' | 'assistencia' | 'cartao_amarelo' | 'cartao_vermelho' | 'substituicao' | 'falta' | 'penalti' | 'defesa' | 'inicio_periodo' | 'fim_periodo' | 'pausa' | 'retomada' | 'encerramento' | 'correcao';
      payment_status: 'pendente' | 'processando' | 'confirmado' | 'divergente' | 'falhou' | 'parcial' | 'estornado' | 'cancelado';
      payment_provider: 'pix_manual' | 'asaas' | 'mercadopago' | 'dinheiro' | 'outro';
      payment_kind: 'pelada' | 'inscricao_torneio' | 'reserva_arena' | 'assinatura_saas';
      competition_format: 'pontos_corridos' | 'mata_mata' | 'grupos_mata_mata' | 'repescagem' | 'copa';
      competition_status: 'rascunho' | 'inscricoes' | 'em_andamento' | 'finalizada' | 'cancelada';
      court_surface: 'sintetico' | 'saibro' | 'cimento' | 'madeira' | 'grama_natural' | 'outro';
      booking_status: 'livre' | 'reservado' | 'bloqueado' | 'cancelado' | 'concluido';
      notification_channel: 'in_app' | 'whatsapp' | 'email' | 'push';
      notification_status: 'pendente' | 'enviada' | 'entregue' | 'lida' | 'falhou';
      invitation_status: 'ativo' | 'expirado' | 'revogado' | 'consumido';
      dispute_status: 'aberta' | 'em_analise' | 'resolvida' | 'arquivada';
      subscription_status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada' | 'suspensa';
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];