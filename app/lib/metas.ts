import type { SupabaseClient } from '@supabase/supabase-js';
import { logEvent } from '@/lib/eventos';

export interface MetaDB {
  id: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaObjetivo: string | null; // ISO yyyy-mm-dd
}

const COLUMNAS_META = 'id, nombre, monto_objetivo, monto_actual, fecha_objetivo';

function mapMeta(m: { id: string; nombre: string; monto_objetivo: number; monto_actual: number; fecha_objetivo: string | null }): MetaDB {
  return {
    id: m.id,
    nombre: m.nombre,
    montoObjetivo: Number(m.monto_objetivo),
    montoActual: Number(m.monto_actual),
    fechaObjetivo: m.fecha_objetivo,
  };
}

export async function listarMetas(supabase: SupabaseClient, coupleId: string): Promise<MetaDB[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select(COLUMNAS_META)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMeta);
}

export async function crearMeta(
  supabase: SupabaseClient,
  coupleId: string,
  meta: { nombre: string; montoObjetivo: number; fechaObjetivo: string | null }
): Promise<MetaDB> {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({ couple_id: coupleId, nombre: meta.nombre, monto_objetivo: meta.montoObjetivo, fecha_objetivo: meta.fechaObjetivo })
    .select(COLUMNAS_META)
    .single();
  if (error) throw error;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) logEvent(supabase, 'meta_creada', user.id, coupleId, { metaId: data.id });
  return mapMeta(data);
}

export async function actualizarMeta(
  supabase: SupabaseClient,
  metaId: string,
  cambios: { nombre?: string; montoObjetivo?: number; fechaObjetivo?: string | null }
): Promise<MetaDB> {
  const patch: Record<string, unknown> = {};
  if (cambios.nombre !== undefined) patch.nombre = cambios.nombre;
  if (cambios.montoObjetivo !== undefined) patch.monto_objetivo = cambios.montoObjetivo;
  if (cambios.fechaObjetivo !== undefined) patch.fecha_objetivo = cambios.fechaObjetivo;

  const { data, error } = await supabase.from('savings_goals').update(patch).eq('id', metaId).select(COLUMNAS_META).single();
  if (error) throw error;
  return mapMeta(data);
}

// Aporta de forma atómica en el servidor (RPC `aportar_a_meta`) — nunca se suma en el cliente,
// para que un aporte de cada integrante casi al mismo tiempo no se pise entre sí.
export async function aportarAMeta(supabase: SupabaseClient, metaId: string, monto: number): Promise<MetaDB> {
  const { data, error } = await supabase.rpc('aportar_a_meta', { p_meta_id: metaId, p_monto: monto });
  if (error) throw error;
  return mapMeta(data);
}
