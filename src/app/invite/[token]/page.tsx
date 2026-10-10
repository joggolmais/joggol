import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { InviteAcceptForm } from './InviteAcceptForm';

// Allow blocking render for dynamic invite validation
export const instant = false;

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

async function InviteContent({ token }: { token: string }) {
  // Use admin client to bypass RLS for public invite validation
  const supabase = createAdminClient();

  // Hash the token to look it up (tokens are stored as SHA-256 hashes)
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Fetch invitation with game details
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(`
      *,
      games!inner(
        id,
        title,
        modality,
        status,
        scheduled_start_at,
        location_name,
        fee_amount_cents,
        max_players,
        organizations(id, name)
      )
    `)
    .eq('token_hash', tokenHash)
    .eq('status', 'ativo')
    .single();

  if (error || !invitation) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Convite inválido</h1>
          <p className="text-slate-400">
            Este convite pode ter expirado, sido revogado ou já utilizado.
            Peça um novo convite ao organizador da pelada.
          </p>
        </div>
      </main>
    );
  }

  const game = invitation.games;
  const isExpired = invitation.expires_at && new Date(invitation.expires_at) < new Date();
  const isMaxedOut = invitation.max_uses !== null && invitation.uses_count >= invitation.max_uses;
  const isGameOpen = ['aberta', 'confirmacoes_fechadas'].includes(game.status);

  if (isExpired || isMaxedOut || !isGameOpen) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Convite indisponível</h1>
          <p className="text-slate-400">
            {isExpired
              ? 'Este convite expirou.'
              : isMaxedOut
                ? 'Este convite atingiu o limite de usos.'
                : 'A pelada não está mais aceitando confirmações.'}
          </p>
        </div>
      </main>
    );
  }

  const modalityLabels: Record<string, string> = {
    futsal: 'Futsal', society: 'Society', campo: 'Campo',
    futebol_7: 'Futebol 7', outro: 'Outro',
  };

  const startDate = new Date(game.scheduled_start_at);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-emerald-400">JogGol</h1>
          <p className="text-sm text-slate-400">Você foi convidado para uma pelada!</p>
        </div>

        {/* Game Info Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                {modalityLabels[game.modality] || game.modality}
              </span>
              {game.fee_amount_cents > 0 && (
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  R$ {(game.fee_amount_cents / 100).toFixed(2)}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{game.title}</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Data</dt>
                <dd className="font-medium text-white">{startDate.toLocaleDateString('pt-BR')}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Horário</dt>
                <dd className="font-medium text-white">{startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Local</dt>
                <dd className="font-medium text-white">{game.location_name || 'A definir'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Organizador</dt>
                <dd className="font-medium text-white">{game.organizations?.name || 'JogGol'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Vagas</dt>
                <dd className="font-medium text-white">Até {game.max_players} jogadores</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Accept Form */}
        <InviteAcceptForm
          gameId={game.id}
          organizationId={game.organization_id}
          invitationId={invitation.id}
        />
      </div>
    </main>
  );
}

function InviteSkeleton() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-24 animate-pulse rounded bg-white/10" />
          <div className="mx-auto h-4 w-48 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </main>
  );
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  return (
    <Suspense fallback={<InviteSkeleton />}>
      <InviteContent token={token} />
    </Suspense>
  );
}