// Monedas de viaje (pedido real del usuario): registrar un gasto en el extranjero SIN
// convertirlo a la moneda de la casa — la conversión real depende de cómo pagaron (efectivo,
// tarjeta, a cuotas), así que forzarla haría el número menos fiel, no más.
export interface MonedaViaje {
  codigo: string; // ISO 4217
  nombre: string;
}

export const MONEDAS_VIAJE: MonedaViaje[] = [
  { codigo: 'USD', nombre: 'Dólares' },
  { codigo: 'EUR', nombre: 'Euros' },
  { codigo: 'GBP', nombre: 'Libras' },
];

export function nombreMoneda(codigo: string): string {
  return MONEDAS_VIAJE.find((m) => m.codigo === codigo)?.nombre ?? codigo;
}

// Locale fijo (es-CO) para que el separador de miles/decimales sea siempre el mismo sin
// importar la moneda de viaje elegida — solo cambia el símbolo/código de la moneda.
export function formatoMonedaViaje(monto: number, codigo: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: codigo }).format(monto);
}
