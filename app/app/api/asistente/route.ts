import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { streamRespuestaAsistente, type MensajeChat } from '@/lib/ai/asistente';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// BFF (09-SEGURIDAD.md): el navegador nunca llama a Anthropic directo. Esta ruta arma el
// contexto con los gastos REALES de la pareja (vía RLS, con la sesión del usuario — nunca la
// clave secreta, no hace falta saltarse RLS para leer datos que igual son suyos) y transmite
// la respuesta en vivo con streaming (30-INTEGRACION-IA.md).
export async function POST(request: NextRequest) {
  const { pregunta, historial } = (await request.json()) as { pregunta?: string; historial?: MensajeChat[] };
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

  const hoy = new Date();
  const prefijoMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const mesLabel = `${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  const { data: gastos } = await supabase
    .from('expenses')
    .select('monto, fecha, nota, categories(nombre)')
    .eq('couple_id', membresia.couple_id)
    .gte('fecha', `${prefijoMes}-01`)
    .order('fecha', { ascending: false });

  const gastosParaIA = (gastos ?? []).map((g) => ({
    categoria: (g.categories as unknown as { nombre: string } | null)?.nombre ?? 'Sin categoría',
    monto: Number(g.monto),
    fecha: g.fecha,
    nota: g.nota,
  }));

  const stream = streamRespuestaAsistente(pregunta, (historial ?? []).slice(-10), gastosParaIA, mesLabel);

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
      }
    },
  });

  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
