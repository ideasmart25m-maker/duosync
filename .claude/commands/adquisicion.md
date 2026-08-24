---
description: Activa el motor de adquisición (afiliados Hotmart, ads, contenido/SEO, lead magnet) según tu etapa, con plan previo y tu OK
---
ADQUISICIÓN Y TRÁFICO — consigue clientes (afiliados + ads + contenido + email)
(Requiere: app desplegada + venta Hotmart configurada.)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-ADQUISICION.txt`, especialmente
las preguntas simples sobre etapa, presupuesto y canal principal. Un canal primero, no cinco.

La app ya está construida y se vende por Hotmart, pero no llega tráfico. Diseña e implementa el
motor de adquisición. Primero dame un plan corto (qué canal activamos según mi etapa y por qué) y
ESPERA MI OK; luego ejecuta lo que aplique, generando los materiales.

━━━ CONTEXTO (etapa: 0 clientes / camino a 100 / escala · presupuesto · canales ya probados) ━━━
$ARGUMENTS

Si el contexto de arriba viene vacío o incompleto, dedúcelo de ESTADO.md (etapa, clientes, canales,
economía unitaria) y pregúntame solo lo que falte antes de proponer el plan.

LEE PRIMERO: docs/sistema/34-ADQUISICION-Y-TRAFICO.md (mapa de canales por etapa, AFILIADOS Hotmart,
paid ads, contenido/SEO, lead magnet + nurturing, influencers/UGC, MEDIR ANTES DE GASTAR),
36-ANALITICA-Y-EVENTOS.md (instrumentar el funnel ANTES del tráfico + cómo se llena `source`/`src`
por canal), 18-VENTA-HOTMART.md (la infra Resend y el producto que vamos a aprovechar — NO montar
email nuevo), 19-PAGINA-DE-VENTAS.md (el destino de todo el tráfico — debe pasar su checklist antes),
21-BACKOFFICE.md (CAC/LTV por canal: SIN esos números no hacemos paid) y 20-ASSETS-VISUALES.md +
16-DIRECCION-DE-ARTE.md (creativos con la identidad de la app).

DEFINE PRIMERO (anótalo en ESTADO.md): en qué ETAPA estoy (0 clientes / camino a 100 / escala) y
cuál es el canal principal de esa etapa. NO abras 5 frentes a la vez. Y ANTES de mover tráfico: el
funnel está instrumentado (36) y cada canal lleva su etiqueta `src` en el checkout (afiliados los
atribuye Hotmart solo; ads/orgánico/email con `?src=...`) para poder medir el CAC por canal (34/36/21).

EJECUTA lo que aplique a mi etapa:
 • AFILIADOS (lo primero, riesgo cero): guíame paso a paso para activar la afiliación en Hotmart,
   fijar comisión (default del SO: 30-40% recurrente, o 50% solo 1ª venta — validar contra el gate
   del archivo 40), aparecer en el marketplace y reclutar. GENERA el KIT completo (ángulos, copys,
   guion UGC, swipe de emails, ideas de creativos, FAQ, reglas) con el prompt del archivo 34, y el
   plan de GESTIÓN (activación, top performers, refresco trimestral del kit — PASO 6 del 34).
 • PAID (solo si ya tengo mensaje validado + prueba social + landing que convierte): PRIMERO el
   píxel de Meta (+ Conversions API) y/o TikTok en el checkout de Hotmart (integración nativa del
   panel, sección PÍXEL Y CAPI del 34) y VERIFICAR el evento Purchase con una compra de prueba —
   ⛔ SIN PÍXEL VERIFICADO NO SE LANZA PAID. Luego: estructura de campaña Meta/TikTok, 5 ángulos,
   guiones UGC, presupuesto de prueba y el criterio de escalar (CPA < LTV/3, payback < 6m).
   NO arrancar paid sin CAC/LTV del archivo 21.
 • ORGÁNICO/SEO: plan de clusters de keyword + calendario de short-form + TikTok SEO (keywords
   dichas/escritas en el video) + 1-2 carruseles/photo-mode por semana (formatos del 34).
 • WHATSAPP (el canal de conversión #1 en LATAM): lista de difusión con opt-in, guion de
   soporte-preventa, click-to-WhatsApp ads si hay capacidad de responder rápido, y TODO link
   etiquetado con ?src=wa_* (sección WHATSAPP del 34).
 • LEAD MAGNET + NURTURING: define el imán de emails y escribe la secuencia de 6 emails (con Resend
   del archivo 18, mismo lib/email.ts, disparada por cron) lista para enviar. ⚠️ PRERREQUISITO
   antes del primer envío masivo: 46-EMAIL-DELIVERABILITY (SPF/DKIM/DMARC + warmup) y
   consentimiento/opt-in (47).

REGLAS: todo tráfico cae en la landing del archivo 19 (no antes de que pase su checklist) · sin
CAC/LTV no se invierte en ads (primero el bloque de métricas del 21) · sin píxel verificado con
compra de prueba NO se lanza paid (34) · CERO dark patterns ni claims
falsos/garantizados en ningún material · verifica tsc + build + dev si tocas código · mejora lo que
existe (no reescribas sin avisar) · reporta el canal activo y los materiales generados en ESTADO.md.
