# VEREDICTO revisor-visual — paywall
Fecha: 2026-10-21 12:00
Screenshot: docs/revisiones/pay-v2-0-375.png
Usabilidad: 30/40
Craft: 14/20
Copy (si vende): 14/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Párrafo bajo el CTA, 12px gris, 3 líneas] La garantía ("15 días de garantía") está enterrada en texto largo sin nombre y sin plazo destacado, y el texto mezcla precio en US$ con "en su moneda al valor del día (en Colombia, en pesos)". Esto contradice la objeción #1 de la ficha ("otra suscripción en dólares"), obliga a releer y tiene contraste ~3.7:1 (#6C8480 sobre #F3F7F6), por debajo de AA. Fix: partir en dos líneas cortas. Línea 1: "Gratis 7 días, cobro el 28 de octubre". Línea 2: garantía con nombre propio (ej. "Garantía Fairsy de 15 días") en --text-primary. Mover la aclaración de moneda a una línea de precio coherente.
2. [Cards de plan y checklist] No hay prueba ni anclaje: ningún testimonio, ningún comparativo con Paired/Agape, ni la frase "un solo pago por los dos en tu moneda" con número. Es el eje especificidad = 2 (por eso el copy no llega a 16). Fix: añadir bajo el checklist una micro-línea de ancla con dato de FICHA-MERCADO.md (ej. "Paired cobra US$X por persona; Fairsy US$3.00/mes por los dos"), solo con fuente y fecha reales. Ocupa 1 línea: caben en 812px si se recorta el padding del checklist.
3. [Fila de avatares M/S + chip "Conectados", arriba-izquierda] El dispositivo ownable sigue siendo dos círculos con inicial, genérico, y el chip "Conectados" es decorativo (parece interactivo y no hace nada). La identidad (eje 3) se queda en 2. Fix: dar un tratamiento propio al vínculo (trazo curvo o hilo coral entre M y S, forma no circular), o eliminar el chip y usar ese espacio para el ancla del defecto 2.
4. [Cards Anual/Mensual] La selección se marca solo con un tinte rosado de 7%; no hay radio ni check, así que a simple vista no queda claro qué plan está elegido. Además, "cancelan cuando quieran" aparece solo en Mensual, lo que sugiere que Anual no se puede cancelar. Fix: indicador de selección (círculo radio con check en --accent) en ambas cards y la misma frase de cancelación o reembolso en las dos.
5. [Titular y texto terciario] "Su Plan Viaje juntos está listo" suena a nombre mal formado (la meta se concatena con mayúscula), y el acento coral cae en "está listo" (verbo vacío) y no en la palabra que vende. "Ahora no, seguir con la versión gratis" (16px, --text-tertiary ~3.7:1) y "Pago seguro con Hotmart" (12px) tampoco pasan AA. Fix: formato "Su plan «Viaje juntos» está listo" o acento en el nombre del plan, y subir los textos terciarios a un tono con ≥4.5:1.
