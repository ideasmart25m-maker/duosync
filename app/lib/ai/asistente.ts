import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, AI_MODEL } from './anthropic';

export interface GastoParaAsistente {
  categoria: string;
  monto: number;
  fecha: string;
  nota: string | null;
  moneda: string | null; // null = moneda de la casa; 'EUR'/'USD'/… = gasto de un viaje
  viaje: string | null;
  subcategoria: string | null;
  pagoPor: string | null;
}

export interface MetaParaAsistente {
  nombre: string;
  actual: number;
  objetivo: number;
  fecha: string | null;
}

export interface ViajeParaAsistente {
  nombre: string;
  moneda: string;
  presupuesto: number | null;
}

export interface ContextoAsistente {
  hoy: string; // yyyy-mm-dd
  monedaCasa: string; // código ISO de la moneda de la casa (COP, MXN…)
  presupuestoMensual: number | null;
  nombres: string[];
  gastos: GastoParaAsistente[];
  metas: MetaParaAsistente[];
  viajes: ViajeParaAsistente[];
}

export interface MensajeChat {
  rol: 'user' | 'assistant';
  texto: string;
}

const SYSTEM_BASE = `Eres el asistente de Fairsy, una app para que una pareja lleve sus gastos
compartidos. Respondes preguntas SOLO con los datos reales que se te dan abajo — nunca
inventas montos, categorías ni monedas. Si la pregunta no se puede responder con esos datos,
dilo con honestidad. Respondes en español, corto y claro, tratando a la pareja de "ustedes".
No das consejos financieros profesionales — si preguntan algo así, aclaras que eres una ayuda
para organizar el registro, no un asesor financiero.

REGLAS DE MONEDA (obligatorias):
- Di SIEMPRE la moneda junto a cada monto (por ejemplo "120.000 COP", "300 EUR"). Nunca un número suelto.
- Nunca sumes ni compares montos de monedas distintas. Los gastos de un viaje están en la moneda del
  viaje y se informan aparte de los gastos de la casa.
- El presupuesto mensual se compara SOLO con los gastos de la casa (la moneda de la casa), nunca con
  los de los viajes ni con lo que ahorran en sus metas (ahorrar no es gastar).
- Si te piden cómo van con el presupuesto, usa la línea "PRESUPUESTO DE ESTE MES" de abajo: ya trae las
  cuentas hechas. Si ahí dice que no hay presupuesto definido, dilo y explica que lo pueden poner en
  la pantalla de Inicio.`;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function dinero(monto: number, moneda: string): string {
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(monto)} ${moneda}`;
}

function nombreMes(iso: string): string {
  const [anio, mes] = iso.split('-').map(Number);
  return `${MESES[mes - 1]} de ${anio}`;
}

// Todo lo que la IA necesita para responder bien, con las cuentas ya hechas en código (la IA no suma):
// fecha de hoy, presupuesto del mes contra lo gastado en la casa, gastos por mes SEPARADOS entre casa y
// cada viaje (cada uno con su moneda), metas y viajes.
export function construirContexto(c: ContextoAsistente): string {
  const partes: string[] = [];
  partes.push(`Hoy es ${c.hoy}. Moneda de la casa: ${c.monedaCasa}.${c.nombres.length ? ` Integrantes de la pareja: ${c.nombres.join(' y ')}.` : ''}`);

  const mesActual = c.hoy.slice(0, 7);
  const gastadoCasaMes = c.gastos.filter((g) => !g.moneda && g.fecha.startsWith(mesActual)).reduce((a, g) => a + g.monto, 0);
  if (c.presupuestoMensual !== null) {
    const saldo = c.presupuestoMensual - gastadoCasaMes;
    partes.push(
      `PRESUPUESTO DE ESTE MES (${nombreMes(`${mesActual}-01`)}): presupuesto ${dinero(c.presupuestoMensual, c.monedaCasa)}; gastado en la casa a hoy ${dinero(gastadoCasaMes, c.monedaCasa)}; ` +
        (saldo >= 0 ? `les quedan ${dinero(saldo, c.monedaCasa)}.` : `se pasaron por ${dinero(-saldo, c.monedaCasa)}.`)
    );
  } else {
    partes.push(`PRESUPUESTO DE ESTE MES: todavía no definieron un presupuesto mensual (lo pueden poner en la pantalla de Inicio). Gastado en la casa a hoy: ${dinero(gastadoCasaMes, c.monedaCasa)}.`);
  }

  if (c.metas.length) {
    partes.push(
      'METAS DE AHORRO (el ahorro NO cuenta como gasto):\n' +
        c.metas.map((m) => `  - ${m.nombre}: llevan ${dinero(m.actual, c.monedaCasa)} de ${dinero(m.objetivo, c.monedaCasa)}${m.fecha ? `, para el ${m.fecha}` : ''}`).join('\n')
    );
  }
  if (c.viajes.length) {
    partes.push(
      'VIAJES (cada uno en su propia moneda):\n' +
        c.viajes.map((v) => `  - ${v.nombre}: moneda ${v.moneda}${v.presupuesto !== null ? `, presupuesto ${dinero(v.presupuesto, v.moneda)}` : ', sin presupuesto definido'}`).join('\n')
    );
  }

  if (c.gastos.length === 0) {
    partes.push('Todavía no han registrado ningún gasto.');
    return partes.join('\n\n');
  }

  const porMes = new Map<string, GastoParaAsistente[]>();
  for (const g of c.gastos) {
    const clave = g.fecha.slice(0, 7);
    if (!porMes.has(clave)) porMes.set(clave, []);
    porMes.get(clave)!.push(g);
  }

  const bloques = [...porMes.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([mes, delMes]) => {
      const casa = delMes.filter((g) => !g.moneda);
      const viaje = delMes.filter((g) => g.moneda);
      const lineaGasto = (g: GastoParaAsistente, moneda: string) =>
        `  - ${g.moneda ? (g.subcategoria ?? 'gasto del viaje') : g.categoria}: ${dinero(g.monto, moneda)} el ${g.fecha}${g.pagoPor ? `, pagó ${g.pagoPor}` : ''}${g.nota ? ` (${g.nota})` : ''}`;
      const sec: string[] = [`${nombreMes(`${mes}-01`)}:`];
      if (casa.length) {
        sec.push(`Gastos de la casa — total ${dinero(casa.reduce((a, g) => a + g.monto, 0), c.monedaCasa)}:`);
        sec.push(...casa.map((g) => lineaGasto(g, c.monedaCasa)));
      }
      const porViaje = new Map<string, GastoParaAsistente[]>();
      for (const g of viaje) {
        const k = `${g.viaje ?? 'Viaje sin nombre'}|${g.moneda}`;
        if (!porViaje.has(k)) porViaje.set(k, []);
        porViaje.get(k)!.push(g);
      }
      for (const [k, lista] of porViaje) {
        const [nombre, moneda] = k.split('|');
        sec.push(`Viaje "${nombre}" — total ${dinero(lista.reduce((a, g) => a + g.monto, 0), moneda)}:`);
        sec.push(...lista.map((g) => lineaGasto(g, moneda)));
      }
      return sec.join('\n');
    });

  partes.push(`HISTORIAL DE GASTOS, del mes más reciente al más antiguo:\n\n${bloques.join('\n\n')}`);
  return partes.join('\n\n');
}

// Streaming (30-INTEGRACION-IA.md: texto corto/medio SIEMPRE con streaming — la mejora de UX
// percibida más grande). Devuelve el stream crudo de Anthropic; el Route Handler lo convierte
// a un ReadableStream de la Web API para la respuesta HTTP.
export function streamRespuestaAsistente(pregunta: string, historial: MensajeChat[], contexto: ContextoAsistente) {
  const messages: Anthropic.MessageParam[] = [
    ...historial.map((m) => ({ role: m.rol, content: m.texto }) as Anthropic.MessageParam),
    { role: 'user', content: pregunta },
  ];

  return anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_BASE}\n\n${construirContexto(contexto)}`,
    messages,
  });
}
