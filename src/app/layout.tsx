import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#047857',
};

export const metadata: Metadata = {
  title: 'JogGol — Organize sua pelada',
  description: 'Plataforma esportiva digital para organizar futebol amador. Complexidade no sistema, simplicidade para o usuário.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-slate-950 text-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}