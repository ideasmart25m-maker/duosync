export default function AvisoIaPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-4">
        Aviso sobre el uso de inteligencia artificial
      </h1>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        DuoSync usa inteligencia artificial para leer los recibos que fotografían (y sugerir el
        monto y la categoría del gasto) y para responder preguntas dentro del asistente de la app.
        La IA puede equivocarse: siempre pueden revisar y corregir lo que registra antes de
        guardarlo. Nunca inventa montos ni los guarda sin que ustedes lo confirmen.
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
