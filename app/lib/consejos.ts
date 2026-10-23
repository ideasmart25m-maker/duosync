// Mensaje del día y acción del día de "Tu momento Fairsy". Rotan solos, sin IA y sin costo: el de hoy sale de la
// fecha, así que los dos integrantes ven el MISMO cada día. Texto neutro (sirve igual a una pareja, a amigos o a
// quienes comparten casa): habla de "los dos" y de "ustedes", nunca de "pareja".

export interface MensajeDelDia {
  /** Frase corta que va en negrita. */
  titulo: string;
  /** Segunda frase, en peso normal. */
  detalle: string;
}

export type DestinoAccion = 'gastos' | 'metas' | 'reportes' | 'pregunta' | 'presupuesto' | 'cuenta' | null;

export interface AccionDelDia {
  texto: string;
  destino: DestinoAccion;
}

export const HREF_DESTINO: Record<Exclude<DestinoAccion, null>, string> = {
  gastos: '/app/gastos',
  metas: '/app/metas',
  reportes: '/app/reportes',
  pregunta: '#pregunta-del-dia',
  presupuesto: '#presupuesto-mensual',
  cuenta: '/app/cuenta',
};

export const MENSAJES: MensajeDelDia[] = [
  { titulo: 'No tienen que resolverlo todo hoy.', detalle: 'Un pequeño paso también es progreso.' },
  { titulo: 'Cada aporte cuenta,', detalle: 'sin importar quién aporte más. Lo importante es avanzar juntos.' },
  { titulo: 'Las cuentas claras', detalle: 'cuidan la tranquilidad de los dos.' },
  { titulo: 'Hablar de dinero no es discutir.', detalle: 'Es ponerse de acuerdo para estar mejor.' },
  { titulo: 'Un gasto pequeño anotado a tiempo', detalle: 'evita una discusión grande después.' },
  { titulo: 'No se trata de gastar menos,', detalle: 'sino de gastar en lo que de verdad les importa.' },
  { titulo: 'Lo que se ve, se cuida.', detalle: 'Mirar sus números juntos ya es una buena costumbre.' },
  { titulo: 'Ahorrar es regalarse tranquilidad', detalle: 'para el futuro de los dos.' },
  { titulo: 'Nadie nace sabiendo de presupuestos.', detalle: 'Se aprende un mes a la vez.' },
  { titulo: 'Equivocarse con un gasto no es grave.', detalle: 'Corregirlo a tiempo, sí vale la pena.' },
  { titulo: 'Celebren lo que sí lograron este mes,', detalle: 'por pequeño que parezca.' },
  { titulo: 'Un acuerdo claro hoy', detalle: 'les ahorra una molestia mañana.' },
  { titulo: 'Planear no quita la espontaneidad.', detalle: 'La hace posible sin culpa.' },
  { titulo: 'La constancia pesa más que la perfección.', detalle: 'Anotar casi todo ya es muchísimo.' },
  { titulo: 'Compartir gastos es compartir confianza.', detalle: 'Cuídenla con claridad.' },
  { titulo: 'Preguntar "¿cómo vamos?" a tiempo', detalle: 'es mejor que enterarse a fin de mes.' },
  { titulo: 'El presupuesto no es una jaula.', detalle: 'Es un mapa para llegar adonde quieren.' },
  { titulo: 'Una meta compartida', detalle: 'se siente más cerca cuando los dos aportan.' },
  { titulo: 'Los pagos fijos no sorprenden', detalle: 'cuando se anotan con tiempo.' },
  { titulo: 'Hoy puede ser el día', detalle: 'en que dejan de preguntarse "¿en qué se nos fue la dinero?".' },
  { titulo: 'Menos incertidumbre,', detalle: 'más ganas de planear cosas juntos.' },
  { titulo: 'Dividir justo no siempre es dividir en partes iguales.', detalle: 'Hablen de lo que a cada uno le parece justo.' },
  { titulo: 'Los grandes cambios', detalle: 'empiezan con un registro de hoy.' },
  { titulo: 'Reconozcan el esfuerzo del otro:', detalle: 'llevar las cuentas también es trabajo.' },
  { titulo: 'Un mes sin sorpresas', detalle: 'se construye con pequeñas revisiones.' },
  { titulo: 'No comparen su dinero con la de nadie.', detalle: 'Comparen su avance con el de ustedes del mes pasado.' },
  { titulo: 'Tener un fondo para imprevistos', detalle: 'convierte los sustos en simples contratiempos.' },
  { titulo: 'Un par de minutos a la semana', detalle: 'bastan para tener las cuentas en orden.' },
  { titulo: 'Decidir juntos pesa menos', detalle: 'que decidir y cargar solo con la duda.' },
  { titulo: 'Si hoy no fue un buen día de gastos,', detalle: 'mañana es un buen día para empezar de nuevo.' },
  { titulo: 'La claridad también es una forma de cuidado.', detalle: 'Gracias por cuidarse así.' },
  { titulo: 'Anoten el gasto mientras se acuerdan:', detalle: 'su yo del fin de mes se los va a agradecer.' },
  { titulo: 'Una charla corta sobre dinero', detalle: 'vale más que una larga y tensa.' },
  { titulo: 'Lo pequeño suma:', detalle: 'cada aporte a la meta los acerca a lo que quieren.' },
  { titulo: 'Fijar un tope para los antojos', detalle: 'deja disfrutarlos sin culpa.' },
  { titulo: 'Equipo no es pensar igual,', detalle: 'es ponerse de acuerdo con respeto.' },
  { titulo: 'Un presupuesto realista', detalle: 'es mejor que uno perfecto que nadie cumple.' },
  { titulo: 'Ordenar las cuentas', detalle: 'deja espacio para disfrutar lo que sí importa.' },
  { titulo: 'Una revisión a tiempo', detalle: 'puede ahorrarles un mes de apuros.' },
  { titulo: 'La mejor decisión financiera', detalle: 'es la que los dos entienden y apoyan.' },
  { titulo: 'No hace falta ganar más para sentirse mejor:', detalle: 'a veces basta con ver con claridad.' },
  { titulo: 'Cuando las cuentas están claras,', detalle: 'hay más energía para lo bueno.' },
  { titulo: 'Su racha no se trata de cumplir:', detalle: 'se trata de acordarse el uno del otro.' },
  { titulo: 'Lo que hoy parece un detalle', detalle: 'mañana es un hábito que los cuida.' },
  { titulo: 'Un recordatorio amable:', detalle: 'cada gasto anotado es un problema menos por resolver después.' },
  { titulo: 'Ir despacio también es avanzar.', detalle: 'Lo importante es no dejar de hacerlo juntos.' },
  { titulo: 'Se vale tener meses malos.', detalle: 'Lo valioso es mirar qué aprendieron.' },
  { titulo: 'Proteger lo compartido', detalle: 'empieza por tener claro cuánto hay y para qué.' },
  { titulo: 'Pequeñas victorias, grandes metas.', detalle: 'Hoy ya sumaron una más.' },
];

export const ACCIONES: AccionDelDia[] = [
  { texto: 'Dediquen 5 minutos a revisar los gastos de la semana y anoten un ajuste si hace falta.', destino: 'gastos' },
  { texto: 'Anoten hoy el gasto que se les haya quedado sin registrar.', destino: 'gastos' },
  { texto: 'Miren juntos cómo va el mes frente al presupuesto.', destino: 'reportes' },
  { texto: 'Respondan hoy la pregunta del día, cada uno por su lado.', destino: 'pregunta' },
  { texto: 'Hagan un pequeño aporte a su meta, aunque sea simbólico.', destino: 'metas' },
  { texto: 'Revisen cuáles pagos fijos vencen en los próximos días.', destino: 'gastos' },
  { texto: 'Miren en qué categoría se fue más dinero este mes.', destino: 'reportes' },
  { texto: 'Pónganle fecha a una meta para que se sienta más real.', destino: 'metas' },
  { texto: 'Revisen que el reparto de cada categoría les siga pareciendo justo.', destino: 'gastos' },
  { texto: 'Comparen este mes con los meses anteriores.', destino: 'reportes' },
  { texto: 'Acuerden un tope para una categoría que se les esté yendo de las manos.', destino: 'gastos' },
  { texto: 'Anoten lo que gastaron en comida hoy.', destino: 'gastos' },
  { texto: 'Cuenten cuánto llevan ahorrado en sus metas.', destino: 'metas' },
  { texto: 'Revisen quién ha pagado qué este mes y si les parece equilibrado.', destino: 'reportes' },
  { texto: 'Pregúntense cuál gasto del mes volverían a hacer sin dudarlo.', destino: 'pregunta' },
  { texto: 'Escojan una categoría y revisen si el valor de su pago fijo sigue vigente.', destino: 'gastos' },
  { texto: 'Hagan una revisión de 3 minutos: ¿hay algo que no cuadre?', destino: 'gastos' },
  { texto: 'Piensen en un gasto que quieran evitar el resto del mes y anótenlo como acuerdo.', destino: 'gastos' },
  { texto: 'Planeen juntos un gasto grande que se viene, antes de que llegue.', destino: 'metas' },
  { texto: 'Revisen si hay un viaje o plan con presupuesto aparte por organizar.', destino: 'metas' },
  { texto: 'Miren el reporte del mes y elijan una sola cosa para mejorar.', destino: 'reportes' },
  { texto: 'Anoten los gastos del fin de semana mientras los recuerdan.', destino: 'gastos' },
  { texto: 'Agradézcanse algo concreto que el otro hizo por las cuentas de los dos.', destino: null },
  { texto: 'Tomen una foto de un recibo y dejen que Fairsy lo lea por ustedes.', destino: 'gastos' },
  { texto: 'Pregunten al asistente cuánto les queda del presupuesto este mes.', destino: 'gastos' },
  { texto: 'Revisen cuánto falta para llegar a su próxima meta.', destino: 'metas' },
  { texto: 'Vean cuántos días seguidos llevan respondiendo la pregunta y celébrenlo.', destino: 'pregunta' },
  { texto: 'Revisen cuánto va a costar el mes que viene en pagos fijos.', destino: 'gastos' },
  { texto: 'Dejen anotado hoy un pago fijo que todavía no hayan registrado.', destino: 'gastos' },
  { texto: 'Compartan con alguien de confianza qué han aprendido de sus cuentas.', destino: null },
  { texto: 'Revisen la foto de perfil y el nombre que cada uno tiene en la app.', destino: 'cuenta' },
  { texto: 'Elijan juntos una categoría para reducir un poco este mes.', destino: 'reportes' },
  { texto: 'Aparten hoy un pequeño valor para imprevistos.', destino: 'metas' },
  { texto: 'Miren si el saldo entre ustedes está al día.', destino: 'gastos' },
  { texto: 'Anoten un gasto en el que se hayan sentido a gusto este mes.', destino: 'gastos' },
  { texto: 'Hagan una pausa de 5 minutos para hablar de cómo se sienten con la dinero.', destino: 'pregunta' },
  { texto: 'Revisen la lista de gastos del mes y borren o corrijan lo que esté mal.', destino: 'gastos' },
  { texto: 'Piensen en una meta nueva que les ilusione y créenla.', destino: 'metas' },
  { texto: 'Vean los últimos 6 meses y busquen un patrón que les llame la atención.', destino: 'reportes' },
];

// Número de días desde una fecha fija: sirve de "contador" estable para escoger el mensaje de hoy.
function numeroDeDia(fecha: string): number {
  const [a, m, d] = fecha.split('-').map(Number);
  return Math.floor(Date.UTC(a, m - 1, d) / 86_400_000);
}

// Pequeño mezclador del id de la casa: dos casas distintas no ven el mismo mensaje el mismo día, pero los dos
// integrantes de una misma casa sí.
function semilla(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Lo que la acción del día necesita saber de la casa para no pedir algo que ya hicieron. */
export interface EstadoCasa {
  tienePresupuesto: boolean;
  tieneMeta: boolean;
}

const ACCION_PRESUPUESTO: AccionDelDia = { texto: 'Definan su presupuesto del mes: así saben cuánto les queda y cuándo ir más despacio.', destino: 'presupuesto' };
const ACCION_META: AccionDelDia = { texto: 'Pónganle nombre a una meta que quieran lograr juntos.', destino: 'metas' };

/** Mensaje y acción de hoy. `fecha` es yyyy-mm-dd (la de la casa); mismo resultado todo el día para los dos. Mientras
 *  no tengan presupuesto o meta, la acción es crearlos (lo que más les sirve); después rota sola. */
export function consejoDelDia(fecha: string, casaId: string, estado?: EstadoCasa): { mensaje: MensajeDelDia; accion: AccionDelDia } {
  const base = numeroDeDia(fecha) + semilla(casaId);
  const rotativa = ACCIONES[(base * 7 + 3) % ACCIONES.length];
  const accion = estado && !estado.tienePresupuesto ? ACCION_PRESUPUESTO : estado && !estado.tieneMeta ? ACCION_META : rotativa;
  return { mensaje: MENSAJES[base % MENSAJES.length], accion };
}
