---
description: Rescata una app estancada con el Protocolo de Rescate R1-R5 (flujo + UX + seguridad)
---
PROMPT DE RESCATE — rediseñar una app existente sin romperla

Regla canónica actualizada: aplica primero `docs/sistema/PROMPT-RESCATE.txt`, especialmente las
preguntas simples iniciales, diagnóstico de causa raíz y aprobación antes de rehacer algo.

Esta app está avanzada pero estancada: el flujo no es claro, la UX/UI se siente
genérica y la experiencia no está al nivel que quiero (mi referencia de fluidez
y claridad son Duolingo, Revolut y Phantom). Vas a rescatarla siguiendo el
PROTOCOLO DE RESCATE de docs/sistema/12-FLUJO-AGENTICO.md, ejecutando sus 5
fases EN ORDEN y sin saltarte ninguna:

━━━ [CONTEXTO DE LA APP] ━━━
$ARGUMENTS

Si el contexto de arriba viene vacío o incompleto, NO asumas el nicho: primero dedúcelo de ESTADO.md
(si existe) y del código, y PREGÚNTAME solo lo que falte ANTES de diseñar. El contexto completo:
  • Qué hace / pantalla principal
  • Audiencia / ICP (género, edad, nivel socioeconómico LATAM, estado emocional al usarla)
  • Personalidad en 3 adjetivos + paleta/marca a preservar (si la hay)
  • Referencias de fluidez/claridad (ej. Duolingo, Revolut, Phantom)
EJEMPLO: app de manifestación/espiritualidad → personalidad calma, inspiración, confianza;
experiencia serena y premium (no gamificada infantil ni corporativa).
Usa el contexto para definir los 3 adjetivos, la paleta (deriva con el PASO 0 de 16), el ritmo de
las animaciones y el tono del copy.

FASE R1 — EXPLORAR (solo lectura, prohibido modificar nada todavía):
Lee la estructura del proyecto y cada pantalla/componente principal. Levanta el
dev server y observa la app funcionando. Haz también una AUDITORÍA TÉCNICA, no solo
visual: ¿hay API keys en el frontend? ¿RLS activo? ¿auth segura? Corre la auditoría de
docs/sistema/27-REVISION-SEGURIDAD.md y revisa esquema/índices (docs/sistema/25) y auth
(docs/sistema/26). Crea el ESTADO.md con la plantilla de docs/sistema/PLANTILLA-ESTADO.md
documentando todo lo que encuentres, incluidos los hallazgos de seguridad/DB/auth.

FASE R2 — MAPEAR EL FLUJO ACTUAL:
Documenta el viaje real del usuario pantalla por pantalla: qué ve, qué puede
hacer, cuántas acciones compiten por su atención, y cómo pasa a la siguiente
pantalla. Marca cada punto de fricción, redundancia y vacío.

FASE R3 — DISEÑAR EL FLUJO IDEAL:
Audita contra docs/sistema/03-PRINCIPIOS-APP-EXITOSA.md (los 16 principios y su
checklist) y docs/sistema/11-DISENO-EMOCIONAL.md (los 3 niveles y el test
"¿se siente genérico?"). Con la lógica de docs/sistema/04-ARQUITECTURA.md,
rediseña el flujo objetivo: primer uso → momento WOW → uso recurrente.

FASE R4 — PRESÉNTAME EL PLAN Y DETENTE:
Entrégame: (a) el diagnóstico de lo que está bien, roto, faltante y genérico,
ordenado por impacto; (b) flujo actual vs flujo ideal; (c) qué pantallas se
mantienen, fusionan, eliminan o crean; (d) el plan de ejecución por capas.
NO ejecutes nada hasta que yo apruebe el plan.

FASE R5 — (tras mi aprobación) EJECUTAR POR CAPAS VERIFICADAS:
1) Flujo y navegación → 2) jerarquía y limpieza de cada pantalla → 3) sistema
visual con tokens de docs/sistema/10-DESIGN-TOKENS.md → 4) diseño emocional
completo (personalidad en 3 adjetivos, animaciones escalonadas, celebraciones,
errores empáticos, copy humano) → 5) testing con docs/sistema/06-TESTING.md.
Una capa a la vez: tsc --noEmit, build y dev server limpios antes de pasar a
la siguiente. Actualiza ESTADO.md al cerrar cada capa.

REGLAS PERMANENTES DURANTE TODO EL RESCATE:
- Mejora lo que existe, no reescribas desde cero. Si algo amerita rehacerse,
  avísame antes.
- Cero features nuevas durante el rescate (anótalas en ESTADO.md para después).
- Nunca elimines algo que construí sin preguntarme explícitamente.
- Causa raíz, no parches: prohibido @ts-ignore, any, o silenciar errores.
- Nunca declares que algo funciona sin haberlo ejecutado.

Empieza con la Fase R1 ahora.
