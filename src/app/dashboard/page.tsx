import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './LogoutButton';

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

        {/* Empty State - Liquid Glass Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625W12 3 9.497 5.625v6.375M12 12v3.75" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Nenhuma pelada ainda</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Você ainda não está inscrito em nenhuma pelada. Crie sua primeira ou entre por convite.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                href="/dashboard/games/create"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Criar pelada
              </Link>
              <Link
                href="/invite"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-slate-900/50 px-6 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                Entrar por convite
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Placeholder */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Partidas jogadas', value: '0' },
            { label: 'Gols marcados', value: '0' },
            { label: 'Vitórias', value: '0' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
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
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
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