import type { SupabaseClient } from '@supabase/supabase-js';

export interface ResultadoTopeIA {
  permitido: boolean;
  usados: number;
  limite: number;
}

// Verifica Y registra el uso en un solo paso atómico server-side (`registrar_uso_ia()`) — nunca
// "contar en el cliente y luego insertar", para que dos solicitudes casi simultáneas no se
// cuelen las dos por una condición de carrera. Prueba gratis: 3 de por vida; plan pago: 50/mes
// (cifras reales dadas por el dueño de la app).
export async function verificarYRegistrarUsoIA(supabase: SupabaseClient, tipo: 'escaneo' | 'asistente'): Promise<ResultadoTopeIA> {
  const { data, error } = await supabase.rpc('registrar_uso_ia', { p_tipo: tipo });
  if (error) throw error;
  const fila = data?.[0];
  return { permitido: fila?.permitido ?? false, usados: fila?.usados ?? 0, limite: fila?.limite ?? 0 };
}
