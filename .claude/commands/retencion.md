---
description: Diseña e implementa retención y gamificación (loop Hooked, rachas, XP, re-enganche) con plan previo y tu OK
---
RETENCIÓN Y GAMIFICACIÓN — haz que la gente VUELVA (como Duolingo)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-RETENCION.txt`, especialmente
las preguntas simples sobre acción principal, frecuencia de uso y mecánicas que sí encajan.

Diseña e implementa el sistema de retención de esta app para que el usuario vuelva mes a mes.
Primero dame un plan corto (qué mecánicas y por qué encajan con ESTE nicho) y espera mi OK; luego
ejecuta por capas, verificando.

━━━ CONTEXTO DE LA APP ━━━
$ARGUMENTS

Si el contexto de arriba viene vacío o incompleto, dedúcelo de ESTADO.md (promesa central, nicho,
patrón de uso, loop ya definido) y del código antes de proponer nada; pregúntame solo lo que falte.

LEE PRIMERO: docs/sistema/24-GAMIFICACION.md (loop Hooked, NÚMERO MÁGICO de activación + forma de la
curva de retención, rachas, XP, recompensa variable, ligas, re-enganche, instrumentación,
anti-patrones), 11-DISENO-EMOCIONAL.md (el tono de las celebraciones), 56-MOMENTOS-EMOCIONALES.md
(las pantallas de celebración, hito de racha, racha rota, level-up, win-back y share cards),
15-PATRONES-UX.md (empty
states, next best action), 02B-ONBOARDING-Y-PAYWALL.md (onboarding gamificado → paywall),
58-RETENCION-DE-INGRESOS.md (referidos + renovación anual) y 21-BACKOFFICE.md +
36-ANALITICA-Y-EVENTOS.md (métricas y eventos de retención).

DEFINE PRIMERO (anótalo en ESTADO.md):
 • El LOOP central — gatillo → acción → recompensa variable → inversión — y qué mecánicas aplican a SU
   patrón de uso (NO metas todas: usa la tabla "por tipo de app" del archivo 24).
 • El NÚMERO MÁGICO: la acción × cantidad × ventana que predice retención (hipótesis si aún no hay
   datos, ej. "3 generaciones en los primeros 3 días"). TODA la gamificación se calibra para empujar
   al usuario a cruzarlo. Antes de invertir en más mecánicas, verifica que la curva de retención
   APLANE en meseta >0 (si decae a cero, el problema es el producto, no la falta de rachas — archivo 24).

Presenta el plan y ESPERA MI OK antes de implementar.

IMPLEMENTA lo que aplique (lógica SIEMPRE en el servidor con RLS — nunca editable desde el cliente):
 • Onboarding con primera victoria en <60s + anillo de setup ("3/5 pasos") + racha pre-cargada en 1.
 • Racha con streak-freeze y reparación <48h; copy en clave de pérdida; hitos 7/30/100/365.
 • XP con meta diaria seleccionable (10/20/30/50) y niveles geométricos, SI el uso es diario.
 • Hitos de volumen, récords personales (vs uno mismo) y badges con goal-gradient ("te faltan X").
 • Re-enganche: notificaciones D1/D3/D7 + win-back (email Resend / pg_cron), TOPE ≤1-2/día, accionables.
 • REFERIDOS (member-get-member, archivo 35): pedirlo en el momento de máxima felicidad (un hito real),
   recompensa de doble lado atada al valor de la app — SOLO si la curva ya aplanó (no antes).
 • Instrumentación: escribe los eventos canónicos (streak_extended, xp_awarded, milestone_reached…)
   en el event_log que lee el backoffice (contrato único de 24 + 21).

PROHIBIDO (anti-patrones del 24): spam de culpa, pay-to-not-lose como única reparación, falsa escasez,
métricas de vanidad, comparación social que humilla. Test ético en cada mecánica: ¿ayuda al usuario a
lograr lo que vino a lograr, o solo lo pega a la pantalla?

REGLAS: verifica tsc + build + dev al cerrar CADA capa · la lógica de progreso SIEMPRE en el servidor
con RLS · mejora lo que existe (no reescribas sin avisar) · cero features nuevas (van a ESTADO.md) ·
causa raíz, no parches · nunca declares que algo "retiene mejor" sin probarlo en el flujo real ·
reporta las mecánicas activas y deja el loop documentado en ESTADO.md.
