'use client';

import { useState } from 'react';
import { UserPlus, Loader2, Check, X } from 'lucide-react';

// Formulario para crear/invitar un usuario a mano (pedido real del usuario: "por si quiero
// agregar a alguien o a un usuario no le llega el acceso correctamente"). Llama a
// /api/admin/usuarios/crear — la creación real pasa por la API de administración de Supabase,
// nunca se toca la base de datos directo desde el navegador.
export function AgregarUsuario() {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const enviar = async () => {
    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch('/api/admin/usuarios/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ ok: false, mensaje: data.error ?? 'No pudimos crear la cuenta.' });
      } else if (data.yaExistia) {
        setResultado({ ok: true, mensaje: `${email} ya tenía cuenta — puede entrar con el enlace de acceso normal desde el login.` });
      } else {
        setResultado({ ok: true, mensaje: `Cuenta creada. Le mandamos un correo de acceso a ${email}.` });
        setEmail('');
        setNombre('');
      }
    } catch {
      setResultado({ ok: false, mensaje: 'No pudimos conectar con el servidor. Intenta de nuevo.' });
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
      >
        <UserPlus size={15} strokeWidth={2.2} aria-hidden="true" />
        Agregar usuario manualmente
      </button>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Agregar usuario manualmente</p>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setResultado(null);
          }}
          aria-label="Cerrar"
          className="text-[var(--text-tertiary)] [touch-action:manipulation]"
        >
          <X size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      <p className="mb-3 text-[12px] text-[var(--text-secondary)]">
        Crea la cuenta y le manda un correo real de acceso — para cuando alguien no se registró solo o el enlace no le llegó.
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          maxLength={60}
          className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        {resultado && (
          <p className={`flex items-start gap-1.5 text-[12px] font-medium ${resultado.ok ? 'text-[var(--accent-2)]' : 'text-[var(--danger)]'}`}>
            {resultado.ok ? <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
            {resultado.mensaje}
          </p>
        )}
        <button
          type="submit"
          disabled={!email || !nombre || enviando}
          className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
        >
          {enviando && <Loader2 size={15} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
          {enviando ? 'Creando…' : 'Crear y enviar acceso'}
        </button>
      </form>
    </div>
  );
}
