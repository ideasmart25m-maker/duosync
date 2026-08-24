---
description: Monta TODOS los emails del negocio (acceso post-compra, carrito, dunning, bienvenida, nurturing) con prueba end-to-end real
---
EMAILS — monta TODOS los correos del negocio de una vez (acceso, carrito, cobros, bienvenida)

Regla canónica: aplica primero `docs/sistema/PROMPT-EMAILS.txt`, especialmente el orden de
prioridad (transaccionales SIEMPRE primero), la deliverability antes que el copy y la prueba
end-to-end real de los transaccionales.

Eres el responsable de email de este negocio. Monta de una sola vez TODOS los correos que la app
necesita para vender, entregar y retener. Primero preséntame el inventario y el plan, y ESPERA
MI OK; luego implementa y PRUEBA.

━━━ CONTEXTO (dominio en Resend, si ya hay ventas, lead magnet) ━━━
$ARGUMENTS

Si viene vacío, dedúcelo de ESTADO.md y del código (dominio del 18, avatar, etapa) y pregúntame
solo lo que falte.

LEE PRIMERO: 18-VENTA-HOTMART (el email de acceso post-compra — el corazón del modelo),
46-EMAIL-DELIVERABILITY (que los correos LLEGUEN: SPF/DKIM/DMARC), 58-RETENCION-DE-INGRESOS
(dunning y win-back), 35-LANZAMIENTO (carrito abandonado), 34-ADQUISICION-Y-TRAFICO (nurturing
del lead magnet), 11-DISENO-EMOCIONAL (voz del arquetipo) + FICHA-AVATAR.md (el copy sale de ahí).

FASE 1 — INVENTARIO (solo lectura): qué emails existen hoy vs cuáles faltan, y el estado real de
la entregabilidad (¿dominio verificado en Resend? ¿SPF/DKIM/DMARC en verde?). Si el dominio no
está listo, eso va PRIMERO — un email perfecto que cae en spam no existe.

FASE 2 — PLAN PRIORIZADO Y DETENTE (espera mi OK). Orden innegociable:
  A. TRANSACCIONALES: (1) ACCESO POST-COMPRA con magic link — EL MÁS CRÍTICO: si no llega, el
     cliente pagó y no puede entrar; (2) recuperación de acceso.
  B. CARRITO ABANDONADO (35).
  C. DUNNING de pagos fallidos + WIN-BACK (58).
  D. BIENVENIDA/ACTIVACIÓN D1-D7.
  E. NURTURING del lead magnet (34).

FASE 3 — (tras mi OK) ESCRIBIR + IMPLEMENTAR. Cada email: asunto en 2 variantes + preheader +
cuerpo corto en la voz del arquetipo derivada de FICHA-AVATAR + UN solo CTA, en el idioma del
usuario. Reglas duras: deliverability primero (46, subdominio dedicado si hay volumen) ·
anti-spam ético (sin mayúsculas gritonas ni urgencia falsa) · transaccionales separados de
marketing.

FASE 4 — PROBAR DE VERDAD: los transaccionales END-TO-END (compra de prueba → webhook → el email
LLEGA a bandeja real → el magic link FUNCIONA). Los demás: envío de prueba + revisión en el
celular. Si cae en spam: causa raíz (46).

CIERRE: reporte con evidencia (tabla de emails ✅ con su prueba, estado de deliverability, ⚠️
pendientes) + ESTADO.md actualizado (emails activos, dónde vive cada plantilla, qué mirar en
/operacion-mensual). Empieza con la Fase 1.
