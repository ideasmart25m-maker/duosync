'use client';

// Pantalla GASTOS — protagonista: la lista de movimientos del hogar, con filtros por categoría
// y navegación real entre meses (DESIGN-CORE regla 13: fechas reales + navegación, nunca solo
// "Este mes"). El registro de un gasto nuevo vive en el contexto visual de la lista (regla 12).
// Conectada a datos reales de Supabase (Sesión 6, auditoría legal) — antes usaba una lista de
// ejemplo fija en el código que se perdía al recargar la página.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Inbox, Loader2, Camera, Sparkles, Bot, Check, Scale, Minus, Tag, Pencil, Trash2 } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import {
  obtenerCoupleId,
  obtenerPaisPareja,
  listarCategorias,
  listarGastosDelMes,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  crearCategoria,
  iniciarEscaneoRecibo,
  consultarEscaneoRecibo,
  obtenerSaldoPareja,
  liquidarSaldo,
  type GastoDB,
  type SaldoPorMoneda,
} from '@/lib/gastos';
import { comprimirImagen } from '@/lib/imagen';
import { iconoDeCategoria, colorDeCategoria, type CategoriaDB } from '@/lib/categorias';
import { formatoMoneda } from '@/lib/paises';
import { MONEDAS_VIAJE, formatoMonedaViaje, nombreMoneda } from '@/lib/monedas';
import { AsistenteChat } from '@/components/app/AsistenteChat';
import { EditorCategorias } from '@/components/app/EditorCategorias';

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
  esEdicion,
  creandoCategoria,
  onGuardar,
  onCerrar,
  onCrearCategoria,
}: {
  categorias: CategoriaDB[];
  guardando: boolean;
  inicial?: { categoriaId: string | null; monto: number; nota?: string | null; splitPercent?: number | null; moneda?: string | null };
  esEdicion?: boolean;
  creandoCategoria: boolean;
  onGuardar: (g: { categoriaId: string; monto: number; nota?: string; splitPercent?: number; moneda?: string | null }) => void;
  onCerrar: () => void;
  onCrearCategoria: (nombre: string) => void;
}) {
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId ?? categorias[0]?.id ?? '');
  const [monto, setMonto] = useState(inicial?.monto ? String(inicial.monto) : '');
  const [nota, setNota] = useState(inicial?.nota ?? '');
  const [moneda, setMoneda] = useState<string | null>(inicial?.moneda ?? null);
  const [nuevaCategoria, setNuevaCategoria] = useState<string | null>(null);
  const categoriaActual = categorias.find((c) => c.id === categoriaId);
  const [reparto, setReparto] = useState(inicial?.splitPercent ?? categoriaActual?.splitPercent ?? 50);
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
        onGuardar({ categoriaId, monto: valor, nota: nota.trim() || undefined, splitPercent: reparto, moneda });
      }}
    >
      <div className="mb-4 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-4">
        {inicial && !esEdicion && (
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
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMoneda(null)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
              moneda === null
                ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
                : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
            }`}
          >
            Moneda de casa
          </button>
          {MONEDAS_VIAJE.map((m) => (
            <button
              key={m.codigo}
              type="button"
              onClick={() => setMoneda(m.codigo)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
                moneda === m.codigo
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
                  : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
              }`}
            >
              {m.nombre}
            </button>
          ))}
        </div>
        {moneda !== null && (
          <p className="mt-1.5 text-[12px] text-[var(--text-secondary)]">
            Gasto de viaje — se guarda en {nombreMoneda(moneda)}, sin convertir, y se reparte aparte de las cuentas de la casa.
          </p>
        )}
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
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar gasto'}
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
  const [saldos, setSaldos] = useState<SaldoPorMoneda[] | null>(null);
  const [saldoCargado, setSaldoCargado] = useState(false);
  const [liquidandoMoneda, setLiquidandoMoneda] = useState<string | null | undefined>(undefined);

  const [gastoEditando, setGastoEditando] = useState<GastoDB | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [editandoCategorias, setEditandoCategorias] = useState(false);

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
        setSaldos(saldoActual);
        setSaldoCargado(true);
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
  // Solo suma los gastos en la moneda de la casa — mezclar pesos con dólares/euros en un solo
  // total no tendría sentido (son unidades distintas). Los de viaje se ven aparte en su fila.
  const totalMes = gastosDelMes.filter((g) => !g.moneda).reduce((a, g) => a + g.monto, 0);
  const totalesViajePorMoneda = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of gastosDelMes) {
      if (g.moneda) mapa.set(g.moneda, (mapa.get(g.moneda) ?? 0) + g.monto);
    }
    return Array.from(mapa.entries());
  }, [gastosDelMes]);

  const categoriaPorId = useCallback((id: string) => categorias.find((c) => c.id === id), [categorias]);

  const guardarGasto = async (g: { categoriaId: string; monto: number; nota?: string; splitPercent?: number; moneda?: string | null }) => {
    if (!coupleId || !userId) return;
    setGuardando(true);
    try {
      const nuevo = await crearGasto(supabase, coupleId, { ...g, receiptScanId: receiptScanId ?? undefined });
      setGastos((prev) => [nuevo, ...prev]);
      setFormularioAbierto(false);
      setDatosDelEscaneo(null);
      setReceiptScanId(null);
      obtenerSaldoPareja(supabase, coupleId, userId).then(setSaldos).catch(() => {});
    } catch {
      setError('No pudimos guardar el gasto. Intenten de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  const liquidar = async (moneda: string | null) => {
    if (!coupleId || !userId) return;
    setLiquidandoMoneda(moneda);
    try {
      await liquidarSaldo(supabase, moneda);
      const nuevosSaldos = await obtenerSaldoPareja(supabase, coupleId, userId);
      setSaldos(nuevosSaldos);
    } catch {
      setError('No pudimos liquidar el saldo. Intenten de nuevo en un momento.');
    } finally {
      setLiquidandoMoneda(undefined);
    }
  };

  const empezarEdicion = (g: GastoDB) => {
    setFormularioAbierto(false);
    setDatosDelEscaneo(null);
    setReceiptScanId(null);
    setConfirmandoEliminar(null);
    setGastoEditando(g);
  };

  const guardarEdicion = async (g: { categoriaId: string; monto: number; nota?: string; splitPercent?: number; moneda?: string | null }) => {
    if (!gastoEditando || !coupleId || !userId) return;
    setGuardando(true);
    try {
      const actualizado = await actualizarGasto(supabase, gastoEditando.id, {
        categoriaId: g.categoriaId,
        monto: g.monto,
        nota: g.nota ?? null,
        splitPercent: g.splitPercent ?? null,
        moneda: g.moneda ?? null,
      });
      setGastos((prev) => prev.map((x) => (x.id === actualizado.id ? actualizado : x)));
      setGastoEditando(null);
      obtenerSaldoPareja(supabase, coupleId, userId).then(setSaldos).catch(() => {});
    } catch {
      setError('No pudimos guardar los cambios. Intenten de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (gastoId: string) => {
    if (!coupleId || !userId) return;
    setEliminando(gastoId);
    try {
      await eliminarGasto(supabase, gastoId);
      setGastos((prev) => prev.filter((x) => x.id !== gastoId));
      setConfirmandoEliminar(null);
      obtenerSaldoPareja(supabase, coupleId, userId).then(setSaldos).catch(() => {});
    } catch {
      setError('No pudimos eliminar el gasto. Intenten de nuevo en un momento.');
    } finally {
      setEliminando(null);
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

      <button
        type="button"
        onClick={() => setEditandoCategorias(true)}
        disabled={categorias.length === 0}
        className="flex items-center gap-1.5 self-end text-[12px] font-medium text-[var(--text-secondary)] disabled:opacity-50 [touch-action:manipulation]"
      >
        <Tag size={13} strokeWidth={2.2} aria-hidden="true" />
        Editar reparto y recurrencia
      </button>

      <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[var(--text-secondary)]">Total del mes</span>
          <span className="text-[18px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
            {formatoMoneda(totalMes, pais)}
          </span>
        </div>
        {totalesViajePorMoneda.map(([codigo, total]) => (
          <div key={codigo} className="mt-1.5 flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] pt-1.5">
            <span className="text-[12px] text-[var(--text-tertiary)]">Viaje en {nombreMoneda(codigo)}</span>
            <span className="text-[14px] font-semibold tabular-nums text-[var(--text-secondary)]">{formatoMonedaViaje(total, codigo)}</span>
          </div>
        ))}
      </div>

      {saldoCargado && (
        <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
            <Scale size={13} strokeWidth={2.2} aria-hidden="true" />
            Cuentas entre ustedes
          </p>
          {saldos === null ? (
            <p className="mt-1.5 text-[15px] font-medium text-[var(--text-primary)]">
              Cuando tu pareja se una con el código de invitación, aquí van a ver cuánto le corresponde a cada uno.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              {saldos.map((s) => {
                const formatear = (n: number) => (s.moneda ? formatoMonedaViaje(n, s.moneda) : formatoMoneda(n, pais));
                const etiqueta = s.moneda ? `Viaje en ${nombreMoneda(s.moneda)}` : 'Cuentas de la casa';
                const alDia = Math.round(Math.abs(s.saldo)) === 0;
                return (
                  <div key={s.moneda ?? 'casa'} className={s.moneda ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] pt-3' : ''}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{etiqueta}</p>
                    {alDia ? (
                      <p className="mt-1 text-[15px] font-medium text-[var(--text-primary)]">Están al día — nadie le debe nada al otro.</p>
                    ) : (
                      <>
                        <p className="mt-1 text-[18px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                          {formatear(Math.abs(s.saldo))}
                        </p>
                        <p className="text-[13px] text-[var(--text-secondary)]">
                          {s.saldo > 0 ? 'Tu pareja te debe esto' : 'Le debes esto a tu pareja'}
                        </p>
                        <button
                          type="button"
                          onClick={() => liquidar(s.moneda)}
                          disabled={liquidandoMoneda !== undefined}
                          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-primary)] disabled:opacity-50 [touch-action:manipulation]"
                        >
                          {liquidandoMoneda === s.moneda && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
                          {liquidandoMoneda === s.moneda ? 'Liquidando…' : 'Ya nos pusimos al día'}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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

      <AnimatePresence initial={false}>
        {gastoEditando && (
          <FormularioGasto
            categorias={categorias}
            guardando={guardando}
            esEdicion
            inicial={{
              categoriaId: gastoEditando.categoriaId,
              monto: gastoEditando.monto,
              nota: gastoEditando.nota,
              splitPercent: gastoEditando.splitPercent,
              moneda: gastoEditando.moneda,
            }}
            creandoCategoria={creandoCategoria}
            onGuardar={guardarEdicion}
            onCrearCategoria={crearCategoriaPropia}
            onCerrar={() => setGastoEditando(null)}
          />
        )}
      </AnimatePresence>

      {!formularioAbierto && !gastoEditando && (
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
                className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-center gap-3">
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
                    {g.moneda ? formatoMonedaViaje(g.monto, g.moneda) : formatoMoneda(g.monto, pais)}
                  </span>
                </div>

                {confirmandoEliminar === g.id ? (
                  <div className="mt-2 flex items-center justify-end gap-2 border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] pt-2">
                    <span className="mr-auto text-[12px] text-[var(--text-secondary)]">¿Eliminar este gasto?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmandoEliminar(null)}
                      disabled={eliminando === g.id}
                      className="flex h-9 items-center justify-center rounded-[var(--radius-button)] px-3 text-[12px] font-medium text-[var(--text-secondary)] disabled:opacity-50 [touch-action:manipulation]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(g.id)}
                      disabled={eliminando === g.id}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 text-[12px] font-semibold text-[var(--danger)] disabled:opacity-50 [touch-action:manipulation]"
                    >
                      {eliminando === g.id && <Loader2 size={13} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
                      {eliminando === g.id ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => empezarEdicion(g)}
                      aria-label="Editar gasto"
                      className="flex size-8 items-center justify-center rounded-[var(--radius-button)] text-[var(--text-tertiary)] [touch-action:manipulation]"
                    >
                      <Pencil size={14} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoEliminar(g.id)}
                      aria-label="Eliminar gasto"
                      className="flex size-8 items-center justify-center rounded-[var(--radius-button)] text-[var(--text-tertiary)] [touch-action:manipulation]"
                    >
                      <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                  </div>
                )}
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

      {editandoCategorias && (
        <EditorCategorias
          categorias={categorias}
          supabase={supabase}
          onActualizada={(actualizada) => setCategorias((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)))}
          onCerrar={() => setEditandoCategorias(false)}
        />
      )}
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
