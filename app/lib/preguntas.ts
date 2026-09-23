import type { SupabaseClient } from '@supabase/supabase-js';

export interface PreguntaDB {
  id: string;
  texto: string;
}

export interface RespuestaDB {
  userId: string;
  respuesta: string;
}

// Misma pregunta para toda la pareja, cambia una vez al día (server-side, `pregunta_de_hoy()`
// en la migración) — antes era un texto fijo en el código, igual para todas las parejas todos
// los días.
export async function obtenerPreguntaDeHoy(supabase: SupabaseClient): Promise<PreguntaDB> {
  const { data, error } = await supabase.rpc('pregunta_de_hoy');
  if (error) throw error;
  return { id: data.id, texto: data.texto };
}

// La respuesta del OTRO integrante solo viene en la lista cuando ambos ya respondieron hoy —
// RLS no puede ocultar selectivamente el contenido de una fila ya visible, por eso el revelado
// se resuelve server-side en la función `respuestas_de_hoy()`.
export async function obtenerRespuestasDeHoy(supabase: SupabaseClient, questionId: string): Promise<RespuestaDB[]> {
  const { data, error } = await supabase.rpc('respuestas_de_hoy', { p_question_id: questionId });
  if (error) throw error;
  return (data ?? []).map((r: { user_id: string; respuesta: string }) => ({ userId: r.user_id, respuesta: r.respuesta }));
}

export interface ResultadoResponder {
  ambosRespondieron: boolean;
  rachaDias: number;
}

// Guarda la respuesta (o la corrige, si ya habían respondido hoy) y de paso actualiza la racha
// server-side cuando esta respuesta completa el "ambos ya contestaron" del día.
export async function responderPreguntaHoy(supabase: SupabaseClient, questionId: string, respuesta: string): Promise<ResultadoResponder> {
  const { data, error } = await supabase.rpc('responder_pregunta_hoy', { p_question_id: questionId, p_respuesta: respuesta });
  if (error) throw error;
  const fila = data?.[0];
  return { ambosRespondieron: fila?.ambos_respondieron ?? false, rachaDias: fila?.racha_dias ?? 0 };
}

export async function obtenerRachaPareja(supabase: SupabaseClient, coupleId: string): Promise<number> {
  const { data, error } = await supabase.from('streaks').select('dias').eq('couple_id', coupleId).maybeSingle();
  if (error) throw error;
  return data?.dias ?? 0;
}

// Últimos 28 días, hoy primero (mismo orden que usaba el historial de ejemplo) — un día cuenta
// como "conectado" cuando TODOS los integrantes de la pareja respondieron la pregunta ese día
// (mismo criterio que la racha). La tabla `streaks` solo guarda el número de días seguidos, no
// un historial día a día — se reconstruye aquí a partir de `daily_answers`, que sí tiene fecha
// por fila.
export async function obtenerHistorialConexion(supabase: SupabaseClient, coupleId: string): Promise<boolean[]> {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 27);
  const desdeStr = desde.toISOString().slice(0, 10);

  const [{ count: totalMiembros }, { data: respuestas }] = await Promise.all([
    supabase.from('couple_members').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId),
    supabase.from('daily_answers').select('fecha, user_id').eq('couple_id', coupleId).gte('fecha', desdeStr),
  ]);

  const porFecha = new Map<string, Set<string>>();
  for (const r of (respuestas ?? []) as { fecha: string; user_id: string }[]) {
    if (!porFecha.has(r.fecha)) porFecha.set(r.fecha, new Set());
    porFecha.get(r.fecha)!.add(r.user_id);
  }

  const historial: boolean[] = [];
  for (let i = 0; i < 28; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const usuarios = porFecha.get(clave);
    historial.push(!!usuarios && !!totalMiembros && usuarios.size >= totalMiembros);
  }
  return historial;
}

export interface NombresPareja {
  propio: string;
  otro: string | null; // null si todavía no se ha unido nadie más
  avatarPropio: string | null;
  avatarOtro: string | null;
}

// Nombre real de los dos integrantes (antes "Mateo & Sofía" fijos en el código) — necesita el
// permiso nuevo de `profiles` (ver perfil de tu pareja) agregado en la misma migración.
export async function obtenerNombresPareja(supabase: SupabaseClient, coupleId: string, miUserId: string): Promise<NombresPareja> {
  // Dos consultas en vez de un join embebido: `couple_members` y `profiles` no tienen una
  // llave foránea directa entre sí (ambas apuntan a auth.users), así que PostgREST no puede
  // resolver el embed y fallaba con PGRST200.
  const { data: miembros, error } = await supabase.from('couple_members').select('user_id').eq('couple_id', coupleId);
  if (error) throw error;
  const ids = (miembros ?? []).map((m) => m.user_id as string);
  const { data: perfiles, error: errorPerfiles } = await supabase.from('profiles').select('id, nombre, avatar_url').in('id', ids);
  if (errorPerfiles) throw errorPerfiles;
  const filas = (perfiles ?? []) as { id: string; nombre: string; avatar_url: string | null }[];
  const mio = filas.find((f) => f.id === miUserId);
  const suyo = filas.find((f) => f.id !== miUserId);
  return {
    propio: mio?.nombre ?? 'Tú',
    otro: suyo?.nombre ?? null,
    avatarPropio: mio?.avatar_url ?? null,
    avatarOtro: suyo?.avatar_url ?? null,
  };
}

// Sube/reemplaza la foto de perfil del usuario actual (bucket público "avatares", un archivo
// por persona en su propia carpeta — política RLS lo garantiza) y guarda la URL en su perfil.
export async function subirAvatar(supabase: SupabaseClient, userId: string, archivo: File): Promise<string> {
  const extension = archivo.name.split('.').pop() ?? 'jpg';
  const ruta = `${userId}/foto.${extension}`;
  const { error: errorSubida } = await supabase.storage.from('avatares').upload(ruta, archivo, { upsert: true, cacheControl: '3600' });
  if (errorSubida) throw errorSubida;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatares').getPublicUrl(ruta);
  // Cache-buster en la URL guardada: si la pareja ya había cargado la foto anterior, el navegador
  // la tenía en caché bajo la misma URL — sin esto, la foto nueva no se veía hasta refrescar fuerte.
  const urlConVersion = `${publicUrl}?v=${Date.now()}`;

  const { error: errorPerfil } = await supabase.from('profiles').update({ avatar_url: urlConVersion }).eq('id', userId);
  if (errorPerfil) throw errorPerfil;

  return urlConVersion;
}
