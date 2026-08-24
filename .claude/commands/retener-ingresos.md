---
description: Protege el ingreso que ya entró — cancelación retentiva, dunning de pagos fallidos, win-back y renovación anual, con plan previo y tu OK
---
RETENER INGRESOS — que no cancelen ni fallen los pagos (cancelación + dunning + win-back + renovación anual)
(Requiere: app vendiendo por Hotmart con el webhook del 18 activo.)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-RETENER-INGRESOS.txt`,
especialmente las preguntas simples sobre tipo de churn y qué puede cumplir Hotmart.

La app ya vende, pero hay gente que cancela y pagos que fallan. Monta el sistema que protege el
ingreso que YA entró. Primero dame un diagnóstico corto (qué tipo de churn me está pegando más:
voluntario, involuntario o el acantilado anual) y el plan por capas, y ESPERA MI OK; luego ejecuta,
generando emails/copys y, si aplica, el código (flujo de cancelación, banner past_due, crons).

━━━ CONTEXTO (churn actual si lo sabes, ¿hay plan anual?, quejas/razones de cancelación vistas) ━━━
$ARGUMENTS

Si el contexto de arriba viene vacío o incompleto, dedúcelo de ESTADO.md y del backoffice (21:
churn voluntario vs involuntario, past_due activos) y pregúntame solo lo que falte.

OJO CON EL SOLAPE: este comando es para que NO SE VAYAN NI FALLEN LOS PAGOS. Si el problema es que
la gente paga pero NO USA la app (hábito, rachas, gamificación), eso es /retencion (archivo 24) —
que VUELVAN a usarla es otra batalla.

LEE PRIMERO: docs/sistema/58-RETENCION-DE-INGRESOS.md (RETENCIÓN Y CHURN
VOLUNTARIO con las alternativas reales a la baja, DUNNING, win-back y RENOVACIÓN ANUAL),
18-VENTA-HOTMART.md (la máquina de estados del webhook: past_due, cancelación a fin de ciclo,
past_due→active al recuperar — todo el sistema opera SOBRE esos estados), 46-EMAIL-DELIVERABILITY.md
(los emails de dunning/win-back son inútiles si caen en spam) y 47-LEGAL-FISCAL-Y-PRIVACIDAD.md
(consentimiento) + 59-SOPORTE-CLIENTE.md (el soporte que rescata churn).

DEFINE PRIMERO (anótalo en ESTADO.md): churn voluntario vs involuntario actual (del backoffice 21;
si no hay datos, hipótesis), y si existe plan anual (activa la capa 4).

EJECUTA por capas, esperando mi OK entre capas:
 1. CANCELACIÓN RETENTIVA (churn voluntario): encuesta de 1 pregunta al pulsar "cancelar" +
    oferta de rescate ramificada por razón + la alternativa a la baja que Hotmart PERMITE
    (descuento vía cupón para quedarse / cancelar + cupón de regreso con fecha / pausa
    solo-de-acceso con aviso honesto del cobro). ⛔ NUNCA prometas una "pausa que no factura":
    la facturación la controla Hotmart, no un flag en Supabase — prometerla = cobros "pausados",
    reembolsos y reseñas negativas. Cancelar debe ser FÁCIL (cero dark patterns); los datos se
    conservan 30-90 días (periodo de gracia).
 2. DUNNING (churn involuntario, la conversión más barata): cadencia de 4 emails (días 1/3/5/7)
    sobre el estado past_due del webhook (18) + banner NO bloqueante in-app + link a actualizar
    método de pago en el panel de comprador de Hotmart. Tono servicial, no acusatorio. Al volver
    PURCHASE_APPROVED, el webhook reactiva a active y el banner desaparece.
 3. WIN-BACK (recuperar al que ya se fue): emails a los 30/60/90 días con novedades + oferta de
    regreso (cupón con fecha), con Resend del 18. El ex-cliente convierte mejor que un lead frío.
 4. RENOVACIÓN ANUAL (el acantilado del mes 12, solo si hay plan anual): emails a ~30 y ~7 días
    antes del cobro con el VALOR del año ("esto lograste con la app") + la fecha exacta de
    renovación — el cobro esperado retiene; el cobro emboscada cancela y reseña mal.

CRITERIOS DE ÉXITO (verificables): el flujo de cancelación se probó end-to-end (encuesta →
rescate → cancelar sigue siendo fácil) · una compra de prueba en past_due dispara el email día 1
y el banner · los crons de win-back/renovación quedan programados y probados con fecha simulada ·
cada evento (cancel_survey, rescue_accepted, dunning_recovered, winback_return) se escribe en el
event_log que lee el backoffice (21/36) · tsc + build + dev limpios si hubo código.

REGLAS: los emails masivos pasan antes por 46 (SPF/DKIM/DMARC + warmup) y 47 (opt-in) · lógica de
estados SIEMPRE en el servidor con RLS (nunca editable del cliente) · el dunning y la gracia NO
borran datos · CERO dark patterns/confirmshaming (la retención se gana con valor y oferta honesta) ·
mejora lo que existe (no reescribas sin avisar) · cierra actualizando ESTADO.md con las cadencias
activas y los números base de churn para comparar el mes próximo.
