# VEREDICTO revisor-visual — landing (ronda de pulido v9)
Fecha: 2026-10-27 12:00
Screenshot: docs/revisiones/ronda-landing-0-375.png (+ ronda-landing-1…11-375.png, página completa a 375px)
Usabilidad: 30/40
Craft: 15/20
Copy (si vende): 14/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos: (1) Claims de precio contradictorios y contradichos por FICHA-MERCADO: hero "hasta 60% más barato" vs FAQ "la mitad o menos"; Splitwise/Monefy ~US$9.99/año según la ficha, no 2x más caro. (2) Badge "MÁS POPULAR" sin usuarios que lo respalden. (3) H1 "sin cobrarle a nadie" se lee como "gratis" y choca con la oferta; subtítulo dice "automatiza" pero los pasos dicen "registran gastos". (4) CTA único vago y en voz tú mientras la página habla de ustedes; no nombra el trial. (5) Garantía "7 días gratis + 15 días" sin punto de partida claro; contraste de labels 12px grises bajo AA.

Detalle: usabilidad h1:3 h2:3 h3:3 h4:3 h5:3 h6:3 h7:3 h8:3 h9:3 h10:3 · craft jerarquía:3 profundidad:3 identidad:3 movimiento:3 encaje:3 · copy idea:3 especificidad:2 emoción:3 oferta:3 acción:3
Gate de carga cognitiva: 1 falla (elementos con apariencia interactiva que no hacen nada) — sin sobrecarga crítica.
Sub-checks: Garantía nombrada con plazo cerca del CTA = PASA. Message-match = NO VERIFICABLE (no hay creativo de anuncio).
Verificado en código: reveal con stagger y reduced-motion, conteo de precio, whileTap 0.97, estado de carga en CTAs, sticky de dos estados, acordeón con aria. No hay celebración ni anillos (no aplican a landing).
Calificación independiente, no comparable punto a punto con v8.

## ARREGLABLES SIN DATOS NUEVOS (solo texto/estilo)
1. [Hero "hasta 60% más barato", FAQ 1 "la mitad o menos"] Dos cifras distintas, comparador sin nombre, y FICHA-MERCADO l.12 pone a Splitwise/Monefy en ~US$9.99/año (Fairsy US$35.94/año). Fix: una sola frase verificable, p. ej. "Un solo pago para los dos: US$35.94 al año en total". Si se conserva un comparativo, acotarlo a apps de pareja (FICHA-AVATAR l.55: US$14.99/mes) con fuente y fecha.
2. [Oferta, badge del plan Anual] "MÁS POPULAR" es un dato de usuarios que no existe. Fix: "MEJOR PRECIO" o "RECOMENDADO".
3. [Hero H1] "sin cobrarle a nadie" se puede leer como "es gratis" y luego aparece el precio. Fix: "sin tener que cobrarle a tu pareja" (o "sin hacerla de cobrador").
4. [Hero subtítulo] "automatiza los gastos compartidos" contradice el paso 02 ("Registran gastos en 2 toques"). Fix: "Registran un gasto en 2 toques y los dos ven el mismo saldo". Falta punto final.
5. [Todos los CTAs] "Empieza a simplificar tus cuentas" es genérico, está en tú y el resto habla a ustedes, y no menciona la prueba. Fix: una sola etiqueta en primera persona con el beneficio, p. ej. "Empezar mis 7 días gratis", igual en las 7 apariciones.
6. [Oferta] Concordancia y vocabulario: "precio de un café" sin artículo ("por el precio de un café"); "Ahorran el 50%" (resto en "Ahorren/ustedes"); "en tu moneda al valor del día" (mezcla tú). Unificar a "ustedes".
7. [Garantía y tarjetas de plan] "Prueban 7 días gratis… 15 días" no dice desde cuándo corren los 15. Fix: "15 días desde el primer cobro". Verificar contra FICHA-MERCADO §4 antes.
8. [Solución] El H2 "Cuentas claras sin discusiones" repite el titular del hero. Y "Código de Conexión" se explica como un enlace por WhatsApp, no como un código. Fix: H2 distinto del hero y frase "la otra persona recibe su Código de Conexión por WhatsApp".
9. [Solución, pill "Código de Conexión"; Problema, 4 cards con borde verde; pasos 01-03] Parecen botones y no hacen nada. Fix: quitar borde/hairline y usar fondo hundido; reservar el hairline para plan y garantía.
10. [Contraste] Labels 12px en gris --text-tertiary (HOY, ANTES, EN 6 MESES, "Entrar", pie del carrusel, "Aviso de IA"). Estimo ~3.7:1 sobre el fondo, no medido. Fix: oscurecer el token a ≥4.5:1; "Entrar" con área táctil ≥44px.
11. [FAQ] Falta la duda de compra #1: "¿Me cobran hoy? ¿Necesito tarjeta para la prueba?" (hoy solo está en texto de 12px bajo el precio). Fix: agregar la pregunta con la respuesta real. Recortar la respuesta de "otra persona deja de usarla" (~45 palabras, el kit avisa en 40). En "cancelar" y "Garantía" aclarar qué es Hotmart: "la plataforma de pago".
12. [Carrusel "Así se ve"] Solo 1 de 4 pantallas visible, sin pista del siguiente (puntos de 8px), y la primera es la misma pantalla Inicio del hero. En capturas consecutivas la imagen y el caption activos no coinciden (Inicio con caption de Inicio y luego "Cada gasto…" con punto 1): verificar. Fix: mostrar la siguiente pantalla asomando y empezar por Gastos.
13. [Oferta vs resto] "Asistente de IA" y "Escaneo de recibos" aparecen solo en las tarjetas de precio, sin explicación ni pantalla. Fix: una línea o caption de carrusel que los muestre.
14. [Cierre/PS] "su conexión diaria" no se explica en ningún lado; la pregunta del día y la planta (lo ownable) solo viven en la imagen. Fix: una frase en Solución o en el PS que las nombre.
15. [Footer] Los separadores "·" quedan huérfanos al envolver ("· Aviso de IA" solo en la 2ª línea) y los enlaces son <44px. Fix: lista en 2 columnas sin puntos, filas de 44px.
16. [Paso 01] "sin correo y sin contraseña" — comprobar que es cierto de punta a punta (el pago pasa por Hotmart con correo). Si no, quitarlo (Gate 61).

## REQUIEREN PRUEBA REAL / DECISIÓN
1. Testimonios, cantidad de parejas, calificación o casos reales: único camino a especificidad ≥3 y a emoción 4. Hoy no hay ninguna prueba.
2. Cualquier comparativo de precio que se quiera conservar: investigar precios de los competidores con fuente y fecha (FICHA-MERCADO). Sin eso, se elimina (arreglable 1).
3. Message-match: depende del anuncio real; revisar cuando exista el creativo.
4. Decisión de producto: pedir o no tarjeta en la prueba. El copy debe decirlo en cualquier caso (arreglable 11).
5. Identidad fuera de las maquetas: la landing sin los pantallazos usa estructura de kit (sin grano, ilustración de serie ni planta/avatares M·S repetidos entre secciones). Subir identidad a 4 es trabajo de diseño, no de texto.
6. Demo real (video corto o GIF del flujo vincular→registrar→ver saldo): reemplaza la prueba social como evidencia del mecanismo.

## Techo realista sin pruebas
Con los 16 arreglos: usabilidad ~33-34, craft 15-16 (contraste/encaje), copy ~15-16. Para el gate doble (≥36 y ≥16 copy ≥16) hace falta al menos prueba social o demo.
