import { Activity, Target } from 'lucide-react';
import { obtenerUso } from '@/lib/admin-datos';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

export default async function AdminUsoPage() {
  const uso = await obtenerUso();
  const porcentajeActivadas = uso.totalParejas > 0 ? (uso.activadosAlgunaVez / uso.totalParejas) * 100 : null;

  const diagnostico: ItemDiagnostico[] = [
    porcentajeActivadas === null
      ? { estado: 'atencion', texto: 'Todavía no hay parejas registradas para medir activación.' }
      : porcentajeActivadas >= 50
        ? { estado: 'bien', texto: `${Math.round(porcentajeActivadas)}% de las parejas ya hicieron al menos una acción real.` }
        : { estado: 'mal', texto: `Solo ${Math.round(porcentajeActivadas)}% de las parejas hicieron una acción real — la mayoría se registra y no vuelve a usar la app.` },
    uso.retencionD1 === null
      ? { estado: 'atencion', texto: 'Retención D1 aún no se puede medir — necesita parejas con al menos 1 día de antigüedad.' }
      : uso.retencionD1 >= 20
        ? { estado: 'bien', texto: `Retención D1 de ${uso.retencionD1}% — dentro de lo esperado para una app nueva.` }
        : { estado: 'mal', texto: `Retención D1 de solo ${uso.retencionD1}% — la mayoría no vuelve al día siguiente.` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Uso</h2>

      <DiagnosticoSeccion items={diagnostico} />

      <section>
        <TituloSeccion icono={Activity} nivel="h3">Activación y retención</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta
            etiqueta="Parejas activadas"
            valor={uso.totalParejas > 0 ? `${uso.activadosAlgunaVez} de ${uso.totalParejas}` : null}
            insight="Hicieron al menos 1 acción real: gasto, meta o pregunta respondida"
            progreso={porcentajeActivadas ?? undefined}
            info="Cuántas parejas, de todas las registradas, llegaron a usar la app de verdad (no solo se registraron)."
          />
          <Tarjeta
            etiqueta="Retención D1"
            valor={uso.retencionD1 !== null ? `${uso.retencionD1}%` : null}
            insight="Volvieron al día siguiente de unirse"
            progreso={uso.retencionD1 ?? undefined}
            info="De las parejas que llevan al menos 1 día, cuántas volvieron a usar la app al día siguiente de registrarse."
          />
          <Tarjeta
            etiqueta="Retención D7"
            valor={uso.retencionD7 !== null ? `${uso.retencionD7}%` : null}
            insight="Volvieron dentro de su primera semana"
            progreso={uso.retencionD7 ?? undefined}
            info="De las parejas que llevan al menos 7 días, cuántas volvieron a usar la app en su primera semana."
          />
        </GrillaTarjetas>
        <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
          Retención D30 todavía no se muestra — necesita parejas con más de 30 días de antigüedad para poder medirla de verdad.
        </p>
      </section>

      <section>
        <TituloSeccion icono={Target} nivel="h3">Acción principal</TituloSeccion>
        <GrillaTarjetas>
          <Tarjeta
            etiqueta="Acciones últimos 7 días"
            valor={String(uso.accionesUltimos7Dias)}
            insight="Gastos registrados + metas + preguntas respondidas"
            info="Cuántas veces, en total entre todas las parejas, alguien hizo algo real en la app esta última semana."
          />
        </GrillaTarjetas>
      </section>
    </div>
  );
}
