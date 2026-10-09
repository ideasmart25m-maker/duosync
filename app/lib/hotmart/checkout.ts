// Enlaces de pago reales del producto Fairsy en Hotmart (verificados el 2026-10-06; son públicos, no secretos).
// El código `off` es el mismo que valida el webhook (lib/hotmart/fsm.ts → OFERTAS).
export const CHECKOUT_BASE = 'https://pay.hotmart.com/J107905702P';

export function urlCheckout(plan: 'mensual' | 'anual'): string {
  return `${CHECKOUT_BASE}?off=${plan === 'anual' ? 'tif6z4p3' : '0kq05mk6'}`;
}

// Al irse a pagar a Hotmart se pierde la URL con los datos de la vinculación (modo, código, clave del enlace).
// Se guardan en el navegador para retomarlos al volver a /gracias y entrar.
const CLAVE = 'fairsy-vinculacion-pendiente';

export interface VinculacionPendiente {
  modo: string;
  codigo: string;
  tk: string;
}

export function guardarVinculacionPendiente(v: VinculacionPendiente): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(v));
  } catch {
    /* sin almacenamiento: al volver entrará sin esos datos y la pareja se crea con un código nuevo */
  }
}

export function leerVinculacionPendiente(): VinculacionPendiente | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const v = JSON.parse(crudo) as Partial<VinculacionPendiente>;
    return { modo: v.modo === 'unirse' ? 'unirse' : 'crear', codigo: String(v.codigo ?? ''), tk: String(v.tk ?? '') };
  } catch {
    return null;
  }
}
