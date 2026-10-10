'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type GameModality = 'futsal' | 'society' | 'campo' | 'futebol_7' | 'outro';

interface GameFormData {
  title: string;
  modality: GameModality;
  scheduled_start_at: string;
  scheduled_end_at: string;
  location_name: string;
  location_address: string;
  max_players: number;
  min_players: number;
  team_size: number;
  has_goalkeepers: boolean;
  period_duration_min: number;
  rotation_enabled: boolean;
  fee_amount_cents: number;
  description: string;
}

const MODALITIES: { value: GameModality; label: string }[] = [
  { value: 'futsal', label: 'Futsal' },
  { value: 'society', label: 'Society' },
  { value: 'campo', label: 'Campo' },
  { value: 'futebol_7', label: 'Futebol 7' },
  { value: 'outro', label: 'Outro' },
];

const STEPS = ['Informações', 'Regras', 'Financeiro', 'Revisão'];

export default function CreateGamePage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<GameFormData>({
    title: '',
    modality: 'futsal',
    scheduled_start_at: '',
    scheduled_end_at: '',
    location_name: '',
    location_address: '',
    max_players: 14,
    min_players: 10,
    team_size: 5,
    has_goalkeepers: true,
    period_duration_min: 10,
    rotation_enabled: true,
    fee_amount_cents: 0,
    description: '',
  });

  function updateField<K extends keyof GameFormData>(key: K, value: GameFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado para criar uma pelada.');
        setLoading(false);
        return;
      }

      // Fetch user's organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!orgMember) {
        setError('Você precisa estar vinculado a uma organização. Crie uma primeiro.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('games').insert({
        organization_id: orgMember.organization_id,
        created_by: user.id,
        title: formData.title,
        modality: formData.modality,
        status: 'rascunho',
        scheduled_start_at: new Date(formData.scheduled_start_at).toISOString(),
        scheduled_end_at: formData.scheduled_end_at
          ? new Date(formData.scheduled_end_at).toISOString()
          : null,
        location_name: formData.location_name || null,
        location_address: formData.location_address || null,
        max_players: formData.max_players,
        min_players: formData.min_players,
        team_size: formData.team_size,
        has_goalkeepers: formData.has_goalkeepers,
        period_duration_min: formData.period_duration_min,
        rotation_enabled: formData.rotation_enabled,
        fee_amount_cents: formData.fee_amount_cents,
        fee_currency: 'BRL',
        description: formData.description || null,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Erro inesperado ao criar pelada. Tente novamente.');
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-2';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-emerald-400">
            JogGol
          </Link>
          <h1 className="text-lg font-semibold text-white">Criar Pelada</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i <= step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  i <= step ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          {/* Step 0: Informações Básicas */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className={labelClass}>Nome da pelada *</label>
                <input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: Pelada de Quinta"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="modality" className={labelClass}>Modalidade *</label>
                <select
                  id="modality"
                  value={formData.modality}
                  onChange={(e) => updateField('modality', e.target.value as GameModality)}
                  className={inputClass}
                >
                  {MODALITIES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="start" className={labelClass}>Data e horário de início *</label>
                  <input
                    id="start"
                    type="datetime-local"
                    required
                    value={formData.scheduled_start_at}
                    onChange={(e) => updateField('scheduled_start_at', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="end" className={labelClass}>Previsão de término</label>
                  <input
                    id="end"
                    type="datetime-local"
                    value={formData.scheduled_end_at}
                    onChange={(e) => updateField('scheduled_end_at', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location_name" className={labelClass}>Local / Arena</label>
                <input
                  id="location_name"
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => updateField('location_name', e.target.value)}
                  placeholder="Ex: Arena Esportiva Centro"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="location_address" className={labelClass}>Endereço</label>
                <input
                  id="location_address"
                  type="text"
                  value={formData.location_address}
                  onChange={(e) => updateField('location_address', e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>Descrição / Observações</label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Regras específicas, observações sobre o local, etc."
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Step 1: Regras */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="max_players" className={labelClass}>Máx. jogadores</label>
                  <input
                    id="max_players"
                    type="number"
                    min={2}
                    max={50}
                    value={formData.max_players}
                    onChange={(e) => updateField('max_players', parseInt(e.target.value) || 2)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="min_players" className={labelClass}>Mín. jogadores</label>
                  <input
                    id="min_players"
                    type="number"
                    min={2}
                    max={formData.max_players}
                    value={formData.min_players}
                    onChange={(e) => updateField('min_players', parseInt(e.target.value) || 2)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="team_size" className={labelClass}>Jogadores por time</label>
                  <input
                    id="team_size"
                    type="number"
                    min={1}
                    max={11}
                    value={formData.team_size}
                    onChange={(e) => updateField('team_size', parseInt(e.target.value) || 5)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="period_duration" className={labelClass}>Duração do período (minutos)</label>
                <input
                  id="period_duration"
                  type="number"
                  min={1}
                  max={120}
                  value={formData.period_duration_min}
                  onChange={(e) => updateField('period_duration_min', parseInt(e.target.value) || 10)}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="has_goalkeepers"
                  type="checkbox"
                  checked={formData.has_goalkeepers}
                  onChange={(e) => updateField('has_goalkeepers', e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-slate-950/50 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0"
                />
                <label htmlFor="has_goalkeepers" className="text-sm text-slate-300">
                  Times com goleiros fixos
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="rotation_enabled"
                  type="checkbox"
                  checked={formData.rotation_enabled}
                  onChange={(e) => updateField('rotation_enabled', e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-slate-950/50 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0"
                />
                <label htmlFor="rotation_enabled" className="text-sm text-slate-300">
                  Ativar rodízio automático
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Financeiro */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="fee" className={labelClass}>Valor por jogador (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                  <input
                    id="fee"
                    type="number"
                    min={0}
                    step={0.5}
                    value={(formData.fee_amount_cents / 100).toFixed(2)}
                    onChange={(e) => {
                      const reais = parseFloat(e.target.value) || 0;
                      updateField('fee_amount_cents', Math.round(reais * 100));
                    }}
                    placeholder="0,00"
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Deixe como R$ 0,00 para peladas gratuitas. O valor será exibido no convite.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Revisão */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Revisar informações</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Nome', formData.title],
                  ['Modalidade', MODALITIES.find((m) => m.value === formData.modality)?.label],
                  ['Início', formData.scheduled_start_at ? new Date(formData.scheduled_start_at).toLocaleString('pt-BR') : '—'],
                  ['Término', formData.scheduled_end_at ? new Date(formData.scheduled_end_at).toLocaleString('pt-BR') : '—'],
                  ['Local', formData.location_name || '—'],
                  ['Jogadores', `${formData.min_players}–${formData.max_players} (${formData.team_size}/time)`],
                  ['Período', `${formData.period_duration_min} min`],
                  ['Goleiros', formData.has_goalkeepers ? 'Sim' : 'Não'],
                  ['Rodízio', formData.rotation_enabled ? 'Ativado' : 'Desativado'],
                  ['Valor', formData.fee_amount_cents > 0 ? `R$ ${(formData.fee_amount_cents / 100).toFixed(2)}` : 'Gratuito'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-white/5 pb-2">
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="font-medium text-white">{value}</dd>
                  </div>
                ))}
              </dl>
              {formData.description && (
                <div className="rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-slate-300">
                  <span className="font-medium text-slate-400">Observações:</span> {formData.description}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0 || loading}
              className="rounded-lg border border-white/10 bg-slate-900/50 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!formData.title || !formData.scheduled_start_at}
                className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Criar pelada'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}