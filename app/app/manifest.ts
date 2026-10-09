import type { MetadataRoute } from 'next';

// Permite "Agregar a la pantalla de inicio": la app se abre como una app (con su ícono, sin la barra del
// navegador) y arranca directo en Inicio. La sesión se conserva, así que no hay que volver a entrar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fairsy',
    short_name: 'Fairsy',
    description: 'Las cuentas claras de la pareja, en un solo lugar.',
    start_url: '/app/hoy',
    scope: '/',
    display: 'standalone',
    background_color: '#f3f7f6',
    theme_color: '#1c4f49',
    lang: 'es',
    icons: [
      { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
