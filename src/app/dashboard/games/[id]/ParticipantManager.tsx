'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  status: string;
  joined_at: string;
  confirmed_at: string | null;
  checked_in_at: string | null;
  players: {
    id: string;
    display_name: string;
    position: string | null;
    overall: number | null;
    phone_e164: string | null;
    avatar_url: string | null;
  } | null;
}

interface ParticipantManagerProps {
  gameId: string;
  participants: Participant[];
}

const STATUS_OPTIONS = [
  { value: 'confirmado', label: 'Confirmado', color: 'text-emerald-400' },
  { value: 'lista_espera', label: 'Lista de Espera', color: 'text-orange-400' },
  { value: 'em_campo', label: 'Em Campo', color: 'text-amber-400' },
  { value: 'banco', label: 'Banco', color: 'text-blue-400' },
  { value: 'pendente', label: 'Pendente', color: 'text-slate-400' },
  { value: 'desistente', label: 'Desistente', color: 'text-red-400' },
  { value: 'lesionado', label: 'Lesionado', color: 'text-red-300' },
  { value: 'no_show', label: 'No-Show', color: 'text-red-500' },
];

export function ParticipantManager({ gameId, participants }: ParticipantManagerProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(participantId: string, newStatus: string) {
    setError(null);
    setUpdatingId(participantId);

    try {
      const response = await fetch(`/dashboard/games/${gameId}/manage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao atualizar status');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setUpdatingId(null);
    }
  }

  if (participants.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <p className="text-slate-400">Nenhum participante inscrito ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-300">Jogador</th>
              <th className="px-4 py-3 font-medium text-slate-300">Posição</th>
              <th className="px-4 py-3 font-medium text-slate-300">OVR</th>
              <th className="px-4 py-3 font-medium text-slate-300">Status</th>
              <th className="px-4 py-3 font-medium text-slate-300">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {participants.map((participant) => {
              const isUpdating = updatingId === participant.id;
              const currentStatusOption = STATUS_OPTIONS.find(
                (opt) => opt.value === participant.status
              ) || STATUS_OPTIONS[4]; // Default to pendente

              return (
                <tr key={participant.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                        {(participant.players?.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {participant.players?.display_name || 'Jogador'}
                        </p>
                        {participant.players?.phone_e164 && (
                          <p className="truncate text-xs text-slate-500">
                            {participant.players.phone_e164}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">
                    {participant.players?.position || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {participant.players?.overall || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={participant.status}
                      onChange={(e) => handleStatusChange(participant.id, e.target.value)}
                      disabled={isUpdating}
                      className={`rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1 text-xs font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 ${currentStatusOption.color}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {participant.status === 'lista_espera' && (
                        <button
                          onClick={() => handleStatusChange(participant.id, 'confirmado')}
                          disabled={isUpdating}
                          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                          title="Promover para confirmado"
                        >
                          ↑ Confirmar
                        </button>
                      )}
                      {['confirmado', 'em_campo', 'banco'].includes(participant.status) && (
                        <button
                          onClick={() => handleStatusChange(participant.id, 'desistente')}
                          disabled={isUpdating}
                          className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                          title="Marcar como desistente"
                        >
                          ✕ Desistiu
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span>
          <strong className="text-emerald-400">{participants.filter(p => p.status === 'confirmado').length}</strong> confirmados
        </span>
        <span>
          <strong className="text-orange-400">{participants.filter(p => p.status === 'lista_espera').length}</strong> na espera
        </span>
        <span>
          <strong className="text-amber-400">{participants.filter(p => p.status === 'em_campo').length}</strong> em campo
        </span>
        <span>
          <strong className="text-red-400">{participants.filter(p => ['desistente', 'lesionado', 'no_show'].includes(p.status)).length}</strong> ausentes
        </span>
      </div>
    </div>
  );
}