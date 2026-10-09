import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { streamRespuestaAsistente, type MensajeChat, type GastoParaAsistente } from '@/lib/ai/asistente';
import { paisPorCodigo } from '@/lib/paises';
import { verificarYRegistrarUsoIA } from '@/lib/ia-uso';
import { registrarCostoIA } from '@/lib/ai/costo-ia';
import { AI_MODEL } from '@/lib/ai/anthropic';

// BFF (09-SEGURIDAD.md): el navegador nunca llama a Anthropic directo. Esta ruta arma el
// contexto con los gastos REALES de la pareja (vía RLS, con la sesión del usuario — nunca la
// clave secreta, no hace falta saltarse RLS para leer datos que igual son suyos) y transmite
// la respuesta en vivo con streaming (30-INTEGRACION-IA.md).
export async function POST(request: NextRequest) {
  const entrada = (await request.json().catch(() => null)) as { pregunta?: string; historial?: MensajeChat[] } | null;
  const pregunta = entrada?.pregunta;
  const historial = entrada?.historial;
  if (!pregunta || typeof pregunta !== 'string' || pregunta.length > 500) {
    return NextResponse.json({ error: 'Pregunta inválida.' }, { status: 400 });
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión activa.' }, { status: 401 });

  const { data: membresia } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
  if (!membresia) return NextResponse.json({ error: 'Todavía no tienen una pareja vinculada.' }, { status: 400 });

  // Tope de uso de IA (verificado y registrado atómico en el servidor) — 3 preguntas de por
  // vida en el plan gratis, 50 al mes en el plan pago.
  const tope = await verificarYRegistrarUsoIA(supabase, 'asistente');
  if (!tope.permitido) {
    return NextResponse.json({ error: 'LIMITE_ALCANZADO', usados: tope.usados, limite: tope.limite }, { status: 403 });
  }

  // Todo el historial, no solo el mes actual (pedido real del usuario: no podía responder
  // sobre meses anteriores) — el volumen de gastos de UN hogar es bajo, así que el costo en
  // tokens sigue siendo mínimo. Tope de 500 filas como salvaguarda ante una pareja muy activa
  // durante mucho tiempo (30-INTEGRACION-IA.md: "el costo de IA < 20% del precio").
  const coupleId = membresia.couple_id as string;
  const [{ data: gastos }, { data: pareja }, { data: viajes }, { data: metas }, { data: miembros }] = await Promise.all([
    supabase
      .from('expenses')
      .select('monto, fecha, nota, moneda, viaje_id, subcategoria, registrado_por, categories(nombre)')
      .eq('couple_id', coupleId)
      .order('fecha', { ascending: false })
      .limit(500),
    supabase.from('couples').select('pais, presupuesto_mensual').eq('id', coupleId).maybeSingle(),
    supabase.from('viajes').select('id, nombre, moneda, presupuesto').eq('couple_id', coupleId),
    supabase.from('savings_goals').select('nombre, monto_actual, monto_objetivo, fecha_objetivo').eq('couple_id', coupleId),
    supabase.from('couple_members').select('user_id').eq('couple_id', coupleId),
  ]);
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, nombre')
    .in('id', (miembros ?? []).map((m) => m.user_id as string));
  const nombrePorId = new Map((perfiles ?? []).map((x) => [x.id as string, x.nombre as string]));
  const nombreViaje = new Map((viajes ?? []).map((v) => [v.id as string, v.nombre as string]));

  const gastosParaIA: GastoParaAsistente[] = (gastos ?? []).map((g) => ({
    categoria: (g.categories as unknown as { nombre: string } | null)?.nombre ?? 'Sin categoría',
    monto: Number(g.monto),
    fecha: g.fecha,
    nota: g.nota,
    moneda: g.moneda ?? null,
    viaje: g.viaje_id ? (nombreViaje.get(g.viaje_id as string) ?? null) : null,
    subcategoria: (g.subcategoria as string | null) ?? null,
    pagoPor: nombrePorId.get(g.registrado_por as string) ?? null,
  }));

  // "Hoy" en hora de Colombia/Perú/Ecuador (UTC-5): evita que "este mes" cambie unas horas antes de tiempo.
  const hoy = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);

  const stream = streamRespuestaAsistente(pregunta, (historial ?? []).slice(-10), {
    hoy,
    monedaCasa: paisPorCodigo(pareja?.pais ?? null)?.moneda ?? 'COP',
    presupuestoMensual: pareja?.presupuesto_mensual !== null && pareja?.presupuesto_mensual !== undefined ? Number(pareja.presupuesto_mensual) : null,
    nombres: [...nombrePorId.values()],
    gastos: gastosParaIA,
    metas: (metas ?? []).map((m) => ({ nombre: m.nombre as string, actual: Number(m.monto_actual), objetivo: Number(m.monto_objetivo), fecha: (m.fecha_objetivo as string | null) ?? null })),
    viajes: (viajes ?? []).map((v) => ({ nombre: v.nombre as string, moneda: v.moneda as string, presupuesto: v.presupuesto !== null ? Number(v.presupuesto) : null })),
  });

  const codificador = new TextEncoder();
  const cuerpo = new ReadableStream({
    async start(controller) {
      try {
        for await (const evento of stream) {
          if (evento.type === 'content_block_delta' && evento.delta.type === 'text_delta') {
            controller.enqueue(codificador.encode(evento.delta.text));
          }
        }
      } catch {
        // Degradación elegante (30-INTEGRACION-IA.md): si la IA falla a mitad de la
        // transmisión, el cliente ya tiene el texto parcial y ve el mensaje cortado con
        // gracia en vez de un error crudo — el cierre del stream basta, no hace falta más.
      } finally {
        controller.close();
        // Costo REAL (no estimado) — el mensaje final del stream trae el conteo real de
        // tokens de Anthropic. Se registra después de cerrar, nunca bloquea la respuesta.
        try {
          const final = await stream.finalMessage();
          const admin = crearClienteAdmin();
          await registrarCostoIA(admin, {
            coupleId: membresia.couple_id,
            tipo: 'asistente',
            modelo: AI_MODEL,
            tokensEntrada: final.usage.input_tokens,
            tokensSalida: final.usage.output_tokens,
          });
        } catch {
          // silencioso — un costo no registrado no debe afectar nada más
        }
      }
    },
  });

  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
