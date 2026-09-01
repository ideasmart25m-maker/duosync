import type { SupabaseClient } from '@supabase/supabase-js';
import type { CategoriaDB } from '@/lib/categorias';

export interface GastoDB {
  id: string;
  categoriaId: string;
  monto: number;
  fecha: string; // ISO yyyy-mm-dd
  registradoPor: string; // user id — la pantalla decide cómo mostrarlo (inicial, nombre, etc.)
  nota: string | null;
}

// Toda pantalla conectada necesita saber a qué pareja pertenece el usuario antes de
// poder leer/escribir nada — no hay "mi pareja" en la sesión de Auth, vive en couple_members.
export async function obtenerCoupleId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
  if (error) throw error;
  return data?.couple_id ?? null;
}

export async function listarCategorias(supabase: SupabaseClient, coupleId: string): Promise<CategoriaDB[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, nombre, icono, color')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id, nombre: c.nombre, icono: c.icono, color: c.color as 'accent' | 'accent-2' }));
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
    .select('id, category_id, monto, fecha, registrado_por, nota')
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
  gasto: { categoriaId: string; monto: number; nota?: string; receiptScanId?: string }
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
    })
    .select('id, category_id, monto, fecha, registrado_por, nota')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    categoriaId: data.category_id,
    monto: Number(data.monto),
    fecha: data.fecha,
    registradoPor: data.registrado_por,
    nota: data.nota,
  };
}
