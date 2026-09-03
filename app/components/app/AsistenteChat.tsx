'use client';

// Asistente de IA — chat simple con streaming (respuesta en vivo, palabra por palabra;
// 30-INTEGRACION-IA.md). Solo conoce los gastos reales del mes de la pareja (los arma el
// servidor en /api/asistente, con RLS — nunca se le manda la clave de IA al navegador).

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';

interface Mensaje {
  rol: 'user' | 'assistant';
  texto: string;
}

export function AsistenteChat({ onCerrar }: { onCerrar: () => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', texto: 'Hola, pueden preguntarme sobre sus gastos de este mes — por ejemplo "¿cuánto llevamos gastado en mercado?".' },
  ]);
  const [pregunta, setPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async () => {
    const texto = pregunta.trim();
    if (!texto || enviando) return;
    setError(null);
    setPregunta('');
    const historial = mensajes.slice(-10).map((m) => ({ rol: m.rol, texto: m.texto }));
    setMensajes((prev) => [...prev, { rol: 'user', texto }, { rol: 'assistant', texto: '' }]);
    setEnviando(true);

    try {
      const respuesta = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: texto, historial }),
      });
      if (!respuesta.ok || !respuesta.body) throw new Error('fallo');

      const lector = respuesta.body.getReader();
      const decodificador = new TextDecoder();
      // Streaming manual (fetch + ReadableStream) — no hace falta una librería aparte para
      // esto; se lee chunk por chunk y se va pegando al último mensaje del asistente.
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        const trozo = decodificador.decode(value, { stream: true });
        setMensajes((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { rol: 'assistant', texto: copia[copia.length - 1].texto + trozo };
          return copia;
        });
      }
    } catch {
      setError('No pudimos responder. Intenten de nuevo en un momento.');
      setMensajes((prev) => prev.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,black_45%,transparent)] sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-[85dvh] w-full max-w-md flex-col rounded-t-[var(--radius-card)] bg-[var(--surface)] shadow-[var(--shadow-2)] sm:h-[70dvh] sm:rounded-[var(--radius-card)]"
      >
        <div className="flex items-center justify-between border-b border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] p-4">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]">
            <Sparkles size={16} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
            Asistente
          </span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-9 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]">
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-[var(--radius-card)] px-4 py-2 text-[14px] leading-relaxed ${
                  m.rol === 'user' ? 'self-end bg-[var(--accent)] text-[var(--bg)]' : 'self-start bg-[var(--surface-2)] text-[var(--text-primary)]'
                }`}
              >
                {m.texto || (enviando && i === mensajes.length - 1 ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : '')}
              </div>
            ))}
            {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
            <div ref={finRef} />
          </div>
        </div>

        <form
          className="flex items-center gap-2 border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
        >
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Pregúntanos algo…"
            className="h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={!pregunta.trim() || enviando}
            aria-label="Enviar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
          >
            <Send size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
