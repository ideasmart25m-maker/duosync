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
}

// Nombre real de los dos integrantes (antes "Mateo & Sofía" fijos en el código) — necesita el
// permiso nuevo de `profiles` (ver perfil de tu pareja) agregado en la misma migración.
export async function obtenerNombresPareja(supabase: SupabaseClient, coupleId: string, miUserId: string): Promise<NombresPareja> {
  const { data, error } = await supabase.from('couple_members').select('user_id, profiles(nombre)').eq('couple_id', coupleId);
  if (error) throw error;
  const filas = (data ?? []) as unknown as { user_id: string; profiles: { nombre: string } | null }[];
  const propio = filas.find((f) => f.user_id === miUserId)?.profiles?.nombre ?? 'Tú';
  const otro = filas.find((f) => f.user_id !== miUserId)?.profiles?.nombre ?? null;
  return { propio, otro };
}
