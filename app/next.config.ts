import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // El indicador de dev tools (círculo "N") tapaba contenido en las capturas a 375px
  // usadas para revisión de diseño — desactivado para que las evidencias sean fieles.
  devIndicators: false,
};

export default nextConfig;
