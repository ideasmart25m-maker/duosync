# VEREDICTO revisor-visual — paywall
Fecha: 2026-08-15 00:00
Screenshot: docs/revisiones/paywall-375.png
Usabilidad: 29/40
Craft: 12/20
Copy (si vende): 15/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [pantalla completa, corte inferior] El CTA principal "Empezar nuestro plan", el disclaimer de garantía, "Ahora no" y los badges de confianza quedan FUERA de la vista a 375px — el screenshot corta en la card "Mensual" y muestra scrollbar activo. En un paywall, la acción de compra invisible sin scroll es el defecto más grave posible → comprimir verticalmente (menos padding en checklist/cards) o convertir el bloque final en footer sticky para que el botón de compra sea visible sin desplazarse en un viewport de ~812px.
2. [fondo, detrás del header/avatares] El mesh radial sigue prácticamente invisible pese a subir la opacidad a 32%/26% respecto al intento anterior — el centro de ambos gradientes está fuera del viewport (y:-15%, y:-5%) y cae a transparente al 65%, así que en pantalla real no aporta profundidad → mover el centro del gradiente dentro del área visible (ej. y:5-10%) hasta que se note en el screenshot, no solo en el código.
3. [fila de avatares M/S bajo el botón cerrar] El dispositivo ownable sigue leyéndose como el patrón genérico de "usuarios conectados" de cualquier app de colaboración (Slack/Notion/Figma) — dos círculos con inicial y colores de marca no bastan para diferenciarlo → sumar un tratamiento propio (textura, vínculo visual entre los círculos, forma no-circular) que no exista en otras apps.
4. [botón X esquina superior izquierda / "Ahora no, seguir con la versión gratis" al fondo] Ambos disparan router.push sin ningún estado de carga, mientras el CTA principal sí tiene spinner + texto + timeout de 8s — inconsistencia de heurística 1 y 4 dentro de la misma pantalla → aplicar el mismo patrón de feedback (deshabilitar + indicador sutil) a la función `salir()`.
5. [checklist de 4 items, card gris] El copy es mayormente funcional/features y no agita el dolor específico de la ficha de avatar (discusiones semanales por dinero, sentirse "el cobrador") antes de resolverlo — eje emoción de copy en 2/4 → agregar una línea breve que nombre la escena dolorosa antes del checklist de beneficios.
