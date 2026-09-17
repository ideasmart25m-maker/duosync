# VEREDICTO revisor-visual — admin-resumen
Fecha: 2026-09-10 00:00
Screenshot: docs/revisiones/admin-resumen-1280.png
Usabilidad: 26/40
Craft: 13/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Top defectos:
1. [Tarjeta "Gastado este mes", sección Costo real de la IA — la card destacada, la más prominente de toda la pantalla] El valor muestra "$0 . 000 USD" con un espaciado roto alrededor del punto decimal, se lee como tres tokens sueltos en vez de un número → revisar en Tarjeta.tsx el render con tabular-nums + font-display: el kerning del glifo "." con el símbolo "$" y los dígitos no está limpio; probar font-feature-settings/letter-spacing específico para valores monetarios, no solo para enteros.
2. [Tarjeta.tsx, useConteoSiEsNumero] La animación de conteo (0→valor) solo aplica a strings que matchean `^-?\d+$` (enteros puros) → los números realmente destacados de la pantalla (Gastado hoy/este mes, en USD con decimales) NUNCA cuentan hacia arriba; solo lo hacen enteros triviales como "1" o "0". Extender el conteo a valores con formato moneda/porcentaje o la firma de movimiento queda coja justo donde más se necesita.
3. [Header de página en cada pestaña — Resumen/Ventas/Usuarios/Uso/Salud] El tratamiento del título de página es inconsistente pese a la descripción de esta ronda: Resumen no tiene h2 de página (entra directo a BannerAvisos + secciones); Usuarios usa TituloSeccion con ícono como título de página; Ventas, Uso y Salud usan un `<h2>` de texto plano sin ícono, y luego SÍ usan TituloSeccion con ícono para las subsecciones → unificar un solo patrón de encabezado de página en las 5 pestañas (verificado leyendo app/app/admin/{ventas,usuarios,uso,salud}/page.tsx).
4. [Toda la pantalla — heurística 7, verificado en código] Sigue sin existir selector de rango de fechas ni reordenamiento de columnas en las tablas (Usuarios, Ventas). Reportado en rondas previas y en consulta de alcance con el dueño — no es nuevo, pero sigue pesando en el puntaje mientras no se resuelva.
5. [Secciones Usuarios / Uso real / Salud] 7 de 11 tarjetas de la pantalla muestran "0" (dato real de una cuenta con una sola pareja de prueba, no dato inventado) — la pantalla se percibe muy vacía y repetitiva; no es un defecto de diseño sino de la etapa del producto, pero reduce la sensación de "panel vivo" que sí logran el banner de avisos y las cards de IA/Salud con sus insights.
