import { Target, Megaphone } from 'lucide-react';
import { obtenerVentasResumen, listarGastoPorCanal } from '@/lib/admin-datos';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { GastoCanalForm } from '@/components/admin/GastoCanalForm';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

export default async function AdminNegocioPage() {
  const [ventas, gastosCanal] = await Promise.all([obtenerVentasResumen(), listarGastoPorCanal()]);

  const diagnostico: ItemDiagnostico[] = [
    gastosCanal.length > 0
      ? { estado: 'bien', texto: `Ya llevas registro de gasto en ${gastosCanal.length} canal(es) de adquisición.` }
      : { estado: 'atencion', texto: 'Todavía no has anotado gasto en ningún canal — hazlo abajo cuando empieces a invertir en tráfico.' },
    { estado: 'atencion', texto: 'LTV y CAC no se pueden calcular todavía — necesitan ingresos reales de Hotmart y clientes nuevos por canal.' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Negocio</h2>
      <p className="text-[13px] text-[var(--text-secondary)]">El modelo de margen: cuánto vale un cliente (LTV) contra cuánto cuesta conseguirlo (CAC).</p>

      <DiagnosticoSeccion items={diagnostico} />

      <section>
        <TituloSeccion icono={Target} nivel="h3">LTV, CAC y canales</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta etiqueta="LTV promedio" valor={null} info="Lo que un cliente promedio te deja en total durante todo el tiempo que se queda pagando." />
          <Tarjeta
            etiqueta="CAC promedio"
            valor={null}
            insight={ventas.gastoAdquisicionTotalUsd > 0 ? 'Falta el número de clientes nuevos por canal para calcularlo' : undefined}
            info="Lo que te cuesta en promedio conseguir un cliente nuevo (gasto en anuncios y contenido dividido entre clientes conseguidos)."
          />
          <Tarjeta etiqueta="Ratio LTV:CAC" valor={null} insight="Sano: 3:1 o más" info="Por cada peso que gastas en conseguir un cliente, cuántos pesos te devuelve. 3:1 o más es un negocio sano." />
        </GrillaTarjetas>
      </section>

      <section>
        <TituloSeccion icono={Megaphone} nivel="h3">Gasto de adquisición por canal (lo anotas tú)</TituloSeccion>
        <div className="flex flex-col gap-3">
          <GastoCanalForm />
          {gastosCanal.length > 0 && (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]">
              <table className="w-full min-w-[480px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface-2)] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                    <th className="px-4 py-2.5">Canal</th>
                    <th className="px-4 py-2.5">Monto</th>
                    <th className="px-4 py-2.5">Período</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosCanal.map((g) => (
                    <tr key={g.id} className="border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--surface)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{g.channel}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--text-secondary)]">
                        {g.amount.toLocaleString('es-CO')} {g.currency}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                        {g.periodStart} → {g.periodEnd}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
