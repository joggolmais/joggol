import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /dashboard/games/[id]/invite — Generate a new invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Verify game exists and user has access
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, organization_id, title, status')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Pelada não encontrada' }, { status: 404 });
  }

  // Verify user is member of this organization
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', game.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!orgMember) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // Parse request body for optional settings
  const body = await request.json().catch(() => ({}));
  const maxUses = body.max_uses ? Math.min(Math.max(parseInt(body.max_uses), 1), 100) : null;
  const expiresHours = body.expires_hours ? Math.min(Math.max(parseInt(body.expires_hours), 1), 720) : 168; // Default 7 days

  // Generate secure random token
  const rawToken = crypto.randomUUID() + '-' + crypto.randomUUID();

  // Hash token with SHA-256 for storage
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Calculate expiration
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();

  // Insert invitation
  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      organization_id: game.organization_id,
      game_id: gameId,
      token_hash: tokenHash,
      status: 'ativo',
      max_uses: maxUses,
      uses_count: 0,
      expires_at: expiresAt,
      created_by: user.id,
      metadata: { game_title: game.title },
    })
    .select('id, expires_at, max_uses')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Build invite URL (raw token is returned only once)
  const origin = request.nextUrl.origin;
  const inviteUrl = `${origin}/invite/${rawToken}`;

  return NextResponse.json({
    invite_url: inviteUrl,
    invitation_id: invitation.id,
    expires_at: invitation.expires_at,
    max_uses: invitation.max_uses,
  });
}