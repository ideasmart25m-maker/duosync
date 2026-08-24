#!/usr/bin/env bash
# SessionStart hook — inyecta CONTENIDO (no solo recordatorios) al arrancar, retomar
# o tras una compactación de contexto. Siempre exit 0 (informa, no bloquea).
#
# Doctrina: las decisiones de diseño deben estar EN el contexto de cada sesión,
# no depender de que el agente obedezca "lee el archivo X". Por eso este hook
# inyecta FICHA-ARTE.md, FICHA-AVATAR.md, FICHA-MERCADO.md y el PREFLIGHT completos.

echo "=== SO APPS · CONTEXTO DE ARRANQUE ==="
echo "→ Brújula de prioridades: docs/sistema/PILARES-DEL-EXITO.md (2 min — ¿la sesión que viene ataca el pilar correcto?)"

# 1) Estado del proyecto
if [ -f "ESTADO.md" ]; then
  echo "→ Existe ESTADO.md: LÉELO ANTES de cualquier cosa (es tu memoria persistente)."
  CHECKPOINT=$(grep -i -m1 "checkpoint" ESTADO.md 2>/dev/null || true)
  [ -n "$CHECKPOINT" ] && echo "  Último checkpoint anotado: $CHECKPOINT"
else
  echo "→ No hay ESTADO.md: proyecto nuevo → lee docs/sistema/INICIO.md y sigue sus FLUJOS A/B/C."
  echo "  ⚠️ PROTOCOLO DEL PRIMER MENSAJE (INICIO PASO 2 — se viola fácil, repásalo):"
  echo "  1. Si hay que instalar (descomprimir, mover, git init): EN SILENCIO ABSOLUTO. Ni"
  echo "     'encontré el zip', ni 'verifico archivos', ni 'sistema instalado y listo'."
  echo "  2. Tu PRIMER texto visible es ÚNICAMENTE la Primera Pregunta de INICIO.md PASO 2,"
  echo "     copiada VERBATIM (con sus 3 opciones EXPLICADAS — prohibido parafrasear o acortar)."
  echo "  3. NADA antes ni después: ni cómo va a ser el trabajo, ni cuentas, ni sesiones, ni"
  echo "     costos. Cada aviso tiene su momento (regla 8 de INICIO)."
fi

# 2) FICHA DE DIRECCIÓN DE ARTE — inyección completa (sobrevive compactaciones)
if [ -f "FICHA-ARTE.md" ]; then
  echo ""
  echo "── FICHA DE DIRECCIÓN DE ARTE (contrato visual vigente — NO redecidir nada de esto) ──"
  head -70 FICHA-ARTE.md
  echo "── fin de la ficha ──"
elif [ -f "ESTADO.md" ]; then
  echo ""
  echo "⚠️ Hay ESTADO.md pero NO hay FICHA-ARTE.md. Si ya se decidió identidad visual, migra esas"
  echo "   decisiones a FICHA-ARTE.md (plantilla: docs/sistema/PLANTILLA-FICHA-ARTE.md) ANTES de"
  echo "   construir más UI. Si aún no hay identidad: se define en la sesión de identidad (16)."
fi

# 2b) FICHA DE AVATAR — el cliente ideal del que se deriva TODO el copy de venta
if [ -f "FICHA-AVATAR.md" ]; then
  echo ""
  echo "── FICHA DE AVATAR (cliente ideal — TODO copy de venta se DERIVA de aquí, no se inventa) ──"
  head -80 FICHA-AVATAR.md
  echo "── fin de la ficha de avatar ──"
elif [ -f "ESTADO.md" ]; then
  echo ""
  echo "⚠️ Hay ESTADO.md pero NO hay FICHA-AVATAR.md. PROHIBIDO escribir página de ventas, onboarding"
  echo "   o paywall sin ella (57-AVATAR-Y-CONSCIENCIA.md; plantilla: PLANTILLA-FICHA-AVATAR.md)."
fi

# 2c) FICHA DE MERCADO — los NÚMEROS del nicho (precio, ciclo, medios de pago, plazos)
if [ -f "FICHA-MERCADO.md" ]; then
  echo ""
  echo "── FICHA DE MERCADO (números del nicho — NO usar los ejemplos de los docs del SO) ──"
  head -70 FICHA-MERCADO.md
  echo "──────────────────────────────────────────────────────────────────────"
elif [ -f "ESTADO.md" ]; then
  echo ""
  echo "⚠️ Hay ESTADO.md pero NO hay FICHA-MERCADO.md. Antes de fijar precio, duración de prueba o"
  echo "   garantía, investiga los números de ESTE nicho y país (plantilla: PLANTILLA-FICHA-MERCADO.md)."
  echo "   Cada nicho es distinto: copiar un número de ejemplo de un doc del SO es inventarlo."
fi

# 3) PREFLIGHT — la tarjeta que se relee antes de CADA pantalla
if [ -f "docs/sistema/PREFLIGHT-PANTALLA.md" ]; then
  echo ""
  echo "── PREFLIGHT DE PANTALLA (releer antes de construir CADA pantalla) ──"
  cat docs/sistema/PREFLIGHT-PANTALLA.md
  echo "── fin del preflight ──"
fi

# 4) Reglas de oro (resumen)
echo ""
echo "LAS 7 REGLAS DE ORO (completas en CLAUDE.md):"
echo "1. CONSULTA ANTES DE ACTUAR (tabla de ruteo) · 2. NUNCA 'LISTO' SIN CHECKLIST"
echo "3. ESTADO.md + FICHA-ARTE.md + FICHA-AVATAR.md + FICHA-MERCADO.md son tu memoria · 4. UNA CAPA A LA VEZ, verificando"
echo "5. NO te saltes fases · 6. DEFINE ANTES DE CONSTRUIR: loop (24), auth (26), datos+RLS (25), IA (30)"
echo "7. PRODUCTO ENRIQUECIDO — render REAL a 375px; puntúa el subagente revisor-visual, NO tú."
echo ""
echo "Si el usuario dio una IMAGEN DE REFERENCIA visual: es un CONTRATO (16, protocolo obligatorio)."
echo "El copy de venta (landing/onboarding/paywall) se DERIVA de FICHA-AVATAR.md (57) — sin ficha, no hay copy."
echo "La landing sigue SIEMPRE la ESTRUCTURA CANÓNICA de 10 secciones del 19 — no se reordena ni se recorta."
echo "El cierre de toda pantalla lo puntúa el subagente 'revisor-visual' (.claude/agents/) con el"
echo "screenshot real — autoevaluarse la rúbrica está prohibido."
echo "La evidencia de gates vive en docs/revisiones/ (<pantalla>-375.png + <pantalla>-veredicto.md que escribe EL REVISOR)."
echo "Un veredicto más viejo que el código de su pantalla está CADUCADO — re-render + re-veredicto antes de cerrar."

exit 0
