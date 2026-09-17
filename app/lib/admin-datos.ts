import { crearClienteAdmin } from '@/lib/supabase/admin';

// Todas las consultas de este archivo usan la clave de servicio — es seguro porque SOLO se
// llaman desde páginas/rutas ya protegidas por `requireAdmin()`/`requireAdminApi()`. El gate
// real es esa verificación, no RLS (RLS igual sigue activo en las tablas y bloquea a cualquier
// usuario normal que intentara leerlas directo).

export interface ParejaAdmin {
  coupleId: string;
  plan: string;
  creadaEn: string;
  integrantes: { userId: string; email: string; nombre: string; role: string }[];
  ultimaActividad: string | null;
}

// Un renglón por PAREJA (no por usuario suelto) — es la unidad natural de esta app: cada
// pareja tiene 1-2 personas, un plan y una fecha de alta compartida.
export async function listarParejas(): Promise<ParejaAdmin[]> {
  const admin = crearClienteAdmin();

  const { data: couples } = await admin.from('couples').select('id, plan, created_at').order('created_at', { ascending: false });
  const { data: membresias } = await admin.from('couple_members').select('couple_id, user_id');
  const { data: perfiles } = await admin.from('profiles').select('id, nombre, role');

  // auth.users no se puede leer con un simple .from() — es un esquema protegido de Supabase;
  // se lee con la API de administración, que sí trae el correo real de cada cuenta.
  const { data: listaUsuarios } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailPorId = new Map((listaUsuarios?.users ?? []).map((u) => [u.id, u.email ?? '(sin correo)']));
  const nombrePorId = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));
  const rolePorId = new Map((perfiles ?? []).map((p) => [p.id, p.role]));

  // Última actividad real (de event_log) por pareja — cualquier acción de cualquiera de los dos.
  const { data: ultimosEventos } = await admin
    .from('event_log')
    .select('couple_id, created_at')
    .not('couple_id', 'is', null)
    .order('created_at', { ascending: false });
  const ultimaPorPareja = new Map<string, string>();
  for (const e of ultimosEventos ?? []) {
    if (e.couple_id && !ultimaPorPareja.has(e.couple_id)) ultimaPorPareja.set(e.couple_id, e.created_at);
  }

  const miembrosPorPareja = new Map<string, string[]>();
  for (const m of membresias ?? []) {
    if (!miembrosPorPareja.has(m.couple_id)) miembrosPorPareja.set(m.couple_id, []);
    miembrosPorPareja.get(m.couple_id)!.push(m.user_id);
  }

  return (couples ?? []).map((c) => ({
    coupleId: c.id,
    plan: c.plan,
    creadaEn: c.created_at,
    integrantes: (miembrosPorPareja.get(c.id) ?? []).map((uid) => ({
      userId: uid,
      email: emailPorId.get(uid) ?? '(sin correo)',
      nombre: nombrePorId.get(uid) ?? '(sin nombre)',
      role: rolePorId.get(uid) ?? 'user',
    })),
    ultimaActividad: ultimaPorPareja.get(c.id) ?? null,
  }));
}

export interface ResumenUsuarios {
  totalParejas: number;
  totalUsuarios: number;
  parejasCompletas: number; // 2 integrantes
  parejasIncompletas: number; // 1 integrante, esperando que se una el otro
  nuevasUltimos7Dias: number;
}

export async function obtenerResumenUsuarios(): Promise<ResumenUsuarios> {
  const parejas = await listarParejas();
  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  return {
    totalParejas: parejas.length,
    totalUsuarios: parejas.reduce((a, p) => a + p.integrantes.length, 0),
    parejasCompletas: parejas.filter((p) => p.integrantes.length >= 2).length,
    parejasIncompletas: parejas.filter((p) => p.integrantes.length === 1).length,
    nuevasUltimos7Dias: parejas.filter((p) => new Date(p.creadaEn) >= hace7Dias).length,
  };
}

export interface CostoIAResumen {
  costoHoyUsd: number;
  costoMesUsd: number;
  llamadasMes: number;
  porTipo: { tipo: string; llamadas: number; costoUsd: number }[];
}

export async function obtenerCostoIA(): Promise<CostoIAResumen> {
  const admin = crearClienteAdmin();
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const { data: llamadasMes } = await admin.from('ai_calls').select('tipo, costo_usd, created_at').gte('created_at', inicioMes.toISOString());

  const costoMesUsd = (llamadasMes ?? []).reduce((a, l) => a + Number(l.costo_usd), 0);
  const costoHoyUsd = (llamadasMes ?? []).filter((l) => new Date(l.created_at) >= inicioHoy).reduce((a, l) => a + Number(l.costo_usd), 0);

  const porTipoMap = new Map<string, { llamadas: number; costoUsd: number }>();
  for (const l of llamadasMes ?? []) {
    const actual = porTipoMap.get(l.tipo) ?? { llamadas: 0, costoUsd: 0 };
    actual.llamadas += 1;
    actual.costoUsd += Number(l.costo_usd);
    porTipoMap.set(l.tipo, actual);
  }

  return {
    costoHoyUsd,
    costoMesUsd,
    llamadasMes: (llamadasMes ?? []).length,
    porTipo: [...porTipoMap.entries()].map(([tipo, v]) => ({ tipo, ...v })),
  };
}

export interface UsoResumen {
  activadosAlgunaVez: number; // parejas que registraron al menos 1 acción real
  totalParejas: number;
  accionesUltimos7Dias: number; // eventos 'gasto_registrado' + 'pregunta_respondida' + 'meta_aporte'
  retencionD1: number | null; // % de altas de hace 7-30 días que volvieron al día siguiente
  retencionD7: number | null;
}

const EVENTOS_ACCION_REAL = ['gasto_registrado', 'pregunta_respondida', 'meta_aporte', 'meta_creada'];

export async function obtenerUso(): Promise<UsoResumen> {
  const admin = crearClienteAdmin();
  const { data: couples } = await admin.from('couples').select('id, created_at');
  const { data: eventos } = await admin.from('event_log').select('couple_id, tipo, created_at').in('tipo', EVENTOS_ACCION_REAL);

  const coupleIdsConAccion = new Set((eventos ?? []).map((e) => e.couple_id).filter((v): v is string => !!v));

  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  const accionesUltimos7Dias = (eventos ?? []).filter((e) => new Date(e.created_at) >= hace7Dias).length;

  // Retención D1/D7: entre las parejas dadas de alta hace más de 1 (o 7) días, ¿cuántas
  // tuvieron una acción real al día siguiente (o en la semana siguiente) de su alta?
  const calcularRetencion = (dias: number): number | null => {
    const elegibles = (couples ?? []).filter((c) => {
      const edad = (Date.now() - new Date(c.created_at).getTime()) / 86_400_000;
      return edad >= dias;
    });
    if (elegibles.length === 0) return null;
    const retenidas = elegibles.filter((c) => {
      const alta = new Date(c.created_at).getTime();
      const limite = alta + dias * 86_400_000;
      return (eventos ?? []).some((e) => e.couple_id === c.id && new Date(e.created_at).getTime() <= limite && new Date(e.created_at).getTime() > alta);
    });
    return Math.round((retenidas.length / elegibles.length) * 100);
  };

  return {
    activadosAlgunaVez: coupleIdsConAccion.size,
    totalParejas: (couples ?? []).length,
    accionesUltimos7Dias,
    retencionD1: calcularRetencion(1),
    retencionD7: calcularRetencion(7),
  };
}

// Identificador de ícono, no un emoji — el emoji como ícono está prohibido por el sistema de
// diseño (defecto real detectado por el revisor-visual). La pantalla mapea esto a un componente
// SVG (Lucide) dentro de un chip con el color semántico correspondiente.
export type IconoAviso = 'plug' | 'wallet' | 'bug' | 'check';

export interface AvisoAdmin {
  icono: IconoAviso;
  titulo: string;
  detalle: string;
  /** CTA opcional hacia dónde resolver el aviso — no todos los avisos tienen una acción clara. */
  accion?: { texto: string; href: string };
}

// Avisos automáticos (21-BACKOFFICE.md): el dueño no lee tablas buscando problemas, el panel se
// los empuja. Con las mismas queries del resto del panel — nada de infraestructura nueva. Si no
// hay nada urgente, devuelve un único aviso positivo.
export async function calcularAvisos(): Promise<AvisoAdmin[]> {
  const admin = crearClienteAdmin();
  const avisos: AvisoAdmin[] = [];

  // Hotmart todavía no está conectado — ningún webhook actualiza `couples.plan`, así que
  // ninguna pareja pasa a premium de verdad todavía. Es el aviso más importante del negocio hoy.
  const { count: parejasPremium } = await admin.from('couples').select('id', { count: 'exact', head: true }).eq('plan', 'premium');
  if (!parejasPremium) {
    avisos.push({
      icono: 'plug',
      titulo: 'Hotmart todavía no está conectado',
      // Lenguaje simple (defecto real detectado por el revisor-visual: "webhook" sin traducir).
      detalle:
        'Nadie puede pasar al plan pago todavía. Conecta Hotmart (el sistema que le avisa a tu app cuando alguien paga) para que las compras activen el plan Premium en automático.',
      accion: { texto: 'Ver estado de Ventas', href: '/admin/ventas' },
    });
  }

  // IA cara: costo del mes vs 20% de ingresos — sin ingresos reales (Hotmart) no se puede
  // calcular el %, así que solo se avisa si hay un costo real sin ningún ingreso que lo cubra.
  const costo = await obtenerCostoIA();
  if (costo.costoMesUsd > 5 && !parejasPremium) {
    avisos.push({
      icono: 'wallet',
      titulo: `La IA ya lleva gastados $${costo.costoMesUsd.toFixed(2)} USD este mes`,
      detalle: 'Todavía nadie paga (falta conectar Hotmart) — por ahora este gasto sale completo de tu bolsillo. Revisa los límites de uso si crece mucho.',
    });
  }

  // Errores en alza: más de 5 errores hoy.
  const { count: erroresHoy } = await admin
    .from('error_log')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
  if ((erroresHoy ?? 0) > 5) {
    avisos.push({
      icono: 'bug',
      titulo: `${erroresHoy} errores registrados hoy`,
      detalle: 'Revisa la sección Salud para ver cuáles se repiten más — esos son los que más urge arreglar.',
    });
  }

  if (avisos.length === 0) {
    avisos.push({ icono: 'check', titulo: 'Todo en orden', detalle: 'No hay nada que necesite tu atención ahora mismo.' });
  }

  return avisos;
}

export interface GastoCanal {
  id: string;
  channel: string;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export async function listarGastoPorCanal(): Promise<GastoCanal[]> {
  const admin = crearClienteAdmin();
  const { data } = await admin.from('acquisition_spend').select('id, channel, amount, currency, period_start, period_end').order('period_start', { ascending: false });
  return (data ?? []).map((r) => ({ id: r.id, channel: r.channel, amount: Number(r.amount), currency: r.currency, periodStart: r.period_start, periodEnd: r.period_end }));
}

export interface VentasResumen {
  parejasPremium: number;
  ingresosMesUsd: number | null; // null = Hotmart no conectado, sin dato real
  gananciaRealUsd: number | null;
  costoIAMesUsd: number;
  gastoAdquisicionTotalUsd: number;
}

// Ventas/negocio: ingresos y ganancia dependen del webhook de Hotmart, que todavía no existe —
// se declaran honestamente `null` en vez de inventar un número (pedido explícito del usuario).
// Lo que SÍ es real hoy: cuántas parejas están marcadas premium (0 siempre, hasta el webhook),
// el costo real de IA, y lo que el dueño haya anotado a mano en gasto de adquisición.
export async function obtenerVentasResumen(): Promise<VentasResumen> {
  const admin = crearClienteAdmin();
  const { count: parejasPremium } = await admin.from('couples').select('id', { count: 'exact', head: true }).eq('plan', 'premium');
  const costoIA = await obtenerCostoIA();
  const gastos = await listarGastoPorCanal();
  const gastoAdquisicionTotalUsd = gastos.reduce((a, g) => a + (g.currency === 'USD' ? g.amount : 0), 0);

  return {
    parejasPremium: parejasPremium ?? 0,
    ingresosMesUsd: null,
    gananciaRealUsd: null,
    costoIAMesUsd: costoIA.costoMesUsd,
    gastoAdquisicionTotalUsd,
  };
}

export interface PuntoSerie {
  etiqueta: string;
  valor: number;
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function etiquetaDia(fecha: Date): string {
  return `${DIAS_CORTOS[fecha.getDay()]} ${fecha.getDate()}`;
}

// Arma los `dias` días vacíos (0) desde hoy hacia atrás, en orden cronológico — así el gráfico
// siempre tiene sus 14 puntos aunque no haya pasado nada en varios de ellos.
function diasVacios(dias: number): Map<string, number> {
  const mapa = new Map<string, number>();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    mapa.set(d.toISOString().slice(0, 10), 0);
  }
  return mapa;
}

function serieDesdeMapa(mapa: Map<string, number>, decimales = 0): PuntoSerie[] {
  return [...mapa.entries()].map(([fecha, valor]) => ({
    etiqueta: etiquetaDia(new Date(`${fecha}T00:00:00`)),
    valor: Number(valor.toFixed(decimales)),
  }));
}

// Costo real de IA por día, últimos `dias` — la tendencia que le importa al dueño: ¿está
// subiendo el gasto o está estable? (21-BACKOFFICE.md, 31-EVALS-OBSERVABILIDAD).
export async function obtenerSerieCostoIA(dias = 14): Promise<PuntoSerie[]> {
  const admin = crearClienteAdmin();
  const porDia = diasVacios(dias);
  const desde = [...porDia.keys()][0];
  const { data } = await admin.from('ai_calls').select('costo_usd, created_at').gte('created_at', `${desde}T00:00:00Z`);
  for (const l of data ?? []) {
    const clave = l.created_at.slice(0, 10);
    if (porDia.has(clave)) porDia.set(clave, (porDia.get(clave) ?? 0) + Number(l.costo_usd));
  }
  return serieDesdeMapa(porDia, 3);
}

// Parejas nuevas por día, últimos `dias` — la curva de crecimiento real (36-ANALITICA-Y-EVENTOS).
export async function obtenerSerieUsuarios(dias = 14): Promise<PuntoSerie[]> {
  const admin = crearClienteAdmin();
  const porDia = diasVacios(dias);
  const desde = [...porDia.keys()][0];
  const { data } = await admin.from('couples').select('created_at').gte('created_at', `${desde}T00:00:00Z`);
  for (const c of data ?? []) {
    const clave = c.created_at.slice(0, 10);
    if (porDia.has(clave)) porDia.set(clave, (porDia.get(clave) ?? 0) + 1);
  }
  return serieDesdeMapa(porDia);
}

// Errores por día, últimos `dias` — ¿va subiendo o va bajando? (31-EVALS-OBSERVABILIDAD).
export async function obtenerSerieErrores(dias = 14): Promise<PuntoSerie[]> {
  const admin = crearClienteAdmin();
  const porDia = diasVacios(dias);
  const desde = [...porDia.keys()][0];
  const { data } = await admin.from('error_log').select('created_at').gte('created_at', `${desde}T00:00:00Z`);
  for (const e of data ?? []) {
    const clave = e.created_at.slice(0, 10);
    if (porDia.has(clave)) porDia.set(clave, (porDia.get(clave) ?? 0) + 1);
  }
  return serieDesdeMapa(porDia);
}

export interface ErrorAgrupado {
  message: string;
  context: string;
  veces: number;
  ultimaVez: string;
}

export async function obtenerErroresAgrupados(): Promise<ErrorAgrupado[]> {
  const admin = crearClienteAdmin();
  const { data } = await admin.from('error_log').select('message, context, created_at').order('created_at', { ascending: false }).limit(500);

  const grupos = new Map<string, ErrorAgrupado>();
  for (const e of data ?? []) {
    const clave = `${e.context}::${e.message}`;
    if (!grupos.has(clave)) {
      grupos.set(clave, { message: e.message, context: e.context, veces: 0, ultimaVez: e.created_at });
    }
    grupos.get(clave)!.veces += 1;
  }
  return [...grupos.values()].sort((a, b) => b.veces - a.veces);
}
