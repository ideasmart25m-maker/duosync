'use client';

// Landing de DuoSync Wallet — compuesta desde el kit canónico (plantillas-codigo/landing).
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
const CTA_LABEL = 'Empieza a simplificar tus cuentas';

export default function DuoSyncLanding() {
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
        appName="DuoSync Wallet"
        logo={<Image src="/logo-duosync.png" alt="" width={233} height={128} priority className="h-7 w-auto" />}
        loginHref="/login"
        h1Marked="Gestión de gastos juntos, sin hojas de cálculo ni [acento]momentos incómodos[/acento]"
        subtitleMarked="DuoSync Wallet automatiza los gastos compartidos, [b]divide los pagos justo[/b] y evita discusiones por dinero"
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        socialProof={<span>Un pago cubre a los dos — hasta 60% más barato que otras apps para parejas</span>}
        visual={<HeroVisual />}
      />

      {/* 2. PROBLEMA */}
      <Problema
        id="problema"
        titulo="¿Les suena?"
        preguntas={[
          { icon: Frown, textoMarked: '¿Sientes que eres el único que ordena las cuentas de la casa?', color: 'var(--cat-rose)' },
          { icon: HandCoins, textoMarked: '¿Discuten por dinero con frecuencia?', color: 'var(--cat-amber)' },
          { icon: Receipt, textoMarked: "¿Te toca 'cobrarle' su parte y sentirte el malo?", color: 'var(--cat-blue)' },
          { icon: CalendarClock, textoMarked: '¿Llegan a fin de mes sin saber en qué gastaron su dinero?', color: 'var(--cat-violet)' },
        ]}
      />

      {/* 3. AGITACIÓN */}
      <Agitacion
        frases={[
          'Cada mes que pasa así, el gasto sigue mal repartido y la cuenta pendiente crece entre los dos.',
          'En un año, esa tensión se acumula y la meta de [acento]viajar juntos[/acento] sigue esperando.',
          'Otra hoja de Excel no ayuda: [b]el problema no es la plata, es que nadie la ve igual[/b].',
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
        mecanismo="el Código de Pareja"
        bigIdeaMarked="No falta organización, falta un lugar donde los dos vean lo mismo. El Código de Pareja los conecta y el [b]saldo se actualiza solo[/b]."
        pasos={[
          { titulo: 'Vinculan sus teléfonos', detalle: 'Un código de 4 dígitos une sus cuentas en menos de un minuto.', color: 'var(--cat-blue)' },
          { titulo: 'Registran gastos en 2 toques', detalle: 'Arriendo, servicios o mercado — con categorías que ustedes eligen.', color: 'var(--cat-amber)' },
          { titulo: 'Ven el mismo saldo', detalle: 'Lo que uno registra, el otro lo ve al instante, sin preguntar.', color: 'var(--cat-teal)' },
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
          { label: 'Su pregunta del día, para no perder la conexión', nombrePantalla: 'Hoy' },
          { label: 'Cada gasto, categorizado a su manera', nombrePantalla: 'Gastos' },
          { label: 'La meta que están construyendo juntos', nombrePantalla: 'Metas' },
          { label: 'Su racha de días conectados', nombrePantalla: 'Nosotros' },
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
        tituloMarked="Empiecen gratis. Sigan por [acento]precio de un café[/acento]"
        trialDias={7}
        anual={{
          nombre: 'Anual',
          badge: 'MÁS POPULAR',
          precioMes: '$3.00',
          totalAnual: 'Se cobra $35.94/año recién al terminar la prueba',
          ahorro: 'Ahorran el 50% vs. mensual',
          descomposicionDia: 'menos de $0.10 al día',
          ctaLabel: CTA_LABEL,
          ctaHref: CTA_HREF,
          features: [
            '[b]Historial ilimitado[/b] de gastos compartidos',
            '[b]Escaneo de recibos con IA[/b], sin teclear',
            '[b]Categorías propias[/b] e ilimitadas',
            'Catálogo completo de [b]dinámicas de pareja[/b]',
            '[b]Metas de ahorro[/b] en conjunto',
          ],
        }}
        mensual={{
          nombre: 'Mensual',
          precioMes: '$5.99',
          descomposicionDia: 'menos de $0.20 al día',
          ctaLabel: CTA_LABEL,
          ctaHref: CTA_HREF,
          features: [
            '[b]Historial ilimitado[/b] de gastos compartidos',
            '[b]Escaneo de recibos con IA[/b]',
            '[b]Categorías propias[/b] e ilimitadas',
            'Cancelan cuando quieran',
          ],
        }}
      />

      {/* 7. GARANTÍA — 15 días, verificado contra los plazos reales de Hotmart (FICHA-MERCADO §4) */}
      <Garantia
        nombre="la Garantía de Cuentas Claras"
        condicionMarked="Prueban 7 días gratis. Si no les convence, [b]piden su dinero de vuelta en 15 días[/b] — sin trámites."
        pisoLegal="Respaldada por la garantía de reembolso de Hotmart"
        color="var(--cat-teal)"
      />

      {/* 8. FAQ */}
      <Faq
        items={[
          {
            pregunta: '¿Nos van a cobrar a cada uno por separado?',
            respuestaMarked:
              'No. Un solo pago cubre a los dos — por eso cuesta [b]la mitad o menos[/b] que otras apps para parejas.',
          },
          {
            pregunta: '¿Es seguro poner nuestros gastos ahí?',
            respuestaMarked:
              'No guardamos ni vinculamos sus cuentas bancarias ni tarjetas de crédito. Sus datos financieros están [b]100% seguros y bajo su control[/b].',
          },
          {
            pregunta: '¿Y si mi pareja deja de usarla a los pocos días?',
            respuestaMarked:
              'La pregunta diaria y el registro de gastos toman segundos, y no necesitan estar los dos a la vez para mantener la racha.',
          },
          {
            pregunta: '¿Funciona en iPhone y Android?',
            respuestaMarked:
              'Sí, se ve y funciona igual en los dos — no hace falta bajar nada de una tienda de aplicaciones.',
          },
          {
            pregunta: '¿Qué pasa si quiero cancelar?',
            respuestaMarked: 'Cancelan cuando quieran desde el área de miembros de Hotmart, sin llamadas ni trámites.',
          },
          {
            pregunta: '¿Puedo usarla para gastos compartidos con cualquier persona (compañero de cuarto, un viaje, un proyecto)?',
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
        psMarked="PS: DuoSync Wallet une el gasto y su conexión diaria en un solo lugar, con un pago que cubre a los dos. Empiecen hoy con 7 días gratis y sientan lo que es ver las cuentas claras sin discutir."
      />

      {/* 10. FOOTER LEGAL */}
      <FooterLegal
        appName="DuoSync Wallet"
        logo={<Image src="/logo-duosync.png" alt="" width={233} height={128} className="h-5 w-auto opacity-80" />}
        soporteEmail="soporte@duosyncwallet.app"
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
