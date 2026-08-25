import { createBrowserClient } from '@supabase/ssr';

// Cliente de Supabase para componentes del navegador ('use client'). Usa solo
// las claves PÚBLICAS (URL + publishable) — nunca la secreta, que vive solo
// en el servidor (09-SEGURIDAD.md: "API keys de IA/pagos JAMÁS en el frontend").
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
