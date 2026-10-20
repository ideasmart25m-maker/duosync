import { redirect } from 'next/navigation';

// La pantalla Nosotros ya no existe: su racha y calendario pasaron a la planta de Inicio, la invitación y el plan a
// "Mi cuenta", y las cuentas a Reportes. Este enlace se deja para quien lo tenga guardado o abierto.
// (El catálogo de dinámicas, que solo mostraba ejemplos "Próximamente", quedó fuera del menú; sigue en el historial de git.)
export default function NosotrosRedirige() {
  redirect('/app/reportes');
}
