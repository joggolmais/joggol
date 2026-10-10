'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface InviteAcceptFormProps {
  gameId: string;
  organizationId: string;
  invitationId: string;
}

export function InviteAcceptForm({
  gameId,
  organizationId,
  invitationId,
}: InviteAcceptFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Você precisa estar logado para aceitar um convite. Faça login ou crie uma conta primeiro.');
        setLoading(false);
        return;
      }

      // Check if player profile exists for this user in this org
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle();

      let playerId = existingPlayer?.id;

      if (!playerId) {
        // Create player profile
        const { data: newPlayer, error: playerError } = await supabase
          .from('players')
          .insert({
            organization_id: organizationId,
            user_id: user.id,
            display_name: displayName || user.email?.split('@')[0] || 'Jogador',
            phone_e164: phone || null,
          })
          .select('id')
          .single();

        if (playerError || !newPlayer) {
          setError(playerError?.message || 'Erro ao criar perfil de jogador.');
          setLoading(false);
          return;
        }
        playerId = newPlayer.id;
      }

      // Upsert participant as confirmed via invite
      const { error: participantError } = await supabase
        .from('game_participants')
        .upsert(
          {
            game_id: gameId,
            player_id: playerId,
            organization_id: organizationId,
            status: 'confirmado',
            joined_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
          },
          { onConflict: 'game_id,player_id' }
        );

      if (participantError) {
        setError(participantError.message);
        setLoading(false);
        return;
      }

      // Increment invitation uses_count (non-critical — ignore errors)
      try {
        await supabase.rpc('increment_invitation_uses', { invitation_id: invitationId });
      } catch {
        // RPC may not exist yet; safe to ignore
      }

      setSuccess(true);
    } catch (err) {
      setError('Erro inesperado ao aceitar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center backdrop-blur-md">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Presença confirmada!</h2>
          <p className="text-sm text-slate-300">
            Você está confirmado nesta pelada. Acesse o dashboard para ver os detalhes.
          </p>
          <Link
            href={`/dashboard/games/${gameId}`}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Ver detalhes da pelada
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <form onSubmit={handleAccept} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-sm font-medium text-slate-300">
            Seu nome / Apelido
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como você quer ser chamado?"
            className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
            WhatsApp (opcional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <p className="text-xs text-slate-500">
            Usado apenas para notificações sobre esta pelada.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Confirmando...' : 'Confirmar Presença'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Ao confirmar, você concorda com os{' '}
          <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 underline">Termos de Uso</Link>.
        </p>
      </form>
    </div>
  );
}