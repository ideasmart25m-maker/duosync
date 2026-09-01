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

export async function crearGasto(
  supabase: SupabaseClient,
  coupleId: string,
  gasto: { categoriaId: string; monto: number; nota?: string }
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
