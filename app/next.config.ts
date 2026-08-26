import type { NextConfig } from "next";

// Headers de seguridad básicos (09-SEGURIDAD.md) — antes no existía ninguno.
// CSP pragmático: sin infraestructura de nonces todavía, así que scripts/estilos
// llevan 'unsafe-inline' (línea base real de Next.js sin esa infraestructura) —
// el resto de las reglas SÍ bloquea de verdad clickjacking, MIME-sniffing y fugas
// de referrer, y limita las conexiones de red al propio dominio y a Supabase.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");
const esDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabaseUrl} ${supabaseWs}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  // El indicador de dev tools (círculo "N") tapaba contenido en las capturas a 375px
  // usadas para revisión de diseño — desactivado para que las evidencias sean fieles.
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
