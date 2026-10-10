import { createHmac, randomInt } from 'node:crypto';

// Código de 6 números para comprobar que quien conecta una compra es dueño del correo con el que pagó.
// Solo se guarda su HMAC (atado a la persona y al correo): ni la base de datos ni los registros ven el código.
export function generarCodigoVinculo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCodigoVinculo(userId: string, email: string, codigo: string): string {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!clave) throw new Error('Falta SUPABASE_SECRET_KEY');
  return createHmac('sha256', clave).update(`${userId}|${email}|${codigo}`).digest('hex');
}

export function normalizarCorreo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const e = valor.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}
