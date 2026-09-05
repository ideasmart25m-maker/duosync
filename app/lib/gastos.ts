import type { SupabaseClient } from '@supabase/supabase-js';
import type { CategoriaDB } from '@/lib/categorias';

export interface GastoDB {
  id: string;
  categoriaId: string;
  monto: number;
  fecha: string; // ISO yyyy-mm-dd
  registradoPor: string; // user id — la pantalla decide cómo mostrarlo (inicial, nombre, etc.)
  nota: string | null;
  splitPercent: number | null; // override puntual del % de la categoría; null = usa el de la categoría
  moneda: string | null; // 'USD'/'EUR'/'GBP' si es un gasto de viaje; null = moneda normal de la casa
}

// Toda pantalla conectada necesita saber a qué pareja pertenece el usuario antes de
// poder leer/escribir nada — no hay "mi pareja" en la sesión de Auth, vive en couple_members.
export async function obtenerCoupleId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
  if (error) throw error;
  return data?.couple_id ?? null;
}

// País elegido por la pareja (SelectorPais) — null si todavía no lo eligieron; quien llama
// decide el valor por defecto (formatoMoneda ya cae a Colombia si recibe null).
export async function obtenerPaisPareja(supabase: SupabaseClient, coupleId: string): Promise<string | null> {
  const { data, error } = await supabase.from('couples').select('pais').eq('id', coupleId).maybeSingle();
  if (error) throw error;
  return data?.pais ?? null;
}

function mapCategoria(c: {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  split_percent: number;
  es_recurrente: boolean;
  dias_vencimiento: number[] | null;
}): CategoriaDB {
  return {
    id: c.id,
    nombre: c.nombre,
    icono: c.icono,
    color: c.color as CategoriaDB['color'],
    splitPercent: c.split_percent,
    esRecurrente: c.es_recurrente,
    diasVencimiento: c.dias_vencimiento,
  };
}

const COLUMNAS_CATEGORIA = 'id, nombre, icono, color, split_percent, es_recurrente, dias_vencimiento';

export async function listarCategorias(supabase: SupabaseClient, coupleId: string): Promise<CategoriaDB[]> {
  const { data, error } = await supabase.from('categories').select(COLUMNAS_CATEGORIA).eq('couple_id', coupleId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCategoria);
}

const PALETA_CATEGORIAS: CategoriaDB['color'][] = ['teal', 'coral', 'amber', 'rose', 'blue', 'violet', 'gray'];

// Categorías propias — el color se asigna solo, ciclando la paleta, para que la nueva
// categoría también se distinga de un vistazo sin pedirle al usuario que elija un color.
export async function crearCategoria(supabase: SupabaseClient, coupleId: string, nombre: string, existentes: CategoriaDB[]): Promise<CategoriaDB> {
  const color = PALETA_CATEGORIAS[existentes.length % PALETA_CATEGORIAS.length];
  const { data, error } = await supabase
    .from('categories')
    .insert({ couple_id: coupleId, nombre: nombre.trim(), icono: 'circle', color })
    .select(COLUMNAS_CATEGORIA)
    .single();
  if (error) throw error;
  return mapCategoria(data);
}

// Edita el reparto y/o la recurrencia de una categoría YA creada — la política de UPDATE de
// `categories` ya permite esto (ver migración inicial), solo faltaba el código para llamarla.
export async function actualizarCategoria(
  supabase: SupabaseClient,
  categoriaId: string,
  cambios: { splitPercent?: number; esRecurrente?: boolean; diasVencimiento?: number[] | null }
): Promise<CategoriaDB> {
  const patch: Record<string, unknown> = {};
  if (cambios.splitPercent !== undefined) patch.split_percent = cambios.splitPercent;
  if (cambios.esRecurrente !== undefined) patch.es_recurrente = cambios.esRecurrente;
  if (cambios.diasVencimiento !== undefined) patch.dias_vencimiento = cambios.diasVencimiento;

  const { data, error } = await supabase.from('categories').update(patch).eq('id', categoriaId).select(COLUMNAS_CATEGORIA).single();
  if (error) throw error;
  return mapCategoria(data);
}

// `prefijoMes` en formato "YYYY-MM" — se resuelve a un rango de fechas real para el filtro,
// evitando el bug ya conocido de parsear fechas ISO con `new Date()` (ver ESTADO.md).
export async function listarGastosDelMes(supabase: SupabaseClient, coupleId: string, prefijoMes: string): Promise<GastoDB[]> {
  const [anio, mes] = prefijoMes.split('-').map(Number);
  const desde = `${prefijoMes}-01`;
  const hastaFecha = new Date(Date.UTC(anio, mes, 1)); // primer día del mes SIGUIENTE
  const hasta = hastaFecha.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('expenses')
    .select('id, category_id, monto, fecha, registrado_por, nota, split_percent, moneda')
    .eq('couple_id', coupleId)
    .gte('fecha', desde)
    .lt('fecha', hasta)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((g) => ({
    id: g.id,
    categoriaId: g.category_id,
    monto: Number(g.monto),
    fecha: g.fecha,
    registradoPor: g.registrado_por,
    nota: g.nota,
    splitPercent: g.split_percent,
    moneda: g.moneda,
  }));
}

export interface ReciboScan {
  id: string;
  estado: 'pendiente' | 'procesando' | 'listo' | 'error';
  montoDetectado: number | null;
  categoriaSugeridaId: string | null;
  errorMensaje: string | null;
}

// Sube la foto (ya comprimida por quien llama) al bucket privado `recibos`, crea la fila de
// seguimiento, y le avisa al servidor que la procese. La ruta empieza por el couple_id — así
// la política de Storage puede verificar pertenencia sin adivinar nada (ver migración).
export async function iniciarEscaneoRecibo(supabase: SupabaseClient, coupleId: string, foto: Blob): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sin sesión activa');

  const nombreArchivo = `${coupleId}/${crypto.randomUUID()}.jpg`;
  const { error: errorSubida } = await supabase.storage.from('recibos').upload(nombreArchivo, foto, { contentType: 'image/jpeg' });
  if (errorSubida) throw errorSubida;

  const { data: scan, error: errorInsert } = await supabase
    .from('receipt_scans')
    .insert({ couple_id: coupleId, subido_por: user.id, imagen_path: nombreArchivo })
    .select('id')
    .single();
  if (errorInsert) throw errorInsert;

  const respuesta = await fetch('/api/recibos/procesar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scanId: scan.id }),
  });
  if (!respuesta.ok) throw new Error('No pudimos empezar a leer el recibo.');

  return scan.id;
}

export async function consultarEscaneoRecibo(supabase: SupabaseClient, scanId: string): Promise<ReciboScan> {
  const { data, error } = await supabase
    .from('receipt_scans')
    .select('id, estado, monto_detectado, categoria_sugerida_id, error_mensaje')
    .eq('id', scanId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    estado: data.estado,
    montoDetectado: data.monto_detectado !== null ? Number(data.monto_detectado) : null,
    categoriaSugeridaId: data.categoria_sugerida_id,
    errorMensaje: data.error_mensaje,
  };
}

export async function crearGasto(
  supabase: SupabaseClient,
  coupleId: string,
  gasto: { categoriaId: string; monto: number; nota?: string; receiptScanId?: string; splitPercent?: number; moneda?: string | null }
): Promise<GastoDB> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sin sesión activa');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      couple_id: coupleId,
      category_id: gasto.categoriaId,
      monto: gasto.monto,
      registrado_por: user.id,
      nota: gasto.nota || null,
      receipt_scan_id: gasto.receiptScanId ?? null,
      split_percent: gasto.splitPercent ?? null,
      moneda: gasto.moneda ?? null,
    })
    .select('id, category_id, monto, fecha, registrado_por, nota, split_percent, moneda')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    categoriaId: data.category_id,
    monto: Number(data.monto),
    fecha: data.fecha,
    registradoPor: data.registrado_por,
    nota: data.nota,
    splitPercent: data.split_percent,
    moneda: data.moneda,
  };
}

export interface SaldoPorMoneda {
  moneda: string | null; // null = la moneda normal de la casa; 'USD'/'EUR'/'GBP' = un viaje
  saldo: number;
}

// Corrige un gasto ya guardado (monto, categoría, nota, reparto o moneda) — la política de
// UPDATE de `expenses` ya permite que CUALQUIERA de los dos integrantes lo edite, no solo quien
// lo registró (es un gasto del hogar, no personal).
export async function actualizarGasto(
  supabase: SupabaseClient,
  gastoId: string,
  cambios: { categoriaId?: string; monto?: number; nota?: string | null; splitPercent?: number | null; moneda?: string | null }
): Promise<GastoDB> {
  const patch: Record<string, unknown> = {};
  if (cambios.categoriaId !== undefined) patch.category_id = cambios.categoriaId;
  if (cambios.monto !== undefined) patch.monto = cambios.monto;
  if (cambios.nota !== undefined) patch.nota = cambios.nota || null;
  if (cambios.splitPercent !== undefined) patch.split_percent = cambios.splitPercent;
  if (cambios.moneda !== undefined) patch.moneda = cambios.moneda;

  const { data, error } = await supabase
    .from('expenses')
    .update(patch)
    .eq('id', gastoId)
    .select('id, category_id, monto, fecha, registrado_por, nota, split_percent, moneda')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    categoriaId: data.category_id,
    monto: Number(data.monto),
    fecha: data.fecha,
    registradoPor: data.registrado_por,
    nota: data.nota,
    splitPercent: data.split_percent,
    moneda: data.moneda,
  };
}

export async function eliminarGasto(supabase: SupabaseClient, gastoId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', gastoId);
  if (error) throw error;
}

// Saldo pendiente entre la pareja desde la última liquidación, UNA fila por moneda (RPC — lo
// calcula el servidor, nunca sumando en el cliente, para que la cuenta oficial sea siempre la
// misma para los dos). Positivo = "tu pareja te debe"; negativo = "le debes a tu pareja" — ya
// resuelto desde el punto de vista del usuario que llama (ver comentario en la migración sobre
// member_a/b). Un gasto de viaje en euros suma a SU PROPIA fila, nunca a la de la casa.
// `null` = todavía no hay una SEGUNDA persona en la pareja (nadie con quien repartir) — se
// distingue a propósito de un saldo real en $0 (defecto real detectado: antes devolvía 0 en
// los dos casos y la pantalla decía "están al día" cuando en realidad nadie se había unido).
export async function obtenerSaldoPareja(supabase: SupabaseClient, coupleId: string, miUserId: string): Promise<SaldoPorMoneda[] | null> {
  const { data: membresias } = await supabase.from('couple_members').select('user_id').eq('couple_id', coupleId);
  const ids = (membresias ?? []).map((m) => m.user_id as string);
  if (ids.length < 2) return null;

  const { data, error } = await supabase.rpc('calcular_saldo_pareja', { p_couple_id: coupleId });
  if (error) throw error;
  const memberA = ids.sort()[0]; // mismo criterio que la función SQL: el menor por orden de texto de UUID
  // La función devuelve el saldo desde la perspectiva de member_a (positivo = member_b le debe a A).
  return (data ?? []).map((fila: { moneda: string | null; saldo: number }) => ({
    moneda: fila.moneda,
    saldo: miUserId === memberA ? Number(fila.saldo) : -Number(fila.saldo),
  }));
}

export async function liquidarSaldo(supabase: SupabaseClient, moneda: string | null = null): Promise<void> {
  const { error } = await supabase.rpc('liquidar_saldo', { p_moneda: moneda });
  if (error) throw error;
}
