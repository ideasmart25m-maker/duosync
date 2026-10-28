# VEREDICTO revisor-visual — paywall
Fecha: 2026-10-27 12:00
Screenshot: docs/revisiones/ronda-paywall-812-375.png (también docs/revisiones/ronda-paywall-640-375.png)
Usabilidad: 29/40
Craft: 14/20
Copy (si vende): 15/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
ARREGLABLES SIN DATOS NUEVOS
1. [Bloque fijo inferior, a 640px] Solo se ve "US$3.00/mes" y "el cobro llega el 3 de noviembre"; el monto real (US$35.94 de una vez) queda tapado, así que parece un cobro escondido → hacer dinámica la línea fija según el plan elegido: "Gratis 7 días. El 3 de nov. se cobra US$35.94 (anual) / US$5.99 (mensual). Cancelan antes y no pagan nada."
2. [Pantalla a 640px] La tarjeta Mensual, "Ahora no" y "Pago seguro con Hotmart" quedan fuera de vista (la tarjeta Anual se ve cortada por el bloque fijo); a 812px la línea del candado también queda bajo el pliegue → compactar: avatares en la misma fila que la X, titular a 28px, planes en filas de una línea (~60px), y mover "Pago seguro con Hotmart" con candado DENTRO del bloque fijo, debajo del CTA.
3. [Cuerpo de la tarjeta de planes y textos de 12px] "7 días gratis · US$35.94/año…" y las líneas de cobro/garantía usan --text-secondary (#6C8480) a 12px sobre fondo rosado/blanco, ≈3.5-3.8:1 (estimado; medir) → no pasa AA; oscurecer el secundario a ≥4.5:1 o usar --text-primary al 80% en esas líneas.
4. [Tarjetas Anual/Mensual, código líneas 172-222] Son motion.button sin role="radio"/aria-checked ni radiogroup, y el aviso de error (línea 240) sin role="status" → agregar role="radiogroup" + role="radio" aria-checked, y role="status"/aria-live="polite" al mensaje de demora.
5. [CTA y precios] CTA "Empezar nuestro Plan Viaje juntos" no menciona los 7 días gratis, y los precios cuentan desde US$0.00 al entrar (delay 0.3s) → CTA "Empezar nuestros 7 días gratis" (conservar el nombre del plan en el titular) y animar el precio solo con fade, o contar desde el 80% del valor.

REQUIEREN PRUEBA REAL / DECISIÓN
A. Garantía de 15 días: confirmar en el panel de Hotmart que quedó configurada en 15, desde cuándo cuenta (primer cobro, no inicio del trial) y que el checkout real la refleje (FICHA-MERCADO línea 41 la marca pendiente). La frase "15 días para pedir su dinero" no dice cómo pedirlo; decidir texto final con la ruta de reembolso real.
B. Fecha y moneda del cobro ("3 de noviembre, en su moneda al valor del día"): verificar en el checkout real de Hotmart (Colombia, México, Argentina) que fecha, monto y moneda coinciden con lo prometido.
C. Medir el bloque fijo en iPhone Safari y Android Chrome reales (barra dinámica, teclado, 100dvh) y el estado del botón al volver con "atrás" desde Hotmart (el temporizador de 8s y `cargando` no se reinician).
D. Message-match con el anuncio de origen: no hay creativo; no verificable hasta tener la publicidad.
E. Anual preseleccionado vs mensual y énfasis del CTA: decisión para prueba A/B con tráfico real; no se decide con screenshots. Idem identidad: los avatares M/S de 32px casi no se leen como dispositivo propio; decidir si crecen (40-48px) con la prueba de recordación.

Detalle: h1:3 h2:3 h3:3 h4:3 h5:3 h6:2 h7:3 h8:3 h9:3 h10:3 | jerarquía:3 profundidad:3 identidad:2 movimiento:3 encaje:3 | idea:3 especificidad:3 emoción:3 oferta:3 acción:3
Garantía nombrada cerca del CTA: SÍ. Message-match: NO VERIFICABLE. CTA vivo: contraste OK, tap definido, habilitado por defecto, 56px de alto. Gate carga cognitiva: 0-1 fallas. Gate doble no alcanzado (29/40 < 36; 14/20 < 16; copy 15/20 < 16).
