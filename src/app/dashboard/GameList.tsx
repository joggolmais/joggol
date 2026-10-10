import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface GameListProps {
  userId: string;
  orgId?: string | null;
}

export async function GameList({ userId, orgId }: GameListProps) {
  if (!orgId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
        <p className="text-slate-400">
          Você ainda não está vinculado a uma organização.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch upcoming games for this organization
  const now = new Date().toISOString();
  const { data: upcomingGames } = await supabase
    .from('games')
    .select('id, title, modality, status, scheduled_start_at, location_name, fee_amount_cents')
    .eq('organization_id', orgId)
    .in('status', ['aberta', 'confirmacoes_fechadas', 'em_andamento'])
    .gte('scheduled_start_at', now)
    .order('scheduled_start_at', { ascending: true })
    .limit(10);

  // Fetch recent past games
  const { data: pastGames } = await supabase
    .from('games')
    .select('id, title, modality, status, scheduled_start_at, location_name')
    .eq('organization_id', orgId)
    .in('status', ['finalizada', 'encerrada'])
    .lt('scheduled_start_at', now)
    .order('scheduled_start_at', { ascending: false })
    .limit(5);

  const hasUpcoming = upcomingGames && upcomingGames.length > 0;
  const hasPast = pastGames && pastGames.length > 0;

  if (!hasUpcoming && !hasPast) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625W12 3 9.497 5.625v6.375M12 12v3.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Nenhuma pelada encontrada</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Sua organização ainda não possui peladas ativas ou finalizadas. Crie a primeira para começar!
          </p>
          <Link
            href="/dashboard/games/create"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Criar pelada
          </Link>
        </div>
      </div>
    );
  }

  const modalityLabels: Record<string, string> = {
    futsal: 'Futsal',
    society: 'Society',
    campo: 'Campo',
    futebol_7: 'Futebol 7',
    outro: 'Outro',
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    aberta: { label: 'Aberta', color: 'bg-emerald-500/20 text-emerald-400' },
    confirmacoes_fechadas: { label: 'Confirmada', color: 'bg-blue-500/20 text-blue-400' },
    em_andamento: { label: 'Em andamento', color: 'bg-amber-500/20 text-amber-400' },
    finalizada: { label: 'Finalizada', color: 'bg-slate-500/20 text-slate-400' },
    encerrada: { label: 'Encerrada', color: 'bg-slate-500/20 text-slate-400' },
  };

  return (
    <div className="space-y-8">
      {/* Upcoming Games */}
      {hasUpcoming && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Próximas Peladas</h3>
          <div className="grid grid-cols-1 gap-4">
            {upcomingGames!.map((game) => {
              const statusInfo = statusLabels[game.status] || statusLabels.aberta;
              const date = new Date(game.scheduled_start_at);
              return (
                <Link
                  key={game.id}
                  href={`/dashboard/games/${game.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-white/10"
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-semibold text-white">{game.title}</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                        <span>{modalityLabels[game.modality] || game.modality}</span>
                        <span>•</span>
                        <span>
                          {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {game.location_name && (
                          <>
                            <span>•</span>
                            <span>{game.location_name}</span>
                          </>
                        )}
                        {game.fee_amount_cents > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">R$ {(game.fee_amount_cents / 100).toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                      Ver detalhes →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Past Games */}
      {hasPast && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Histórico Recente</h3>
          <div className="grid grid-cols-1 gap-3">
            {pastGames!.map((game) => {
              const statusInfo = statusLabels[game.status] || statusLabels.finalizada;
              const date = new Date(game.scheduled_start_at);
              return (
                <Link
                  key={game.id}
                  href={`/dashboard/games/${game.id}`}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{game.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {date.toLocaleDateString('pt-BR')} • {modalityLabels[game.modality] || game.modality}
                      {game.location_name ? ` • ${game.location_name}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}