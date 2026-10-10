'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface GameActionsProps {
  gameId: string;
  userId: string;
  currentStatus?: string | null;
  gameStatus: string;
  feeAmountCents: number;
}

export function GameActions({
  gameId,
  userId,
  currentStatus,
  gameStatus,
  feeAmountCents,
}: GameActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cannot interact with games that are not open or in confirmation phase
  const canInteract = ['aberta', 'confirmacoes_fechadas'].includes(gameStatus);
  const isConfirmed = currentStatus === 'confirmado';
  const isWaitlisted = currentStatus === 'lista_espera';
  const isPending = currentStatus === 'pendente';

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      // Check if player profile exists for this user in the org context
      // For simplicity, we assume the user has a player record or we create one inline
      // In a real app, this would be handled by a server action or API route

      // Upsert participant as confirmed
      const { error: insertError } = await supabase.from('game_participants').upsert(
        {
          game_id: gameId,
          player_id: userId, // Simplified mapping
          organization_id: (await supabase.from('games').select('organization_id').eq('id', gameId).single()).data?.organization_id,
          status: 'confirmado',
          joined_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        },
        { onConflict: 'game_id,player_id' }
      );

      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.refresh();
    } catch (err) {
      setError('Erro ao confirmar presença.');
    } finally {
      setLoading(false);
    }
  }

  async function handleWaitlist() {
    setError(null);
    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('game_participants').upsert(
        {
          game_id: gameId,
          player_id: userId,
          organization_id: (await supabase.from('games').select('organization_id').eq('id', gameId).single()).data?.organization_id,
          status: 'lista_espera',
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'game_id,player_id' }
      );

      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.refresh();
    } catch (err) {
      setError('Erro ao entrar na lista de espera.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('game_participants')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', userId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      router.refresh();
    } catch (err) {
      setError('Erro ao cancelar participação.');
    } finally {
      setLoading(false);
    }
  }

  if (!canInteract && !currentStatus) return null;

  return (
    <div className="flex flex-col gap-3 w-full sm:w-auto">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {!currentStatus ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading || !canInteract}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Confirmando...' : 'Confirmar Presença'}
          </button>
          <button
            onClick={handleWaitlist}
            disabled={loading || !canInteract}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-slate-900/50 px-6 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Entrar na Espera
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <span className={`text-sm font-medium ${
            isConfirmed ? 'text-emerald-400' :
            isWaitlisted ? 'text-orange-400' :
            'text-slate-400'
          }`}>
            {isConfirmed ? '✓ Você está confirmado' :
             isWaitlisted ? '⏳ Na lista de espera' :
             `Status: ${currentStatus}`}
          </span>

          {(isConfirmed || isWaitlisted || isPending) && canInteract && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-xs text-red-400 hover:text-red-300 underline decoration-red-400/30 underline-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelando...' : 'Cancelar participação'}
            </button>
          )}
        </div>
      )}

      {feeAmountCents > 0 && canInteract && !currentStatus && (
        <p className="text-xs text-slate-500 text-center sm:text-left">
          Valor: R$ {(feeAmountCents / 100).toFixed(2)} • Pagamento no local
        </p>
      )}
    </div>
  );
}