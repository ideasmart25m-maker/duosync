import { Sparkles, TrendingUp } from 'lucide-react';
import { obtenerCostoIA, obtenerSerieCostoIA } from '@/lib/admin-datos';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { GraficoSerie } from '@/components/admin/GraficoSerie';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

const NOMBRES_TIPO: Record<string, string> = { escaneo: 'Escaneo de recibos', asistente: 'Asistente de IA' };

export default async function AdminCostoIAPage() {
  const [costoIA, serie] = await Promise.all([obtenerCostoIA(), obtenerSerieCostoIA(14)]);

  const diagnostico: ItemDiagnostico[] = [
    costoIA.costoMesUsd <= 5
      ? { estado: 'bien', texto: `El gasto de IA este mes ($${costoIA.costoMesUsd.toFixed(2)} USD) está bajo control.` }
      : { estado: 'mal', texto: `El gasto de IA ya lleva $${costoIA.costoMesUsd.toFixed(2)} USD este mes y todavía nadie paga — sale de tu bolsillo.` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Costo de IA</h2>
      <p className="text-[13px] text-[var(--text-secondary)]">Lo que te cuesta en dólares reales cada escaneo de recibo y cada respuesta del asistente.</p>

      <DiagnosticoSeccion items={diagnostico} />

      <section>
        <TituloSeccion icono={Sparkles} nivel="h3">Costo real de la IA</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Gastado hoy" valor={`$${costoIA.costoHoyUsd.toFixed(3)} USD`} info="Suma de todo lo gastado en IA (escaneos + asistente) desde la medianoche de hoy." />
          <Tarjeta etiqueta="Gastado este mes" valor={`$${costoIA.costoMesUsd.toFixed(3)} USD`} destacada info="Suma de todo lo gastado en IA desde el día 1 de este mes." />
          <Tarjeta etiqueta="Llamadas este mes" valor={String(costoIA.llamadasMes)} info="Cuántas veces se llamó a la IA este mes, sumando escaneos y respuestas del asistente." />
        </GrillaTarjetas>
        {costoIA.porTipo.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {costoIA.porTipo.map((t) => (
              <div key={t.tipo} className="flex items-center justify-between rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 py-2.5 text-[13px]">
                <span className="text-[var(--text-secondary)]">{NOMBRES_TIPO[t.tipo] ?? t.tipo}</span>
                <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                  {t.llamadas} llamadas · ${t.costoUsd.toFixed(3)} USD
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <TituloSeccion icono={TrendingUp} nivel="h3">Tendencia — últimos 14 días</TituloSeccion>
        <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
          <GraficoSerie titulo="Costo de IA por día (USD)" datos={serie} />
        </div>
      </section>
    </div>
  );
}
