---
description: Convierte el feedback de los primeros clientes en máximo 3 mejoras priorizadas con RICE contra la promesa central — sin scope creep
---
ITERACIÓN POR FEEDBACK — llegaron los primeros clientes: qué mejorar (y qué NO)
(Requiere: clientes reales usando la app.)

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-ITERACION-FEEDBACK.txt`,
especialmente las preguntas simples sobre origen del feedback y máximo 3 cambios por ciclo.

Eres el product manager de esta app. Ya hay clientes reales opinando (soporte, WhatsApp, encuesta
de cancelación, reseñas de Hotmart, mensajes sueltos). Tu trabajo: convertir ese ruido en LA lista
corta de mejoras que sí mueven el negocio, y ejecutarla SIN scope creep. El feedback es oro, pero
obedecerlo todo destruye el producto: se prioriza contra la promesa central, no por volumen de
quejas ni por el cliente que más grita.

━━━ CONTEXTO (pega aquí el feedback crudo que tengas: mensajes, quejas, pedidos) ━━━
$ARGUMENTS

Si viene vacío, busca el feedback donde exista: tickets/plantillas de soporte, encuesta de
cancelación (35), event_log (36), reseñas de Hotmart que yo te pase — y pregúntame solo lo que falte.

LEE PRIMERO: docs/sistema/01-IDEACION.md (el FILTRO DE FEATURE — ¿apoya la promesa central? ¿la
usaría >50%? ¿pasa el test "quítale la palabra IA"?), 44-DESCUBRIMIENTO-DE-USUARIO.md (cómo leer
lo que dicen vs lo que hacen), 59-SOPORTE-CLIENTE.md (el loop de feedback del soporte) y
ESTADO.md (la promesa central y qué se decidió mandar a V2).

FASES (espera mi OK entre fase y fase):

FASE 1 — RECOLECTAR Y AGRUPAR (sin decidir todavía):
  Junta TODO el feedback disponible y complementa con CONDUCTA real si hay eventos (36): qué
  features se usan y cuáles nadie toca (lo que HACEN pesa más que lo que DICEN). Agrupa en temas
  (bug / fricción de UX / feature pedida / precio / expectativa rota) con cuántas personas
  mencionan cada uno. Muéstrame el mapa y espera mi OK.

FASE 2 — PRIORIZAR CON RICE LIGERO CONTRA LA PROMESA:
  Para cada tema: Alcance (¿a cuántos toca?) × Impacto (¿acerca al usuario a la promesa central o
  es cosmético?) × Confianza (¿lo respaldan datos/varios usuarios o es 1 voz fuerte?) ÷ Esfuerzo
  (S/M/L). ANTES de puntuar, cada feature pedida pasa el FILTRO DE FEATURE del 01 — si no lo pasa,
  va a la lista "NO por ahora" con la razón escrita (para responderle al cliente con respeto).
  Los BUGS que rompen la promesa saltan la fila: se arreglan primero, siempre.
  → Entrega: tabla priorizada + qué entra a V2 + qué NO entra y por qué. Espera mi OK.

FASE 3 — EJECUTAR EL CICLO (máximo 3 cambios):
  Implementa SOLO los 3 primeros del ranking aprobado (o menos). Cada cambio: leer los archivos
  del SO que la tabla de ruteo de CLAUDE.md indique para esa tarea → construir → verificar
  (tsc + build + dev + mirar renderizado si toca UI, checklist de cierre de CLAUDE.md).
  PROHIBIDO colar "ya que estamos" un cuarto cambio: lo que surja a mitad va a la lista de la
  próxima iteración en ESTADO.md.

FASE 4 — CERRAR EL LOOP CON LOS CLIENTES:
  Redacta el mensaje de "los escuchamos" (email/WhatsApp/changelog in-app): qué se mejoró gracias
  a quién lo pidió. El cliente que ve su feedback convertido en producto se queda — es retención
  gratis. A los que pidieron lo que NO se hará, respuesta honesta (está/no está en el plan y por qué).

CRITERIOS DE ÉXITO: cada decisión tiene su fila RICE visible (no "me pareció") · máximo 3 cambios
implementados y verificados · la lista "NO por ahora" existe con razones · el mensaje a clientes
está listo para enviar · ningún cambio contradice la promesa central de ESTADO.md.

CIERRE: actualiza ESTADO.md con: feedback procesado (temas y conteos), qué se implementó, la lista
"NO por ahora", y qué señal esperamos ver en 30 días (menos tickets del tema X, más uso de Y).
