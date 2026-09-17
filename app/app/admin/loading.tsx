// Skeleton compartido por las 5 pestañas de /admin — cada una dispara varias queries en
// paralelo (Promise.all); sin esto, cambiar de pestaña se sentía como pantalla en blanco.
function TarjetaEsqueleto() {
  return (
    <div className="animate-pulse rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4">
      <div className="h-3 w-20 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]" />
      <div className="mt-2 h-6 w-16 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_24%,transparent)]" />
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-5 w-32 animate-pulse rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TarjetaEsqueleto key={i} />
        ))}
      </div>
    </div>
  );
}
