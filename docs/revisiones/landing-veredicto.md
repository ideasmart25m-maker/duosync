# VEREDICTO revisor-visual — landing
Fecha: 2026-08-15 00:00
Screenshot: docs/revisiones/landing-375.png
Usabilidad: 30/40
Craft: 14/20
Copy (si vende): 15/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Sección "Así se ve llevar las cuentas en equipo" (AppPorDentro), carrusel de 4 frames] Los 4 frames son placeholders con borde punteado (solo el nombre de pantalla: "Hoy"/"Gastos"/"Metas"/"Nosotros"), cero screenshot real del producto — confirmado en page.tsx (ningún frame recibe `src`). Es la sección de prueba del producto y no prueba nada → fix: montar al menos 1-2 capturas reales de la app a 375px antes de publicar.
2. [HeroVisual.tsx, mockup de teléfono en el Hero] Los radios de las cards internas no coinciden entre sí ni con los tokens del sitio: pregunta=rounded-[16px], balance/arriendo/meta=rounded-[12px], marco del teléfono=rounded-[24px], mientras tokens.css define --radius-card:20px/--radius-button:14px. Contradice el fix reportado de "tokens de radio unificados" de la ronda anterior — no se propagó al elemento más visible de la página (hero, above the fold) → fix: unificar las cards internas del mockup a un solo radio (recomendado --radius-button 14px).
3. [Sección Oferta, bloque "stack de valor" sobre las cards de precio] El stack Hormozi ($180+$25+$20 tachado en $225) no cita fuente ni comparación verificable, y el avatar (FICHA-AVATAR VoC) desconfía explícitamente de precios inflados de apps de pareja ("siempre dicen 'gratis' pero no puedes hacer nada sin pagar") — el propio dolor que la marca promete resolver ("cuentas claras") se contradice con una técnica de precio poco transparente → fix: quitar el stack o anclarlo a un comparativo real y citado (precio público de Paired/Splitwise).
4. [CTAs de toda la página] La etiqueta del CTA cambia sin razón aparente entre "Vincular con mi pareja gratis" (Hero/mitad/CTA final/sticky) y "Empezar mis 7 días gratis" (cards de Oferta) para la MISMA acción (ir a /onboarding) → fix: unificar el verbo/beneficio del CTA en toda la página.
5. [Sección Oferta, línea "Hoy: $3.00/mes (se cobra $35.94/año)" junto al badge "7 días gratis"] No queda explícito si el cobro de $35.94 ocurre al terminar el trial o de inmediato — riesgo de sorpresa de cobro → fix: agregar literalmente "después de tus 7 días gratis" junto al precio anual/mensual.
