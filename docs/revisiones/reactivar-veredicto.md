# VEREDICTO revisor-visual — reactivar
Fecha: 2026-10-27 12:00
Screenshot: docs/revisiones/reactivar-375.png (evidencia puntuada: docs/revisiones/ronda-reactivar-0-375.png y docs/revisiones/ronda-reactivar-1-375.png)
Usabilidad: 26/40
Craft: 7/20
Copy (si vende): 10/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos: ver abajo. Detalle usabilidad h1:2 h2:3 h3:3 h4:2 h5:2 h6:3 h7:3 h8:2 h9:3 h10:3. Craft jerarquia:2 profundidad:2 identidad:1 movimiento:0 encaje:2. Copy idea:2 especificidad:1 emocion:2 oferta:2 accion:3.

NOTA DE PROCESO: el archivo de screenshot pedido por convencion (reactivar-375.png) no existe; se puntuo sobre las dos capturas ronda-reactivar-0/1. Copiar/renombrar la captura a la ruta convencional para que los hooks la encuentren.

Gate de carga cognitiva: 2 fallas (parrafos de 5 lineas en la tarjeta y en el panel "Ya pagaron"; el panel obliga a recordar "Conectar mi compra mas arriba"). No es sobrecarga critica, pero es la raiz del defecto de minimalismo.
CTA heroe vivo: contraste OK (coral oscuro con texto claro), alto 48px, ancho completo, no disabled. Falla: no hay estado tap/hover implementado (sin whileTap ni :active propio) ni feedback al tocar (es un enlace que sale a Hotmart sin indicador).
Verificaciones en codigo no observables: 3 (control) = hay "Cerrar sesion" y "Usar otro correo", pero el paso "correo" no tiene Cancelar. 7 (flexibilidad) = bien: sondeo cada 6s + al volver a la pestana, autoentrada al llegar el pago, autocomplete one-time-code, envio automatico al 6o digito. Movimiento: cero uso de motion/react en ambos archivos, sin stagger, sin whileTap, sin reduced-motion.
Fidelidad a FICHA-ARTE: paleta (coral CTA, verde estructura, fondo menta claro), grotesk en display y radios coinciden. Desvio: el dispositivo ownable secundario (par de avatares M/S "siempre arriba del headline" en paywall) no aparece; en su lugar hay un candado generico.

## TOP DEFECTOS (por impacto)
1. [Tarjeta "Tu plan", parrafo bajo "Sin plan activo"] Dice "si es su primera vez, tienen 7 dias gratis" a alguien cuyo plan ya termino: contradice el h1 y confunde (¿puedo tener otra prueba?). Ademas repite "Sin plan activo" ya dicho por el h1 y usa icono de destellos (Sparkles) para un estado bloqueado. → pasar variante `reactivar` a TuPlan: sin texto de prueba ni titulo "Sin plan activo"; solo precios.
2. [Pantalla completa, movimiento] Estatica: cero stagger de entrada, cero whileTap en los CTA, cero transicion al abrir el formulario de "Conectar mi compra", sin reduced-motion. → agregar motion/react: entrada escalonada 60-80ms, whileTap scale 0.97 en CTA anual, apertura animada del formulario, respetar prefers-reduced-motion.
3. [Panel gris "¿Ya pagaron y todavia no entran?"] Duplica la explicacion de "Conectar mi compra" (enlace arriba + 2 parrafos de 5 lineas abajo + "mas arriba" que obliga a recordar). Es la mayor fuente de ruido y empuja el logout fuera del primer pantallazo. → colapsar a 2 lineas ("¿Pagaste con otro correo? Conecta tu compra" con boton que abre el mismo formulario) y dejar solo soporte@ como linea final.
4. [Textos de la pantalla] Persona gramatical inconsistente: pagina y panel hablan de "ustedes" (Reactiven, Toquen, Escriban) y TuPlan habla de "tu/tu" (Revisa, pagaste, Te enviamos); la ficha pide "los dos"/neutral. → unificar a una sola persona (tuteo singular como el resto de la app o "los dos" consistente) en ambos archivos.
5. [Tarjeta, iconografia y encaje] Dos chips de icono distintos (candado circulo 48px coral + destellos cuadrado redondeado 40px verde) en 200px de alto; texto de la tarjeta indentado junto al chip genera parrafo estrecho de 5 lineas; tres estilos de enlace (verde subrayado, gris subrayado, coral subrayado en soporte). → quitar el chip de la tarjeta (queda solo el candado/dispositivo M/S), texto a ancho completo, unificar enlaces secundarios en un solo estilo.

## ARREGLABLES SIN DATOS NUEVOS (una sola ronda)
A. Quitar "7 dias gratis" y "Sin plan activo" de TuPlan en /reactivar (prop de variante). [defecto 1]
B. Anclaje de precio usando solo cifras ya mostradas: "Activar mi plan anual · US$35.94 al año" con linea "equivale a US$2.99 al mes, la mitad que el mensual (US$5.99)" (35.94 = 50% de 5.99x12). CTA en primera persona y con beneficio.
C. Titular con enfasis: "Reactiven su plan" en texto primario y "para seguir" o "siguen guardados" en acento coral; hoy todo pesa igual. Lo guardado ("gastos, metas y reportes") pasar a una linea con chip SVG, no negrita suelta.
D. Reemplazar el candado generico por el par de avatares M/S de la ficha (dispositivo ownable ya existente) y dar fondo con profundidad (degrade tonal sutil en la base, hairline degrade en la tarjeta del plan).
E. Movimiento baseline completo (defecto 2). Estado de carga: TuPlan devuelve null mientras carga, el spinner desaparece y la tarjeta salta (CLS) → skeleton con la forma de la tarjeta.
F. Feedback en los enlaces de checkout: al tocar, estado "Abriendo el pago..." con spinner inline y bloqueo de doble toque.
G. Boton "Enviarme el codigo" no debe nacer disabled al 50%: habilitado siempre, validar el correo al tocar con mensaje ("Escribe el correo completo, por ejemplo nombre@correo.com"). Agregar "Cancelar" al paso de correo.
H. Panel de ayuda condensado y unificado de persona (defectos 3 y 4); reducir tamanos de texto de 6 (28/17/16/15/14/13) a 4 (28/17/15/13).
I. Indicar que la pantalla esta comprobando el pago: "Revisando tu pago..." discreto (aria-live) en vez de sondeo silencioso.
J. Mover "Cerrar sesion" y soporte a un pie ligero (link) para que el CTA y el camino de renovar ocupen todo el primer pantallazo; hoy "Conectar mi compra" parte en 2 lineas con "compra" huerfana.

## REQUIEREN DECISION (datos o criterio que no estan en el codigo)
1. Prueba de lo guardado: mostrar cifras reales ("142 gastos, 3 metas, 6 meses de reportes te esperan") exige consultar y decidir que mostrar; es el mayor aumento de emocion/especificidad (copy 10 → ~14). Decidir si se hace y que metricas.
2. Garantia / cancelacion: falta una garantia nombrada con plazo cerca del CTA (sub-check binario fallido). Depende de la politica real de Hotmart y de la usuaria; sin eso no se escribe (no inventar).
3. Reencuadre emocional: el copy actual es logistico; la ficha pide ancla "volver a ser equipo / cuentas claras / en paz". Decidir tono de reactivacion (¿reconocer que sigue dolor 1 o mantenerlo neutro?) y, si hay tiempo limitado, si se ofrece descuento de reactivacion (cambia precio, requiere decision de negocio y el 40).
4. Persona gramatical definitiva (ustedes vs tu) para toda la app: criterio de la usuaria; aplicar luego a toda pantalla.
5. ¿Ofrecer "plan mensual" con el mismo peso o dejarlo como enlace secundario (hoy lo es)? Decision de conversion; sin datos de mezcla de ventas no se cambia.
6. ¿El enlace de checkout prellena el correo de la cuenta? Verificar con Hotmart; si se puede, reduce el caso "pago con otro correo" de raiz (prevencion de errores).
