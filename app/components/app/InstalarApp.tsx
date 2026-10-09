'use client';

// Botón "Instalar Fairsy": en Android/Chrome abre el cuadro de instalación; en iPhone (Safari no permite
// instalar con un botón) explica los 2 toques. Se oculta si ya está instalada o si la persona lo descarta.

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CLAVE = 'fairsy-instalar-descartado';

export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [esIphone, setEsIphone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [verPasos, setVerPasos] = useState(false);

  useEffect(() => {
    const instalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    let descartado = false;
    try {
      descartado = localStorage.getItem(CLAVE) === '1';
    } catch {
      /* sin almacenamiento: se muestra igual */
    }
    if (instalada || descartado) return;

    const iphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Asíncrono a propósito: leer el navegador y actualizar el estado fuera del cuerpo del efecto.
    const t = setTimeout(() => {
      setEsIphone(iphone);
      if (iphone) setVisible(true);
    }, 0);

    const alLlegar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', alLlegar);
    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', alLlegar);
    };
  }, []);

  if (!visible) return null;

  const descartar = () => {
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      /* ignorar */
    }
    setVisible(false);
  };

  const instalar = async () => {
    if (evento) {
      await evento.prompt();
      const r = await evento.userChoice;
      if (r.outcome === 'accepted') setVisible(false);
      setEvento(null);
    } else {
      setVerPasos(true);
    }
  };

  return (
    <div className="relative flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] bg-[var(--surface)] p-4">
      <button type="button" onClick={descartar} aria-label="No mostrar de nuevo" className="absolute right-2 top-2 flex size-8 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]">
        <X size={16} aria-hidden="true" />
      </button>
      <p className="pr-8 text-[15px] font-semibold text-[var(--text-primary)]">Ten Fairsy como app en tu celular</p>
      <p className="text-[13px] text-[var(--text-secondary)]">Se abre con un toque desde tu pantalla de inicio, sin escribir la dirección y sin volver a entrar.</p>
      {verPasos || (esIphone && !evento) ? (
        <ol className="mt-1 list-decimal pl-5 text-[13px] text-[var(--text-secondary)]">
          <li>
            Toca el botón <Share size={13} className="inline align-text-bottom" aria-hidden="true" /> <strong>Compartir</strong> de Safari.
          </li>
          <li>
            Elige <strong>&quot;Agregar a pantalla de inicio&quot;</strong> y toca <strong>Agregar</strong>.
          </li>
        </ol>
      ) : (
        <button
          type="button"
          onClick={instalar}
          className="mt-1 flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
        >
          <Download size={16} strokeWidth={2.4} aria-hidden="true" />
          Instalar Fairsy
        </button>
      )}
    </div>
  );
}
