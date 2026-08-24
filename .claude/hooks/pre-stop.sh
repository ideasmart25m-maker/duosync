#!/usr/bin/env bash
# Stop hook v2 — guardián de cierre: la EVIDENCIA es un artefacto en disco, no prosa.
# Conserva de v1: tsc incremental, frescura de ESTADO.md, gates de fichas y garantía>prueba.
# Nuevo en v2 (PILAR 1 — evidencia como artefacto):
#   a) GATE DE VEREDICTO — pantalla del dinero declarada construida en ESTADO.md exige
#      docs/revisiones/<slug>-veredicto.md con "Veredicto: LISTA", ≥36/40 y ≥16/20, y que
#      ningún .tsx sea más nuevo que ese veredicto (veredicto más viejo que el código = CADUCADO).
#   b) GATE DE COMPARATIVA — si existe FICHA-ARTE.md debe existir direcciones-abc.html
#      (en el árbol o en la historia de git).
#   c) GATE DE COPY MARCADO — landing construida exige docs/copy/ con al menos un .md.
#   d) GARANTÍA FAIL-CLOSED — copy que menciona garantía exige FICHA-MERCADO.md legible con
#      "Prueba elegida: N" y "Garantía elegida: M" y M>N. Sin ficha o sin parse = BLOQUEO SIEMPRE.
#   e) ANTI-LOOP REPARADO — la segunda pasada (stop_hook_active) ya NO desarma los gates:
#      RE-CORRE a-d y solo permite cerrar si pasan, o si cada violación pendiente está
#      documentada (grepeable) en la sección "Problemas conocidos" de ESTADO.md.
#   f) Si existe scripts/audit-conversion.sh en el proyecto, se corre y se propaga su exit
#      (lo crea otro editor del SO; este hook solo lo invoca si existe).
# Diseño: los gates a-d ACUMULAN todas las violaciones y se reportan juntas en un solo
# exit 2, para que el agente vea el mapa completo en una pasada (no de a una).
# Robusto: tolera proyectos sin package.json/tsconfig/git. Compatible con bash 3.2 (macOS).
# Los mismos gates a-d existen como pre-commit en scripts/pre-commit-gates.sh (mismos mensajes).

INPUT=$(cat)

# ── Detección de segunda pasada ─────────────────────────────────────────────
STOP_ACTIVE=false
if command -v node >/dev/null 2>&1; then
  STOP_ACTIVE=$(printf '%s' "$INPUT" | node -e '
  let input = "";
  process.stdin.on("data", chunk => input += chunk);
  process.stdin.on("end", () => {
    try { process.stdout.write(JSON.parse(input)?.stop_hook_active ? "true" : "false"); }
    catch { process.stdout.write("false"); }
  });
  ' 2>/dev/null)
elif printf '%s' "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  STOP_ACTIVE=true
fi

# ── Acumulador de violaciones ───────────────────────────────────────────────
VIOL_KEYS=()
VIOL_MSGS=()
add_viol() {
  VIOL_KEYS[${#VIOL_KEYS[@]}]="$1"
  VIOL_MSGS[${#VIOL_MSGS[@]}]="$2"
}

# ── a) GATE DE VEREDICTO ────────────────────────────────────────────────────
# Detección (aproximación DOCUMENTADA): una pantalla del dinero se considera
# "declarada construida" si alguna línea de ESTADO.md contiene su nombre
# (landing | onboarding | paywall | pantalla principal) a ≤30 caracteres de una
# palabra de estado (construid- | verificad- | complet- | lista/o), en cualquier
# orden, y la línea no contiene "pendiente"/"no iniciad-". Es una heurística de
# línea: prefiere el falso positivo (pedir evidencia de más) al falso negativo.
gate_veredicto() {
  [ -f "ESTADO.md" ] || return 0
  for PAR in "landing|landing" "onboarding|onboarding" "paywall|paywall" "pantalla principal|pantalla-principal"; do
    NOMBRE="${PAR%%|*}"
    SLUG="${PAR##*|}"
    LINEA=$(LC_ALL=C grep -iE "(${NOMBRE}).{0,30}(construid|verificad|complet|list[ao])|(construid|verificad|complet|list[ao]).{0,30}(${NOMBRE})" ESTADO.md 2>/dev/null \
      | LC_ALL=C grep -ivE "pendiente|no iniciad|por construir" | head -1)
    [ -n "$LINEA" ] || continue

    # 1) Existe el veredicto del revisor (artefacto, no prosa)
    VFILE=""
    if [ -f "docs/revisiones/${SLUG}-veredicto.md" ]; then
      VFILE="docs/revisiones/${SLUG}-veredicto.md"
    else
      for F in docs/revisiones/*"${SLUG}"*-veredicto.md; do
        [ -f "$F" ] && { VFILE="$F"; break; }
      done
    fi
    if [ -z "$VFILE" ]; then
      add_viol "veredicto:${SLUG}" "ESTADO.md declara la pantalla '${SLUG}' como construida/lista pero NO existe su veredicto: falta docs/revisiones/${SLUG}-veredicto.md con 'Veredicto: LISTA', 'Usabilidad: NN/40' (≥36) y 'Craft: NN/20' (≥16). Lo escribe EL SUBAGENTE revisor-visual (nunca quien construyó), junto al screenshot docs/revisiones/${SLUG}-375.png. La prosa ('revisado en preview') NO cuenta como evidencia."
      continue
    fi

    # 2) Veredicto LISTA + puntajes del gate doble (parseo con regex del formato canónico)
    if ! grep -qE '^Veredicto:[[:space:]]*LISTA' "$VFILE"; then
      add_viol "veredicto:${SLUG}" "El veredicto ${VFILE} NO dice 'Veredicto: LISTA' (o dice NO LISTA). La pantalla '${SLUG}' no puede declararse construida/lista en ESTADO.md: corrige los defectos del veredicto y re-lanza el revisor-visual."
      continue
    fi
    USAB=$(sed -nE 's|^Usabilidad:[[:space:]]*([0-9]+)/40.*|\1|p' "$VFILE" | head -1)
    CRAFT=$(sed -nE 's|^Craft:[[:space:]]*([0-9]+)/20.*|\1|p' "$VFILE" | head -1)
    if [ -z "$USAB" ] || [ -z "$CRAFT" ]; then
      add_viol "veredicto:${SLUG}" "El veredicto ${VFILE} no tiene puntajes legibles: se exigen las líneas canónicas 'Usabilidad: NN/40' y 'Craft: NN/20' (las escribe el revisor-visual). Sin puntajes parseables el gate es fail-closed."
      continue
    fi
    if [ "$USAB" -lt 36 ] || [ "$CRAFT" -lt 16 ]; then
      add_viol "veredicto:${SLUG}" "La pantalla '${SLUG}' no pasa el gate doble: ${USAB}/40 y ${CRAFT}/20 (se exige ≥36/40 Y ≥16/20). Corrige los TOP DEFECTOS del veredicto ${VFILE} y re-lanza el revisor-visual."
      continue
    fi

    # 3) Frescura: veredicto más viejo que el código = CADUCADO.
    #    Aproximación DOCUMENTADA: no hay mapeo fiable pantalla→archivo, así que se
    #    exige que NINGÚN .tsx de app/, components/ o src/ sea más nuevo que el
    #    veredicto de la pantalla (find -newer). Si editaste código tras el veredicto,
    #    re-render + re-veredicto.
    NUEVOS=$(find app components src -name "*.tsx" -newer "$VFILE" 2>/dev/null | head -3 | tr '\n' ' ')
    if [ -n "$NUEVOS" ]; then
      add_viol "veredicto:${SLUG}" "Veredicto CADUCADO para '${SLUG}': hay código .tsx más nuevo que ${VFILE} (ej.: ${NUEVOS}). Un veredicto más viejo que el código de su pantalla no vale: re-renderiza a 375px y re-lanza el revisor-visual."
    fi
  done
}

# ── b) GATE DE COMPARATIVA ──────────────────────────────────────────────────
gate_comparativa() {
  [ -f "FICHA-ARTE.md" ] || return 0
  [ -f "direcciones-abc.html" ] && return 0
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git log --all --diff-filter=A --name-only --pretty=format: 2>/dev/null | grep -q "direcciones-abc\.html" && return 0
  fi
  add_viol "direcciones-abc" "Existe FICHA-ARTE.md pero direcciones-abc.html está AUSENTE (ni en el árbol ni en la historia de git): la identidad se eligió sin la comparativa A/B/C renderizada que exige el protocolo del 54. Genera direcciones-abc.html en la raíz del proyecto + el screenshot docs/revisiones/direcciones-abc.png (o recupera el que se usó)."
}

# ── c) GATE DE COPY MARCADO ─────────────────────────────────────────────────
# Detección: hay pantalla de venta construida si existe app/ y (ESTADO.md declara la
# landing construida O hay copy de venta grepeable en el código).
gate_copy_marcado() {
  [ -d "app" ] || return 0
  DECLARADA=$(LC_ALL=C grep -iE "(landing).{0,30}(construid|verificad|complet|list[ao])|(construid|verificad|complet|list[ao]).{0,30}(landing)" ESTADO.md 2>/dev/null \
    | LC_ALL=C grep -ivE "pendiente|no iniciad|por construir" | head -1)
  VENTA=$(grep -rlEi "días gratis|dias gratis|prueba gratis|empezar mi prueba|paywall" \
    --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
    app components src 2>/dev/null | head -1)
  [ -n "$DECLARADA" ] || [ -n "$VENTA" ] || return 0
  ls docs/copy/*.md >/dev/null 2>&1 && return 0
  add_viol "docs/copy" "Hay pantalla de venta construida (app/ con landing) pero docs/copy/ está AUSENTE (no existe o no tiene ningún .md). El copy marcado es el INPUT de construcción: escribe docs/copy/<pantalla>.md con [acento]...[/acento] y [b]...[b] ANTES de construir/retocar la pantalla de venta."
}

# ── d) GARANTÍA FAIL-CLOSED ─────────────────────────────────────────────────
# v1 solo verificaba garantía>prueba SI existía FICHA-MERCADO.md (el gate se desarmaba
# sin la ficha). v2 lo invierte: copy con garantía y SIN ficha legible = bloqueo SIEMPRE.
gate_garantia() {
  MENCIONA=$(grep -rlEi "garantía|garantia" \
    --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
    app components src 2>/dev/null | head -1)
  [ -n "$MENCIONA" ] || return 0
  if [ ! -f "FICHA-MERCADO.md" ]; then
    add_viol "garantia" "El copy menciona garantía (ej.: ${MENCIONA}) pero NO existe FICHA-MERCADO.md. Los plazos tienen que estar VERIFICADOS contra la pasarela real (18-VENTA-HOTMART.md), no supuestos. Este gate es FAIL-CLOSED: garantía sin FICHA-MERCADO con 'Prueba elegida: N' y 'Garantía elegida: M' (M>N) bloquea SIEMPRE. Créala con PLANTILLA-FICHA-MERCADO.md o quita la garantía del copy."
    return 0
  fi
  PRUEBA=$(LC_ALL=C sed -nE 's|.*Prueba elegida:[[:space:]]*([0-9]+).*|\1|p' FICHA-MERCADO.md 2>/dev/null | head -1)
  GARANTIA=$(LC_ALL=C sed -nE 's|.*Garant[^ ]*a elegida:[[:space:]]*([0-9]+).*|\1|p' FICHA-MERCADO.md 2>/dev/null | head -1)
  if [ -z "$PRUEBA" ] || [ -z "$GARANTIA" ]; then
    add_viol "garantia" "El copy menciona garantía (ej.: ${MENCIONA}) pero FICHA-MERCADO.md no tiene los dos plazos legibles ('Prueba elegida: N' y 'Garantía elegida: M'). v1 avisaba y dejaba pasar; v2 es FAIL-CLOSED: sin los plazos parseables no hay cobertura verificada → se bloquea. Completa la ficha o quita la garantía del copy."
    return 0
  fi
  if [ "$GARANTIA" -le "$PRUEBA" ]; then
    add_viol "garantia" "REGLA DURA INCUMPLIDA: garantía (${GARANTIA} días) NO supera la prueba (${PRUEBA} días). Durante la prueba no hay nada que devolver, y el día del primer cobro la garantía ya venció: la cobertura real es CERO. O subes el plazo en el panel de la pasarela, o QUITAS la garantía del copy (18-VENTA-HOTMART.md)."
  fi
}

# ── Gates conservados de v1 (fichas + frescura de ESTADO) — solo primera pasada ──
gates_extra() {
  # Frescura: ESTADO.md desactualizado (>2h) con trabajo sin commitear en src/ o app/.
  if [ -f "ESTADO.md" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    NOW=$(date +%s)
    if [ "$(uname)" = "Darwin" ]; then
      MTIME=$(stat -f %m ESTADO.md 2>/dev/null || echo "$NOW")
    else
      MTIME=$(stat -c %Y ESTADO.md 2>/dev/null || echo "$NOW")
    fi
    AGE=$((NOW - MTIME))
    if [ "$AGE" -gt 7200 ]; then
      DIRTY=$(git status --porcelain -- src app 2>/dev/null)
      if [ -n "$DIRTY" ]; then
        add_viol "ESTADO.md" "Hay cambios sin commitear en src/ o app/ y ESTADO.md lleva más de 2 horas sin actualizarse. ESTADO.md es tu memoria (Regla de Oro 3): actualízalo (fase, decisiones, pendientes) antes de cerrar."
      fi
    fi
  fi

  # Copy de venta sin la ficha del cliente ideal.
  COPY_VENTA=$(grep -rlEi "días gratis|dias gratis|prueba gratis|empezar mi prueba|paywall" \
    --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
    app components src 2>/dev/null | head -1)
  if [ -n "$COPY_VENTA" ] && [ ! -f "FICHA-AVATAR.md" ]; then
    add_viol "FICHA-AVATAR" "Hay copy de venta en la app pero NO existe FICHA-AVATAR.md. El SO lo prohíbe expresamente (Regla de Oro 6 / 57-AVATAR-Y-CONSCIENCIA.md): el copy se DERIVA de la ficha, no se inventa. Créala con PLANTILLA-FICHA-AVATAR.md antes de cerrar."
  fi

  # Otras promesas de dinero (reembolso/días gratis) sin FICHA-MERCADO.md.
  # (La garantía ya la cubre el gate d, fail-closed; esto conserva el resto del gate v1.)
  MENCIONA_G=$(grep -rlEi "garantía|garantia" \
    --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
    app components src 2>/dev/null | head -1)
  PROMESA=$(grep -rlEi "reembolso|días gratis|dias gratis" \
    --include="*.tsx" --include="*.ts" app components src 2>/dev/null | head -1)
  if [ -n "$PROMESA" ] && [ -z "$MENCIONA_G" ] && [ ! -f "FICHA-MERCADO.md" ]; then
    add_viol "FICHA-MERCADO" "La app promete prueba/reembolso/precio pero NO existe FICHA-MERCADO.md. Esos plazos tienen que estar VERIFICADOS contra la pasarela real, no supuestos (18-VENTA-HOTMART.md → protocolo de checkout real). Créala con PLANTILLA-FICHA-MERCADO.md antes de cerrar."
  fi
}

# ── ¿La violación está documentada en "Problemas conocidos" de ESTADO.md? ───
SECCION_PROBLEMAS=""
carga_problemas() {
  SECCION_PROBLEMAS=$(awk '/^## Problemas conocidos/{f=1;next} /^## /{f=0} f' ESTADO.md 2>/dev/null)
}
documentada() {
  case "$1" in
    veredicto:*)
      SL="${1#veredicto:}"
      printf '%s\n' "$SECCION_PROBLEMAS" | grep -i "veredicto" | grep -qi "$SL"
      ;;
    direcciones-abc) printf '%s\n' "$SECCION_PROBLEMAS" | grep -qi "direcciones-abc" ;;
    docs/copy)       printf '%s\n' "$SECCION_PROBLEMAS" | grep -qi "docs/copy" ;;
    garantia)        printf '%s\n' "$SECCION_PROBLEMAS" | LC_ALL=C grep -qiE "garant|FICHA-MERCADO" ;;
    *) return 1 ;;
  esac
}

# ── SEGUNDA PASADA (anti-loop v2): re-correr a-d; cerrar solo si pasan o están documentadas ──
if [ "$STOP_ACTIVE" = "true" ]; then
  gate_veredicto
  gate_comparativa
  gate_copy_marcado
  gate_garantia
  N=${#VIOL_KEYS[@]}
  [ "$N" -eq 0 ] && exit 0
  carga_problemas
  SIN_DOC=0
  i=0
  while [ "$i" -lt "$N" ]; do
    if ! documentada "${VIOL_KEYS[$i]}"; then
      if [ "$SIN_DOC" -eq 0 ]; then
        echo "⛔ Segunda pasada: siguen violaciones de gates NI resueltas NI documentadas:" >&2
      fi
      printf '  • [%s] %s\n' "${VIOL_KEYS[$i]}" "${VIOL_MSGS[$i]}" >&2
      SIN_DOC=1
    fi
    i=$((i + 1))
  done
  if [ "$SIN_DOC" -eq 1 ]; then
    echo "" >&2
    echo "→ Resuelve cada violación, o documéntala (grepeable, con su palabra clave: la pantalla y" >&2
    echo "  'veredicto', 'direcciones-abc', 'docs/copy', 'garantía'/'FICHA-MERCADO') en la sección" >&2
    echo "  'Problemas conocidos' de ESTADO.md. Resuelve o documenta en Problemas conocidos." >&2
    exit 2
  fi
  exit 0
fi

# ── PRIMERA PASADA ──────────────────────────────────────────────────────────
gate_veredicto
gate_comparativa
gate_copy_marcado
gate_garantia
gates_extra

N=${#VIOL_KEYS[@]}
if [ "$N" -gt 0 ]; then
  echo "⛔ GATES DE EVIDENCIA (pre-stop v2): ${N} violación(es). No se declara terminado sin resolverlas:" >&2
  i=0
  while [ "$i" -lt "$N" ]; do
    printf '\n• [%s] %s\n' "${VIOL_KEYS[$i]}" "${VIOL_MSGS[$i]}" >&2
    i=$((i + 1))
  done
  echo "" >&2
  echo "→ Resuelve cada punto. Si decides posponer alguno, documéntalo (grepeable, con su palabra" >&2
  echo "  clave) en la sección 'Problemas conocidos' de ESTADO.md — solo así la siguiente pasada" >&2
  echo "  permite cerrar." >&2
  exit 2
fi

# f) Auditoría de conversión del proyecto (la crea otro editor del SO; solo se invoca si existe).
if [ -f "scripts/audit-conversion.sh" ]; then
  bash scripts/audit-conversion.sh
  RC=$?
  if [ "$RC" -ne 0 ]; then
    exit "$RC"
  fi
fi

# TypeScript limpio antes de cerrar (conservado de v1; corre al final para pagar su costo
# solo cuando los gates deterministas ya pasaron).
# (--incremental + .tsbuildinfo-hook: mismo cache que post-edit.sh; va en .gitignore)
if [ -f "tsconfig.json" ] && [ -d "node_modules" ]; then
  if ! npx tsc --noEmit --incremental --tsBuildInfoFile .tsbuildinfo-hook >/dev/null 2>&1; then
    echo "⚠️ No declares esto terminado: tsc reporta errores. Corrígelos o anótalos como pendiente en ESTADO.md" >&2
    exit 2
  fi
fi

exit 0
