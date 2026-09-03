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

function construirContexto(gastos: GastoParaAsistente[], mesLabel: string): string {
  if (gastos.length === 0) {
    return `Gastos de ${mesLabel}: todavía no han registrado ningún gasto este mes.`;
  }
  const lineas = gastos.map((g) => `- ${g.categoria}: ${g.monto} el ${g.fecha}${g.nota ? ` (${g.nota})` : ''}`);
  const total = gastos.reduce((a, g) => a + g.monto, 0);
  return `Gastos de ${mesLabel} (montos en la moneda de la pareja, sin símbolo):\n${lineas.join('\n')}\n\nTotal del mes: ${total}`;
}

// Streaming (30-INTEGRACION-IA.md: texto corto/medio SIEMPRE con streaming — la mejora de UX
// percibida más grande). Devuelve el stream crudo de Anthropic; el Route Handler lo convierte
// a un ReadableStream de la Web API para la respuesta HTTP.
export function streamRespuestaAsistente(pregunta: string, historial: MensajeChat[], gastos: GastoParaAsistente[], mesLabel: string) {
  const contexto = construirContexto(gastos, mesLabel);
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
