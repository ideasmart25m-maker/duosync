---
description: USO INTERNO — audita la coherencia interna del propio SO (7 chequeos del SELF-CHECK) antes de reempacar; reporte primero
---
AUDITAR EL PROPIO SO — coherencia interna antes de reempacar (REPORTE primero)

>> USO INTERNO (mantenimiento del SO). Audita la DOCUMENTACIÓN del sistema, NO una app.
>> Si quieres auditar TU APP construida con el SO, usa /auditoria.

Vas a auditar la COHERENCIA INTERNA del propio Sistema Operativo documental — no una app.
El defecto histórico #1 del SO son las referencias cruzadas que se desincronizan, así que
NO se reempaca el SO hasta que esta auditoría salga limpia.

Contexto adicional del usuario (si lo dio): $ARGUMENTS

QUÉ HACER:
1. Lee docs/sistema/PLANTILLA-SELF-CHECK.md.
2. Corre EXACTAMENTE los comandos de los 7 chequeos (a–g), uno por uno, y pega la salida real
   de cada uno (no la inventes):
   (a) toda ref NN-*.md y PROMPT-*.txt resuelve a un archivo existente
   (b) AGENTS.md == CLAUDE.md byte a byte, y prompts distribuibles == docs/sistema/
   (c) fences (triple backtick) balanceados en cada doc
   (d) sin contradicciones de números (conteo de docs, sesiones, rangos + grep de conteos estancados)
   (e) IDs de modelo vigentes (claude-opus-4-8 / sonnet-4-6 / haiku-4-5 / fable-5; sin fecha ni 3.x)
   (f) cada doc numerado aparece en la tabla de ruteo de CLAUDE.md
   (g) INSTRUCCIONES.md y REFERENCIA-RAPIDA.md remiten a INICIO.md (B5) como fuente única del plan de sesiones
3. Rellena la tabla de REPORTE de la plantilla con ✅/❌ y la incoherencia exacta de cada ❌.

REGLAS:
- Primero el REPORTE. NO corrijas nada hasta que yo apruebe.
- No declares "coherente" un chequeo sin pegar la salida del comando que lo prueba.
- Tras mi OK, corrige solo lo aprobado, re-corre el chequeo afectado, y registra el cambio en
  CHANGELOG.md (PATCH para correcciones de coherencia). Solo entonces se reempaca el SO
  (scripts/release.sh automatiza parte de estas verificaciones).

Empieza leyendo la plantilla y corriendo el chequeo (a).
