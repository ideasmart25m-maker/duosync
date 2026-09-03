import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, AI_MODEL } from './anthropic';

export interface GastoParaAsistente {
  categoria: string;
  monto: number;
  fecha: string;
  nota: string | null;
}

export interface MensajeChat {
  rol: 'user' | 'assistant';
  texto: string;
}

const SYSTEM_BASE = `Eres el asistente de DuoSync Wallet, una app para que una pareja lleve sus gastos
compartidos. Respondes preguntas SOLO sobre los gastos reales que se te dan abajo — nunca
inventas montos ni categorías que no estén en la lista. Si la pregunta no se puede responder
con esos datos, dilo con honestidad. Respondes en español, corto y claro, tratando a la pareja
de "ustedes". No das consejos financieros profesionales — si preguntan algo así, aclaras que
eres una ayuda para organizar el registro, no un asesor financiero.`;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Agrupa por mes ("2026-09" → "septiembre de 2026") para que la IA pueda distinguir "este mes"
// de "el mes pasado" sin ambigüedad — antes solo se le pasaba el mes actual y no podía
// responder sobre meses anteriores (pedido real del usuario).
function construirContexto(gastos: GastoParaAsistente[]): string {
  if (gastos.length === 0) {
    return 'Todavía no han registrado ningún gasto.';
  }
  const porMes = new Map<string, GastoParaAsistente[]>();
  for (const g of gastos) {
    const [anio, mes] = g.fecha.split('-').map(Number);
    const clave = `${MESES[mes - 1]} de ${anio}`;
    if (!porMes.has(clave)) porMes.set(clave, []);
    porMes.get(clave)!.push(g);
  }

  const bloques = [...porMes.entries()].map(([mesLabel, delMes]) => {
    const lineas = delMes.map((g) => `  - ${g.categoria}: ${g.monto} el ${g.fecha}${g.nota ? ` (${g.nota})` : ''}`);
    const total = delMes.reduce((a, g) => a + g.monto, 0);
    return `${mesLabel} (total: ${total}):\n${lineas.join('\n')}`;
  });

  return `Historial de gastos (montos en la moneda de la pareja, sin símbolo), del más reciente al más antiguo:\n\n${bloques.join('\n\n')}`;
}

// Streaming (30-INTEGRACION-IA.md: texto corto/medio SIEMPRE con streaming — la mejora de UX
// percibida más grande). Devuelve el stream crudo de Anthropic; el Route Handler lo convierte
// a un ReadableStream de la Web API para la respuesta HTTP.
export function streamRespuestaAsistente(pregunta: string, historial: MensajeChat[], gastos: GastoParaAsistente[]) {
  const contexto = construirContexto(gastos);
  const messages: Anthropic.MessageParam[] = [
    ...historial.map((m) => ({ role: m.rol, content: m.texto }) as Anthropic.MessageParam),
    { role: 'user', content: pregunta },
  ];

  return anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_BASE}\n\n${contexto}`,
    messages,
  });
}
