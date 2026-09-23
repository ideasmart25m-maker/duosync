'use client';

// Shell de la app interna — Sesión 5. 4 secciones (Hoy · Gastos · Metas · Nosotros), cada una
// con 1 protagonista (SECUENCIA-MAESTRA-CONSTRUCCION §Paso 5). Bottom-nav fijo con safe-area,
// altura dinámica de viewport + flex-col (DESIGN-CORE §2: "nav al fondo, cero vacío muerto").

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { SelectorPais } from '@/components/app/SelectorPais';

// Set de íconos propio (pedido del usuario) en vez del set de Phosphor genérico — cada ícono
// ya trae su propio color (naranja Inicio, verde azulado Gastos/Metas/Nosotros), así que el
// estado activo/inactivo ya no se resuelve cambiando de color: el ícono siempre se ve a color
// completo, y lo que cambia es la opacidad + el fondo detrás (mismo lenguaje del resto de la
// app: pill neutro detrás del elemento en foco, nunca un color de acento distinto por pestaña).
const DESTINOS = [
  { href: '/app/hoy', label: 'Hoy', icono: '/icons/nav-inicio.png' },
  { href: '/app/gastos', label: 'Gastos', icono: '/icons/nav-gastos.png' },
  { href: '/app/metas', label: 'Metas', icono: '/icons/nav-metas.png' },
  { href: '/app/nosotros', label: 'Nosotros', icono: '/icons/nav-nosotros.png' },
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
    // overflow-x-hidden (no overflow-hidden a secas): el gradiente decorativo de fondo no debe
    // desbordar de lado, pero el contenido SÍ debe poder hacer scroll vertical cuando es más alto
    // que el viewport — con overflow-hidden en las dos direcciones, a la altura real de un celular
    // (812px) la última tarjeta se CORTABA en vez de quedar scrolleable, y esa mala cortada se
    // veía como si "atravesara" el nav flotante (causa raíz real del defecto ya reportado 2 veces
    // por el revisor-visual, no resuelta del todo con el velo de desvanecido por sí solo).
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[var(--bg)] [font-family:var(--font-body)]">
      {/* Profundidad de fondo — antes era un fill plano de un solo tono (defecto real
          detectado por el revisor-visual: DESIGN-CORE exige 3 niveles, nunca fill plano).
          2ª subida de intensidad (18/14%→28/22%): la anterior seguía "casi imperceptible" según
          el revisor. El tercer radial (tono hundido) estaba centrado al 120% — fuera del
          viewport, quedaba tapado por el velo blanco del nav antes de notarse — movido al 55%
          para que caiga dentro del área de contenido visible, no en la zona del nav. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(520px 360px at 15% -5%, color-mix(in oklab, var(--accent-2) 28%, transparent) 0%, transparent 62%), ' +
            'radial-gradient(460px 340px at 100% 8%, color-mix(in oklab, var(--accent) 22%, transparent) 0%, transparent 58%), ' +
            'radial-gradient(560px 380px at 50% 55%, var(--surface-2) 0%, transparent 65%)',
        }}
      />
      {/* Transición entre pestañas (Hoy/Gastos/Metas/Nosotros) — antes el cambio de tab era un
          corte seco sin animación, una de las 7 baseline de movimiento que faltaba (defecto real
          detectado por el revisor-visual). `key={pathname}` fuerza a Motion a tratar cada
          pestaña como una entrada/salida propia. */}
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-6"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Velo de desvanecido — el nav flotante no cubre todo el ancho (es una píldora centrada),
          así que sin esto el contenido se veía "atravesado" detrás/alrededor de él (defecto real,
          reportado 2 veces por el revisor-visual). Los primeros dos intentos usaban un porcentaje
          arbitrario del alto del velo para la parte sólida — no coincidía con el tramo real que
          ocupa el nav (16px de separación del fondo + 64px de alto de la píldora = 80px), así que
          quedaba un filo sin cubrir justo donde empieza el nav. Ahora es sólido exactamente esos
          80px y solo difumina los últimos 20px de arriba, para que el corte no se sienta abrupto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30"
        style={{ height: '100px', background: 'linear-gradient(to top, var(--bg) 0%, var(--bg) 80%, transparent 100%)' }}
      />

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
                  activo ? 'bg-[var(--surface-2)] shadow-[var(--shadow-1)]' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- set de íconos propio, archivo estático fijo */}
                <img
                  src={d.icono}
                  alt=""
                  className={`size-6 object-contain transition-opacity duration-150 ${activo ? 'opacity-100' : 'opacity-45'}`}
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
