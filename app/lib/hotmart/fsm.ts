// Máquina de estados de la suscripción — función PURA (sin base de datos) para poder probarla sola.
// Reglas pensadas para que el acceso siempre quede ACOTADO por `accessUntil`, aunque se pierda un evento.

export type Estado = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'refunded' | 'chargeback';
export type Intervalo = 'mensual' | 'anual';

export const TRIAL_DIAS = 7;
export const GRACIA_DIAS = 5;
const CICLO_DIAS: Record<Intervalo, number> = { mensual: 31, anual: 366 };

// Ofertas reales del producto Fairsy en Hotmart (el código que va en `?off=` del enlace de pago).
export const OFERTAS: Record<string, Intervalo> = {
  '0kq05mk6': 'mensual',
  tif6z4p3: 'anual',
};

export interface Suscripcion {
  status: Estado;
  planInterval: Intervalo | null;
  trialEndsAt: Date | null;
  firstPaidAt: Date | null;
  accessUntil: Date;
  lastTransaction: string | null;
}

export interface EventoNormalizado {
  tipo: string;
  transaccion: string | null;
  intervalo: Intervalo | null;
  ocurridoEn: Date;
  precioPositivo: boolean;
}

export type Decision =
  | { accion: 'ignorar'; motivo: string }
  | { accion: 'aplicar'; siguiente: Suscripcion; inicioDePrueba: boolean; registrarVenta: boolean; registrarReversa: 'refund' | 'chargeback' | null };

const dias = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const ignorar = (motivo: string): Decision => ({ accion: 'ignorar', motivo });

export function decidir(actual: Suscripcion | null, ev: EventoNormalizado): Decision {
  switch (ev.tipo) {
    // PURCHASE_COMPLETE (la compra "madura" tras la garantía) NO mueve el acceso: ya lo movió su
    // PURCHASE_APPROVED. Procesarlo extendería el acceso dos veces por el mismo cobro.
    case 'PURCHASE_COMPLETE':
      return ignorar('PURCHASE_COMPLETE no cambia el acceso (ya lo hizo PURCHASE_APPROVED)');

    case 'PURCHASE_APPROVED': {
      const intervalo = ev.intervalo ?? actual?.planInterval ?? 'mensual';
      const esNueva = !actual || actual.status === 'refunded' || actual.status === 'chargeback' || actual.status === 'expired';

      if (esNueva) {
        if (actual && actual.lastTransaction && actual.lastTransaction === ev.transaccion) return ignorar('evento viejo de una transacción ya cerrada');
        // Las dos ofertas tienen 7 días de prueba: el primer APPROVED de una persona inicia la prueba.
        const fin = dias(ev.ocurridoEn, TRIAL_DIAS);
        return {
          accion: 'aplicar',
          inicioDePrueba: true,
          registrarVenta: false,
          registrarReversa: null,
          siguiente: { status: 'trialing', planInterval: intervalo, trialEndsAt: fin, firstPaidAt: null, accessUntil: dias(fin, GRACIA_DIAS), lastTransaction: ev.transaccion },
        };
      }

      // Confirmado con un aviso real de Hotmart (2026-10-06): el inicio de prueba llega como APPROVED con precio 0.
      // Un aviso sin cobro real nunca convierte a nadie en pagante ni extiende su acceso.
      if (!ev.precioPositivo) return ignorar('aviso sin cobro (precio 0): no mueve el acceso');
      if (actual.status === 'trialing' && actual.trialEndsAt && ev.ocurridoEn < actual.trialEndsAt) {
        return ignorar('segundo aviso dentro de la prueba');
      }
      if (ev.transaccion && ev.transaccion === actual.lastTransaction) return ignorar('transacción ya aplicada');

      // Primer cobro real tras la prueba, o renovación.
      return {
        accion: 'aplicar',
        inicioDePrueba: false,
        registrarVenta: ev.precioPositivo,
        registrarReversa: null,
        siguiente: {
          status: 'active',
          planInterval: intervalo,
          trialEndsAt: actual.trialEndsAt,
          firstPaidAt: actual.firstPaidAt ?? ev.ocurridoEn,
          accessUntil: dias(ev.ocurridoEn, CICLO_DIAS[intervalo] + GRACIA_DIAS),
          lastTransaction: ev.transaccion ?? actual.lastTransaction,
        },
      };
    }

    case 'PURCHASE_DELAYED':
      if (!actual || (actual.status !== 'active' && actual.status !== 'trialing')) return ignorar('sin suscripción vigente que atrasar');
      // La gracia ya está incluida en accessUntil: solo se marca el atraso, sin extender nada.
      return { accion: 'aplicar', inicioDePrueba: false, registrarVenta: false, registrarReversa: null, siguiente: { ...actual, status: 'past_due' } };

    case 'SUBSCRIPTION_CANCELLATION':
      if (!actual) return ignorar('cancelación de una suscripción desconocida');
      if (actual.status === 'refunded' || actual.status === 'chargeback') return ignorar('ya estaba reembolsada');
      return {
        accion: 'aplicar',
        inicioDePrueba: false,
        registrarVenta: false,
        registrarReversa: null,
        // Cancelar durante la prueba corta el acceso al fin de la prueba; cancelar un mes ya pagado lo respeta.
        siguiente: { ...actual, status: 'cancelled', accessUntil: actual.status === 'trialing' && actual.trialEndsAt ? actual.trialEndsAt : actual.accessUntil },
      };

    case 'PURCHASE_EXPIRED':
      if (!actual) return ignorar('expiración de una suscripción desconocida');
      return { accion: 'aplicar', inicioDePrueba: false, registrarVenta: false, registrarReversa: null, siguiente: { ...actual, status: 'expired', accessUntil: ev.ocurridoEn } };

    case 'PURCHASE_REFUNDED':
    case 'PURCHASE_CHARGEBACK': {
      if (!actual) return ignorar('reembolso de una suscripción desconocida');
      const reembolso = ev.tipo === 'PURCHASE_REFUNDED';
      return {
        accion: 'aplicar',
        inicioDePrueba: false,
        registrarVenta: false,
        registrarReversa: reembolso ? 'refund' : 'chargeback',
        // Siempre corta el acceso: es lo conservador para el negocio.
        siguiente: { ...actual, status: reembolso ? 'refunded' : 'chargeback', accessUntil: ev.ocurridoEn, lastTransaction: ev.transaccion ?? actual.lastTransaction },
      };
    }

    case 'SWITCH_PLAN':
      if (!actual || !ev.intervalo) return ignorar('cambio de plan sin suscripción o sin plan nuevo identificable');
      return { accion: 'aplicar', inicioDePrueba: false, registrarVenta: false, registrarReversa: null, siguiente: { ...actual, planInterval: ev.intervalo } };

    default:
      return ignorar(`evento fuera del catálogo: ${ev.tipo}`);
  }
}

// Eventos que la app entiende — el resto se registra y se responde 200 sin tocar nada.
export const EVENTOS_CONOCIDOS = new Set([
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'PURCHASE_DELAYED',
  'PURCHASE_EXPIRED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'SUBSCRIPTION_CANCELLATION',
  'SWITCH_PLAN',
]);
