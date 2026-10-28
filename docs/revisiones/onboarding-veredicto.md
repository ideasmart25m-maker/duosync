# VEREDICTO revisor-visual — onboarding
Fecha: 2026-10-27 12:00
Screenshot: docs/revisiones/ronda-onb-0-375.png (serie completa: ronda-onb-0 a ronda-onb-6 y ronda-onb-r; el paso 7 "Armando su plan" NO tiene screenshot y no se puntuó visualmente)
Usabilidad: 30/40
Craft: 13/20
Copy (si vende): 13/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Detalle usabilidad: h1:3 h2:3 h3:3 h4:3 h5:3 h6:4 h7:3 h8:3 h9:2 h10:3
Detalle craft: jerarquía:3 profundidad:3 identidad:2 movimiento:3 encaje:2
Detalle copy: idea:3 especificidad:2 emoción:3 oferta:2 acción:3 (ningún eje <=2 permitido: especificidad y oferta en 2 obligan a corregir aunque el total pase)

Verificaciones en código: reduced-motion presente en PasoTransition, Chip stagger, barra, resultado. Baseline motion: stagger de opciones OK, transición de paso OK, barra que se anima OK, whileTap OK, conteo del % en el loading OK, spring en resultado OK, celebración real en hito: solo un ícono con spring. Heurísticas 3 y 7 verificadas en código (back conserva respuestas, X sale a "/" sin confirmar y sin persistir, se puede saltar el código).
No revisado: FICHA-MERCADO.md (no se leyó), paso 7 (loading), flujo "ya tengo código" en pantalla.

## Gate de carga cognitiva
0-1 fallas (la nota repetida en las 4 preguntas es ruido). No es sobrecarga crítica.

## ARREGLABLES SIN DATOS NUEVOS (código/copy, 1 ronda)
1. [Pregunta 4, CTA "Continuar"] Está al 50% de opacidad y deshabilitado hasta escribir (PasoMeta). Rompe "CTA vivo" -> habilitarlo siempre; si está vacío, mostrar hint "Elijan una sugerencia o escriban la suya" al tocar (o aceptar "Lo definimos después").
2. [Pregunta 4, chips de sugerencia] Texto de 12px y altura ~36px (py-2): bajo el mínimo táctil de 44px -> min-h-11, texto 14px.
3. [Preguntas 1-5, posición de la tarjeta verde] Salta de lugar: centrada verticalmente en P1-P3 y P5 (y=181/215), pegada arriba en P4 (y=68) -> misma posición fija en todas (ancla arriba con pt fijo) para que el quiz no "baile".
4. [Barra + contador] "Pregunta 5 de 5" con la barra en ~65%; "Último paso" en el Código con barra ~78% y todavía quedan loading y resultado -> reescalar pct() para que P5 ~85% y Código 100%, y cambiar "Último paso" por "Casi listo".
5. [Nota al pie de P1, P2, P3, P5] "Cada respuesta ajusta el plan..." se repite 4 veces a 12px gris, y es falsa para la P1: frecuenciaDiscusion no se usa en ningún lado del código (tampoco quienLleva más allá del texto del paso 3). -> mostrarla solo una vez o reemplazarla por algo cierto; o usar la respuesta de P1 en el resultado.
6. [Resultado] "Hecho con sus 5 respuestas" pero la lista refleja solo 3 respuestas (+ código); P1 y P2 no aparecen -> decir "Hecho con lo que contaron" o listar las 5.
7. [Resultado, título y CTA] El nombre del plan es texto libre sin límite: "Su plan «...» está listo" y "Ver el Plan ..." pueden desbordar o sonar raro ("Plan viaje") -> maxLength 40 en el input de meta y CTA fijo "Ver mi plan" (la meta queda en el título).
8. [Paso Reconocimiento, "Esto no es falta de amor"] Texto de 5 líneas alineado a la izquierda bajo título centrado, sin tarjeta, con CTA genérico "Continuar", y se muestra igual a quien contestó "Casi nunca" en P1 -> centrar o usar la tarjeta verde, bifurcar por P1 y renombrar el CTA ("Ver cómo funciona").
9. [Copy, palabras del avatar] El quiz no usa ninguna palabra de FICHA-AVATAR ("cobrarle", "en paz", "su parte", "cuentas claras", "socios"). Ej. P2: "Yo, y me cansé de cobrarle"; Reconocimiento: "para quedar en paz" en vez de "construir confianza desde la claridad" (abstracto).
10. [Salida X en todo el flujo] Va a "/" sin confirmación y pierde todo (estado local); en el Código ya generado se pierde el código. -> confirmación "¿Salir? Se pierde lo que respondieron" o guardar en sessionStorage.
11. [Identidad] La tarjeta verde es el único dispositivo; el logo desaparece desde P2 (queda la flecha), el resultado es un recap genérico con ícono de confeti. -> sumar el par de avatares M/S de la ficha arriba del título del resultado y 1 hairline degradé en la tarjeta de recap.
12. [Desvío con FICHA-ARTE] La tarjeta-hero mezcla --accent-2 al 92% con blanco (verde apagado ~#2B6A5C) en vez de #0E5A4C de la ficha -> usar var(--accent-2) sólido o documentar el cambio.
13. [Semántica/accesibilidad] Las preguntas son <p>, no <h1>; las opciones no están en grupo (role=radiogroup/fieldset). Solo el Reconocimiento, el Código y el Resultado usan h1.
14. [Pregunta 3] "Otra cosa (escríbanla)" sin ícono dentro de una lista con íconos, y "escríbanla" suena a orden -> ícono Pencil y "Otra (la escribo)"... usar "Otro gasto".
15. [Error de código] Solo se valida "no es su propio código"; sin copy para sin conexión o código no encontrado -> definir los mensajes (qué pasó + qué hacer) aunque la validación real llegue luego.

## REQUIEREN PRUEBA REAL / DECISIÓN
A. [Especificidad/prueba, copy eje 2] No hay una sola cifra, testimonio ni prueba en el flujo (ni "X parejas ya..."). No se puede inventar: requiere testimonios reales o un dato propio del beta. Mientras tanto no se afirma nada que no se pueda sostener.
B. [Claim "entra al instante, sin correo ni contraseña"] Solo es cierto si el enlace /unirme realmente lo cumple; verificar con prueba end-to-end con dos dispositivos antes de la publicidad.
C. [Personalización real] Decidir: que P1/P2/P5 de verdad cambien algo del plan (producto) o dejar de prometerlo. Es decisión de producto, no de pulido.
D. [Oferta, copy eje 4] El onboarding no menciona precio ni garantía. Poner "un solo cobro por los dos" o la garantía depende de FICHA-MERCADO y del paywall; decisión de la usuaria.
E. [Longitud del quiz: 5 preguntas + 2 pasos intermedios + loading] Si es la cantidad correcta solo lo dice el abandono por paso con tráfico real (36/60); hoy no hay dato.
F. [Código de 4 dígitos] Seguridad/colisión: 9.000 combinaciones; decisión técnica de backend (expiración, intentos), no visual.
G. [Message-match] No verificable: no hay anuncio/creativo de origen todavía.
H. [Garantía nombrada cerca del CTA] Pertenece al paywall; no aplica al onboarding.

## Top defectos (orden de impacto)
1. Resultado y recap sobre-prometen/etiquetan mal ("5 respuestas" con 3 visibles; nota "cada respuesta ajusta el plan" falsa para P1) -> items 5 y 6.
2. CTA de P4 muerto al 50% y chips de 12px/36px -> items 1 y 2.
3. Tarjeta verde que salta de posición + barra incoherente con "Pregunta 5 de 5"/"Último paso" -> items 3 y 4.
4. Identidad débil después de P1 y resultado genérico; hero verde fuera de la ficha -> items 11 y 12.
5. Sin prueba ni especificidad (techo del copy en 13/20) -> bloque A, no arreglable sin datos reales.

Techo estimado tras arreglar solo lo arreglable: usabilidad ~33-34, craft ~15-16, copy ~14-15. El gate (36/40, 16/20, 16/20 copy) no se alcanza sin A, B, C y D.
