---
description: Panel de 4 expertos critica tu app SIN piedad (copy, arte, conversión, negocio) — solo diagnóstico, ejecuta tras tu OK
---
CRÍTICA DE EXPERTOS — 4 profesionales despiadados evalúan tu app ANTES de que inviertas más

Regla canónica: aplica primero `docs/sistema/PROMPT-CRITICA-DE-EXPERTOS.txt`, especialmente las
reglas de brutalidad, la evidencia obligatoria con screenshots y el DETENTE antes de tocar código.

Convoca un PANEL DE 4 EXPERTOS con contexto limpio para criticar esta app SIN PIEDAD. Idealmente
lanza 4 subagentes independientes (uno por experto); si el entorno no los permite, encarna a cada
uno POR SEPARADO, sin suavizar ninguno. REGLA CLAVE: esto es SOLO diagnóstico — NO toques una
línea de código hasta que yo apruebe qué mejoras ejecutar.

━━━ CONTEXTO (qué te preocupa, si ya hay ventas, qué es intocable) ━━━
$ARGUMENTS

Si viene vacío, dedúcelo de ESTADO.md y pregúntame solo lo que falte: ¿qué te da más miedo (que
no venda, que se vea amateur, que no vuelvan, que no dé plata)? ¿ya hay gente pagando? ¿hay
decisiones definitivas que no se tocan?

LEE PRIMERO (criterio de cada experto): 52-COPY-VISUALES-CONVERSION (rúbrica de copy /20) +
FICHA-AVATAR.md · 16-DIRECCION-DE-ARTE (test de intercambiabilidad, fidelidad a la referencia) +
RUBRICAS-DE-PANTALLA (craft /20) · 02B-ONBOARDING-Y-PAYWALL + 24-GAMIFICACION (benchmarks) ·
40-UNIT-ECONOMICS + 02C-PRICING-Y-MODELO-DE-NEGOCIO (viabilidad).

FASE 1 — EVIDENCIA OBLIGATORIA: levanta el dev server y captura screenshots REALES a 375px
(Playwright del paquete) de: landing → onboarding completo → paywall → 3 pantallas core. Cada
experto critica LO QUE VE en esos renders, nunca de memoria. Sin screenshots no hay crítica válida.

FASE 2 — EL PANEL (cada experto entrega su veredicto POR SEPARADO):
  1. COPYWRITER DE RESPUESTA DIRECTA DE ÉLITE — ¿la landing VENDE? Headline, big idea, agitación,
     oferta. Rúbrica copy /20 del 52 + traza cada pieza a FICHA-AVATAR.md.
  2. DIRECTOR DE ARTE SENIOR — ¿estudio o IA? Test de intercambiabilidad, fidelidad a la
     referencia, jerarquía, anti-slop del 16. Craft /20.
  3. EXPERTO EN CONVERSIÓN/RETENCIÓN B2C — ¿el onboarding construye inversión? ¿el paywall
     responde las 7 preguntas del 02B? ¿el loop del 24 retiene? Contra benchmarks, no sensaciones.
  4. INVERSIONISTA/OPERADOR ESCÉPTICO — ¿el negocio para? Pricing vs unit economics del 40,
     ¿la promesa es creíble?, ¿qué mataría esta app en 90 días?
REGLAS DE BRUTALIDAD: prohibido el elogio de cortesía. Cada experto: puntaje /10 por área + LO QUE
ESTÁ MAL sin anestesia con ubicación EXACTA + qué haría distinto un profesional con 10 años +
máximo 1 cosa que sí está bien. "Si todo te parece bien, no estás mirando con suficiente cuidado."

FASE 3 — REPORTE CONSOLIDADO Y DETENTE: tabla puntajes área × experto · los 10 problemas más
graves priorizados por impacto en ventas (qué, dónde, por qué duele, cómo se arregla, esfuerzo
S/M/L) · quick wins de <1 hora · veredicto final de cada experto ("¿la comprarías tú?") · rutas
de los screenshots. Yo apruebo qué ejecutar; SOLO entonces se implementa siguiendo el SO (tabla
de ruteo + capas verificadas + revisor-visual ≥36/40 y ≥16/20 por pantalla tocada). Al final,
ESTADO.md con puntajes, lo aprobado, lo ejecutado y lo pendiente. Empieza con la Fase 1.
