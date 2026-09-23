import type { SupabaseClient } from '@supabase/supabase-js';

// Viaje con nombre propio (pedido real del usuario) — agrupa los gastos de una moneda extranjera
// bajo un nombre ("Viaje New York") en vez de solo "gastos en dólares". El dinero en sí (saldo,
// reparto) sigue calculándose por `moneda`, igual que antes — esto es solo para agrupar y nombrar.
export interface ViajeDB {
  id: string;
  nombre: string;
  moneda: string;
}

export async function listarViajes(supabase: SupabaseClient, coupleId: string): Promise<ViajeDB[]> {
  const { data, error } = await supabase.from('viajes').select('id, nombre, moneda').eq('couple_id', coupleId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((v) => ({ id: v.id, nombre: v.nombre, moneda: v.moneda }));
}

export async function crearViaje(supabase: SupabaseClient, coupleId: string, nombre: string, moneda: string): Promise<ViajeDB> {
  const { data, error } = await supabase.from('viajes').insert({ couple_id: coupleId, nombre, moneda }).select('id, nombre, moneda').single();
  if (error) throw error;
  return { id: data.id, nombre: data.nombre, moneda: data.moneda };
}
