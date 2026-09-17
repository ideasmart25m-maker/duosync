import { DollarSign, TrendingDown } from 'lucide-react';
import { obtenerVentasResumen } from '@/lib/admin-datos';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

export default async function AdminVentasPage() {
  const ventas = await obtenerVentasResumen();
  const hotmartConectado = ventas.parejasPremium > 0;

  const diagnostico: ItemDiagnostico[] = [
    hotmartConectado
      ? { estado: 'bien', texto: 'Hotmart está conectado — las compras activan Premium solas.' }
      : { estado: 'mal', texto: 'Hotmart todavía no está conectado — nadie puede pasar a Premium todavía.' },
    ventas.gananciaRealUsd !== null
      ? { estado: 'bien', texto: 'Ya se puede calcular la ganancia real (ingresos menos todos los costos).' }
      : { estado: 'atencion', texto: 'La ganancia real no se puede calcular sin los ingresos de Hotmart — normal en esta etapa.' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Ventas</h2>

      {!hotmartConectado && (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] p-4 text-[13px] text-[var(--text-secondary)]">
          Los ingresos, cancelaciones y churn dependen del webhook de Hotmart, que todavía no está conectado — por eso las tarjetas de abajo dicen "Sin datos" en vez de un número inventado. En cuanto conectes Hotmart, se llenan solas.
        </div>
      )}

      <DiagnosticoSeccion items={diagnostico} />

      <section>
        <TituloSeccion icono={DollarSign} nivel="h3">Ingresos y ganancia</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Ingresos del mes" valor={ventas.ingresosMesUsd !== null ? `$${ventas.ingresosMesUsd.toFixed(2)} USD` : null} info="Lo que Hotmart reporta que entró este mes, antes de restar nada." />
          <Tarjeta
            etiqueta="Ganancia real"
            valor={ventas.gananciaRealUsd !== null ? `$${ventas.gananciaRealUsd.toFixed(2)} USD` : null}
            insight="Ingresos − Hotmart − afiliados − impuestos − IA − infra − email"
            info="Lo que de verdad te queda en el bolsillo, después de restar todos los costos del negocio."
            destacada={ventas.gananciaRealUsd !== null}
          />
          <Tarjeta etiqueta="Parejas en plan Premium" valor={String(ventas.parejasPremium)} info="Cuántas parejas tienen hoy el plan pago activo." />
        </GrillaTarjetas>
      </section>

      <section>
        <TituloSeccion icono={TrendingDown} nivel="h3">Churn y cancelaciones</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Cancelaciones del mes" valor={null} info="Cuántas parejas cancelaron su plan pago este mes." />
          <Tarjeta etiqueta="Churn voluntario" valor={null} info="Cancelaron ellas mismas, por decisión propia." />
          <Tarjeta etiqueta="Churn involuntario" valor={null} info="Se les venció la tarjeta o falló el cobro — no fue una decisión." />
        </GrillaTarjetas>
      </section>
    </div>
  );
}
