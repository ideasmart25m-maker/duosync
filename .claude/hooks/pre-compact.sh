#!/usr/bin/env bash
# PreCompact hook — antes de compactar, exige dejar el checkpoint ESCRITO en disco.
# (El recordatorio verbal se pierde EN la compactación; lo que sobrevive es lo que
# está en archivos. Tras compactar, el hook SessionStart re-inyecta FICHA-ARTE.md
# y el PREFLIGHT automáticamente.)

if [ -f "ESTADO.md" ]; then
  echo "Compactación inminente: ANTES de seguir, escribe en ESTADO.md un checkpoint de 3-5 líneas"
  echo "(fase actual, pantalla en curso, decisiones de esta sesión aún no anotadas, próximo paso)."
  echo "Tras la compactación el hook de arranque re-inyectará FICHA-ARTE.md, FICHA-AVATAR.md y el PREFLIGHT."
else
  echo "Compactación inminente y NO existe ESTADO.md: créalo AHORA con la plantilla"
  echo "(docs/sistema/PLANTILLA-ESTADO.md) para no perder las decisiones de esta sesión."
fi

exit 0
