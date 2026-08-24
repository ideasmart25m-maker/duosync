export default function ReembolsosPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-4">
        Cancelaciones y reembolsos
      </h1>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Tienen 7 días de prueba gratis y no se les cobra nada si cancelan antes de que termine ese
        plazo. Si ya pagaron y no era para ustedes, tienen 15 días desde el primer cobro para pedir
        su dinero de vuelta a través de Hotmart, nuestra pasarela de pago.
      </p>
      <p className="text-[var(--text-secondary)] leading-relaxed">
        ¿Dudas ahora mismo? Escríbannos a{" "}
        <a href="mailto:soporte@duosync.app" className="underline">
          soporte@duosync.app
        </a>
        .
      </p>
    </main>
  );
}
