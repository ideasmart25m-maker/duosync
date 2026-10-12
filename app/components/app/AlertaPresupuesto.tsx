'use client';

// Aviso del presupuesto: aparece cuando ya van en el 80 % o más, cuando se pasaron, o cuando lo que falta por
// pagar de los pagos fijos los haría pasarse. Texto simple y con la cifra concreta; nada de alarmas.

import { TriangleAlert } from 'lucide-react';
import type { EstadoPresupuesto } from '@/lib/presupuesto';

export function AlertaPresupuesto({ estado, formatear }: { estado: EstadoPresupuesto; formatear: (n: number) => string }) {
  const { nivel, porcentaje, restante, excedido, pendientesFijos, pasaPorFijos, excedidoProyectado } = estado;
  if (nivel === 'sin' || (nivel === 'bien' && !pasaPorFijos)) return null;

  const pendientesTexto = pendientesFijos > 0 ? `Todavía faltan ${formatear(pendientesFijos)} de pagos fijos por registrar` : '';
  let titulo: string;
  let detalle: string;
  if (nivel === 'pasado') {
    titulo = `Se pasaron del presupuesto por ${formatear(excedido)}`;
    detalle = pendientesTexto ? `${pendientesTexto}.` : 'Conviene frenar los gastos que se puedan aplazar este mes.';
  } else if (pasaPorFijos) {
    titulo = 'Cuidado: los pagos fijos que faltan los harían pasarse';
    detalle = `${pendientesTexto}. Si los pagan, se pasarían del presupuesto por ${formatear(excedidoProyectado)}. Hoy les quedan ${formatear(restante)}.`;
  } else {
    titulo = `Ya llevan el ${porcentaje}% del presupuesto`;
    detalle = `Les quedan ${formatear(restante)} para el resto del mes.${pendientesTexto ? ` ${pendientesTexto}.` : ''}`;
  }

  const peligro = nivel === 'pasado';
  const color = peligro ? 'var(--danger)' : 'var(--cat-amber)';
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-[var(--radius-button)] p-3"
      style={{ backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      <TriangleAlert size={18} strokeWidth={2.2} color={color} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{titulo}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{detalle}</p>
      </div>
    </div>
  );
}
