# VEREDICTO revisor-visual — Inicio (Hoy), rediseño 2026-10-20 · 3 rondas
(Escrito por quien invocó al revisor: el subagente no tiene permiso de escritura y devolvió el bloque canónico.)

Evolución: ronda 1 → 25/40 · 11/20 · ronda 2 → 28/40 · 13/20 · ronda 3 → 28/40 · 14/20
Screenshot (ronda 3): docs/revisiones/hoy-v4-375.png y hoy-v4-b-375.png (versión final: hoy-final-375.png)
Usabilidad: 28/40
Craft: 14/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Corregido en el camino: estado falso al cargar (skeleton), acción del día según estado real, montos con numerales proporcionales, orden (Registrar gasto antes del presupuesto, ayuda al final), áreas táctiles de 44px, errores humanos, typo del href, rótulo de Ahorro.

Defectos que quedan (ronda 3):
1. [Alta] "Registrar gasto" sigue bajo el pliegue y compite con "Responder" y "Acción de hoy" (hoy/page.tsx ~650).
2. [Alta] Sin nivel héroe: 8 tamaños de letra entre 12 y 24px; el saldo va a 15px (hoy/page.tsx 471, 750, 796).
3. [Media] Barra inferior solo con íconos, sin etiqueta y de bajo contraste (set elegido por la usuaria; layout.tsx).
4. [Media] Tarjeta de presupuesto con 4 capas anidadas y 4 estilos de enlace secundario (hoy/page.tsx 731-810).
5. [Media] "Reintentar" recarga la página completa (hoy/page.tsx ~686).
Menores: sin whileTap en la píldora de racha y la acción; sin celebración al revelar las respuestas; la ayuda queda al final y plegada.
