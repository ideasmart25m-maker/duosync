'use client';

// "Mi cuenta": lo que antes estaba repartido entre Nosotros e Inicio y la gente no encontraba. Aquí viven su plan,
// la invitación a la otra persona, guardar el acceso (cuentas de invitado), instalar la app, el país y la moneda, y
// cerrar sesión.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2, LogOut, ChevronRight } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { obtenerCoupleId, obtenerPaisPareja } from '@/lib/gastos';
import { paisPorCodigo } from '@/lib/paises';
import { TuPlan } from '@/components/app/TuPlan';
import { InvitarPareja } from '@/components/app/InvitarPareja';
import { GuardarAcceso } from '@/components/app/GuardarAcceso';
import { InstalarApp } from '@/components/app/InstalarApp';
import { SelectorPais } from '@/components/app/SelectorPais';
import { GuiaPagina } from '@/components/app/GuiaPagina';

export default function CuentaPage() {
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [correo, setCorreo] = useState<string | null>(null);
  const [esInvitado, setEsInvitado] = useState(false);
  const [pais, setPais] = useState<string | null>(null);
  const [cambiandoPais, setCambiandoPais] = useState(false);
  const [guardandoPais, setGuardandoPais] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelado) {
        setCorreo(user?.email ?? null);
        setEsInvitado(!!user?.is_anonymous);
      }
      const cid = await obtenerCoupleId(supabase).catch(() => null);
      if (!cid || cancelado) return;
      setCoupleId(cid);
      const p = await obtenerPaisPareja(supabase, cid).catch(() => null);
      if (!cancelado) setPais(p);
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase]);

  const cambiarPais = async (codigo: string) => {
    setGuardandoPais(true);
    const { error } = await supabase.rpc('actualizar_pais_pareja', { p_pais: codigo });
    setGuardandoPais(false);
    if (!error) {
      setPais(codigo);
      setCambiandoPais(false);
    }
  };

  const cerrarSesion = async () => {
    setSaliendo(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const datosPais = paisPorCodigo(pais);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/app/hoy" aria-label="Volver a Inicio" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] [touch-action:manipulation]">
          <ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Mi cuenta</h1>
          {correo && <p className="text-[12px] text-[var(--text-tertiary)]">{correo}</p>}
        </div>
      </div>

      <GuiaPagina
        id="acceso"
        titulo="Cómo funciona tu acceso"
        items={[
          { titulo: 'No te pedimos nada mientras no cierres sesión', texto: 'Tu sesión queda guardada en tu celular: abres Fairsy y entras directo, sin códigos ni contraseñas.' },
          { titulo: 'Entrar con Google', texto: 'Si activaste “Continuar con Google”, entras con un toque. Si usas el mismo correo con el que pagaste, tu plan se activa solo.' },
          { titulo: 'Entrar con tu correo', texto: 'Te enviamos un código de 8 números: lo escribes y entras. No hay contraseñas que recordar.' },
          { titulo: 'Instala Fairsy en tu pantalla de inicio', texto: 'Se abre con un toque y tu sesión dura más. En el celular compartido, mejor no la instales.' },
          { titulo: 'Si entraste como invitado', texto: 'Guarda tu acceso (con Google o con tu correo) antes de cerrar sesión, cambiar de celular o borrar el navegador; si no, pierdes esa cuenta.' },
          { titulo: '¿Pagaste con otro correo?', texto: 'Toca “Conectar mi compra” en “Tu plan” y te mandamos un código al correo de la compra.' },
          { titulo: 'En un celular que no es tuyo', texto: 'Cierra sesión al terminar para que nadie más vea sus gastos.' },
        ]}
      />

      {coupleId && <TuPlan supabase={supabase} coupleId={coupleId} />}

      {/* Se ocultan solas cuando no aplican: la invitación cuando ya son dos, el guardado cuando la cuenta ya tiene correo. */}
      {coupleId && <InvitarPareja supabase={supabase} coupleId={coupleId} />}
      <GuardarAcceso supabase={supabase} />

      {coupleId && (
        <button
          type="button"
          onClick={() => setCambiandoPais(true)}
          className="flex min-h-14 items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] bg-[var(--surface)] p-4 text-left [touch-action:manipulation]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)]">
            <Globe2 size={20} strokeWidth={2} color="var(--accent-2)" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-[var(--text-tertiary)]">País y moneda</span>
            <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{datosPais ? `${datosPais.nombre} · ${datosPais.moneda}` : 'Sin elegir'}</span>
          </span>
          <ChevronRight size={18} strokeWidth={2.2} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
        </button>
      )}

      <InstalarApp />

      {esInvitado && (
        <p role="note" className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--cat-amber)_14%,transparent)] p-3 text-[13px] leading-snug text-[var(--text-primary)]">
          Entraste como invitado, sin correo. Si cierras sesión ahora <span className="font-semibold">perderías esta cuenta</span>. Primero guarda tu acceso con tu correo (arriba, en “Guardar mi acceso”).
        </p>
      )}
      <button
        type="button"
        onClick={cerrarSesion}
        disabled={saliendo || esInvitado}
        className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] text-[15px] font-medium text-[var(--text-secondary)] disabled:opacity-50 [touch-action:manipulation]"
      >
        <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
        {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
      </button>
      <p className="text-center text-[12px] text-[var(--text-tertiary)]">
        ¿Necesitas ayuda? Escribe a <a href="mailto:soporte@fairsy.lat" className="underline">soporte@fairsy.lat</a>
      </p>

      {cambiandoPais && <SelectorPais guardando={guardandoPais} onElegir={cambiarPais} onCerrar={() => setCambiandoPais(false)} />}
    </div>
  );
}
