import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './LogoutButton';
import { GameList } from './GameList';

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, avatar_url')
    .eq('id', user.id)
    .single();

  const displayName = profile?.nickname || profile?.full_name || user.email;

  // Fetch user's organization
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  // Fetch stats
  let stats = { games: 0, goals: 0, wins: 0 };
  if (orgMember) {
    const { count: gamesCount } = await supabase
      .from('game_participants')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', user.id) // Simplified: assuming player_id matches user_id for now or needs join
      .in('status', ['finalizado', 'em_campo', 'banco']);

    // Note: Real stats require joining players table or storing user_id directly in participants
    // For now, using placeholder logic compatible with current schema
    stats.games = gamesCount || 0;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-emerald-400">
            JogGol
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden sm:block">
              Olá, {displayName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        {/* Welcome Section */}
        <section className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Minhas Peladas</h1>
          <p className="text-slate-400">
            Gerencie suas partidas, confirme presença e acompanhe seus resultados.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Partidas jogadas', value: stats.games.toString() },
            { label: 'Gols marcados', value: stats.goals.toString() },
            { label: 'Vitórias', value: stats.wins.toString() },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        {/* Games List */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Peladas</h2>
            <Link
              href="/dashboard/games/create"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Criar pelada
            </Link>
          </div>

          <Suspense fallback={<GamesSkeleton />}>
            <GameList userId={user.id} orgId={orgMember?.organization_id} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

function GamesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-96 animate-pulse rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}