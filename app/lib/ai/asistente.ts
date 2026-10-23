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

// Guía de uso que el asistente puede consultar para responder preguntas técnicas sobre la app. Mantenerla al día
// cuando cambie una pantalla: lo que no esté aquí, el asistente debe decir que no lo sabe.
export const GUIA_DE_USO = `GUÍA DE USO DE FAIRSY
- Menú de abajo: Hoy, Gastos, Metas y Reportes. Mi cuenta se abre con el engranaje de la pantalla Hoy.
- HOY: "Tu momento Fairsy" (mensaje del día, la planta que crece con la racha de días y una acción de hoy), la
  pregunta para los dos (cada uno responde aparte y las respuestas se revelan cuando responden los dos), el
  presupuesto del mes y el botón "Registrar gasto". Tocar la planta abre el calendario de la racha.
- REGISTRAR UN GASTO: en Gastos toquen "Nuevo gasto" (o "Registrar gasto" en Hoy). Eligen la categoría, el monto
  y, si quieren, una nota. Cada gasto se puede editar o eliminar desde la lista.
- ESCANEAR UN RECIBO: en Gastos, botón "Escanear recibo" (cámara o foto). La IA propone monto y categoría y ustedes
  confirman. Cuenta dentro del límite de su plan.
- REPARTO: cuánto del gasto le toca a cada uno. Puede ser cualquier porcentaje de 0 a 100 (por ejemplo 57 % y
  43 %): se escribe el número o se afina de a 1 con + y −. Se define al registrar un gasto ("Reparto … ajustar") y
  por categoría en "Editar reparto y pagos que se repiten", al final de Gastos.
- PAGOS QUE SE REPITEN (arriendo, servicios, suscripciones): en "Editar reparto y pagos que se repiten" activan
  "Se repite cada mes"; la app avisa un día antes y los muestra en "Pagos fijos del mes" para registrarlos con un toque.
- CATEGORÍAS: en el mismo editor pueden crear, renombrar o quitar categorías.
- CUENTAS ENTRE USTEDES (en Gastos): muestra el saldo pendiente y quién le debe a quién según lo que cada uno pagó y
  el reparto; es una tarjeta que está arriba de la lista de gastos. Si quien debe no puede pagar todo, anota un ABONO
  (casilla "Abono" y botón "Abonar" dentro de esa tarjeta, sin tocar nada más antes) y el saldo baja
  en ese valor; no se puede abonar más de lo que se debe. Cuando se pongan al día del todo, tocan "Ya nos pusimos
  al día" y el saldo vuelve a 0. Los viajes en otra moneda tienen su propio saldo.
- METAS: en Metas crean una meta con nombre, monto y fecha (opcional), le aportan con "Aportar a la meta" y ven el
  avance. Tocando el nombre de la meta se edita y ahí mismo se puede eliminar (se borran también sus aportes).
- VIAJES: dentro de Metas hay un espacio para viajes con su propia moneda y presupuesto; sus gastos se llevan aparte
  de los de la casa y por subcategoría. Los gastos y el viaje se pueden editar o eliminar.
- REPORTES: el mes frente al presupuesto, en qué se va el dinero por categoría, quién registró qué, la comparación
  con el mes anterior y cuánto ahorraron en metas. Se cambia de mes con las flechas.
- PRESUPUESTO MENSUAL: se define en Hoy y se compara solo con los gastos de la casa; aparece una alerta al llegar
  al 80 % y al pasarse.
- INVITAR A LA OTRA PERSONA: con el Código de Conexión. En Mi cuenta (o al crear el espacio) tocan "Enviar por
  WhatsApp"; la otra persona abre el enlace y entra al instante, sin correo y sin contraseña. Si ya tiene un código,
  puede ingresarlo en la pantalla de entrada.
- ENTRAR A LA APP: con "Continuar con Google" (un toque) o con el correo (llega un código de 8 números). La sesión
  queda abierta en el celular hasta que cierren sesión en Mi cuenta. Quien entró como invitado, sin correo, debe
  guardar su acceso en Mi cuenta ("Guardar mi acceso") antes de cerrar sesión; si no, pierde esa cuenta.
- PLAN: gratis incluye 3 escaneos de recibo y 3 preguntas al asistente EN TOTAL; el plan completo incluye 50 de cada
  uno al mes. El plan completo tiene 7 días gratis y un solo pago cubre a los dos. Se ve en Mi cuenta ("Tu plan").
  Si pagaron con otro correo, en "Tu plan" usan "Conectar mi compra". La suscripción se cancela desde el área de
  miembros de Hotmart.
- INSTALAR: en Mi cuenta ("Instalar app") para tener Fairsy en la pantalla de inicio del celular.
- PAÍS Y MONEDA: se cambian en Mi cuenta. SOPORTE: soporte@fairsy.lat.`;

const SYSTEM_BASE = `Eres el asistente de Fairsy, una app para que dos personas lleven sus gastos
compartidos. Haces DOS cosas:
1) Respondes preguntas sobre su dinero SOLO con los datos reales que se te dan abajo — nunca
   inventas montos, categorías ni monedas. Si la pregunta no se puede responder con esos datos,
   dilo con honestidad.
2) Explicas cómo usar la app (dónde está cada cosa y cómo se hace), basándote SOLO en la "GUÍA DE USO DE
   FAIRSY" de más abajo. Responde con los pasos concretos y cortos. Si lo que preguntan no está en la guía,
   no lo inventes: di que no estás seguro y que pueden escribir a soporte@fairsy.lat.
Si preguntan algo que no tiene que ver con sus cuentas ni con el uso de Fairsy, di amablemente que solo puedes
ayudar con eso. Respondes en español, corto y claro, tratando a los dos de "ustedes".
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
  la pantalla de Inicio.
- Cuando respondas sobre el presupuesto del mes, después de las cifras de la casa agrega UNA línea breve por
  cada viaje con presupuesto (gastado y lo que queda, en la moneda del viaje), aclarando que es aparte.`;

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
  partes.push(`Hoy es ${c.hoy}. Moneda de la casa: ${c.monedaCasa}.${c.nombres.length ? ` Integrantes: ${c.nombres.join(' y ')}.` : ''}`);

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
        c.viajes
          .map((v) => {
            const gastado = c.gastos.filter((g) => g.moneda && g.viaje === v.nombre).reduce((a, g) => a + g.monto, 0);
            const detalle =
              v.presupuesto !== null
                ? `presupuesto ${dinero(v.presupuesto, v.moneda)}, gastado ${dinero(gastado, v.moneda)}, ${
                    v.presupuesto - gastado >= 0 ? `quedan ${dinero(v.presupuesto - gastado, v.moneda)}` : `se pasaron por ${dinero(gastado - v.presupuesto, v.moneda)}`
                  }`
                : `sin presupuesto definido, gastado ${dinero(gastado, v.moneda)}`;
            return `  - ${v.nombre} (moneda ${v.moneda}): ${detalle}`;
          })
          .join('\n')
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
    system: `${SYSTEM_BASE}\n\n${GUIA_DE_USO}\n\n${construirContexto(contexto)}`,
    messages,
  });
}
