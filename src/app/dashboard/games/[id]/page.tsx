import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { GameActions } from './GameActions';
import { InviteSharePanel } from './InviteSharePanel';
import { ParticipantManager } from './ParticipantManager';

// This route accesses cookies() and params at the top level — allow blocking render
export const instant = false;

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

async function GameDetailContent({ gameId }: { gameId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch game with organization validation
  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      organizations!inner(id, name),
      arenas(id, name),
      courts(id, name)
    `)
    .eq('id', gameId)
    .single();

  if (error || !game) notFound();

  // Check if user is member of this organization
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', game.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!orgMember) notFound();

  // Fetch participants with player info
  const { data: participants } = await supabase
    .from('game_participants')
    .select(`
      *,
      players(id, display_name, position, overall, avatar_url)
    `)
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true });

  // Fetch user's participation status
  const { data: myParticipation } = await supabase
    .from('game_participants')
    .select('*')
    .eq('game_id', gameId)
    .eq('player_id', user.id)
    .single();

  // Stats
  const confirmedCount = participants?.filter(p => ['confirmado', 'em_campo', 'banco'].includes(p.status)).length || 0;
  const waitlistCount = participants?.filter(p => p.status === 'lista_espera').length || 0;

  const modalityLabels: Record<string, string> = {
    futsal: 'Futsal', society: 'Society', campo: 'Campo',
    futebol_7: 'Futebol 7', outro: 'Outro',
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    rascunho: { label: 'Rascunho', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    aberta: { label: 'Aberta', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    confirmacoes_fechadas: { label: 'Confirmada', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    em_andamento: { label: 'Em Andamento', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    finalizada: { label: 'Finalizada', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    encerrada: { label: 'Encerrada', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    cancelada: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20' },
  };

  const currentStatus = statusConfig[game.status] || statusConfig.aberta;
  const startDate = new Date(game.scheduled_start_at);
  const endDate = game.scheduled_end_at ? new Date(game.scheduled_end_at) : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-lg font-semibold text-white truncate max-w-[200px] sm:max-w-none">
            {game.title}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${currentStatus.bg} ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                  <span className="text-sm text-slate-400">{modalityLabels[game.modality]}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{game.title}</h2>
              </div>

              {/* Action Buttons */}
              <GameActions
                gameId={gameId}
                userId={user.id}
                currentStatus={myParticipation?.status}
                gameStatus={game.status}
                feeAmountCents={game.fee_amount_cents}
              />
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-slate-500">Data e Hora</p>
                <p className="font-medium text-white">
                  {startDate.toLocaleDateString('pt-BR')} • {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {endDate && (
                  <p className="text-xs text-slate-500">
                    Término: {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-slate-500">Local</p>
                <p className="font-medium text-white">{game.location_name || 'A definir'}</p>
                {game.location_address && (
                  <p className="text-xs text-slate-500 truncate">{game.location_address}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-slate-500">Jogadores</p>
                <p className="font-medium text-white">
                  {confirmedCount} / {game.max_players} confirmados
                </p>
                {waitlistCount > 0 && (
                  <p className="text-xs text-amber-400">+{waitlistCount} na espera</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-slate-500">Valor</p>
                <p className="font-medium text-white">
                  {game.fee_amount_cents > 0
                    ? `R$ ${(game.fee_amount_cents / 100).toFixed(2)}`
                    : 'Gratuito'}
                </p>
                {myParticipation && (
                  <p className="text-xs text-slate-500 capitalize">
                    Status: {myParticipation.status.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>

            {game.description && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{game.description}</p>
              </div>
            )}
          </div>
        </section>

        {/* Participants Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Participantes</h3>
            <span className="text-sm text-slate-500">{participants?.length || 0} inscritos</span>
          </div>

          {!participants || participants.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
              <p className="text-slate-400">Nenhum participante ainda. Compartilhe o convite!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {participants.map((participant) => {
                const statusColors: Record<string, string> = {
                  confirmado: 'border-emerald-500/30 bg-emerald-500/5',
                  em_campo: 'border-amber-500/30 bg-amber-500/5',
                  banco: 'border-blue-500/30 bg-blue-500/5',
                  lista_espera: 'border-orange-500/30 bg-orange-500/5',
                  pendente: 'border-slate-500/30 bg-slate-500/5',
                  desistente: 'border-red-500/30 bg-red-500/5 opacity-60',
                };
                const borderColor = statusColors[participant.status] || 'border-white/10 bg-white/5';

                return (
                  <div
                    key={participant.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${borderColor}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-300">
                      {(participant.players?.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {participant.players?.display_name || 'Jogador'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {participant.players?.position && (
                          <span className="capitalize">{participant.players.position}</span>
                        )}
                        {participant.players?.overall && (
                          <span>• OVR {participant.players.overall}</span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      participant.status === 'confirmado' ? 'bg-emerald-500/20 text-emerald-400' :
                      participant.status === 'em_campo' ? 'bg-amber-500/20 text-amber-400' :
                      participant.status === 'lista_espera' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {participant.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Organizer: Participant Manager (only for admins/organizers/owners) */}
        {['owner', 'admin', 'organizer'].includes(orgMember.role) && participants && participants.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Gerenciar Participantes</h3>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Painel do Organizador
              </span>
            </div>
            <ParticipantManager gameId={gameId} participants={participants} />
          </section>
        )}

        {/* Invite Share Panel (only for organizers/admins or when game is open) */}
        {['aberta', 'confirmacoes_fechadas', 'rascunho'].includes(game.status) && (
          <section>
            <InviteSharePanel gameId={gameId} gameTitle={game.title} />
          </section>
        )}
      </div>
    </main>
  );
}

function GameDetailSkeleton() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="h-5 w-16 animate-pulse rounded bg-white/10" />
          <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
          <div className="w-16" />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<GameDetailSkeleton />}>
      <GameDetailContent gameId={id} />
    </Suspense>
  );
}