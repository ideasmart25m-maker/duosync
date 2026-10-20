# VEREDICTO revisor-visual — reportes
Fecha: 2026-10-20 12:00
Screenshot: docs/revisiones/reportes-375.png
Usabilidad: 25/40
Craft: 8/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Detalle usabilidad: h1:2 h2:3 h3:3 h4:2 h5:3 h6:3 h7:2 h8:2 h9:2 h10:3
Detalle craft: jerarquia:2 profundidad:2 identidad:1 movimiento:1 encaje:2
(Escrito por quien invocó al revisor: el subagente no tiene permiso de escritura y devolvió este bloque canónico. Los defectos van abajo, tal como los entregó.)

Gate de carga cognitiva: 2 fallas (hasta 6 categorías visibles; acumulación de 5 secciones + guía + aviso). No llega a sobrecarga crítica.
Limitación: el screenshot cubre solo la primera vista; "Quién pagó qué", "Últimos 6 meses" y "Ahorro en metas" se puntuaron solo con el código.

Top defectos (por severidad):
1. Hero: separadores de miles muy abiertos ("$ 2 . 230 . 000") y "de $ 2.500.000" parece monoespaciado (tabular-nums sobre la fuente display) — page.tsx:183-185. Fix: numerales proporcionales y una sola apariencia de moneda.
2. Identidad: todas las secciones son la misma tarjeta blanca; no hay dispositivo propio; el hero no usa la tarjeta sólida de la ficha. Fix: hero del mes como bloque sólido --accent-2 con el número claro y la barra integrada.
3. Movimiento: solo hay barras animadas. Faltan conteo animado del número héroe, entrada escalonada, whileTap en flechas y guía, transición entre meses (hoy todo se reemplaza por skeleton), celebración.
4. Error y carga: sin casa vinculada, `cargando` queda en true para siempre (skeleton eterno + mensaje, sin "Reintentar"); si falla la consulta de gastos el hero queda en $0 bajo el error.
5. El aviso ámbar repite lo que ya dice la card (89 % y "Les quedan" aparecen dos veces).
6. Jerarquía: 8 tamaños de letra; título "Reportes" (19px) casi igual al mes (17px); títulos de sección (15px) pesan igual que sus filas (14px); la guía ocupa el primer lugar sobre el hero.
7. Color sin significado: 4 colores de categoría (el rojo de Supermercado se lee como alarma); "Quién pagó" usa el coral (reservado a acciones); el color de cada persona cambia según el orden de monto.
8. Contraste: --text-tertiary sobre blanco ~4:1 en 11-12px; la barra ámbar sobre su riel ~2,5:1.
9. Gráfico de 6 meses: sin valores en las barras, sin aria-label ni frase interpretada; la etiqueta "Presupuesto" puede encimarse con barras.
10. Navegación de mes: flechas de 40px (mínimo 44) y sin whileTap; los meses pasados vacíos muestran "Registrar gasto", que crea un gasto de hoy y no de ese mes.
11. Barra inferior: íconos con estilos distintos (inconsistencia de componente; el set es el que eligió la usuaria).
12. Copy: "la plata" es regionalismo; la ficha pide español latino neutro → "En qué se va el dinero".
