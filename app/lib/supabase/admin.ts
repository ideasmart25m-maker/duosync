import { createClient } from '@supabase/supabase-js';

// Cliente con la clave SECRETA — se salta RLS a propósito. SOLO se importa desde código de
// servidor (Route Handlers), NUNCA desde un componente 'use client' (la clave no debe llegar
// jamás al navegador). Se usa exclusivamente para que el worker de IA escriba el resultado del
// escaneo de recibos, tal como documenta la política de `receipt_scans` en la migración inicial:
// "el estado/monto_detectado los escribe el worker de IA vía service_role, nunca el cliente".
export function crearClienteAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
