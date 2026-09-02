// Países de Latinoamérica con su moneda real — la pareja elige el suyo UNA vez (ver
// SelectorPais) y desde ahí todos los montos de la app se muestran en su moneda, no en pesos
// colombianos a la fuerza. `locale` es el BCP-47 que le da a Intl.NumberFormat el símbolo y el
// formato de agrupación correctos de cada país (México usa coma decimal distinto a Colombia,
// Brasil usa el real con formato de pt-BR, etc.).
export interface Pais {
  codigo: string; // ISO 3166-1 alpha-2
  nombre: string;
  moneda: string; // ISO 4217
  locale: string;
}

export const PAISES: Pais[] = [
  { codigo: 'AR', nombre: 'Argentina', moneda: 'ARS', locale: 'es-AR' },
  { codigo: 'BO', nombre: 'Bolivia', moneda: 'BOB', locale: 'es-BO' },
  { codigo: 'BR', nombre: 'Brasil', moneda: 'BRL', locale: 'pt-BR' },
  { codigo: 'CL', nombre: 'Chile', moneda: 'CLP', locale: 'es-CL' },
  { codigo: 'CO', nombre: 'Colombia', moneda: 'COP', locale: 'es-CO' },
  { codigo: 'CR', nombre: 'Costa Rica', moneda: 'CRC', locale: 'es-CR' },
  { codigo: 'CU', nombre: 'Cuba', moneda: 'CUP', locale: 'es-CU' },
  { codigo: 'DO', nombre: 'República Dominicana', moneda: 'DOP', locale: 'es-DO' },
  { codigo: 'EC', nombre: 'Ecuador', moneda: 'USD', locale: 'es-EC' },
  { codigo: 'SV', nombre: 'El Salvador', moneda: 'USD', locale: 'es-SV' },
  { codigo: 'GT', nombre: 'Guatemala', moneda: 'GTQ', locale: 'es-GT' },
  { codigo: 'HN', nombre: 'Honduras', moneda: 'HNL', locale: 'es-HN' },
  { codigo: 'MX', nombre: 'México', moneda: 'MXN', locale: 'es-MX' },
  { codigo: 'NI', nombre: 'Nicaragua', moneda: 'NIO', locale: 'es-NI' },
  { codigo: 'PA', nombre: 'Panamá', moneda: 'USD', locale: 'es-PA' },
  { codigo: 'PY', nombre: 'Paraguay', moneda: 'PYG', locale: 'es-PY' },
  { codigo: 'PE', nombre: 'Perú', moneda: 'PEN', locale: 'es-PE' },
  { codigo: 'UY', nombre: 'Uruguay', moneda: 'UYU', locale: 'es-UY' },
  { codigo: 'VE', nombre: 'Venezuela', moneda: 'VES', locale: 'es-VE' },
];

export function paisPorCodigo(codigo: string | null): Pais | undefined {
  return PAISES.find((p) => p.codigo === codigo);
}

// Formatea un monto con la moneda real del país de la pareja. Sin país elegido todavía
// (cuentas viejas o justo antes de que el usuario responda el selector), cae a Colombia — el
// valor por defecto que ya tenía toda la app antes de este cambio, nunca rompe nada existente.
export function formatoMoneda(monto: number, codigoPais: string | null): string {
  const pais = paisPorCodigo(codigoPais ?? 'CO') ?? PAISES.find((p) => p.codigo === 'CO')!;
  return new Intl.NumberFormat(pais.locale, {
    style: 'currency',
    currency: pais.moneda,
    maximumFractionDigits: pais.moneda === 'COP' || pais.moneda === 'CLP' || pais.moneda === 'PYG' ? 0 : 2,
  }).format(monto);
}
