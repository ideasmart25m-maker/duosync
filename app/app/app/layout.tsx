'use client';

// Shell de la app interna — Sesión 5. 4 secciones (Hoy · Gastos · Metas · Nosotros), cada una
// con 1 protagonista (SECUENCIA-MAESTRA-CONSTRUCCION §Paso 5). Bottom-nav fijo con safe-area,
// altura dinámica de viewport + flex-col (DESIGN-CORE §2: "nav al fondo, cero vacío muerto").

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Sun, Receipt, Target, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { SelectorPais } from '@/components/app/SelectorPais';

const DESTINOS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/app/hoy', label: 'Hoy', icon: Sun },
  { href: '/app/gastos', label: 'Gastos', icon: Receipt },
  { href: '/app/metas', label: 'Metas', icon: Target },
  { href: '/app/nosotros', label: 'Nosotros', icon: Heart },
];

export default function AppInternaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [preguntarPais, setPreguntarPais] = useState(false);
  const [guardandoPais, setGuardandoPais] = useState(false);

  // Se pregunta el país UNA vez, fuera del onboarding/paywall ya aprobados — apenas la pareja
  // ya tiene sesión real y todavía no eligió (couples.pais es null). No bloquea nada si falla
  // la consulta: mejor mostrar la app en pesos colombianos por defecto que romper la pantalla.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const supabase = crearClienteNavegador();
      const { data: membresia } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
      if (!membresia || cancelado) return;
      const { data: pareja } = await supabase.from('couples').select('pais').eq('id', membresia.couple_id).maybeSingle();
      if (!cancelado && pareja && pareja.pais === null) setPreguntarPais(true);
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const elegirPais = async (codigo: string) => {
    setGuardandoPais(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.rpc('actualizar_pais_pareja', { p_pais: codigo });
    setGuardandoPais(false);
    if (!error) setPreguntarPais(false);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--bg)] [font-family:var(--font-body)]">
      {/* Profundidad de fondo — antes era un fill plano de un solo tono (defecto real
          detectado por el revisor-visual: DESIGN-CORE exige 3 niveles, nunca fill plano). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(480px 320px at 15% -5%, color-mix(in oklab, var(--accent-2) 10%, transparent) 0%, transparent 60%), ' +
            'radial-gradient(420px 300px at 100% 10%, color-mix(in oklab, var(--accent) 8%, transparent) 0%, transparent 55%)',
        }}
      />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-24 pt-6">{children}</main>

      {/* Menú flotante (pedido del usuario, referencia visual) — despegado de los bordes,
          con sombra propia y el destino activo como círculo sólido, en vez de la barra
          plana de ancho completo pegada al fondo que había antes. */}
      <nav
        aria-label="Navegación principal"
        className="fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--surface)] p-2 shadow-[var(--shadow-2)]"
        style={{ bottom: 'max(16px, calc(env(safe-area-inset-bottom) + 8px))' }}
      >
        {DESTINOS.map((d) => {
          const activo = pathname === d.href;
          return (
            <Link key={d.href} href={d.href} aria-label={d.label} aria-current={activo ? 'page' : undefined} className="[touch-action:manipulation]">
              <motion.span
                whileTap={{ scale: 0.9 }}
                className={`flex size-12 items-center justify-center rounded-full transition-colors duration-150 ${
                  activo ? 'bg-[var(--accent)] shadow-[0_4px_12px_color-mix(in_oklab,var(--accent)_40%,transparent)]' : ''
                }`}
              >
                <d.icon
                  size={20}
                  strokeWidth={activo ? 2.4 : 2}
                  color={activo ? 'var(--bg)' : 'var(--text-tertiary)'}
                  aria-hidden="true"
                />
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {preguntarPais && <SelectorPais guardando={guardandoPais} onElegir={elegirPais} />}
    </div>
  );
}
