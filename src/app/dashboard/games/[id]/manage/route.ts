import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /dashboard/games/[id]/manage — Update participant status
export async function PATCH(
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

  // Verify game exists and get organization_id
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, organization_id, status')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Pelada não encontrada' }, { status: 404 });
  }

  // Verify user is organizer/admin/owner of this organization
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', game.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!orgMember || !['owner', 'admin', 'organizer'].includes(orgMember.role)) {
    return NextResponse.json({ error: 'Sem permissão para gerenciar participantes' }, { status: 403 });
  }

  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body || !body.participant_id || !body.status) {
    return NextResponse.json({ error: 'participant_id e status são obrigatórios' }, { status: 400 });
  }

  const validStatuses = [
    'confirmado', 'lista_espera', 'em_campo', 'banco',
    'desistente', 'lesionado', 'no_show', 'pendente'
  ];

  if (!validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Status inválido. Use: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  // Update participant status
  const updateData: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };

  // Set specific timestamps based on status transition
  if (body.status === 'confirmado') {
    updateData.confirmed_at = new Date().toISOString();
  } else if (body.status === 'em_campo') {
    updateData.checked_in_at = new Date().toISOString();
  } else if (['desistente', 'lesionado', 'no_show'].includes(body.status)) {
    updateData.left_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('game_participants')
    .update(updateData)
    .eq('id', body.participant_id)
    .eq('game_id', gameId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: body.status });
}

// GET /dashboard/games/[id]/manage — Get all participants with full details for management
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Verify game exists and get organization_id
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, organization_id')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Pelada não encontrada' }, { status: 404 });
  }

  // Verify user has management permission
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', game.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!orgMember || !['owner', 'admin', 'organizer'].includes(orgMember.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // Fetch all participants with player details
  const { data: participants, error } = await supabase
    .from('game_participants')
    .select(`
      *,
      players(id, display_name, phone_e164, position, overall, avatar_url)
    `)
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participants: participants || [] });
}