import type { SupabaseClient } from '@supabase/supabase-js';

// Registra un evento de uso real (21-BACKOFFICE.md) — con esto el panel de administración
// calcula activación y retención sin herramientas externas. Nunca lanza si falla (un evento
// perdido no debe romper la acción real del usuario) — se traga el error en silencio.
export async function logEvent(
  supabase: SupabaseClient,
  tipo: string,
  userId: string,
  coupleId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('event_log').insert({ tipo, user_id: userId, couple_id: coupleId, metadata });
  } catch {
    // silencioso a propósito — ver comentario arriba
  }
}

// Registra un error real de la app (Error Boundary / catch) para que el panel de administración
// lo muestre en lenguaje claro — 21-BACKOFFICE.md. `userId` es opcional: un error puede pasar
// antes de tener sesión.
export async function logError(supabase: SupabaseClient, message: string, context: string, userId?: string): Promise<void> {
  try {
    await supabase.from('error_log').insert({ message: message.slice(0, 500), context, user_id: userId ?? null });
  } catch {
    // silencioso a propósito
  }
}
