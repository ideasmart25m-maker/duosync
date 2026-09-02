export default function AvisoIaPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-2">
        Aviso sobre el uso de inteligencia artificial
      </h1>
      <p className="text-[12px] text-[var(--text-tertiary)] mb-8">Última actualización: 27 de agosto de 2026</p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        El plan Premium de DuoSync Wallet incluirá dos funciones con inteligencia artificial: lectura
        automática de recibos (para sugerir el monto y la categoría del gasto a partir de una foto)
        y un asistente dentro de la app para resolver dudas sobre sus gastos.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        <strong>Todavía estamos construyendo estas dos funciones — hoy no están activas.</strong>{' '}
        Mientras tanto, registran cada gasto a mano, como el resto de la app. Vamos a avisar por
        correo y dentro de la app el día que se activen, y esta página se actualiza con el nombre
        del proveedor de IA que usemos.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Cuando estén activas, aplican estas reglas:
      </p>
      <ul className="list-disc pl-5 text-[var(--text-secondary)] leading-relaxed mb-6 space-y-1">
        <li>La IA puede equivocarse: siempre van a poder revisar y corregir lo que sugiere antes de guardarlo.</li>
        <li>Nunca guarda un monto o una categoría sin que ustedes lo confirmen.</li>
        <li>No reemplaza asesoría financiera profesional — es una ayuda para registrar más rápido, no una recomendación sobre qué hacer con su dinero.</li>
        <li>Sus fotos y preguntas se procesan por un proveedor externo de IA para generar la respuesta; no se usan para entrenar modelos de terceros.</li>
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
