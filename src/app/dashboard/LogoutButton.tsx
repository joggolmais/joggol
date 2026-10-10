'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    >
      Sair
    </button>
  );
}