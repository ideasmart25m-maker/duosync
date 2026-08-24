---
description: Prepara el lanzamiento (5 fases, checklist día-a-día, oferta de fundadores, bumps/upsells, prueba social) con plan previo y tu OK
---
LANZAMIENTO — vende en picos (5 fases, oferta de fundadores, bumps/upsells, prueba social)
(Requiere: app lista para lanzar.)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-LANZAMIENTO.txt`, especialmente
las preguntas simples sobre fecha, oferta, audiencia y promesas reales.

Prepara el lanzamiento de esta app. Primero dame el plan de lanzamiento (las 5 fases + la oferta
de fundadores) y ESPERA MI OK; luego ejecuta por capas, generando los materiales.

━━━ CONTEXTO (fecha objetivo, oferta pensada, lista de espera si existe) ━━━
$ARGUMENTS

Si el contexto de arriba viene vacío o incompleto, dedúcelo de ESTADO.md (pricing, promesa, estado
de la venta Hotmart) y pregúntame solo lo que falte antes de proponer el plan.

LEE PRIMERO: docs/sistema/35-LANZAMIENTO.md (playbook 5 fases, CHECKLIST DÍA-A-DÍA
D-14→D+7, lista de espera, oferta de fundadores, order bump/upsell/downsell, referidos, prueba
social desde cero), 18-VENTA-HOTMART.md (el webhook y Resend que vamos a usar),
19-PAGINA-DE-VENTAS.md (oferta y copy), 46-EMAIL-DELIVERABILITY.md + 47-LEGAL-FISCAL-Y-PRIVACIDAD.md
(prerrequisito de los envíos masivos) y 34-ADQUISICION-Y-TRAFICO.md (los canales que concentra el
lanzamiento + afiliados + WhatsApp).

DEFINE PRIMERO (anótalo en ESTADO.md): la OFERTA de fundadores (precio + bono + por qué urge, sin
falsa escasez) y la fecha real de cierre de la ventana.

⚠️ PRERREQUISITO antes del PRIMER envío masivo (warming, ventana de carrito): 46-EMAIL-DELIVERABILITY
(SPF/DKIM/DMARC + warmup del dominio) y consentimiento/opt-in de la lista (47). Un dominio frío
mandando cientos de emails el día de apertura cae en spam justo cuando más duele.

EJECUTA lo que aplique:
 • LANZAMIENTO: calendario de las 5 fases + el CHECKLIST DÍA-A-DÍA (D-14 → D+7 del archivo 35, con
   responsable y criterio de "hecho" por día) + secuencia de emails de WARMING (lista de espera) y
   de la VENTANA de carrito (apertura → último aviso), lista para Resend (archivo 18) · brief de
   afiliados para la ventana (encadena con el kit del 34) · grupo/difusión de WhatsApp si aplica (34).
 • AOV/LTV: define el ORDER BUMP (add-on barato en el checkout) y el UPSELL (mensual→anual en la
   página de gracias) en Hotmart; verifica que el webhook del 18 los procese por event_id.
 • Si la oferta de fundadores promete "precio bloqueado de por vida": deja el compromiso ANOTADO en
   ESTADO.md (quiénes son fundadores y qué precio tienen) — el cambio de precio futuro lo
   operacionaliza /precios respetando ese grandfathering.
 • REFERIDOS (member-get-member, archivo 35): convertir clientes felices en afiliados de Hotmart, o
   recompensa in-app "da y recibe" reconciliada por el webhook del 18; pedirlo en el momento de
   máxima felicidad y solo si la app ya retiene (curva aplanada, archivo 24).
 • PRUEBA SOCIAL DESDE CERO si aún no tengo clientes: plan de beta sembrada + caso propio +
   testimonios reales para la landing del 19. CERO testimonios inventados.

RETENER EL INGRESO QUE ENTRÓ (cancelaciones, pagos fallidos, win-back, renovación anual) NO va
aquí: cuando el lanzamiento cierre y haya clientes pagando, usa /retener-ingresos — ese monta la
cancelación retentiva, el dunning sobre past_due, el win-back y la cadencia pre-renovación anual.
Y si la gente paga pero no USA la app, /retencion.

REGLAS: urgencia y escasez REALES (si dije que cierra, cierra) · CERO dark patterns/confirmshaming/
falsa escasez · ensayo general D-1: compra de prueba end-to-end antes de abrir · verifica tsc +
build + dev si tocas código · mejora lo que existe · reporta lo lanzado y deja el playbook +
ofertas en ESTADO.md.
