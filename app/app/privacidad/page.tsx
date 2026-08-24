export default function PrivacidadPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-4">
        Política de privacidad
      </h1>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Estamos redactando esta página con el detalle completo de qué datos guarda DuoSync, para
        qué los usa y cómo pueden pedir que los borremos. Mientras tanto: solo ustedes dos ven los
        gastos que registran, no vendemos sus datos a nadie, y no pedimos acceso a su cuenta
        bancaria.
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
