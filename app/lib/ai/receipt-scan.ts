import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, AI_MODEL } from './anthropic';

export interface CategoriaParaIA {
  id: string;
  nombre: string;
}

export interface ResultadoScan {
  monto: number;
  categoriaId: string | null;
  esRecibo: boolean;
}

// Salida forzada por esquema (tool use) — nunca se le pide "responde en JSON" a la libre: el
// modelo DEBE llamar esta tool con estos argumentos exactos (30-INTEGRACION-IA.md, "SALIDA
// ESTRUCTURADA"). `categoria_id` es un enum de las categorías REALES de la pareja — así la IA
// nunca puede inventar una categoría que no existe.
function construirTool(categorias: CategoriaParaIA[]) {
  return {
    name: 'registrar_lectura_recibo',
    description: 'Registra lo leído de la foto de un recibo o factura de gasto del hogar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        es_recibo: {
          type: 'boolean',
          description: 'true si la imagen es un recibo o factura legible; false si no se puede leer o no es un recibo.',
        },
        monto_total: {
          type: 'number',
          description: 'El monto TOTAL pagado, en la moneda que aparece en el recibo, sin símbolos ni separadores de miles.',
        },
        categoria_id: {
          type: 'string',
          enum: categorias.length > 0 ? categorias.map((c) => c.id) : ['sin_categorias'],
          description: 'El id de la categoría que mejor describe este gasto, de la lista de categorías reales de la pareja.',
        },
      },
      required: ['es_recibo', 'monto_total', 'categoria_id'],
      additionalProperties: false,
    },
  };
}

const EsquemaResultado = z.object({
  es_recibo: z.boolean(),
  monto_total: z.number().nonnegative(),
  categoria_id: z.string(),
});

// Reintenta UNA vez reinyectando el error de validación al modelo (no un reintento a ciegas —
// 30-INTEGRACION-IA.md). max_tokens limitado, modelo desde AI_MODEL, nunca hardcodeado.
export async function leerRecibo(imagenBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp', categorias: CategoriaParaIA[]): Promise<ResultadoScan> {
  const tool = construirTool(categorias);
  const listaCategorias = categorias.map((c) => `- ${c.id}: ${c.nombre}`).join('\n');

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imagenBase64 } },
        {
          type: 'text',
          text: `Lee esta foto de un recibo o factura de un gasto del hogar. Categorías disponibles (elige la que mejor calce):\n${listaCategorias}\n\nSi la imagen no es un recibo legible, marca es_recibo=false y monto_total=0.`,
        },
      ],
    },
  ];

  for (let intento = 0; intento <= 1; intento++) {
    const res = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
      messages,
    });

    const usoDeTool = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const parseado = EsquemaResultado.safeParse(usoDeTool?.input);

    if (parseado.success) {
      const { es_recibo, monto_total, categoria_id } = parseado.data;
      const categoriaValida = categorias.some((c) => c.id === categoria_id);
      return {
        esRecibo: es_recibo,
        monto: monto_total,
        categoriaId: categoriaValida ? categoria_id : null,
      };
    }

    // Reinyecta el error de validación para que el modelo se autocorrija (no un reintento ciego).
    messages.push({ role: 'assistant', content: res.content });
    messages.push({
      role: 'user',
      content: `La respuesta no cumplió el formato esperado: ${parseado.error.message}. Corrige y vuelve a llamar la herramienta.`,
    });
  }

  throw new Error('La IA no devolvió una lectura válida del recibo tras los reintentos.');
}
