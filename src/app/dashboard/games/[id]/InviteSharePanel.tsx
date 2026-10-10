'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface InviteSharePanelProps {
  gameId: string;
  gameTitle: string;
}

export function InviteSharePanel({ gameId, gameTitle }: InviteSharePanelProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [maxUses, setMaxUses] = useState('');
  const [expiresHours, setExpiresHours] = useState('168'); // 7 days default

  async function handleGenerate() {
    setError(null);
    setInviteUrl(null);
    setCopied(false);
    setLoading(true);

    try {
      const response = await fetch(`/dashboard/games/${gameId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_uses: maxUses ? parseInt(maxUses) : undefined,
          expires_hours: parseInt(expiresHours),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao gerar convite');
      }

      const data = await response.json();
      setInviteUrl(data.invite_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError('Não foi possível copiar. Copie manualmente.');
    }
  }

  function handleWhatsApp() {
    if (!inviteUrl) return;
    const text = encodeURIComponent(
      `🏟️ *${gameTitle}*\n\nVocê foi convidado para jogar!\n\nConfirme sua presença pelo link:\n${inviteUrl}\n\n_Organizado via JogGol_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Convidar jogadores</h3>
          <p className="text-sm text-slate-400">
            Gere um link único para compartilhar via WhatsApp ou copiar.
          </p>
        </div>

        {/* Settings */}
        {!inviteUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="maxUses" className="block text-xs font-medium text-slate-400">
                Máx. de usos (opcional)
              </label>
              <input
                id="maxUses"
                type="number"
                min={1}
                max={100}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Ilimitado"
                className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="expires" className="block text-xs font-medium text-slate-400">
                Validade do link
              </label>
              <select
                id="expires"
                value={expiresHours}
                onChange={(e) => setExpiresHours(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              >
                <option value="24">24 horas</option>
                <option value="72">3 dias</option>
                <option value="168">7 dias</option>
                <option value="720">30 dias</option>
              </select>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Generated Link Display */}
        {inviteUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300 font-mono">
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleWhatsApp}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white transition-all hover:bg-[#20BD5A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Compartilhar no WhatsApp
              </button>
              <button
                onClick={() => { setInviteUrl(null); setCopied(false); }}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/50 px-5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                Gerar novo link
              </button>
            </div>

            <p className="text-xs text-slate-500">
              ⚠️ Este link é único e só será exibido agora. Copie ou compartilhe imediatamente.
            </p>
          </div>
        )}

        {/* Generate Button (only when no link yet) */}
        {!inviteUrl && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Gerando link...' : 'Gerar link de convite'}
          </button>
        )}
      </div>
    </div>
  );
}