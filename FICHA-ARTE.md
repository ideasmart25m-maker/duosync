# FICHA DE DIRECCIÓN DE ARTE — DuoSync

## Referencia del usuario (CONTRATO)
- ¿Hay imagen(es) de referencia del usuario?: NO — el usuario pidió que el agente propusiera 3 direcciones (protocolo A/B/C sin referencia, 16 PASO 0.2bis + 54).

## Identidad derivada — combinación elegida por el usuario
- Proceso: se presentaron 3 fusiones (A "Hogar en Calma", B "Equipo con Control", C "Complicidad Cálida") en una página comparativa a 375px. El usuario eligió la base de B y pidió combinar dos elementos de C: la pregunta diaria como hero arriba de la pantalla, y el saldo mostrado como monto + % de la meta.
- TABLA DE LÍDERES (fusión, sin referencia del usuario): Nubank/Revolut → grotesk confiable + números tabulares para el balance · Cal AI → cards con barra de progreso por categoría · Duolingo/Fabulous → tarjeta-hero de color sólido para el momento de interacción diaria (la pregunta del día)
- Combinación tipográfica: fila "Finanzas" de `29-REFERENCIA-VISUAL.md` (grotesk segura tipo Archivo/Schibsted Grotesk + Instrument Sans en body) — validada contra los líderes (Nubank/Revolut usan grotesk segura para transmitir confianza)
- Arquetipo: Gobernante/Sabio (control, orden, confianza) con un acento cálido (coral) que evita el azul corporativo genérico de fintech
- Mundo del sujeto: la mesa de la cocina donde se revisan las cuentas del mes — de ahí la calidez del acento coral sobre la seriedad del verde azulado

## Personalidad compilada
- 3 adjetivos: confiable, ordenada, cálida-en-los-acentos
- Compilación: spring sutil (sin rebote fuerte — arquetipo Gobernante) · duración base 220-280ms · celebración nivel medio (hitos de racha y metas cumplidas) · radio tendencial 16px

## Brand kit final
- Fondo: #F3F7F6 · Superficie: #FFFFFF · Hundido: #E8EFEE (derivado) · Texto 1º/2º: #152A27 / #6C8480
- Acento: #1C4F49 verde azulado profundo (SOLO en: navegación activa, barras de progreso, streak, avatar principal — pantallas de la app) · 2ª nota: #FF6B47 coral (porqué: calidez humana + todas las llamadas a la acción — "responder", CTA de pago)
- ⚠️ Nota de implementación (landing): el kit canónico de `plantillas-codigo/landing/` usa la variable CSS `--accent` como EL color de marca para CTA/badges/checks y `--accent-2` solo como nota decorativa mínima. Para que las llamadas a la acción salgan en coral (como manda esta ficha), en `app/components/landing/tokens.css` **`--accent` = #C2492D y `--accent-2` = #1C4F49 (verde azulado)** — mapeo invertido respecto a como se nombran aquí arriba, documentado para no confundir en sesiones futuras. Dentro de la app (no la landing) se usan los valores tal cual están arriba.
- ⚠️ El coral #FF6B47 de esta ficha, con texto casi-blanco encima (como usa el CTA del kit), no pasa contraste AA (~2.6:1, medido por el revisor-visual). En la landing se usa #C2492D — el mismo coral, oscurecido lo justo para pasar AA (~4.9:1) sin perder la temperatura cálida. Si se necesita el coral #FF6B47 puro en algún lugar, debe ir con texto oscuro (`--text-primary`) encima, nunca claro.
- ⚠️ CONVENCIÓN VÁLIDA PARA TODO EL PRODUCTO (no solo la landing, decidido en Sesión 4): como `globals.css` importa el mismo `tokens.css` en toda la app, `--accent` = coral #C2492D (toda acción/CTA/selección) y `--accent-2` = verde azulado #1C4F49 (estructura, navegación, dato secundario) en onboarding, paywall, login Y la app interna — mismo mapeo que la landing, para no tener dos sistemas de color distintos en el mismo proyecto.
- Semánticos: éxito #1C8F5A · error #D9483A · aviso #C98A2E
- Display: grotesk segura (clase Schibsted Grotesk / Archivo — pesos 500/700) · Body: Instrument Sans (pesos 400/600) · Escala: display 28-34px / title 18-20px / body 14-16px / label 11-12px
- Radio: 14px (cards de categoría) / 16-22px (cards grandes: hero de pregunta, balance) / 999px (chips, botones pill) · Profundidad: bordes sutiles + 1 nivel de superficie elevada (sin sombras duras) · Espaciado base: escala 4·8·12·16·24·32·48·64
- Dispositivo ownable (principal): la tarjeta-hero de color sólido con la pregunta del día arriba de todo — es lo primero que ven al abrir la app, antes que el dinero. Reutilizada en cada pregunta del onboarding (mismo bloque sólido en --accent-2 con eyebrow + pregunta) para que el quiz se sienta parte de la misma app, no un formulario aparte.
- Dispositivo ownable (secundario): el par de avatares superpuestos "M/S" (iniciales de la pareja, círculos en --accent-2/--accent con borde del fondo) — nace en el HeroVisual de la landing y se repite en el paywall, siempre arriba del headline, para anclar que el plan/pantalla es DE esa pareja específica, no una plantilla genérica.
- Motion signature: easing suave sin rebote (arquetipo Gobernante) · stagger 60-80ms en la entrada de categorías · firma: el número del balance cuenta hacia arriba al cargar

## Trazabilidad y vetos
- Protocolo A/B/C: opción elegida = B (base) + elementos de C (pregunta-hero arriba, balance con % de meta) · descartada A (calidez editorial/serif — se sintió menos "cuentas claras") · página comparativa: `direcciones-abc.html` (raíz del proyecto) + [versión publicada](https://claude.ai/code/artifact/a5e26f2d-7d19-457d-9dad-52fb152f3b9a) · evidencia: `docs/revisiones/direcciones-abc.png`
- Paleta derivada de: fusión de líderes (Nubank/Revolut para el verde de confianza) + banco 54 (coral como dispositivo diferenciador frente al azul fintech genérico)
- Registro anti-repetición: verde azulado #1C4F49 + coral #FF6B47 + par Schibsted Grotesk/Instrument Sans quedan VETADOS para el próximo proyecto del SO
- Modo (claro/oscuro) DERIVADO por: nicho de finanzas del hogar → claro transmite control y transparencia (Regla 2 del 16 — los neobancos ganadores son claros)

## Idioma UI: español latino neutro · Fecha de cierre de la ficha: 2026-08-12 · Aprobada por el usuario: SÍ (eligió y ajustó la combinación explícitamente)
