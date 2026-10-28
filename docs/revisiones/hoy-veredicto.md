# VEREDICTO revisor-visual — Hoy (Inicio)
Fecha: 2026-10-27 12:00
Screenshot: docs/revisiones/ronda-hoy-a-375.png (+ docs/revisiones/ronda-hoy-b-375.png, tras bajar 560px)
Usabilidad: 29/40
Craft: 15/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos: ver abajo (ARREGLABLES SIN DATOS NUEVOS / REQUIEREN DECISIÓN)

Detalle usabilidad: h1:3 h2:3 h3:3 h4:3 h5:3 h6:3 h7:3 h8:2 h9:3 h10:3
Detalle craft: jerarquía:3 profundidad:3 identidad:3 movimiento:3 encaje:3
Gate de carga cognitiva: 2 fallas (7 bloques apilados antes del fondo; 3 acciones coral/solidas compiten). No llega a sobrecarga crítica (4).
Ficha-arte: paleta (verde #0E5A4C, coral #CF4429, fondo menta), grotesk en títulos y radios 14-22 coinciden con la ficha. Sin desvío. No es clon de "Capítulo" ni "Umbral".
No verificado: celebración en hitos (vive en MomentoFairsy y AlertaPresupuesto, no los leí). Código leído: hoy/page.tsx y layout.tsx.

## ARREGLABLES SIN DATOS NUEVOS (una ronda, solo código/tokens)
1. [Todo el texto de apoyo y etiquetas del menú] `--text-secondary` (#6C8480 sobre blanco, ~3.9:1) no pasa AA en texto de 11-13px: etiquetas inactivas del menú ("Gastos", "Metas", "Reportes"), "Gastado… de…", "Les queda este mes", "No cuenta como gasto", "Nuestro presupuesto del mes". -> Oscurecer el token a ~#4F6A66 (≥5:1) o usar `--text-primary` al 80% en esas etiquetas (anotar el cambio en FICHA-ARTE). Subir los íconos inactivos de opacity-70 a 85%.
2. [Tarjeta Presupuesto, aviso ámbar] La cifra $261.000 sale 3 veces en una misma vista: cabecera, número héroe y el aviso "Les quedan $261.000 para el resto del mes". -> En el aviso del 90% quitar el monto ("Cuiden los gastos hasta fin de mes") y unificar "Les quedan" (la tarjeta dice "Les queda"). Cabecera y héroe se quedan, son decisión de la usuaria.
3. [Tarjeta Presupuesto, "$ 261.000" héroe] El conteo animado está en el número chico "Gastado", no en el héroe, que aparece estático. -> `useCountUp(Math.abs(disponible))` para el héroe (page.tsx ~l.748) y dejar "Gastado" fijo.
4. [Pregunta: "Responder"; Ahorro: "Ocultar"; Header: avatar] "Responder" al 16% de blanco es casi igual al campo de arriba (12%) y se lee como otro input. -> Subir a ~26% + `ArrowRight` de 16px (sigue discreto y se lee botón). "Ocultar" va en coral como si fuera acción: pasarlo a `--text-secondary` (coral queda para acciones). El avatar propio abre el selector de fotos, pero la cámara solo aparece con hover (inexistente en táctil): añadir una insignia de cámara visible de 14px.
5. [Tarjeta Presupuesto, banner "No pudimos cargar todos tus datos"] Si falla la carga el aviso queda ~700px abajo, fuera de vista; arriba solo se ven skeletons y falta la línea del saldo. -> Mover el banner con "Reintentar" justo bajo la cabecera.

## REQUIEREN DECISIÓN DE LA USUARIA
1. [Botón "Registrar gasto", bajo la tarjeta de pregunta] En el pantallazo (viewport 784px) el CTA primario sigue cortado a la mitad por el velo del menú (empieza en y≈685; el velo es sólido desde y≈704). La compactación no alcanzó. Con 812px solo sobra ~9px (cálculo, no render); en celulares reales con barra del navegador (~650-720px) no se verá completo nunca, y es la acción primaria. Opciones: (a) botón fijo flotante "Registrar gasto" encima del menú en esta pantalla, (b) quitar de Inicio el sub-bloque "Acción de hoy" o acortar el mensaje del momento, (c) dejarlo como está y aceptar el corte como pista de scroll. Mi recomendación: (a), porque no toca el orden decidido.
2. [Bloque "Ahorro en metas este mes" + "Meta" + guía] 7 bloques apilados; Ahorro y Meta repiten "dinero hacia el futuro". Fusionar Ahorro como línea dentro de la tarjeta Meta o de Presupuesto bajaría la carga (h8: 2 -> 3). Toca contenido que la dueña ya fijó, por eso es decisión suya.

## Para llegar a LISTA (≥36 y ≥16)
Los 5 arreglables suben h8 a 3 y encaje/movimiento a 3 firmes (~31/40, 16/20): el craft puede cruzar el umbral, la usabilidad no. Los 36/40 exigen además resolver el CTA cortado y la carga de 7 bloques, y yo no veo cómo sin tocar la estructura. Una ronda de pulido deja la pantalla usable y con craft aceptable, pero no cierra el gate de usabilidad por sí sola.
