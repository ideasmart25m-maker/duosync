'use client';

// Landing de Fairsy — compuesta desde el kit canónico (plantillas-codigo/landing).
// Copy marcado en docs/copy/landing.md, trazado a FICHA-AVATAR.md.
// Modelo onboarding-first (02C, decidido en Sesión 1): el CTA lleva a /onboarding.

import Image from 'next/image';
import { Frown, Receipt, HandCoins, CalendarClock } from 'lucide-react';
import { Hero } from '@/components/landing/Hero';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { Problema } from '@/components/landing/Problema';
import { Agitacion } from '@/components/landing/Agitacion';
import { Solucion } from '@/components/landing/Solucion';
import { AppPorDentro } from '@/components/landing/AppPorDentro';
import { Oferta } from '@/components/landing/Oferta';
import { Garantia } from '@/components/landing/Garantia';
import { Faq } from '@/components/landing/Faq';
import { CtaFinal } from '@/components/landing/CtaFinal';
import { FooterLegal } from '@/components/landing/FooterLegal';
import { StickyCtaMobile } from '@/components/landing/ui';

const CTA_HREF = '/onboarding';
const CTA_LABEL = 'Empezar mis 7 días gratis';

export default function FairsyLanding() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      <a
        href="#problema"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[12px] focus:bg-[var(--accent)] focus:px-4 focus:py-3 focus:text-[16px] focus:font-semibold focus:text-[var(--bg)]"
      >
        Saltar al contenido
      </a>
      {/* 1. HERO */}
      <Hero
        appName="Fairsy"
        logo={<Image src="/logo-fairsy.png" alt="" width={233} height={128} priority className="h-7 w-auto" />}
        loginHref="/login"
        h1Marked="Cuentas claras entre los dos. [acento]Sin discutir[/acento], sin cobrarle a nadie."
        subtitleMarked="Registran un gasto en 2 toques, [b]dividen el pago justo[/b] y los dos ven el mismo saldo, al instante"
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        socialProof={<span>Un solo pago para los dos: US$35.94 al año en total (o US$5.99 al mes)</span>}
        visual={<HeroVisual />}
      />

      {/* 2. PROBLEMA */}
      <Problema
        id="problema"
        titulo="¿Les suena?"
        preguntas={[
          { icon: Frown, textoMarked: '¿Sientes que eres el único o la única que ordena las cuentas de la casa?', color: 'var(--accent-2)' },
          { icon: HandCoins, textoMarked: '¿Discuten por dinero con frecuencia?', color: 'var(--accent-2)' },
          { icon: Receipt, textoMarked: "¿Te toca 'cobrarle' su parte y sentirte el malo o la mala?", color: 'var(--accent-2)' },
          { icon: CalendarClock, textoMarked: '¿Llegan a fin de mes sin saber en qué gastaron su dinero?', color: 'var(--accent-2)' },
        ]}
      />

      {/* 3. AGITACIÓN */}
      <Agitacion
        frases={[
          'Cada mes que pasa así, el gasto sigue mal repartido y la cuenta pendiente crece entre los dos.',
          'En un año, esa tensión se acumula y [acento]sus metas[/acento] siguen esperando.',
          'Otra hoja de Excel no ayuda: [b]el problema no es el dinero, es que nadie lo ve igual[/b].',
        ]}
        contraste={{
          labelHoy: 'Hoy',
          hoy: 'Uno de los dos lleva las cuentas en la cabeza y el otro no sabe cuánto deben.',
          labelFuturo: 'En 6 meses, si nada cambia',
          futuro: 'Las mismas discusiones — con más resentimiento acumulado.',
        }}
      />

      {/* 4. SOLUCIÓN */}
      <Solucion
        tituloMarked="Cuentas claras [acento]sin discusiones[/acento]"
        mecanismo="Código de Conexión"
        bigIdeaMarked="No falta organización, falta un lugar donde los dos vean lo mismo. El Código de Conexión los conecta y el [b]saldo se actualiza solo[/b]."
        pasos={[
          { titulo: 'Vinculan sus teléfonos', detalle: 'Un enlace por WhatsApp y la otra persona entra al instante: sin correo y sin contraseña.', color: 'var(--accent-2)' },
          { titulo: 'Registran gastos en 2 toques', detalle: 'Arriendo, servicios o mercado — con categorías que ustedes eligen.', color: 'var(--accent-2)' },
          { titulo: 'Ven el mismo saldo', detalle: 'Lo que uno registra, el otro lo ve al instante, sin preguntar.', color: 'var(--accent-2)' },
        ]}
        antesDespues={{
          labelAntes: 'Antes',
          antes: 'Cada uno con su Excel, sin saber cuánto puso el otro.',
          labelDespues: 'Después',
          despues: 'Un saldo único, actualizado al instante para los dos.',
        }}
      />

      {/* 5. LA APP POR DENTRO */}
      <AppPorDentro
        tituloMarked="Así se ve [acento]llevar las cuentas en equipo[/acento]"
        frames={[
          { src: '/landing/app-gastos.png', alt: 'Gastos del mes por categoría, con el aviso del presupuesto', label: 'Cada gasto, categorizado a su manera' },
          { src: '/landing/app-metas.png', alt: 'Metas de ahorro: Viaje a Cartagena con su avance', label: 'La meta que están construyendo juntos' },
          { src: '/landing/app-reportes.png', alt: 'Reportes: lo gastado en el mes frente al presupuesto y en qué se va', label: 'En qué se va el dinero, mes a mes' },
          { src: '/landing/app-hoy.png', alt: 'Inicio: el mensaje del día, la planta de la racha y la pregunta para los dos', label: 'Su mensaje del día y la planta que crece con ustedes' },
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
      />

      {/* 6. OFERTA — anual primero, trial 7 días (02C), total visible.
          Sin stack de valor Hormozi: los montos ($180/$25/$20/$225) no eran verificables ni
          citados, y FICHA-AVATAR.md registra desconfianza explícita del avatar hacia precios
          "inflados" de apps de pareja — defecto real de integridad detectado por el
          revisor-visual (Gate 61: ninguna cifra sin fuente). CTA unificado con el resto de la
          página (antes decía "Empezar mis 7 días gratis" aquí y "Vincular con mi pareja
          gratis" en el resto — dos etiquetas para la misma acción, defecto real detectado). */}
      <Oferta
        tituloMarked="Empiecen gratis. Sigan por [acento]el precio de un café[/acento]"
        trialDias={7}
        anual={{
          nombre: 'Anual',
          badge: 'MEJOR PRECIO',
          precioMes: 'US$3.00',
          totalAnual: 'Se cobra US$35.94/año al terminar la prueba, en su moneda al valor del día',
          ahorro: 'Ahorran el 50% vs. mensual',
          descomposicionDia: 'menos de US$0.10 al día',
          ctaLabel: CTA_LABEL,
          ctaHref: CTA_HREF,
          features: [
            '[b]Historial ilimitado[/b] de gastos compartidos',
            '[b]Escaneo de recibos con IA[/b], sin teclear',
            '[b]Asistente de IA[/b] que responde sobre sus gastos',
            '[b]Categorías propias[/b] e ilimitadas',
            '[b]Metas de ahorro[/b] en conjunto',
          ],
        }}
        mensual={{
          nombre: 'Mensual',
          precioMes: 'US$5.99',
          descomposicionDia: 'menos de US$0.20 al día',
          ctaLabel: CTA_LABEL,
          ctaHref: CTA_HREF,
          // El plan mensual da acceso al mismo Premium completo que el anual (mismos beneficios
          // salvo "Historial ilimitado", que el usuario pidió quitar de este recuadro).
          features: [
            '[b]Escaneo de recibos con IA[/b], sin teclear',
            '[b]Asistente de IA[/b] que responde sobre sus gastos',
            '[b]Categorías propias[/b] e ilimitadas',
            '[b]Metas de ahorro[/b] en conjunto',
          ],
        }}
      />

      {/* 7. GARANTÍA — 15 días, verificado contra los plazos reales de Hotmart (FICHA-MERCADO §4) */}
      <Garantia
        nombre="La Garantía de Cuentas Claras"
        condicionMarked="Prueban 7 días gratis. Si no les convence, [b]piden su dinero de vuelta en 15 días[/b] — sin trámites."
        pisoLegal="Respaldada por la garantía de reembolso de Hotmart"
        color="var(--accent-2)"
      />

      {/* 8. FAQ */}
      <Faq
        items={[
          {
            pregunta: '¿Nos van a cobrar a cada uno por separado?',
            respuestaMarked:
              'No. [b]Un solo pago cubre a los dos[/b]: no pagan cada uno por separado.',
          },
          {
            pregunta: '¿Es seguro poner nuestros gastos ahí?',
            respuestaMarked:
              'Sí, es seguro porque no guardamos ni vinculamos sus cuentas bancarias ni tarjetas de crédito. Sus datos financieros [b]quedan bajo su control[/b].',
          },
          {
            pregunta: '¿Me cobran hoy? ¿Necesito tarjeta?',
            respuestaMarked:
              'Hoy no se cobra nada: empiezan [b]7 días gratis[/b] y el primer cobro llega al terminar la prueba. Hotmart (la plataforma de pago) pide tarjeta o PayPal para activarla, y pueden cancelar antes sin pagar.',
          },
          {
            pregunta: '¿Y si la otra persona deja de usarla a los pocos días?',
            respuestaMarked:
              'Fairsy sigue funcionando con una sola persona: quien la use registra los gastos y ve el saldo y las metas. La otra se suma cuando quiera con el Código de Conexión.',
          },
          {
            pregunta: '¿Funciona en iPhone y Android?',
            respuestaMarked:
              'Sí, se ve y funciona igual en los dos — no hace falta bajar nada de una tienda de aplicaciones.',
          },
          {
            pregunta: '¿Qué pasa si quiero cancelar?',
            respuestaMarked: 'Cancelan cuando quieran desde el área de miembros de Hotmart (la plataforma donde pagan), sin llamadas ni trámites.',
          },
          {
            pregunta: '¿Puedo usarla para gastos compartidos con cualquier persona (compañero de cuarto, familia, amigo)?',
            respuestaMarked:
              'Sí, la pueden usar dos personas con gastos compartidos que quieran [b]tener las cuentas claras y en tiempo real[/b].',
          },
        ]}
      />

      {/* 9. CTA FINAL */}
      <CtaFinal
        h2Marked="Menos cuentas, [acento]más tiempo para ustedes[/acento]"
        futurePacingMarked="Mañana registran un gasto en 2 toques, ven el mismo saldo los dos, y les queda tiempo para lo que sí importa."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        recap="7 días gratis · Un solo pago para los dos"
        psMarked="PS: Fairsy une el gasto y su conexión diaria en un solo lugar, con un pago que cubre a los dos. Empiecen hoy con 7 días gratis y sientan lo que es ver las cuentas claras sin discutir."
      />

      {/* 10. FOOTER LEGAL */}
      <FooterLegal
        appName="Fairsy"
        logo={<Image src="/logo-fairsy.png" alt="" width={233} height={128} className="h-5 w-auto opacity-80" />}
        soporteEmail="soporte@fairsy.lat"
        enlaces={[
          { label: 'Privacidad', href: '/privacidad' },
          { label: 'Términos y Condiciones', href: '/terminos' },
          { label: 'Reembolsos', href: '/reembolsos' },
          { label: 'Aviso de IA', href: '/aviso-ia' },
        ]}
      />

      <StickyCtaMobile labelComercial={CTA_LABEL} href={CTA_HREF} />
    </div>
  );
}
