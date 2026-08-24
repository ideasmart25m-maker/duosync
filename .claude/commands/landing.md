---
description: Crea o eleva la página de ventas de alta conversión (estructura del 19 + message-match), con plan previo y tu OK
---
PÁGINA DE VENTAS PREMIUM — landing de alta conversión (no una landing básica)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-LANDING.txt`, especialmente las
preguntas simples sobre audiencia, promesa, CTA, precio, garantía y testimonios reales.

Crea (o eleva) la página de ventas de esta app para que CONVIERTA. Primero dame el ángulo de copy
derivado de la ficha de avatar, ESPERA MI OK, y luego constrúyela completa (código real, no mockup).

GATE DE AVATAR (antes de todo): si NO existe FICHA-AVATAR.md completa y aprobada (plantilla:
docs/sistema/PLANTILLA-FICHA-AVATAR.md), créala PRIMERO con el usuario según
docs/sistema/57-AVATAR-Y-CONSCIENCIA.md. TODO el copy se DERIVA de sus dolores/deseos/objeciones
y del nivel de consciencia del mercado — cada pieza debe poder trazarse a un campo de la ficha.

ESTRUCTURA: la landing sigue SIEMPRE la ESTRUCTURA CANÓNICA de 10 secciones del 19 (hero 4U's →
problema en preguntas → agitación → mecanismo → carrusel de la app → oferta anual+mensual con
trial → garantía → FAQ desde objeciones → CTA final emocional → footer legal). NO se reordena ni
se recorta; solo copy y visual se adaptan al avatar y a FICHA-ARTE.md — salvo RESCATE con
diagnóstico de 60, donde se puede compactar con evidencia y medición (PROMPT-LANDING).

━━━ CONTEXTO (promesa, nicho, pricing, ángulo si lo tengo) ━━━
$ARGUMENTS

Si el contexto de arriba viene vacío o incompleto, dedúcelo de ESTADO.md (promesa central, ICP,
pricing, dirección de arte) y del código; pregúntame solo lo que falte antes de proponer.

LEE PRIMERO: docs/sistema/60-OPERACION-DE-CONVERSION.md (primer viewport, message-match y destino
real del CTA), docs/sistema/57-AVATAR-Y-CONSCIENCIA.md + FICHA-AVATAR.md del proyecto (la fuente de
TODO el copy), docs/sistema/19-PAGINA-DE-VENTAS.md (ESTRUCTURA CANÓNICA + Big Idea + MECANISMO
BAUTIZADO + oferta Hormozi), docs/sistema/52-COPY-VISUALES-CONVERSION.md (SWIPE FILE de headlines + proceso
obligatorio de 10 variantes + rúbrica de copy /20), docs/sistema/55-DISENO-DE-LANDING.md (medidas del
hero/pricing/secciones a 375px), FICHA-ARTE.md del proyecto (misma identidad visual que la app —
si el usuario dio referencia, es CONTRATO), 22-LIBRERIAS-Y-CRAFT.md (animaciones de entrada),
02C-PRICING-Y-MODELO-DE-NEGOCIO.md (promesa, pricing y señuelo de 3 planes) y 20-ASSETS-VISUALES.md.

HEADLINE: obligatorio el proceso del 52 — 10 variantes mínimo → puntuar con las 4 U's → test del
bar → test de intercambiabilidad. El mecanismo se BAUTIZA con nombre propio (19) y aparece en
hero, sección de mecanismo y paywall.

CONSTRUYE las 10 secciones canónicas del 19 EN SU ORDEN EXACTO, con las reglas de copy del 52:
1) hero (headline 4U's de Mark Ford + subtitular que potencia + visual o placeholder con sugerencia
+ CTA; franja de prueba social día-1 debajo del CTA) · 2) problema en 3-5 preguntas desde los
dolores de la ficha · 3) agitación con el costo de la inacción cuantificado · 4) solución con el
mecanismo bautizado · 5) carrusel automático de la app (placeholders si aún no existe; screenshots
reales al cerrarla — pendiente en ESTADO.md) · 6) oferta anual+mensual con trial (anual como $/mes)
· 7) garantía con nombre · 8) FAQ desde las objeciones de la ficha · 9) CTA final emocional con
future pacing + PS · 10) footer legal con páginas existentes (47).
Copy en el idioma del usuario, específico y sin relleno, TODO trazable a FICHA-AVATAR.md.

ANTES DE PROPONER EL DISEÑO, escribe el argumento de conversión:
dolor específico → mecanismo → resultado → prueba/demo → oferta → reversibilidad → acción.
El hero debe expresar una sola idea escaneable; headline 8-10 palabras max (<8 ideal) y <=2 lineas
son limites del 52: si excedes por claridad, anotalo en el reporte (no es licencia general).
Usa palabras clave resaltadas
y visual real que muestre antes→después, desbloqueo, progreso o prueba. Si no hay garantía real,
no escribas "garantía visible"; déjalo como pendiente interno.

CTA SEGÚN EL MODELO (archivo 19 → "ADAPTACIÓN AL FLUJO HOTMART"): antes de escribir un solo CTA,
lee en ESTADO.md qué modelo de monetización se definió (02C) y, si no está claro, PREGÚNTAME.
Si Modelo 1 (hard paywall): el CTA lleva al checkout de Hotmart. Si Modelo 2 (onboarding-first,
el default B2C): el CTA lleva a `/onboarding` anonimo ("Crear mi plan gratis") por defecto. Solo
lleva a REGISTRO si la persistencia previa al pago exige Modelo 2B. El checkout aparece tras el
onboarding; la landing vende el inicio del resultado y el paywall vende el pago.

PRUEBA SOCIAL: si aún no hay 3 testimonios REALES, usa la jerarquía día-1 del 19 (demo/GIF del
producto real + garantía Hotmart + resultado del fundador con fecha) y OMITE la sección de
testimonios — nunca placeholders ni inventados. Sin claims de ingresos/salud (políticas de ads, 47).

MESSAGE-MATCH (archivo 19): el headline del hero debe ECOAR la promesa exacta del anuncio/email que
trae al visitante (los creativos del archivo 34). Si corres varios ángulos, idealmente cada uno
aterriza en un hero que recoge SU promesa — no un hero genérico para todos. Es la fuga de conversión
más barata de tapar.

REGLAS: una sola promesa central (la de ESTADO.md); CTAs consistentes con el estado del funnel;
sticky en dos tiempos (antes de ver oferta -> scroll; despues -> accion comercial); en 390x844 y
1440x900 deben verse marca, headline, subheadline, CTA y pista real del producto;
performance (Core Web Vitals — ver 28 si es Next.js); responsive mobile-first; CERO patrones engañosos
(urgencia falsa, costos ocultos, confirmshaming). Mismo nivel anti-slop que la app. Ninguna sección
solo-texto: aplica el SISTEMA DE ÍCONOS Y DETALLES del 55 (íconos SVG premium con contenedor,
hairlines degradadas en los elementos clave, checkmarks custom) — emojis prohibidos como íconos
salvo que el usuario los pida. CIERRE: screenshot
REAL a 375px → subagente `revisor-visual` (≥36/40 y ≥16/20 + fidelidad si hay referencia) + rúbrica
de copy /20 del 52 (≥16, también por revisor con contexto limpio). Verifica tsc + build + dev al
cerrar cada capa; mejora lo que exista (no reescribas sin avisar); causa raíz, no parches; no la
declares "lista" sin el veredicto del revisor; actualiza ESTADO.md.
