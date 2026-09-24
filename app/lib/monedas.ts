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

const NOMBRES_PLURALES: Record<string, string> = { USD: 'Dólares', EUR: 'Euros', GBP: 'Libras' };

export function nombreMoneda(codigo: string): string {
  if (NOMBRES_PLURALES[codigo]) return NOMBRES_PLURALES[codigo];
  try {
    const nombre = new Intl.DisplayNames(['es'], { type: 'currency' }).of(codigo);
    return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : codigo;
  } catch {
    return codigo;
  }
}

// Destinos de viaje: el país define la moneda en la que se llevan los gastos del viaje.
export interface Destino {
  pais: string;
  moneda: string;
}

export const DESTINOS: Destino[] = [
  { pais: 'Alemania', moneda: 'EUR' }, { pais: 'Argentina', moneda: 'ARS' }, { pais: 'Aruba', moneda: 'AWG' },
  { pais: 'Australia', moneda: 'AUD' }, { pais: 'Austria', moneda: 'EUR' }, { pais: 'Bahamas', moneda: 'BSD' },
  { pais: 'Bélgica', moneda: 'EUR' }, { pais: 'Bolivia', moneda: 'BOB' }, { pais: 'Brasil', moneda: 'BRL' },
  { pais: 'Canadá', moneda: 'CAD' }, { pais: 'Chile', moneda: 'CLP' }, { pais: 'China', moneda: 'CNY' },
  { pais: 'Colombia', moneda: 'COP' }, { pais: 'Corea del Sur', moneda: 'KRW' }, { pais: 'Costa Rica', moneda: 'CRC' },
  { pais: 'Croacia', moneda: 'EUR' }, { pais: 'Cuba', moneda: 'CUP' }, { pais: 'Dinamarca', moneda: 'DKK' },
  { pais: 'Ecuador', moneda: 'USD' }, { pais: 'Egipto', moneda: 'EGP' }, { pais: 'El Salvador', moneda: 'USD' },
  { pais: 'Emiratos Árabes Unidos', moneda: 'AED' }, { pais: 'España', moneda: 'EUR' }, { pais: 'Estados Unidos', moneda: 'USD' },
  { pais: 'Filipinas', moneda: 'PHP' }, { pais: 'Finlandia', moneda: 'EUR' }, { pais: 'Francia', moneda: 'EUR' },
  { pais: 'Grecia', moneda: 'EUR' }, { pais: 'Guatemala', moneda: 'GTQ' }, { pais: 'Honduras', moneda: 'HNL' },
  { pais: 'Hong Kong', moneda: 'HKD' }, { pais: 'India', moneda: 'INR' }, { pais: 'Indonesia', moneda: 'IDR' },
  { pais: 'Irlanda', moneda: 'EUR' }, { pais: 'Islandia', moneda: 'ISK' }, { pais: 'Israel', moneda: 'ILS' },
  { pais: 'Italia', moneda: 'EUR' }, { pais: 'Jamaica', moneda: 'JMD' }, { pais: 'Japón', moneda: 'JPY' },
  { pais: 'Malasia', moneda: 'MYR' }, { pais: 'Marruecos', moneda: 'MAD' }, { pais: 'México', moneda: 'MXN' },
  { pais: 'Nicaragua', moneda: 'NIO' }, { pais: 'Noruega', moneda: 'NOK' }, { pais: 'Nueva Zelanda', moneda: 'NZD' },
  { pais: 'Países Bajos', moneda: 'EUR' }, { pais: 'Panamá', moneda: 'USD' }, { pais: 'Paraguay', moneda: 'PYG' },
  { pais: 'Perú', moneda: 'PEN' }, { pais: 'Polonia', moneda: 'PLN' }, { pais: 'Portugal', moneda: 'EUR' },
  { pais: 'Puerto Rico', moneda: 'USD' }, { pais: 'Reino Unido', moneda: 'GBP' }, { pais: 'República Checa', moneda: 'CZK' },
  { pais: 'República Dominicana', moneda: 'DOP' }, { pais: 'Rusia', moneda: 'RUB' }, { pais: 'Singapur', moneda: 'SGD' },
  { pais: 'Sudáfrica', moneda: 'ZAR' }, { pais: 'Suecia', moneda: 'SEK' }, { pais: 'Suiza', moneda: 'CHF' },
  { pais: 'Tailandia', moneda: 'THB' }, { pais: 'Turquía', moneda: 'TRY' }, { pais: 'Uruguay', moneda: 'UYU' },
  { pais: 'Venezuela', moneda: 'VES' }, { pais: 'Vietnam', moneda: 'VND' },
];

// Locale fijo (es-CO) para que el separador de miles/decimales sea siempre el mismo sin
// importar la moneda de viaje elegida — solo cambia el símbolo/código de la moneda.
export function formatoMonedaViaje(monto: number, codigo: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: codigo }).format(monto);
}
