export default function TerminosPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-4">
        Términos y condiciones
      </h1>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Estamos redactando el detalle legal completo de cómo funciona la suscripción de DuoSync.
        Mientras tanto: un solo pago cubre a los dos integrantes de la pareja, pueden probar la
        app 7 días gratis, y pueden cancelar cuando quieran desde su cuenta.
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
