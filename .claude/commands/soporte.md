---
description: Monta el sistema de soporte (email + WhatsApp, plantillas, SLA) y el soporte-como-retención que evita reembolsos y reseñas negativas
---
SOPORTE — monta el sistema de atención que retiene clientes (email + WhatsApp, plantillas, SLA)
(Requiere: app vendiendo por Hotmart, o a punto de lanzar.)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-SOPORTE.txt`, especialmente las
preguntas simples sobre canal, etapa y tiempo real disponible para responder.

Eres el responsable de operación post-venta de esta app. Monta el sistema de soporte completo:
canal, plantillas listas para copiar-pegar, un SLA realista para una persona sola, y el soporte
como RETENCIÓN (cada ticket bien atendido es un churn evitado y una reseña positiva en Hotmart).
Primero preséntame el plan y ESPERA MI OK; luego genera todo.

━━━ CONTEXTO (canales que ya uso, volumen de mensajes, quejas repetidas) ━━━
$ARGUMENTS

Si viene vacío, dedúcelo de ESTADO.md (tono de la app, avatar, dominio de email del 18) y
pregúntame solo lo que falte.

LEE PRIMERO: docs/sistema/59-SOPORTE-CLIENTE.md (el sistema de soporte-como-retención completo: la sección "SOPORTE AL CLIENTE COMO
SISTEMA DE RETENCIÓN": canales por etapa, SLA, soporte con IA + escalada humana, soporte
que rescata churn, métricas), 18-VENTA-HOTMART.md (cómo funciona el acceso post-compra y el
reembolso vía Hotmart — el soporte vive pegado a ese flujo), 58-RETENCION-DE-INGRESOS.md (las
alternativas reales a la baja, para la señal de cancelación) y 34-ADQUISICION-Y-TRAFICO.md
(sección WhatsApp: el mismo canal que vende, soporta).

FASES (espera mi OK entre fase y fase):

FASE 1 — CANAL + SLA (dimensionado a UNA persona, no a un call center):
  • Email de soporte (soporte@dominio o el alias que exista en Resend/18) + WhatsApp Business
    (el canal que el cliente LATAM usa de verdad — respuestas rápidas y etiquetas configuradas).
  • Dónde se publica: página de la app (footer/ajustes), página de gracias de Hotmart, y en el
    email de acceso (el cliente que no encuentra soporte abre disputa en Hotmart directamente).
  • SLA simple y CUMPLIBLE (47): ej. respuesta <24h hábiles (aspirar a <4h en horario), acuse
    automático inmediato. Publicar el SLA es una promesa — mejor humilde y cumplido.
  → Preséntame el plan de canal + SLA y espera mi OK.

FASE 2 — PLANTILLAS (las 6+ respuestas que cubren ~90% de los tickets, en el tono de la app):
  1. "NO ME LLEGÓ EL ACCESO" — el punto crítico #1 del modelo Hotmart (pagó y no puede entrar): pasos de
     verificación (email de compra vs email de registro, spam, reenviar acceso), y qué revisar
     del lado técnico (¿llegó el webhook? ¿se creó el perfil?) antes de culpar al cliente.
  2. REEMBOLSO: cómo pedirlo VÍA HOTMART (quién lo procesa, plazo de garantía), tono sin fricción
     — un reembolso fácil es mejor que una disputa y una reseña destructiva.
  3. CÓMO CANCELAR: instrucciones honestas del panel de comprador de Hotmart + (si está montado)
     la encuesta/alternativas del 35. Cancelar fácil = confianza = puerta abierta a volver.
  4. BUG REPORTADO: acuse + qué datos pedir (pantalla, dispositivo, captura) + promesa de
     seguimiento con fecha + registro del bug para /iteracion-feedback.
  5. "¿CÓMO HAGO X?" (duda de uso): respuesta + dónde estaba la ayuda + anotar la fricción
     (si muchos preguntan lo mismo, es un problema de UX, no de soporte).
  6. PAGO FALLIDO / past_due: link para actualizar el método en Hotmart (enlaza con el dunning
     de /retener-ingresos si está activo).
  Cada plantilla: asunto (email) + versión corta para WhatsApp + variables [NOMBRE], [APP], [LINK].

FASE 3 — SOPORTE COMO RETENCIÓN (la diferencia entre atender y retener):
  • SEÑALES DE CANCELACIÓN en tickets ("muy caro", "no lo uso", "no entiendo", "¿cómo cancelo?")
    → respuesta con alternativa REAL del 35 (descuento vía cupón, re-onboarding guiado, cancelar +
    cupón de regreso) — SIN presionar: se ofrece una vez, se respeta el no.
  • PROACTIVO: contactar (email/WhatsApp) a quien pagó y no activó en 7 días ("¿te ayudo con el
    primer paso?") — rescata reembolsos del periodo de garantía.
  • LOOP DE FEEDBACK: cada ticket se clasifica (bug/fricción/feature/precio) en un registro simple
    que alimenta /iteracion-feedback y las métricas de soporte del 47.
  • Si hay volumen: respuestas asistidas por IA con REGLA DURA del 47 — la IA nunca promete
    reembolsos ni cambia condiciones; dinero y enojo escalan a humano SIEMPRE.

CRITERIOS DE ÉXITO: el canal está publicado y un mensaje de prueba recibe el acuse · las 6+
plantillas existen en el tono de la app y en el idioma del avatar · el SLA está escrito y es
cumplible por una persona · la plantilla #1 (acceso) incluye el diagnóstico técnico del webhook ·
el registro de clasificación de tickets existe · nada del sistema promete lo que Hotmart/la app
no pueden cumplir.

CIERRE: actualiza ESTADO.md con: canales activos, SLA publicado, dónde viven las plantillas, y las
métricas de soporte a mirar en /operacion-mensual (volumen, tema top, tiempo de respuesta,
churn rescatado).
