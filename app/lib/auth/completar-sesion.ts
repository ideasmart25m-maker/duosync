import type { SupabaseClient } from '@supabase/supabase-js';

// Lo que pasa justo después de confirmar el correo (por enlace o por código): unirse a la pareja con
// el código de invitación, o crear una pareja nueva si todavía no tiene una. Un solo lugar para los
// dos caminos de entrada, para que nunca se comporten distinto.
export async function completarVinculacion(supabase: SupabaseClient, modo: string | null, codigo: string | null, token: string | null = null): Promise<{ vinculacionFallo: string | null }> {
  if (modo === 'unirse' && codigo) {
    const { error } = await supabase.rpc('unirse_con_codigo', { p_codigo: codigo });
    if (!error) return { vinculacionFallo: null };
    const m = error.message ?? '';
    // Motivo en una palabra clave: la pantalla de Inicio lo traduce a un mensaje claro.
    return { vinculacionFallo: m.includes('YA_TIENES_PAREJA') ? 'ya_tienes_pareja' : m.includes('CODIGO_INVALIDO') ? 'codigo' : m.includes('DEMASIADOS_INTENTOS') ? 'intentos' : 'error' };
  }
  // Solo crea una pareja nueva si todavía no tiene una — si alguien vuelve a entrar, no debe
  // generarle una segunda pareja duplicada.
  const { data: yaTienePareja } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
  if (!yaTienePareja) {
    // Se le pasa el código que la persona YA compartió por WhatsApp, para que sea el real de la pareja.
    const argumentos: Record<string, string> = {};
    if (codigo && /^[0-9]{4}$/.test(codigo)) argumentos.p_codigo = codigo;
    if (token && /^[0-9a-f]{32}$/.test(token)) argumentos.p_token = token; // la clave del enlace que ya se compartió
    await supabase.rpc('crear_pareja', argumentos);
  }
  return { vinculacionFallo: null };
}

// Solo rutas internas de la app como destino: evita que un parámetro `next` manipulado redirija a otro sitio.
export function destinoSeguro(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/app/hoy';
}
