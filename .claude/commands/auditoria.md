---
description: Audita tu app como un equipo senior y la eleva a 10/10 (reporte primero, ejecuta tras tu OK) — --rapido | --exhaustivo
---
AUDITORÍA Y ELEVACIÓN — de "funciona" a 10/10 (REPORTE primero, el usuario aprueba, luego ejecutas)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-AUDITORIA.txt`, especialmente las
preguntas simples iniciales, el reporte antes de cambios y la aprobación antes de tocar código.

>> Este comando audita LA APP (la que se construyó). Si lo que se quiere es auditar la COHERENCIA del
>> propio SO documental (antes de reempacar el zip), ese es otro comando: /auditar-so.

MODO — decídelo con los argumentos recibidos: $ARGUMENTS
  - Si contienen `--exhaustivo` → checklist ítem-por-ítem en las 6 dimensiones + ejecución por capas. Para pre-venta.
  - Si contienen `--rapido`, o vienen vacíos → diagnóstico por dimensión, conciso (tabla priorizada). Ideal para una pasada ágil.
(Default: --rapido.)

Audita esta app como lo haría un EQUIPO SENIOR completo (producto, diseño, UX, backend, base de datos,
auth, ciberseguridad, IA, infra, monetización, distribución y operación) y entrégame un REPORTE de todo
lo que falta para 10/10. REGLA CLAVE: primero el diagnóstico — NO toques nada hasta que yo apruebe.
Después ejecutas SOLO lo aprobado, capa por capa, verificando. NO reescribas desde cero.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — EXPLORAR (solo lectura, cero cambios)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Levanta el dev server y recorre la app COMO USUARIO NUEVO a 375px (mobile), MIRANDO cada pantalla
RENDERIZADA con un mecanismo REAL de preview/screenshot (MCP de preview/navegador, Playwright; solo si
no hay ninguno, pídeme la captura): onboarding, pantalla principal, flujos secundarios, estados
vacíos/error, paywall, navegación. Una pantalla que no viste renderizada NO la puedes auditar. Lee el
código clave y el ESTADO.md. (--exhaustivo: además crea/actualiza ESTADO.md con qué hace la app, para
quién, stack detectado, estado de cada pantalla y decisiones de diseño ya tomadas.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — AUDITAR LAS 6 DIMENSIONES (lee el archivo del sistema que toca como criterio)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Una sola lista canónica de dimensiones. En --rapido marca por dimensión ✅/❌/⚠️ con los hallazgos de
mayor impacto. En --exhaustivo recorre TODOS los ítems de cada dimensión, uno por uno.

─── DIM 1 · PRODUCTO, RETENCIÓN Y MONETIZACIÓN (01/02/02B/02C/03/15/24 · 34/35/58) ───
  □ Problema real + primera victoria clara; loop de hábito nombrado (gatillo→acción→recompensa→inversión)
  □ Onboarding según estrategia (02B); valor antes del registro; paywall con valor, no muro de error
  □ Límites de plan definidos con números; el límite se verifica ANTES de crear (paywall, no error)
  □ Sin dark patterns (culpa, urgencia falsa, cancelación difícil)
  □ ¿Hay un plan de adquisición y de retención/dunning? (34/35) — sin distribución no se vende

─── DIM 2 · DISEÑO, ANTI-SLOP Y VERIFICACIÓN VISUAL (14/16/29 + rúbrica /40 de RUBRICAS-DE-PANTALLA SOBRE EL RENDER + 32) ───
  □ ¿La identidad se DERIVÓ de la audiencia/ICP (PASO 0 de 16), o se copió un nicho genérico?
  □ Test de entrecerrar los ojos: 1 objeto principal por pantalla; jerarquía 1→2→3→4
  □ Espaciado mecánico (solo 4·8·12·16·24·32·48·64), interno≤externo; radio único; íconos de un set
  □ Restricción cromática (60-30-10, ≤2 de marca); tipografía con carácter (NO Inter/Roboto)
  □ RENDER a 375px: nav al fondo sin vacío muerto (min-h-dvh) · fondo con profundidad (no plano) ·
    pantalla LLENA DE VALOR (no input+2 botones) · CTA vivo (no pill muerto al 50%)
  □ Cada pantalla clave la puntúa el subagente `revisor-visual` con el screenshot (≥36/40 y ≥16/20 — autoevaluarse es inválido). Test del logo: ¿se distingue de un template?

─── DIM 3 · UX Y DISEÑO EMOCIONAL (11/15) ───
  □ Claridad: misión de cada pantalla en <3s; "qué sigue" obvio; next-best-action
  □ Todos los estados: empty (con CTA), loading (skeleton, no spinner), success, error (empático), offline
  □ Personalidad consistente (3 adjetivos); celebración SOLO en hitos reales; personalización visible

─── DIM 4 · BACKEND, DATOS E INFRA (25/13/28) ───
  □ Esquema correcto; índices en FKs y columnas de WHERE/ORDER/JOIN; sin N+1; listas con KEYSET, no OFFSET profundo
  □ RLS de alto rendimiento ((select auth.uid()) + columna indexada); políticas por comando (using/with check)
  □ CORRECTITUD: cuotas/cobros atómicos (RPC/UPDATE condicional), NO "SELECT count→JS→INSERT"; idempotencia
  □ Migraciones seguras (expand/contract); backups con PITR + restore probado; ¿aguanta 300-500 usuarios?

─── DIM 5 · AUTH Y CIBERSEGURIDAD (26/27/09) ───
  □ OWASP 2025; fail-secure (crashea si falta un secreto, sin default de juguete); secretos fuera del frontend
  □ Auth: cookies httpOnly, rotación, anti-enumeración, rate limiting; CSRF (SameSite + Origin/double-submit)
  □ IDOR (probar leer recurso de otro usuario → 403); XSS por escape de OUTPUT (no del input); SSRF en fetch de URLs
  □ Webhook de pago: firma en tiempo constante sobre el RAW body + idempotencia + máquina de estados (18)
  □ Uploads validados por magic bytes; privacidad LATAM (LGPD/Ley 1581/LFPDPPP) + transferencia a IA declarada

─── DIM 6 · IA, si aplica (30/31/33) ───
  □ Clave en servidor (BFF que AUTORIZA sesión+plan); modelo en AI_MODEL; max_tokens limitado
  □ Texto = streaming; imagen/audio = job asíncrono + Storage; resiliencia (retries/backoff/timeout/idempotencia)
  □ Structured output vía tool use nativo (no parsear texto y reintentar a ciegas); RAG solo si hace falta (33)
  □ Guardrails (moderación, anti-inyección, grounding); evals con golden set + LLM-judge; ai_calls (costo/tokens/latencia)
  □ Economía: costo de IA por usuario Pro < 20% del precio; caché de idénticos; fair-use

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — ENTREGARME EL REPORTE Y DETENERTE (no ejecutes nada todavía)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lista priorizada por impacto en este formato:
  | Severidad (Crítico/Importante/Pulido) | Hallazgo | Dónde (archivo/pantalla) | Mejora propuesta |
Cierra con: puntaje actual /10 + las 3 mejoras de mayor impacto para llegar a 10/10.
Espera mi aprobación. Puedo aprobar todo o marcarte cuáles sí y cuáles no.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 4 — (SOLO tras mi OK) EJECUTAR lo aprobado por capas verificadas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Orden recomendado: (1) Seguridad y backend (lo que nunca debe fallar) → (2) Bugs y estados faltantes →
(3) Diseño y jerarquía → (4) Animaciones y craft → (5) Retención y engagement → (6) Auditoría final.
Al cerrar CADA capa: tsc --noEmit + build + dev limpios; y en pantallas, ABRIR el render a 375px y
MIRARLO. Recorrer el NÚCLEO OBLIGATORIO (10 ítems) del Checklist de Cierre de CLAUDE.md + los bloques de
dominio que apliquen.

REPORTE DE CIERRE (artefacto, no exhortación):
  ✅ QUÉ SE HIZO por capa · 🔍 VERIFICADO: tsc ✓ build ✓ dev ✓ · render 375px → [ruta del screenshot] ·
  rúbrica __/40 por pantalla clave · 📊 IMPACTO en conversión/retención · ⚠️ PENDIENTES para el usuario ·
  🚀 ¿lista para vender? Si no pegaste ruta de screenshot + puntaje, la pantalla queda NO verificada.

REGLAS: causa raíz, no parches (prohibido @ts-ignore/any/silenciar errores). Una capa a la vez. Cero
features nuevas (van a ESTADO.md). No elimines ni reescribas lo que ya construí sin preguntarme. Nunca
declares nada "listo" sin verificarlo con evidencia. Actualiza ESTADO.md por capa. Empieza con la Fase 1.
