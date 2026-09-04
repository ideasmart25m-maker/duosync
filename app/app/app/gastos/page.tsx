'use client';

// Pantalla GASTOS — protagonista: la lista de movimientos del hogar, con filtros por categoría
// y navegación real entre meses (DESIGN-CORE regla 13: fechas reales + navegación, nunca solo
// "Este mes"). El registro de un gasto nuevo vive en el contexto visual de la lista (regla 12).
// Conectada a datos reales de Supabase (Sesión 6, auditoría legal) — antes usaba una lista de
// ejemplo fija en el código que se perdía al recargar la página.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Inbox, Loader2, Camera, Sparkles, Bot, Check, Scale, Minus } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import {
  obtenerCoupleId,
  obtenerPaisPareja,
  listarCategorias,
  listarGastosDelMes,
  crearGasto,
  crearCategoria,
  iniciarEscaneoRecibo,
  consultarEscaneoRecibo,
  obtenerSaldoPareja,
  liquidarSaldo,
  type GastoDB,
} from '@/lib/gastos';
import { comprimirImagen } from '@/lib/imagen';
import { iconoDeCategoria, colorDeCategoria, type CategoriaDB } from '@/lib/categorias';
import { formatoMoneda } from '@/lib/paises';
import { AsistenteChat } from '@/components/app/AsistenteChat';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatoFecha(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]}`;
}

function FormularioGasto({
  categorias,
  guardando,
  inicial,
  creandoCategoria,
  onGuardar,
  onCerrar,
  onCrearCategoria,
}: {
  categorias: CategoriaDB[];
  guardando: boolean;
  inicial?: { categoriaId: string | null; monto: number };
  creandoCategoria: boolean;
  onGuardar: (g: { categoriaId: string; monto: number; nota?: string; splitPercent?: number }) => void;
  onCerrar: () => void;
  onCrearCategoria: (nombre: string) => void;
}) {
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId ?? categorias[0]?.id ?? '');
  const [monto, setMonto] = useState(inicial?.monto ? String(inicial.monto) : '');
  const [nota, setNota] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState<string | null>(null);
  const categoriaActual = categorias.find((c) => c.id === categoriaId);
  const [reparto, setReparto] = useState(categoriaActual?.splitPercent ?? 50);
  const [ajustandoReparto, setAjustandoReparto] = useState(false);

  // Si cambian de categoría, el % vuelve al de la categoría nueva (a menos que ya lo hayan
  // tocado a mano en este mismo formulario — evita pisar un ajuste puntual sin querer).
  const [repartoTocado, setRepartoTocado] = useState(false);
  const cambiarCategoria = (id: string) => {
    setCategoriaId(id);
    if (!repartoTocado) {
      const cat = categorias.find((c) => c.id === id);
      setReparto(cat?.splitPercent ?? 50);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        const valor = Number(monto);
        if (!valor || valor <= 0 || !categoriaId || guardando) return;
        onGuardar({ categoriaId, monto: valor, nota: nota.trim() || undefined, splitPercent: reparto });
      }}
    >
      <div className="mb-4 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-4">
        {inicial && (
          <p className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
            <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" />
            Leído del recibo — revisen y corrijan si hace falta
          </p>
        )}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {categorias.map((c) => {
            const Icono = iconoDeCategoria(c.icono);
            const color = colorDeCategoria(c.color);
            const seleccionada = categoriaId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => cambiarCategoria(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] border-2 p-3 text-center [touch-action:manipulation] ${
                  seleccionada ? '' : 'border-transparent'
                }`}
                style={seleccionada ? { borderColor: color, backgroundColor: `color-mix(in oklab, ${color} 10%, transparent)` } : undefined}
              >
                <span className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                  <Icono size={22} strokeWidth={2.2} color="var(--bg)" aria-hidden="true" />
                </span>
                <span className="text-[12px] font-medium leading-tight text-[var(--text-primary)]">{c.nombre}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setNuevaCategoria('')}
            className="flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] p-3 text-center [touch-action:manipulation]"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)]">
              <Plus size={22} strokeWidth={2.2} color="var(--text-secondary)" aria-hidden="true" />
            </span>
            <span className="text-[12px] font-medium leading-tight text-[var(--text-secondary)]">Otra</span>
          </button>
        </div>

        {nuevaCategoria !== null && (
          <div className="mb-4 flex items-center gap-2">
            <input
              autoFocus
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              placeholder="Nombre de la categoría"
              maxLength={40}
              className="h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={!nuevaCategoria.trim() || creandoCategoria}
              onClick={() => {
                onCrearCategoria(nuevaCategoria.trim());
                setNuevaCategoria(null);
              }}
              aria-label="Agregar categoría"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
            >
              {creandoCategoria ? <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" /> : <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
            </button>
          </div>
        )}

        <input
          autoFocus
          inputMode="numeric"
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => {
            // "Enter"/"Listo" del teclado numérico no debe enviar el formulario solo — si el
            // usuario todavía no tocó una categoría, guardaría con la primera por defecto sin
            // querer (defecto real detectado: 4 gastos seguidos cayeron en "Arriendo").
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder="Monto"
          className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[16px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota (opcional)"
          className="mt-2 h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        {!ajustandoReparto ? (
          <button
            type="button"
            onClick={() => setAjustandoReparto(true)}
            className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] [touch-action:manipulation]"
          >
            <Scale size={13} strokeWidth={2.2} aria-hidden="true" />
            Reparto: {reparto}% tú · {100 - reparto}% tu pareja — ajustar
          </button>
        ) : (
          <div className="mt-3 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
            <p className="text-[12px] text-[var(--text-secondary)]">
              Tú: <span className="font-semibold text-[var(--text-primary)]">{reparto}%</span> · Tu pareja:{' '}
              <span className="font-semibold text-[var(--text-primary)]">{100 - reparto}%</span>
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={reparto <= 0}
                onClick={() => {
                  setReparto((r) => Math.max(0, r - 10));
                  setRepartoTocado(true);
                }}
                aria-label="Menos para mí"
                className="flex size-9 items-center justify-center rounded-full bg-[var(--surface)] disabled:opacity-40 [touch-action:manipulation]"
              >
                <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${reparto}%` }} />
              </div>
              <button
                type="button"
                disabled={reparto >= 100}
                onClick={() => {
                  setReparto((r) => Math.min(100, r + 10));
                  setRepartoTocado(true);
                }}
                aria-label="Más para mí"
                className="flex size-9 items-center justify-center rounded-full bg-[var(--surface)] disabled:opacity-40 [touch-action:manipulation]"
              >
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[14px] font-medium text-[var(--text-tertiary)] [touch-action:manipulation] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!monto || !categoriaId || guardando}
            className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
          >
            {guardando && <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
            {guardando ? 'Guardando…' : 'Guardar gasto'}
          </button>
        </div>
      </div>
    </motion.form>
  );
}

function GastosInner() {
  const params = useSearchParams();
  const supabase = useMemo(() => crearClienteNavegador(), []);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [pais, setPais] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<CategoriaDB[]>([]);
  const [gastos, setGastos] = useState<GastoDB[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [liquidando, setLiquidando] = useState(false);

  const [asistenteAbierto, setAsistenteAbierto] = useState(false);

  const [mesOffset, setMesOffset] = useState(0);
  const [filtro, setFiltro] = useState<string | 'todas'>('todas');
  const [formularioAbierto, setFormularioAbierto] = useState(params.get('nuevo') === '1');

  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [escaneoError, setEscaneoError] = useState<string | null>(null);
  const [datosDelEscaneo, setDatosDelEscaneo] = useState<{ categoriaId: string | null; monto: number } | null>(null);
  const [receiptScanId, setReceiptScanId] = useState<string | null>(null);

  const fechaBase = new Date();
  fechaBase.setDate(1);
  fechaBase.setMonth(fechaBase.getMonth() + mesOffset);
  const mesLabel = `${MESES[fechaBase.getMonth()][0].toUpperCase()}${MESES[fechaBase.getMonth()].slice(1)} ${fechaBase.getFullYear()}`;
  const prefijoMes = `${fechaBase.getFullYear()}-${String(fechaBase.getMonth() + 1).padStart(2, '0')}`;

  const cargarGastos = useCallback(
    async (cid: string, prefijo: string) => {
      const filas = await listarGastosDelMes(supabase, cid, prefijo);
      setGastos(filas);
    },
    [supabase]
  );

  // Carga inicial: sesión → pareja → categorías + gastos del mes visible.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Sin sesión activa');
        if (cancelado) return;
        setUserId(user.id);

        const cid = await obtenerCoupleId(supabase);
        if (!cid) throw new Error('Todavía no tienen una pareja vinculada.');
        if (cancelado) return;
        setCoupleId(cid);

        const [cats, paisPareja, saldoActual] = await Promise.all([
          listarCategorias(supabase, cid),
          obtenerPaisPareja(supabase, cid),
          obtenerSaldoPareja(supabase, cid, user.id),
          cargarGastos(cid, prefijoMes),
        ]);
        if (cancelado) return;
        setCategorias(cats);
        setPais(paisPareja);
        setSaldo(saldoActual);
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No pudimos cargar sus gastos.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  // Recarga los gastos cuando cambia el mes visible (no en el primer render, ya cubierto arriba).
  const [primerRender, setPrimerRender] = useState(true);
  useEffect(() => {
    if (primerRender) {
      setPrimerRender(false);
      return;
    }
    if (!coupleId) return;
    cargarGastos(coupleId, prefijoMes).catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar sus gastos.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefijoMes deriva de mesOffset
  }, [mesOffset]);

  const gastosDelMes = useMemo(
    () => gastos.filter((g) => filtro === 'todas' || g.categoriaId === filtro).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [gastos, filtro]
  );
  const totalMes = gastosDelMes.reduce((a, g) => a + g.monto, 0);

  const categoriaPorId = useCallback((id: string) => categorias.find((c) => c.id === id), [categorias]);

  const guardarGasto = async (g: { categoriaId: string; monto: number; nota?: string; splitPercent?: number }) => {
    if (!coupleId || !userId) return;
    setGuardando(true);
    try {
      const nuevo = await crearGasto(supabase, coupleId, { ...g, receiptScanId: receiptScanId ?? undefined });
      setGastos((prev) => [nuevo, ...prev]);
      setFormularioAbierto(false);
      setDatosDelEscaneo(null);
      setReceiptScanId(null);
      obtenerSaldoPareja(supabase, coupleId, userId).then(setSaldo).catch(() => {});
    } catch {
      setError('No pudimos guardar el gasto. Intenten de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  const liquidar = async () => {
    if (!coupleId || !userId) return;
    setLiquidando(true);
    try {
      await liquidarSaldo(supabase);
      const nuevoSaldo = await obtenerSaldoPareja(supabase, coupleId, userId);
      setSaldo(nuevoSaldo);
    } catch {
      setError('No pudimos liquidar el saldo. Intenten de nuevo en un momento.');
    } finally {
      setLiquidando(false);
    }
  };

  const crearCategoriaPropia = async (nombre: string) => {
    if (!coupleId || !nombre) return;
    setCreandoCategoria(true);
    try {
      const nueva = await crearCategoria(supabase, coupleId, nombre, categorias);
      setCategorias((prev) => [...prev, nueva]);
    } catch {
      setError('No pudimos crear la categoría. Intenten de nuevo en un momento.');
    } finally {
      setCreandoCategoria(false);
    }
  };

  // Comprime la foto, la sube, avisa al servidor que la lea, y sondea el resultado cada 1.5s
  // (hasta 20s) — la IA es un servicio externo lento y falible (30-INTEGRACION-IA.md): nunca se
  // bloquea la pantalla esperando, y si tarda demasiado se le avisa al usuario en vez de colgarse.
  const manejarFotoSeleccionada = async (archivo: File) => {
    if (!coupleId) return;
    setEscaneando(true);
    setEscaneoError(null);
    try {
      const foto = await comprimirImagen(archivo);
      const scanId = await iniciarEscaneoRecibo(supabase, coupleId, foto);

      const esperaMs = 1500;
      const maxIntentos = 14; // ~20s
      for (let intento = 0; intento < maxIntentos; intento++) {
        await new Promise((r) => setTimeout(r, esperaMs));
        const scan = await consultarEscaneoRecibo(supabase, scanId);
        if (scan.estado === 'listo') {
          setReceiptScanId(scanId);
          setDatosDelEscaneo({ categoriaId: scan.categoriaSugeridaId, monto: scan.montoDetectado ?? 0 });
          setFormularioAbierto(true);
          setEscaneando(false);
          return;
        }
        if (scan.estado === 'error') {
          setEscaneoError(scan.errorMensaje ?? 'No pudimos leer el recibo. Regístrenlo a mano.');
          setEscaneando(false);
          return;
        }
      }
      setEscaneoError('Está tardando más de lo normal — inténtenlo de nuevo o regístrenlo a mano.');
    } catch {
      setEscaneoError('No pudimos leer el recibo. Regístrenlo a mano.');
    } finally {
      setEscaneando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Gastos</h1>
        <div className="h-11 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-16 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      </div>
    );
  }

  if (error && !coupleId) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--danger)_35%,transparent)] py-10 text-center">
        <p className="text-[14px] text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Gastos</h1>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesOffset((m) => m - 1)}
          aria-label="Mes anterior"
          className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] [touch-action:manipulation]"
        >
          <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="text-[15px] font-semibold text-[var(--text-primary)]">{mesLabel}</span>
        <button
          type="button"
          onClick={() => setMesOffset((m) => Math.min(m + 1, 0))}
          disabled={mesOffset === 0}
          aria-label="Mes siguiente"
          className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] disabled:opacity-30 [touch-action:manipulation]"
        >
          <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFiltro('todas')}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
            filtro === 'todas'
              ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
              : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
          }`}
        >
          Todas
        </button>
        {categorias.map((c) => {
          const Icono = iconoDeCategoria(c.icono);
          const color = colorDeCategoria(c.color);
          const activo = filtro === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltro(c.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation]"
              style={
                activo
                  ? { borderColor: color, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`, color }
                  : { borderColor: 'color-mix(in oklab, var(--text-tertiary) 25%, transparent)', color: 'var(--text-secondary)' }
              }
            >
              <Icono size={13} strokeWidth={2.2} aria-hidden="true" color={activo ? color : 'var(--text-tertiary)'} />
              {c.nombre}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--surface-2)] px-4 py-3">
        <span className="text-[13px] text-[var(--text-secondary)]">Total del mes</span>
        <span className="text-[18px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
          {formatoMoneda(totalMes, pais)}
        </span>
      </div>

      {saldo !== null && (
        <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
            <Scale size={13} strokeWidth={2.2} aria-hidden="true" />
            Cuentas entre ustedes
          </p>
          {Math.round(Math.abs(saldo)) === 0 ? (
            <p className="mt-1.5 text-[15px] font-medium text-[var(--text-primary)]">Están al día — nadie le debe nada al otro.</p>
          ) : (
            <>
              <p className="mt-1.5 text-[18px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                {formatoMoneda(Math.abs(saldo), pais)}
              </p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {saldo > 0 ? 'Tu pareja te debe esto' : 'Le debes esto a tu pareja'}
              </p>
              <button
                type="button"
                onClick={liquidar}
                disabled={liquidando}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-primary)] disabled:opacity-50 [touch-action:manipulation]"
              >
                {liquidando && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
                {liquidando ? 'Liquidando…' : 'Ya nos pusimos al día'}
              </button>
            </>
          )}
        </div>
      )}

      {error && coupleId && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
      {escaneoError && <p className="text-[12px] font-medium text-[var(--danger)]">{escaneoError}</p>}

      <AnimatePresence initial={false}>
        {formularioAbierto && (
          <FormularioGasto
            categorias={categorias}
            guardando={guardando}
            inicial={datosDelEscaneo ?? undefined}
            creandoCategoria={creandoCategoria}
            onGuardar={guardarGasto}
            onCrearCategoria={crearCategoriaPropia}
            onCerrar={() => {
              setFormularioAbierto(false);
              setDatosDelEscaneo(null);
              setReceiptScanId(null);
            }}
          />
        )}
      </AnimatePresence>

      {!formularioAbierto && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormularioAbierto(true)}
            disabled={categorias.length === 0}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent)_40%,transparent)] text-[14px] font-semibold text-[var(--accent)] disabled:opacity-50 [touch-action:manipulation]"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
            Nuevo gasto
          </button>
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            disabled={categorias.length === 0 || escaneando}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 text-[14px] font-semibold text-[var(--text-secondary)] disabled:opacity-50 [touch-action:manipulation]"
          >
            {escaneando ? (
              <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />
            ) : (
              <Camera size={16} strokeWidth={2.4} aria-hidden="true" />
            )}
            {escaneando ? 'Leyendo…' : 'Escanear recibo'}
          </button>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = '';
              if (archivo) manejarFotoSeleccionada(archivo);
            }}
          />
        </div>
      )}

      {gastosDelMes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-10 text-center">
          <Inbox size={28} strokeWidth={1.6} color="var(--text-tertiary)" aria-hidden="true" />
          <p className="text-[14px] text-[var(--text-tertiary)]">
            {filtro === 'todas' ? 'Sin gastos registrados este mes.' : 'Sin gastos en esta categoría.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {gastosDelMes.map((g) => {
            const cat = categoriaPorId(g.categoriaId);
            const Icono = cat ? iconoDeCategoria(cat.icono) : iconoDeCategoria('circle');
            return (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] p-3"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-button)]"
                  style={{ backgroundColor: cat ? colorDeCategoria(cat.color) : 'var(--cat-gray)' }}
                >
                  <Icono size={16} strokeWidth={2.2} color="var(--bg)" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">
                    {g.nota || cat?.nombre || 'Gasto'}
                  </span>
                  <span className="block text-[12px] text-[var(--text-tertiary)]">
                    {formatoFecha(g.fecha)} · {g.registradoPor === userId ? 'Tú' : 'Tu pareja'}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-[14px] font-semibold text-[var(--text-primary)]">
                  {formatoMoneda(g.monto, pais)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setAsistenteAbierto(true)}
        aria-label="Preguntar al asistente"
        className="fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-[var(--accent-2)] text-[var(--bg)] shadow-[var(--shadow-2)] [touch-action:manipulation]"
        style={{ bottom: 'max(84px, calc(env(safe-area-inset-bottom) + 76px))' }}
      >
        <Bot size={22} strokeWidth={2.2} aria-hidden="true" />
      </motion.button>

      {asistenteAbierto && <AsistenteChat onCerrar={() => setAsistenteAbierto(false)} />}
    </div>
  );
}

export default function GastosPage() {
  return (
    <Suspense fallback={null}>
      <GastosInner />
    </Suspense>
  );
}
