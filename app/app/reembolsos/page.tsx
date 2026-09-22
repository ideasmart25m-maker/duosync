export default function ReembolsosPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-2">
        Cancelaciones y reembolsos
      </h1>
      <p className="text-[12px] text-[var(--text-tertiary)] mb-8">Última actualización: 21 de septiembre de 2026</p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Tienen 7 días de prueba gratis, sin ningún cobro. Si cancelan antes de que termine ese plazo,
        no se les cobra nada — la cancelación se hace desde el área de miembros de Hotmart.
      </p>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Si no cancelan, al terminar el día 7 se hace automáticamente el primer cobro, al precio del
        plan que hayan elegido (mensual o anual), y ahí empieza su suscripción activa.
      </p>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Si ya les cobraron y no era para ustedes, tienen 15 días desde ese primer cobro para pedir su
        dinero de vuelta a través de Hotmart, nuestra pasarela de pago — sin necesidad de explicar
        el motivo. Hotmart procesa la devolución al mismo medio de pago que usaron.
      </p>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
        Si pagaron con PIX o un código de pago (boleto), el reembolso puede tardar unos días más en
        reflejarse porque depende del método usado; en ese caso escríbannos y les damos seguimiento
        directo con Hotmart.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed">
        ¿Dudas ahora mismo? Escríbannos a{' '}
        <a href="mailto:legal@fairsy.lat" className="underline">
          legal@fairsy.lat
        </a>
        .
      </p>
    </main>
  );
}
