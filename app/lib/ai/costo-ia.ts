import type { SupabaseClient } from '@supabase/supabase-js';
import { calcularCostoUsd } from './precios';

// Registra el costo REAL de una llamada a la IA — se escribe con la clave de servicio (nunca
// desde el cliente, `ai_calls` no tiene policy de insert para authenticated). Nunca lanza: un
// fallo al registrar el costo no debe romper la respuesta real al usuario.
export async function registrarCostoIA(
  admin: SupabaseClient,
  datos: { coupleId: string | null; tipo: 'escaneo' | 'asistente'; modelo: string; tokensEntrada: number; tokensSalida: number }
): Promise<void> {
  try {
    await admin.from('ai_calls').insert({
      couple_id: datos.coupleId,
      tipo: datos.tipo,
      modelo: datos.modelo,
      tokens_entrada: datos.tokensEntrada,
      tokens_salida: datos.tokensSalida,
      costo_usd: calcularCostoUsd(datos.modelo, datos.tokensEntrada, datos.tokensSalida),
    });
  } catch {
    // silencioso a propósito — ver comentario arriba
  }
}
