import { ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { obtenerErroresAgrupados, obtenerSerieErrores } from '@/lib/admin-datos';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { GraficoSerie } from '@/components/admin/GraficoSerie';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default async function AdminSaludPage() {
  const [errores, serie] = await Promise.all([obtenerErroresAgrupados(), obtenerSerieErrores(14)]);
  const totalOcurrencias = errores.reduce((a, e) => a + e.veces, 0);

  const diagnostico: ItemDiagnostico[] = [
    errores.length === 0
      ? { estado: 'bien', texto: 'No hay errores registrados — la app está estable.' }
      : { estado: 'mal', texto: `${errores.length} tipo(s) de error distintos, ${totalOcurrencias} veces en total.` },
    { estado: 'atencion', texto: 'El webhook de Hotmart todavía no está construido — no hay forma de medir "drift" de suscripciones todavía.' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Salud</h2>

      <DiagnosticoSeccion items={diagnostico} />

      <section>
        <TituloSeccion icono={ShieldCheck} nivel="h3">Estado general</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Errores registrados (total)" valor={String(totalOcurrencias)} info="Suma de todas las veces que ocurrió cualquier error, contando repeticiones." />
          <Tarjeta etiqueta="Estado del webhook de Hotmart" valor="No conectado" colorValor="var(--danger)" insight="Todavía no se construyó — ver Ventas" info="El aviso automático que Hotmart le manda a tu app cuando alguien paga o cancela." />
          <Tarjeta etiqueta="Drift de suscripciones" valor={null} insight="Se mide una vez que Hotmart esté conectado" info="Cuando lo que Hotmart dice que pasó no coincide con lo que la app tiene guardado." />
        </GrillaTarjetas>
      </section>

      <section>
        <TituloSeccion icono={TrendingUp} nivel="h3">Errores por día — últimos 14 días</TituloSeccion>
        <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <GraficoSerie titulo="Errores por día" datos={serie} color="var(--danger)" />
        </div>
      </section>

      <section>
        <TituloSeccion icono={AlertTriangle} nivel="h3">Errores más frecuentes (los que más urge arreglar primero)</TituloSeccion>
        {errores.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-10 text-center text-[13px] text-[var(--text-tertiary)]">
            Ningún error registrado todavía.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {errores.slice(0, 20).map((e, i) => (
              <div key={i} className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{e.message}</p>
                  <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--danger)]">
                    {e.veces}×
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                  {e.context} · última vez: {fechaCorta(e.ultimaVez)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
