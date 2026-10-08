import type { SupabaseClient } from '@supabase/supabase-js';

// Lo que pasa justo después de confirmar el correo (por enlace o por código): unirse a la pareja con
// el código de invitación, o crear una pareja nueva si todavía no tiene una. Un solo lugar para los
// dos caminos de entrada, para que nunca se comporten distinto.
export async function completarVinculacion(supabase: SupabaseClient, modo: string | null, codigo: string | null): Promise<{ vinculacionFallo: boolean }> {
  if (modo === 'unirse' && codigo) {
    const { error } = await supabase.rpc('unirse_con_codigo', { p_codigo: codigo });
    return { vinculacionFallo: !!error };
  }
  // Solo crea una pareja nueva si todavía no tiene una — si alguien vuelve a entrar, no debe
  // generarle una segunda pareja duplicada.
  const { data: yaTienePareja } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
  if (!yaTienePareja) {
    // Se le pasa el código que la persona YA compartió por WhatsApp, para que sea el real de la pareja.
    await supabase.rpc('crear_pareja', codigo && /^[0-9]{4}$/.test(codigo) ? { p_codigo: codigo } : {});
  }
  return { vinculacionFallo: false };
}

// Solo rutas internas de la app como destino: evita que un parámetro `next` manipulado redirija a otro sitio.
export function destinoSeguro(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/app/hoy';
}
