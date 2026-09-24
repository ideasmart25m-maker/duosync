import type { SupabaseClient } from '@supabase/supabase-js';

// Viaje con nombre propio: vive en Metas y agrupa los gastos de una moneda extranjera por
// subcategoría. El dinero (saldo, reparto) sigue calculándose por `expenses.moneda` — esto solo
// agrupa y nombra.
export interface ViajeDB {
  id: string;
  nombre: string;
  moneda: string;
  presupuesto: number | null;
}

// Las básicas se guardan con su clave; las que agregue la pareja se guardan con su propio nombre.
export type SubcategoriaViaje = string;

export const SUBCATEGORIAS_VIAJE: { clave: string; nombre: string }[] = [
  { clave: 'tiquetes', nombre: 'Tiquetes' },
  { clave: 'alojamiento', nombre: 'Alojamiento' },
  { clave: 'alimentacion', nombre: 'Alimentación' },
  { clave: 'transporte', nombre: 'Transporte' },
  { clave: 'tours', nombre: 'Tours / Salidas' },
  { clave: 'compras', nombre: 'Compras' },
];

export interface GastoViajeDB {
  id: string;
  monto: number;
  fecha: string;
  nota: string | null;
  subcategoria: SubcategoriaViaje | null;
  registradoPor: string;
}

export function nombreSubcategoria(clave: string | null): string {
  if (!clave) return 'Otros';
  return SUBCATEGORIAS_VIAJE.find((s) => s.clave === clave)?.nombre ?? clave;
}

const COLUMNAS_VIAJE = 'id, nombre, moneda, presupuesto';

function mapViaje(v: { id: string; nombre: string; moneda: string; presupuesto: number | string | null }): ViajeDB {
  return { id: v.id, nombre: v.nombre, moneda: v.moneda, presupuesto: v.presupuesto === null ? null : Number(v.presupuesto) };
}

export async function listarViajes(supabase: SupabaseClient, coupleId: string): Promise<ViajeDB[]> {
  const { data, error } = await supabase.from('viajes').select(COLUMNAS_VIAJE).eq('couple_id', coupleId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapViaje);
}

export async function crearViaje(
  supabase: SupabaseClient,
  coupleId: string,
  v: { nombre: string; moneda: string; presupuesto: number | null }
): Promise<ViajeDB> {
  const { data, error } = await supabase
    .from('viajes')
    .insert({ couple_id: coupleId, nombre: v.nombre, moneda: v.moneda, presupuesto: v.presupuesto })
    .select(COLUMNAS_VIAJE)
    .single();
  if (error) throw error;
  return mapViaje(data);
}

export async function eliminarViaje(supabase: SupabaseClient, viajeId: string): Promise<void> {
  // Primero sus gastos (el vínculo es `on delete set null`: sin esto quedarían huérfanos en las cuentas).
  const { error: errorGastos } = await supabase.from('expenses').delete().eq('viaje_id', viajeId);
  if (errorGastos) throw errorGastos;
  const { error } = await supabase.from('viajes').delete().eq('id', viajeId);
  if (error) throw error;
}

export async function listarGastosDeViajes(supabase: SupabaseClient, coupleId: string): Promise<(GastoViajeDB & { viajeId: string })[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, monto, fecha, nota, subcategoria, registrado_por, viaje_id')
    .eq('couple_id', coupleId)
    .not('viaje_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((g) => ({
    id: g.id,
    monto: Number(g.monto),
    fecha: g.fecha,
    nota: g.nota,
    subcategoria: g.subcategoria as SubcategoriaViaje | null,
    registradoPor: g.registrado_por,
    viajeId: g.viaje_id as string,
  }));
}

// expenses.category_id es obligatorio: los gastos de viaje cuelgan de una categoría interna
// ("Viajes", oculta en Gastos) que se crea la primera vez que hace falta.
async function categoriaInternaDeViajes(supabase: SupabaseClient, coupleId: string, userId: string): Promise<string> {
  const { data: existente, error } = await supabase.from('categories').select('id').eq('couple_id', coupleId).eq('es_de_viaje', true).limit(1).maybeSingle();
  if (error) throw error;
  if (existente) return existente.id;
  const { data, error: errorCrear } = await supabase
    .from('categories')
    .insert({ couple_id: coupleId, nombre: 'Viajes', icono: 'circle', color: 'gray', es_de_viaje: true, reparto_user_id: userId })
    .select('id')
    .single();
  if (errorCrear) throw errorCrear;
  return data.id;
}

// `splitPercent` = parte de QUIEN PAGÓ (quien registra), la misma convención de los gastos de la casa.
export async function registrarGastoDeViaje(
  supabase: SupabaseClient,
  coupleId: string,
  viaje: ViajeDB,
  g: { monto: number; subcategoria: SubcategoriaViaje; nota?: string; splitPercent: number; receiptScanId?: string }
): Promise<GastoViajeDB & { viajeId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sin sesión activa');
  const categoriaId = await categoriaInternaDeViajes(supabase, coupleId, user.id);
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      couple_id: coupleId,
      category_id: categoriaId,
      monto: g.monto,
      registrado_por: user.id,
      nota: g.nota || null,
      split_percent: g.splitPercent,
      moneda: viaje.moneda,
      viaje_id: viaje.id,
      subcategoria: g.subcategoria,
      receipt_scan_id: g.receiptScanId ?? null,
    })
    .select('id, monto, fecha, nota, subcategoria, registrado_por, viaje_id')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    monto: Number(data.monto),
    fecha: data.fecha,
    nota: data.nota,
    subcategoria: data.subcategoria as SubcategoriaViaje,
    registradoPor: data.registrado_por,
    viajeId: data.viaje_id as string,
  };
}

// Lee un recibo con la IA (misma función que en Gastos) y devuelve el monto detectado.
export async function escanearReciboDeViaje(supabase: SupabaseClient, coupleId: string, foto: Blob): Promise<{ scanId: string; monto: number | null }> {
  const { iniciarEscaneoRecibo, consultarEscaneoRecibo } = await import('@/lib/gastos');
  const scanId = await iniciarEscaneoRecibo(supabase, coupleId, foto);
  for (let intento = 0; intento < 14; intento++) {
    await new Promise((r) => setTimeout(r, 1500));
    const scan = await consultarEscaneoRecibo(supabase, scanId);
    if (scan.estado === 'listo') return { scanId, monto: scan.montoDetectado };
    if (scan.estado === 'error') throw new Error(scan.errorMensaje ?? 'No pudimos leer el recibo.');
  }
  throw new Error('Está tardando más de lo normal.');
}
