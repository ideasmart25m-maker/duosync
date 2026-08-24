# VEREDICTO revisor-visual — app-hoy
Fecha: 2026-08-16 00:00
Screenshot: docs/revisiones/app-hoy-375.png
Usabilidad: 29/40
Craft: 14/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Navegación completa: bottom-nav en layout.tsx, "Ver todo", "Registrar gasto", card "Viaje a Cartagena" en hoy/page.tsx] Todo enlace interno usa `<a href>`/`<motion.a>` nativo en vez de `next/link` → cada tap dispara recarga completa del navegador (flash blanco, se pierde el estado, la animación whileTap queda cortada por el unload) y mata cualquier transición entre pestañas. Fix: reemplazar todos los `<a>`/`<motion.a>` de navegación interna por `<Link>` de `next/link` (mantener motion.create(Link) si se necesita whileTap).
2. [Card "Pregunta de hoy" — botón Responder vs botón "Registrar gasto"] Dos elementos con apariencia de CTA fuerte compiten en la primera pantalla (gate de 1 acción primaria). Fix: bajar el peso visual de "Responder" (outline/ghost en vez de relleno sólido) para que "Registrar gasto" sea la única acción primaria inequívoca.
3. [Botón "Responder", estado inicial sin texto] Queda con opacity-50 "muerto" antes de escribir — se lee como roto/deshabilitado sin explicar qué falta. Fix: mantenerlo habilitado y mostrar el hint de validación (borde + mensaje) solo al intentar enviar vacío, nunca opacity plana por defecto.
4. [Card "Gastado este mes" — chips de categoría Arriendo/Mercado/Servicios] La asignación de color (accent vs accent-2) por categoría no sigue regla semántica visible en el código — luce arbitraria y se romperá al escalar categorías. Fix: definir mapeo determinístico color↔categoría documentado en FICHA-ARTE.
5. [Toda la pantalla, especialmente envío de respuesta] Cero estados de error verificables en el código (heurística 9 sin evidencia de "qué pasó + qué hacer"). Fix: modelar y mostrar al menos un caso de error con mensaje accionable antes de conectar a backend real.
