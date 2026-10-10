import Link from 'next/link';
import { CurrentYear } from '@/components/CurrentYear';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-emerald-400 sm:text-6xl">
            JogGol
          </h1>
          <p className="text-xl text-slate-300 sm:text-2xl">
            Complexidade no sistema. Simplicidade para o usuário.
          </p>
          <p className="text-base text-slate-400 max-w-lg mx-auto">
            A plataforma definitiva para organizar futebol amador.
            Convites, confirmações, times equilibrados, pagamentos e rankings em um só lugar.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/auth/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 w-full sm:w-auto"
          >
            Criar minha primeira pelada
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900/50 px-8 text-base font-semibold text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950 w-full sm:w-auto"
          >
            Entrar
          </Link>
        </div>

        {/* Features Grid - Liquid Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left">
          {[
            { title: 'Organize', desc: 'Crie peladas e convide via WhatsApp em segundos.' },
            { title: 'Equilibre', desc: 'Times automáticos baseados em nível e posição.' },
            { title: 'Gerencie', desc: 'Pagamentos, presença e súmula sem planilhas.' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-white/10"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20" />
              <h3 className="relative text-lg font-semibold text-white">{feature.title}</h3>
              <p className="relative mt-2 text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-8 text-center text-xs text-slate-500">
        <p>© <CurrentYear /> JogGol. Todos os direitos reservados.</p>
        <div className="mt-2 space-x-4">
          <Link href="/terms" className="hover:text-slate-300">Termos</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacidade</Link>
        </div>
      </footer>
    </main>
  );
}