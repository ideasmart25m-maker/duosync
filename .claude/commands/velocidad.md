---
description: Hace la app rápida en el celular real de LATAM (Lighthouse móvil, LCP <2.5s, bundle) — mide antes, plan con tu OK, mide después
---
VELOCIDAD — que la app VUELE en el celular real de tu cliente (Android gama media, 3G/4G)

Regla canónica: aplica primero `docs/sistema/PROMPT-VELOCIDAD.txt`, especialmente medir ANTES con
números reales, el plan priorizado con OK previo, y la regla de nunca sacrificar las animaciones
baseline ni el diseño por bytes.

Haz que esta app sea RÁPIDA donde importa: el celular real del cliente LATAM (Android gama media,
red 3G/4G), no tu laptop con fibra. Primero se MIDE, luego se planea, y solo tras mi OK se
arregla. Nada de "se siente más rápida" — tabla de antes vs después.

━━━ CONTEXTO (dónde la sientes lenta, quejas de clientes) ━━━
$ARGUMENTS

Si viene vacío, mide todo el recorrido igual (landing, pantalla principal, acción core).

LEE PRIMERO: 38-PERFORMANCE-BUDGET (el presupuesto y los umbrales — es el contrato),
28-INGENIERIA-NEXTJS si es Next.js, 15-PATRONES-UX (rendimiento PERCIBIDO: skeletons) y
43-MICRO-CRAFT-Y-EJECUCION (bundle, fuentes).

FASE 1 — MEDIR ANTES: Lighthouse en modo MÓVIL (throttling de red y CPU) sobre las 3-4 pantallas
clave + peso del bundle (size-limit / analizador, según 38). Anota: LCP (meta <2.5s), CLS
(meta <0.1), bundle inicial (dentro del budget del 38), INP si aparece. Guarda el reporte — es
la línea base.

FASE 2 — PLAN PRIORIZADO POR IMPACTO Y DETENTE (espera mi OK). Los sospechosos de siempre:
  • Imágenes sin optimizar → next/image o compresión + lazy loading.
  • Fuentes → subset + display swap.
  • JS de más → dynamic import, quitar librerías muertas o duplicadas.
  • Percepción → skeletons con la forma del contenido donde hay espera real (15).
  • Next.js: RSC donde toca, caché bien usada (28).
Cada ítem con: qué pesa/tarda hoy, ganancia esperada, esfuerzo S/M/L.

FASE 3 — (tras mi OK) ARREGLAR POR CAPAS: una capa a la vez (imágenes → fuentes → JS →
percepción); tras cada capa tsc + build + dev limpios + la app abierta a 375px verificando que
NADA se rompió ni cambió visualmente. REGLA INNEGOCIABLE: optimizar es quitar peso MUERTO, no
vida — prohibido sacrificar las 7 animaciones baseline, los skeletons o el diseño por bytes.

FASE 4 — MEDIR DESPUÉS Y COMPARAR: repite exactamente las mediciones de la Fase 1 y entrega
| Métrica | Antes | Después | Meta | ¿Cumple? | por pantalla. Si una meta no se cumplió: causa
raíz y qué haría falta — sin maquillar.

CIERRE: ESTADO.md actualizado (línea base, resultado, qué se descartó por dañar la experiencia,
presupuesto que las próximas features deben respetar) + reporte con evidencia (✅ por capa ·
🔍 tsc ✓ build ✓ dev ✓ · tabla antes/después · ⚠️ pendientes). Empieza con la Fase 1.
