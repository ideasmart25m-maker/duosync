# VEREDICTO revisor-visual — landing (re-revisión v8)
Fecha: 2026-10-21 16:00
Screenshot: docs/revisiones/landing-v8-hero-375.png (+ landing-v8-pag01…pag10-375.png, landing-v7-oferta-375.png, landing-v7-mensual-375.png)
Usabilidad: 31/40
Craft: 15/20
Copy (si vende): 15/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Craft/Movimiento, toda la página] Ahora 5 de las 7 baseline verificadas en código (reveal escalonado, conteo del precio con reduced-motion, whileTap, carrusel/acordeón, modal/sticky). Faltan dibujado de anillos/barras y celebración en hito. Fix: animar el anillo de racha/barra de la captura o un trazo SVG (p. ej. subrayado del titular o línea del paso 01-03) al entrar en viewport, y un micro-feedback de éxito en el CTA; ambos con useReducedMotion.
2. [Copy, Hero bajo el CTA y FAQ 1] Especificidad sigue en 2: "hasta 60% más barato" / "la mitad o menos" sin comparador ni prueba verificable (testimonio, nº de parejas, fecha/fuente). Fix: nota "comparado con X, oct 2026" o una cita real de pareja piloto; sin esto copy no sube de 15.
3. [Hero, base del teléfono / pag01 y=365] El recorte ya no corta la acción, pero asoma una franja coral del botón "Registrar gasto" bajo la tarjeta verde; la última diapositiva del carrusel sigue recortada a media acción. Fix: cortar el hero 12px más arriba (sin franja) y cerrar el carrusel con un fade limpio.
4. [CTAs] Cinco CTA en cascada + fijo con dos textos ("Ver plan y precios" / "Empieza a simplificar tus cuentas") sobre el mismo destino; el fijo tapa títulos al hacer scroll (pag04 "Así se ve..."). Fix: un solo texto de CTA y padding/scroll-margin inferior para que el fijo no corte títulos.
5. [Craft/Identidad] La identidad sigue apoyada en planta/mascota y avatares M/S; no hay un detalle firma propio en la página (hairline, trazo, textura). Fix: un dispositivo ownable repetido (p. ej. hilo punteado coral que une los pasos 01-02-03).
Notas: Verificado en código Oferta.tsx PrecioAnimado: useInView once, animate 1s, aria-label con el precio completo, reduced-motion muestra directo (OK). Plan Mensual con "Historial ilimitado" tachado + "solo en el plan Anual" (OK, resuelve defecto v6 #4). Carrusel ya no repite la imagen del hero en la 1ª diapositiva (OK). Aritmética del precio coherente (35.94/365<0.10; 5.99/30<0.20; 49.9% ≈ 50%). Paleta y tipografía coinciden con FICHA-ARTE.
Para 36/40 (+5): imposible por retoques; requiere subir 5 criterios de 3 a 4 en una página estática (h8 con menos CTAs, h4 un solo texto de CTA, h10 prueba visible, h1 estado explícito en CTA fijo, h7 ancla directa desde "Entrar"). Para 16/20 craft (+1): cualquiera de (a) anillo/barra dibujándose + celebración (movimiento 3→4), (b) arreglar franja coral del hero y solape del CTA fijo (encaje 3→4). Para copy 16 y ningún eje ≤2: una prueba pública verificable que suba especificidad de 2 a 3.
