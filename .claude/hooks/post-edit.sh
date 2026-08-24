#!/usr/bin/env bash
# PostToolUse hook (Edit|Write) — typecheck automático tras editar .ts/.tsx.
# Robusto: si no hay Node, tsconfig o node_modules, sale limpio sin molestar.

INPUT=$(cat)

command -v node >/dev/null 2>&1 || exit 0
FILE_PATH=$(printf '%s' "$INPUT" | node -e '
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  try { process.stdout.write(JSON.parse(input)?.tool_input?.file_path ?? ""); } catch {}
});
' 2>/dev/null)

# Sin file_path detectable → no bloquear nada.
[ -z "$FILE_PATH" ] && exit 0

# Solo TypeScript.
case "$FILE_PATH" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Solo si el proyecto realmente es TS con dependencias instaladas.
[ -f "tsconfig.json" ] || exit 0
[ -d "node_modules" ] || exit 0

# --incremental + tsBuildInfoFile propio: el typecheck del hook reusa estado entre ediciones
# (mucho más rápido en proyectos grandes) sin pisar el .tsbuildinfo del build normal.
# `.tsbuildinfo-hook` debe estar en .gitignore (junto a .env y .next).
TSC_OUT=$(npx tsc --noEmit --incremental --tsBuildInfoFile .tsbuildinfo-hook --pretty false 2>&1 | head -40)
if [ -n "$TSC_OUT" ] && printf '%s' "$TSC_OUT" | grep -q "error TS"; then
  {
    echo "⚠️ tsc reporta errores tras editar $FILE_PATH (Regla de Oro 4: una capa a la vez, verificando):"
    echo "$TSC_OUT"
    echo "Corrige la CAUSA RAÍZ antes de seguir (no @ts-ignore, no any)."
  } >&2
  exit 2
fi

# ── LINT DEL ARCHIVO EDITADO ────────────────────────────────────────────────
# Por qué también lint y no solo tsc: los errores que más cuestan tiempo no son de
# tipos, son de REGLAS (efectos que cambian estado, dependencias mal declaradas,
# hooks condicionales). tsc los deja pasar y aparecen al final, cuando rehacerlos
# es caro. Se lintea SOLO el archivo tocado para que el hook siga siendo rápido.
# Silencioso si el proyecto no tiene ESLint configurado.
if [ -f "eslint.config.mjs" ] || [ -f "eslint.config.js" ] || [ -f ".eslintrc.json" ]; then
  LINT_OUT=$(npx eslint "$FILE_PATH" --format unix 2>/dev/null | grep -i "error" | head -20)
  if [ -n "$LINT_OUT" ]; then
    {
      echo "⚠️ ESLint reporta errores en $FILE_PATH (Regla dura 2: causa raíz, no supresión):"
      echo "$LINT_OUT"
      echo "Prohibido desactivar la regla para que pase. Corrige el patrón."
    } >&2
    exit 2
  fi
fi

exit 0
