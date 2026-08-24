---
description: Diagnostica y corrige la fuga entre trafico, onboarding, Hotmart, trial y primer cobro
---
OPERACION DE CONVERSION — datos primero, cambios despues

Aplica completo `docs/sistema/PROMPT-CONVERSION.txt` y usa
`docs/sistema/60-OPERACION-DE-CONVERSION.md` como contrato canonico.

Contexto adicional del usuario:
$ARGUMENTS

No asumas que el problema es el copy. Reconstruye el funnel con sesiones limpias, prueba el recorrido
real con `?qa=1`, separa `paywall_visto`, `checkout_iniciado`, `trial_iniciado` y
`primer_cobro_confirmado`, y solo entonces propone la correccion de causa raiz. Nunca conviertas un
benchmark en promesa ni agregues un email obligatorio antes de Hotmart.

Empieza ahora por la Fase 1 del prompt canonico.
