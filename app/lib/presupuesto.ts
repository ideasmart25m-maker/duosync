// Estado del presupuesto del mes. Función pura (sin base de datos ni pantalla) para poder probarla sola.
//
// Un gasto inaplazable (servicios públicos, arriendo) llega aunque el presupuesto ya esté casi lleno, así que
// además de mirar lo gastado se cuenta lo que TODAVÍA falta pagar de los pagos fijos del mes.

export type NivelPresupuesto = 'sin' | 'bien' | 'cerca' | 'pasado';

export interface EstadoPresupuesto {
  nivel: NivelPresupuesto;
  /** Porcentaje gastado del presupuesto (puede pasar de 100). */
  porcentaje: number;
  /** Lo que queda (negativo si ya se pasaron). */
  restante: number;
  /** Cuánto se pasaron (0 si no se han pasado). */
  excedido: number;
  /** Pagos fijos del mes que todavía no se registran. */
  pendientesFijos: number;
  /** Con lo que falta de pagos fijos, ¿se pasarían del presupuesto aunque hoy no se hayan pasado? */
  pasaPorFijos: boolean;
  /** Cuánto se pasarían si pagan todo lo fijo que falta (0 si no se pasan). */
  excedidoProyectado: number;
}

export const UMBRAL_ALERTA = 0.8;

export function evaluarPresupuesto(gastado: number, presupuesto: number | null, pendientesFijos = 0): EstadoPresupuesto {
  const pendientes = Math.max(0, pendientesFijos);
  if (presupuesto === null || !(presupuesto > 0)) {
    return { nivel: 'sin', porcentaje: 0, restante: 0, excedido: 0, pendientesFijos: pendientes, pasaPorFijos: false, excedidoProyectado: 0 };
  }
  const porcentaje = Math.round((gastado / presupuesto) * 100);
  const restante = presupuesto - gastado;
  const excedido = Math.max(0, gastado - presupuesto);
  const excedidoProyectado = Math.max(0, gastado + pendientes - presupuesto);
  const nivel: NivelPresupuesto = gastado > presupuesto ? 'pasado' : gastado >= presupuesto * UMBRAL_ALERTA ? 'cerca' : 'bien';
  return {
    nivel,
    porcentaje,
    restante,
    excedido,
    pendientesFijos: pendientes,
    pasaPorFijos: nivel !== 'pasado' && excedidoProyectado > 0,
    excedidoProyectado,
  };
}
