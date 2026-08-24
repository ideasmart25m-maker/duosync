# Copy marcado — Landing DuoSync

> Cada pieza se traza a un campo de `FICHA-AVATAR.md`. Marcadores: `[acento]…[/acento]` (la palabra
> que vende, color de acento) · `[b]…[/b]` (énfasis semibold). Fuente de precios: `FICHA-MERCADO.md`.

## 1. Hero
- H1: `Dejen de ser [acento]socios de una empresa en quiebra[/acento]` — traza a IDENTIDAD ("Parecemos más socios de una empresa quebrada que pareja") y dolor #1.
- Subtítulo: `DuoSync ordena el gasto del hogar [b]sin pelear[/b] y sin dos suscripciones` — traza a deseo #1 y a la objeción #1 (suscripción doble).
- CTA: "Vincular con mi pareja gratis" → `/onboarding` (modelo onboarding-first, decidido en Sesión 1)
- Social proof: "Un pago cubre a los dos — hasta 60% más barato que otras apps para parejas" (fuente: FICHA-MERCADO.md §1; sin nombrar competidores por decisión del usuario 2026-08-14)
- Sugerencia de visual: pantalla "Hoy" con la pregunta del día y el saldo — mientras no hay screenshot real, el kit usa el placeholder honesto
- HeroVisual.tsx incluye la fila "Meta: Viaje a Cartagena" con una línea de progreso semilla→árbol-con-frutos (Sprout → Tree → Tree+Apple) — pedido explícito del usuario (2026-08-14) como metáfora de que la constancia se ve y da frutos

## 2. Problema
- "¿Sientes que eres el único que se preocupa por ordenar las cuentas de la casa?" — dolor #5
- "¿Discuten por dinero con frecuencia?" — dolor #1 (ajustado 2026-08-14, antes "casi cada semana")
- "¿Te toca 'cobrarle' su parte y sentirte el malo de la película?" — dolor #3
- "¿Llegan a fin de mes sin saber en qué gastaron su dinero?" — dolor #2 (ajustado 2026-08-14, antes "en qué se fue todo")

## 3. Agitación
- "Cada mes que pasa así, el gasto sigue mal repartido y la cuenta pendiente crece entre los dos."
- "En un año, esa tensión se acumula y la meta de [acento]viajar juntos[/acento] sigue esperando." — traza a COSTO DE LA INACCIÓN
- "Otra hoja de Excel no ayuda: [b]el problema no es la plata, es que nadie la ve igual[/b]."
- Contraste — Hoy: "Uno de los dos lleva las cuentas en la cabeza y el otro no sabe cuánto deben." / En 6 meses: "Las mismas discusiones — con más resentimiento acumulado."

## 4. Solución
- Mecanismo bautizado: "el Código de Pareja"
- Título: `Cuentas claras [acento]sin pelear[/acento]`
- Big idea: "No falta amor, falta un lugar donde los dos vean lo mismo. El Código de Pareja los conecta y el [b]saldo se actualiza solo[/b]."
- Pasos: (1) Vinculan sus teléfonos — código de 4 dígitos, menos de un minuto (2) Registran gastos en 2 toques — con categorías que ustedes eligen (3) Ven el mismo saldo — actualizado al instante para los dos
- Antes/Después: cada uno con su Excel sin saber cuánto puso el otro → un saldo único, actualizado al instante para los dos

## 5. App por dentro (placeholders honestos — sin screenshots reales todavía)
- Título: `Así se ve [acento]llevar las cuentas en equipo[/acento]`
- Frames: Hoy (pregunta del día) · Gastos (categorías propias) · Metas (ahorro conjunto) · Nosotros (racha de días conectados)
- Carrusel con autoplay (2026-08-14, pedido del usuario): avanza solo cada 3.2s en loop, se pausa con hover/touch/foco, desactivado con prefers-reduced-motion

## 6. Oferta
- Título: `Empiecen gratis. Sigan por [acento]precio de un café[/acento]`
- Trial: 7 días (decidido en Sesión 1)
- Precio anual: $2.99/mes ($35.94/año, menos de $0.10/día) · Precio mensual: $5.99/mes (menos de $0.20/día) — ajustado por el usuario 2026-08-14, fuente: ESTADO.md / FICHA-MERCADO.md §1
- Ahorro anual real: "ahorran más del 50% vs. mensual" (35.94 vs 71.88 = 50.03% — cifra verificada, no redondeada al alza)
- Beneficios en negrilla (2026-08-14, pedido del usuario): "Historial ilimitado", "Escaneo de recibos con IA", "Categorías propias", "dinámicas de pareja", "Metas de ahorro" — Oferta.tsx ahora renderiza los features con MarkedCopy (antes texto plano)

## 7. Garantía
> Verificado en FICHA-MERCADO.md §4 (2026-08-13): Hotmart permite configurar la garantía en 7, 15,
> 21 o 30 días. Se eligió 15 (> que los 7 del trial, regla dura de 18) — el reembolso aplica al
> primer cobro tras el trial, dentro de esos 15 días.
- Nombre: "la Garantía de Cuentas Claras"
- Condición: "Prueban 7 días gratis. Si no les convence, piden su dinero de vuelta en 15 días — sin trámites." (recortado a 2026-08-14 para pasar el límite de 4 líneas a 375px del audit de escaneabilidad)
- Piso legal: "Respaldada por la garantía de reembolso de Hotmart"

## 8. FAQ
- "¿Nos van a cobrar a cada uno por separado?" → "No. Un solo pago cubre a los dos — por eso cuesta [b]la mitad o menos[/b] que otras apps para parejas." (traza objeción #1; sin nombrar competidores desde 2026-08-14)
- "¿Es seguro poner nuestros gastos ahí?" → "No pedimos acceso a su banco. Registran los gastos a mano o con la foto del recibo, y solo ustedes dos ven esos datos." (traza objeción #3)
- "¿Y si mi pareja deja de usarla a los pocos días?" → "La pregunta diaria y el registro de gastos toman segundos, y no necesitan estar los dos a la vez para mantener la racha." (traza objeción #6)
- "¿Funciona en iPhone y Android?" → "Sí, se ve y funciona igual en los dos — no hace falta bajar nada de una tienda de aplicaciones."
- "¿Qué pasa si quiero cancelar?" → "Cancelan cuando quieran desde su cuenta, sin llamadas ni trámites."

## 9. CTA final
- H2: `Vuelvan a ser [acento]pareja, no administradores[/acento]`
- Future pacing: "Mañana registran un gasto en 2 toques, ven el mismo saldo los dos, y les queda tiempo para lo que sí importa."
- Recap: "7 días gratis · Un solo pago para los dos"
- PS: "PS: DuoSync une el gasto del hogar y la conexión diaria de la pareja en un solo lugar, con un pago que cubre a los dos. Empiecen hoy con 7 días gratis y sientan lo que es ver las cuentas claras sin pelear."

## 10. Footer legal
- appName: DuoSync · soporte: soporte@duosync.app (dominio provisional — se actualiza cuando el usuario compre el dominio real)
- Enlaces: Privacidad · Términos y Condiciones · Reembolsos · Aviso de IA — páginas stub creadas, contenido legal completo pendiente de `47-LEGAL-FISCAL-Y-PRIVACIDAD.md`
