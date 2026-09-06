export default function AvisoIaPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-2">
        Aviso sobre el uso de inteligencia artificial
      </h1>
      <p className="text-[12px] text-[var(--text-tertiary)] mb-8">Última actualización: 5 de septiembre de 2026</p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        El plan Premium de DuoSync Wallet incluye dos funciones con inteligencia artificial: lectura
        automática de recibos (sugiere el monto y la categoría del gasto a partir de una foto) y un
        asistente dentro de la app para resolver dudas sobre sus gastos. Ambas ya están activas.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        El proveedor de esta inteligencia artificial es <strong>Anthropic</strong> (Claude), con sede
        en Estados Unidos. Sus fotos de recibos y sus preguntas al asistente viajan a los servidores
        de Anthropic para generar la respuesta — nunca se usan para entrenar sus modelos.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">Aplican estas reglas:</p>
      <ul className="list-disc pl-5 text-[var(--text-secondary)] leading-relaxed mb-6 space-y-1">
        <li>La IA puede equivocarse: siempre van a poder revisar y corregir lo que sugiere antes de guardarlo.</li>
        <li>Nunca guarda un monto o una categoría sin que ustedes lo confirmen.</li>
        <li>No reemplaza asesoría financiera profesional — es una ayuda para registrar más rápido, no una recomendación sobre qué hacer con su dinero.</li>
        <li>El asistente solo conoce los gastos de su propia pareja — nunca los de otras parejas.</li>
      </ul>

      <p className="text-[var(--text-secondary)] leading-relaxed">
        ¿Dudas ahora mismo? Escríbannos a{' '}
        <a href="mailto:legal@duosyncwallet.app" className="underline">
          legal@duosyncwallet.app
        </a>
        .
      </p>
    </main>
  );
}
