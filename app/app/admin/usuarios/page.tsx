import { Users, TrendingUp } from 'lucide-react';
import { listarParejas, obtenerResumenUsuarios, obtenerSerieUsuarios } from '@/lib/admin-datos';
import { AgregarUsuario } from '@/components/admin/AgregarUsuario';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { GraficoSerie } from '@/components/admin/GraficoSerie';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// Buscador simple por texto (server-side, sin JS extra): recibe `?q=` y filtra por correo o
// nombre antes de renderizar — funciona sin necesidad de un componente cliente aparte.
export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [parejas, resumen, serie] = await Promise.all([listarParejas(), obtenerResumenUsuarios(), obtenerSerieUsuarios(14)]);
  const filtro = (q ?? '').trim().toLowerCase();
  const filtradas = filtro
    ? parejas.filter((p) => p.integrantes.some((i) => i.email.toLowerCase().includes(filtro) || i.nombre.toLowerCase().includes(filtro)))
    : parejas;

  const diagnostico: ItemDiagnostico[] = [
    resumen.nuevasUltimos7Dias > 0
      ? { estado: 'bien', texto: `${resumen.nuevasUltimos7Dias} pareja(s) nueva(s) se unieron en los últimos 7 días.` }
      : { estado: 'atencion', texto: 'Nadie nuevo se ha unido en los últimos 7 días.' },
    resumen.parejasIncompletas > 0
      ? { estado: 'atencion', texto: `${resumen.parejasIncompletas} pareja(s) están esperando que su segunda mitad se una.` }
      : { estado: 'bien', texto: 'Todas las parejas registradas tienen a sus dos integrantes.' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Usuarios</h2>
        <AgregarUsuario />
      </div>

      <DiagnosticoSeccion items={diagnostico} />

      <section>
        <TituloSeccion icono={Users} nivel="h3">Resumen</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Parejas totales" valor={String(resumen.totalParejas)} info="Cuántas parejas se han registrado en total desde siempre." />
          <Tarjeta etiqueta="Personas registradas" valor={String(resumen.totalUsuarios)} info="Cuántas personas en total, sumando ambos integrantes de cada pareja." />
          <Tarjeta etiqueta="Nuevas últimos 7 días" valor={String(resumen.nuevasUltimos7Dias)} colorValor="var(--accent)" info="Parejas que se registraron por primera vez esta última semana." />
        </GrillaTarjetas>
      </section>

      <section>
        <TituloSeccion icono={TrendingUp} nivel="h3">Parejas nuevas — últimos 14 días</TituloSeccion>
        <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <GraficoSerie titulo="Parejas nuevas por día" datos={serie} color="var(--accent-2)" />
        </div>
      </section>

      <TituloSeccion icono={Users} nivel="h3">Todas las parejas</TituloSeccion>

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por correo o nombre…"
          className="h-11 w-full max-w-sm rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </form>

      {filtradas.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-10 text-center text-[13px] text-[var(--text-tertiary)]">
          {filtro ? 'Ninguna pareja coincide con esa búsqueda.' : 'Todavía no hay ninguna pareja registrada.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface-2)] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                <th className="px-4 py-2.5">Integrantes</th>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5">Alta</th>
                <th className="px-4 py-2.5">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => (
                <tr key={p.coupleId} className="border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--surface)]">
                  <td className="px-4 py-3">
                    {p.integrantes.length === 0 ? (
                      <span className="text-[var(--text-tertiary)]">Sin integrantes</span>
                    ) : (
                      p.integrantes.map((i) => (
                        <div key={i.userId}>
                          <span className="font-medium text-[var(--text-primary)]">{i.nombre}</span>{' '}
                          <span className="text-[var(--text-tertiary)]">{i.email}</span>
                          {i.role === 'admin' && (
                            <span className="ml-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                              admin
                            </span>
                          )}
                        </div>
                      ))
                    )}
                    {p.integrantes.length === 1 && <span className="text-[12px] text-[var(--text-tertiary)]">Esperando que se una su pareja</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.plan === 'premium' ? 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'
                      }`}
                    >
                      {p.plan === 'premium' ? 'Premium' : 'Gratis'}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{fechaCorta(p.creadaEn)}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{p.ultimaActividad ? fechaCorta(p.ultimaActividad) : 'Sin actividad todavía'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
