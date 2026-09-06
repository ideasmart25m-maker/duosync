# VEREDICTO revisor-visual — Hoy (pantalla principal)
Fecha: 2026-09-06 00:00
Screenshot: docs/revisiones/hoy-375.png
Usabilidad: 29/40
Craft: 13/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. Fondo del shell (layout.tsx, los 3 radiales) sigue leyéndose plano en el render real (tope y zona media casi idéntico tono blanco/gris que las cards) → subir más el contraste o cambiar de opacity-only a un tercer plano de superficie con tinte propio hasta que sea visible sin entrecerrar los ojos.
2. Tarjeta "Meta" (fondo, bajo el velo del nav) sigue cortada; el ícono junto a "Viaje a Cartagena" se ve lavado/ilegible por el gradiente de desvanecido → subir esa tarjeta en el orden (reducir aún más la altura de la tarjeta "Gastado en" o el gap) o agregar una pista de scroll.
3. Home completo: 7-8 elementos tappables de peso similar (avatar, "Ver todo", 3 categorías, "Responder", "Registrar gasto", tarjeta Meta) compiten por atención aunque el CTA coral sea el más grande → bajar el contraste visual de las acciones secundarias para que la única acción primaria domine sin ambigüedad.
4. Código PreguntaDelDia (hoy/page.tsx): la insignia de racha (spring) y la revelación de respuestas no chequean `useReducedMotion` (solo el conteo del saldo y la barra de progreso lo hacen) → aplicar el mismo guard a todas las animaciones de la tarjeta hero.
5. Código hoy/page.tsx: sigue sin atajo/default para el usuario recurrente (ej. recordar última categoría al tocar "Registrar gasto") → heurística 7 en 2/4, pendiente para una ronda de producto.
