# VEREDICTO revisor-visual — landing (re-revisión v5)
Fecha: 2026-10-21 12:00
Screenshot: docs/revisiones/landing-v5-hero-375.png (+ landing-v5-pag01…pag10-375.png, página completa)
Usabilidad: 30/40
Craft: 14/20
Copy (si vende): 14/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Craft/Movimiento, toda la página] Solo 3 de las 7 animaciones baseline (reveal escalonado, whileTap, sticky con AnimatePresence). Faltan conteo de números héroe (precio US$3.00 estático), dibujado de barras/anillos en el carrusel de capturas y celebración. Fix: contar el precio de 0 a 3.00 al entrar la Oferta y animar las barras de Reportes al entrar en viewport (con reduced-motion).
2. [Copy, Hero y Oferta] Especificidad 2: "hasta 60% más barato que otras apps" no nombra comparador ni fuente pública, y no hay una sola prueba (testimonio, número de usuarios, demo). La garantía nombrada (15 días) vive en su sección y NO junto a los CTA de las tarjetas de precio. Fix: citar el comparador/fecha o reducir a "la mitad o menos" con nota, y añadir bajo el CTA de cada plan "Garantía de Cuentas Claras: 15 días".
3. [Hero, H1] Toda la segunda frase ("Sin discutir, sin cobrarle a nadie.", 6 palabras) va en coral; la regla pide 1-3 palabras clave y el énfasis se diluye (todo grita). Fix: acentuar solo "Sin discutir" o "sin cobrarle a nadie".
4. [Garantía, título] Se lee "la Garantía de Cuentas Claras" en minúscula inicial, como título de tarjeta, además del chip "el Código de Conexión" en Solución. Fix: capitalizar ("La Garantía de Cuentas Claras") o reescribir el título sin artículo.
5. [Entre "Antes/Después" y carrusel, pag04] Banda blanca vacía de ~180px antes del título del carrusel (el reveal whileInView aún no disparó en la captura) y hero con el teléfono recortado justo sobre el botón "Registrar gasto" (se ve cortado con degradé). Fix: subir el umbral de viewport del reveal (amount 0.05) o no ocultar el título antes de entrar, y recortar el teléfono del hero por la nav, no a media acción.
Notas: la unificación a un solo verde (--accent-2) con coral solo en acciones queda resuelta y consistente con FICHA-ARTE; el CTA de la tarjeta Anual ya está centrado en 1 línea; la garantía legal tiene contraste legible. El H1 nuevo usa el vocabulario del avatar. El CTA fijo de dos estados y el plan Mensual sin "Historial ilimitado" no se puntúan (decisión explícita). Faltan 6 puntos de usabilidad y 2 de craft para el gate (36/40 y 16/20); copy queda bajo 16 y con un eje en 2.
