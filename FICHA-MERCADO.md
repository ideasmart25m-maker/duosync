# FICHA DE MERCADO — Fairsy

## Alcance de esta ficha
- Nicho/categoría exacta: apps de gestión de gastos compartidos del hogar para parejas (con capa de conexión afectiva) en LATAM
- País(es) donde se va a vender: Colombia, México, Argentina (prioritarios) · Moneda de cobro: moneda local por país vía Hotmart
- Fecha de investigación: 2026-08-12 · **Vence el:** 2027-02-12 (6 meses)
- Pasarela/plataforma de venta elegida: Hotmart (default del SO — ver `18-VENTA-HOTMART.md`)

## 1. PRECIO — contra qué se compara el tuyo
- Paired (líder global del nicho más cercano): $9.99-14.99 USD/mes o $69.99-83.99 USD/año, subscripción que cubre a la pareja (hay reportes contradictorios sobre si cobra por persona en algunos planes — no confirmado con certeza al 2026-08-12; el copy de venta NO debe afirmar "te cobran doble" como hecho garantizado, solo comparar precio final). | fuente: [Paired App Reviews 2026](https://instapv.co.uk/paired-app/), [Is the Paired App Worth It in 2026 — LoveFix](https://lovefix.app/resources/apps/is-paired-app-worth-it-2026/) | fecha: 2026-08-12
- Agape: ~$15 USD/año o freemium (dato original del docx del usuario, sin re-verificar hoy — revisar antes de citarlo en copy)
- Splitwise/Monefy: gratis con anuncios o ~$9.99 USD/año (dato original del docx del usuario)
- **Precio elegido para esta app (ajustado por el usuario 2026-08-14):** $5.99 USD/mes o $35.94 USD/año ($2.99/mes, ahorro >50% vs. mensual) por pareja · **Desvío respecto a Paired (la referencia más fuerte, uso interno — NO se nombra en el copy público):** entre 40% y 60% más barato
- El desvío está justificado: apps globales cobran en USD sin ajuste LATAM; Fairsy cobra en moneda local vía Hotmart y apunta a poder adquisitivo medio de la región (no es un desvío que necesite "razón especial" — es la esencia del posicionamiento de arbitraje LATAM)

## 2. CICLO DE DECISIÓN
- NO ENCONTRADO — se decide por criterio y se revisa el 2026-09-12 (con datos propios de campaña cuando haya tráfico real)
- **Ventana mínima antes de declarar que una campaña fracasó:** 14 días (criterio por defecto del SO para suscripciones de bajo ticket, hasta tener dato propio)

## 3. CÓMO PAGA ESTE MERCADO (verificado)
- Medios de pago disponibles en Hotmart: tarjeta de crédito, PayPal, Google Pay, Samsung Pay, boleto bancario, OXXO (México), PIX (Brasil), SEPA (Europa), PSE (Colombia), saldo Hotmart (Brasil) | fuente: [Central de Ayuda Hotmart](https://help.hotmart.com/es/article/25648853025037/-cuales-son-los-metodos-de-pago-disponibles-para-comprar-en-hotmart-) | fecha: 2026-06 (verificado 2026-08-12)
- Cuotas Hotmart: hasta 12 cuotas con tarjeta, PIX o boleto — disponible para precios en BRL, MXN, CLP, PEN, COP | misma fuente
- PIX/boleto NO se auto-cobran: cada renovación genera un código nuevo enviado por email, con 48 horas para pagar antes de expirar → esto es clave para el diseño del dunning (58): un cliente que paga con PIX/boleto puede "caerse" de la suscripción simplemente por no ver el correo a tiempo, no por decidir cancelar
- Penetración de tarjeta de crédito por país: NO ENCONTRADO — se decide por criterio y se revisa el 2026-09-12
- **Consecuencia para el producto:** dado que Hotmart cubre tarjeta + métodos locales (OXXO, PSE, PIX) en los 3 países prioritarios, el modelo de suscripción no debería excluir a una porción relevante del mercado — pendiente confirmar con datos reales una vez haya tráfico

## 4. PRUEBA Y GARANTÍA
- Plazos de garantía que admite Hotmart: el productor elige entre 7, 15, 21 o 30 días al configurar el producto; el comprador pide el reembolso en refund.hotmart.com dentro de ese plazo | fuente: [Hotmart — Cómo solicitar un reembolso](https://hotmart.com/es/blog/hotmart-reembolso), [Central de Ayuda Hotmart — anulación de compra](https://help.hotmart.com/es/article/360038569752/-cuando-puedo-solicitar-la-anulacion-de-mi-compra-) | fecha: 2026-08-13
- En suscripciones, el reembolso solo aplica al cobro inicial si sigue dentro del plazo de garantía (no a renovaciones posteriores) | misma fuente
- Prueba elegida: 7 días · Garantía elegida: 15 días
- Comprobación regla dura (`18`): garantía 15 > prueba 7 → SÍ — la garantía sigue cubriendo 8 días reales después de terminar el trial, antes del segundo cobro
- ¿Desde cuándo cuenta el plazo de garantía?: desde la fecha del primer cobro tras el trial (configuración estándar de Hotmart) — confirmar el valor exacto al crear el producto real en `18-VENTA-HOTMART.md`
- Pendiente para Sesión 6 (creación del producto real en Hotmart): configurar la garantía en 15 días en el panel del productor y re-verificar que el checkout real lo refleje así

### Checkout REAL del Plan Mensual — verificado 2026-10-06 (abierto a 375px, país Colombia)
- URL pública: https://pay.hotmart.com/J107905702P?off=0kq05mk6 (no es un secreto: es el enlace que verá el comprador).
- Prueba: casilla "Quiero un periodo gratis" — "Tendrás 7 día(s)… después se cobrará el importe" ✓ coincide con la decisión (7 días).
- Precio: con tarjeta cobra en COP $20.494/mes; con PayPal cobra en USD US$5,99/mes (la landing y el paywall muestran $5.99 USD ✓). El valor en COP depende del tipo de cambio que use Hotmart — revisarlo de vez en cuando.
- ✅ RESUELTO 2026-10-06: Efecty se quitó en Hotmart (producto → métodos de pago: se apagaron "Boleto Bancário", "Medios de pago locales" y "Pago Híbrido", que lo traían). Re-verificado en el checkout real: solo quedan Débito/Crédito y PayPal.
- Medios que aparecían antes: Débito/Crédito ✓ funciona, PayPal ✓ funciona (cambia el cobro a USD), **Efecty: se muestra pero está INERTE** (al tocarlo no se selecciona; no admite suscripción). Un medio visible pero muerto hace creer que la página está rota → pendiente: quitarlo en el panel de Hotmart si el producto lo permite.
- Garantía: el checkout NO la muestra por ningún lado → solo nuestra web promete los 15 días, tiene que ser exacta. Pendiente confirmar en el panel que la garantía del producto sea de 15 días.
- Sin textos rotos ni claves sin traducir. Idioma y moneda coherentes. (Falta la captura con fecha en docs/revisiones/.)
- Plan ANUAL verificado 2026-10-06: https://pay.hotmart.com/J107905702P?off=tif6z4p3 — 7 días gratis ✓; con tarjeta COP $122.954/año, con PayPal US$35,94/año ✓ (coincide con la landing y el paywall: $35.94/año = 50% del mensual). Mismos medios que el mensual (Efecty inerte también).

## 5. CONVERSIÓN ESPERABLE
- NO ENCONTRADO — se decide por criterio y se revisa cuando haya datos propios de la app en producción (36-ANALITICA-Y-EVENTOS)

## 6. ESTACIONALIDAD Y CONTEXTO
- Picos esperables (por criterio, no verificado): enero (propósitos de año nuevo / mudanzas), antes de vacaciones (planificación de viajes en pareja)
- Regulación que afecte la venta: datos financieros personales → aplican reglas de privacidad de datos financieros por país, revisar en `47-LEGAL-FISCAL-Y-PRIVACIDAD.md` antes de vender
