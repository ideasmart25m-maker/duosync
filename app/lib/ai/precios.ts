// Precios reales de Anthropic por millón de tokens (verificado 2026-09, anthropic.com/pricing) —
// SOLO para Haiku 4.5, el único modelo que usa esta app. Si cambia el modelo o el precio, hay
// que actualizar esta constante — nunca se inventa un costo.
const PRECIOS_USD_POR_MILLON: Record<string, { entrada: number; salida: number }> = {
  'claude-haiku-4-5': { entrada: 1, salida: 5 },
};

export function calcularCostoUsd(modelo: string, tokensEntrada: number, tokensSalida: number): number {
  const precio = PRECIOS_USD_POR_MILLON[modelo];
  if (!precio) return 0; // modelo desconocido — no se inventa un costo, queda en 0 (visible en el panel)
  return (tokensEntrada / 1_000_000) * precio.entrada + (tokensSalida / 1_000_000) * precio.salida;
}
