import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { NavAdmin } from '@/components/admin/NavAdmin';
import { TransicionContenido } from '@/components/admin/TransicionContenido';

// Server Component — `requireAdmin()` corta con 404 real si quien pide la página no es la
// cuenta admin (segunda capa, la primera es el middleware en proxy.ts). Todo lo que cuelga de
// este layout puede asumir con seguridad que quien lo ve es el dueño de la app.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--bg)] [font-family:var(--font-body)]">
      {/* Profundidad de fondo — antes era un fill plano de un solo tono (defecto real
          detectado por el revisor-visual: solo 2 niveles, sin ningún matiz). Mismo lenguaje
          decorativo ya aprobado en la app interna (app/app/app/layout.tsx). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(560px 360px at 10% -10%, color-mix(in oklab, var(--accent-2) 10%, transparent) 0%, transparent 60%), ' +
            'radial-gradient(480px 320px at 100% 0%, color-mix(in oklab, var(--accent) 8%, transparent) 0%, transparent 55%)',
        }}
      />
      <header className="border-b border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Panel privado</p>
              <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Fairsy — Administración</h1>
            </div>
            <Link
              href="/app/hoy"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] [touch-action:manipulation]"
            >
              <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
              Volver a la app
            </Link>
          </div>
          <NavAdmin />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <TransicionContenido>{children}</TransicionContenido>
      </main>
    </div>
  );
}
