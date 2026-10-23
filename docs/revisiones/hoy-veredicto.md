# VEREDICTO revisor-visual — Hoy (Inicio), ronda 4
Fecha: 2026-10-23 12:00
Screenshot: docs/revisiones/hoy-v5-a-375.png (y hoy-v5-b-375.png)
Usabilidad: 29/40
Craft: 15/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos: 1) Barra inferior solo con íconos sin etiqueta, bajo contraste (decisión de la dueña) -> añadir etiqueta de 11px bajo cada ícono o al menos en el activo. 2) "Reintentar" hace window.location.reload() (hoy/page.tsx ~659) -> refetch local con estado de carga. 3) Héroe $261.000 (32px) queda bajo el pliegue; en el primer pantallazo el nivel dominante es la pregunta (22px) sin cifra de dinero -> decisión de la dueña sobre el orden, o mostrar el saldo en una línea en la cabecera. 4) Recuadro "Ahorro en metas" anidado dentro de la tarjeta de presupuesto y enlaces secundarios con estilos distintos ("Ver todo" coral sin subrayado vs "Ocultar" subrayado verde) -> sacar Ahorro a su propia fila/tarjeta y unificar enlace. 5) Dos tarjetas con titular grande + alerta ámbar + tres tarjetas más: >5 bloques y dos botones de acción en pantalla; Responder (outline) y Registrar gasto compiten -> mantener un solo CTA sólido por pliegue.
