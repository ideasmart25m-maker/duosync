import Link from 'next/link';
import { Users, Activity, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { calcularAvisos, obtenerResumenUsuarios, obtenerCostoIA, obtenerUso, obtenerErroresAgrupados, obtenerVentasResumen } from '@/lib/admin-datos';
import { Tarjeta, GrillaTarjetas } from '@/components/admin/Tarjeta';
import { BannerAvisos } from '@/components/admin/BannerAvisos';
import { TituloSeccion } from '@/components/admin/TituloSeccion';
import { DiagnosticoSeccion, type ItemDiagnostico } from '@/components/admin/DiagnosticoSeccion';

export default async function AdminResumenPage() {
  const [avisos, usuarios, costoIA, uso, errores, ventas] = await Promise.all([
    calcularAvisos(),
    obtenerResumenUsuarios(),
    obtenerCostoIA(),
    obtenerUso(),
    obtenerErroresAgrupados(),
    obtenerVentasResumen(),
  ]);

  const porcentajeActivadas = usuarios.totalParejas > 0 ? (uso.activadosAlgunaVez / usuarios.totalParejas) * 100 : null;
  const hotmartConectado = ventas.parejasPremium > 0;

  // Un vistazo de "cómo va cada área" combinando las señales más importantes — el dueño no
  // tiene que entrar a las 6 pestañas para saber si algo necesita su atención hoy.
  const diagnosticoGeneral: ItemDiagnostico[] = [
    hotmartConectado
      ? { estado: 'bien', texto: 'Ventas: Hotmart conectado, las compras activan Premium solas.' }
      : { estado: 'atencion', texto: 'Ventas: Hotmart todavía no está conectado.' },
    porcentajeActivadas !== null && porcentajeActivadas >= 50
      ? { estado: 'bien', texto: `Uso: ${Math.round(porcentajeActivadas)}% de las parejas ya usaron la app de verdad.` }
      : { estado: porcentajeActivadas === null ? 'atencion' : 'mal', texto: porcentajeActivadas === null ? 'Uso: todavía no hay suficientes parejas para medir activación.' : `Uso: solo ${Math.round(porcentajeActivadas)}% de las parejas se activaron.` },
    costoIA.costoMesUsd <= 5
      ? { estado: 'bien', texto: `Costo de IA: $${costoIA.costoMesUsd.toFixed(2)} USD este mes, controlado.` }
      : { estado: 'mal', texto: `Costo de IA: ya lleva $${costoIA.costoMesUsd.toFixed(2)} USD este mes y sale de tu bolsillo.` },
    errores.length === 0
      ? { estado: 'bien', texto: 'Salud: sin errores registrados.' }
      : { estado: 'mal', texto: `Salud: ${errores.length} tipo(s) de error activos.` },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de avisos — lo primero que se ve, en lenguaje simple (qué pasó → por qué
          importa → qué hacer), nunca jerga técnica. */}
      <BannerAvisos avisos={avisos} />

      <section>
        <TituloSeccion icono={ShieldCheck}>Cómo va tu negocio, de un vistazo</TituloSeccion>
        <DiagnosticoSeccion items={diagnosticoGeneral} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <TituloSeccion icono={Users}>Usuarios</TituloSeccion>
          <Link href="/admin/usuarios" className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)] [touch-action:manipulation]">
            Ver más <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Parejas totales" valor={String(usuarios.totalParejas)} info="Cuántas parejas se han registrado en total desde siempre." />
          <Tarjeta etiqueta="Personas registradas" valor={String(usuarios.totalUsuarios)} info="Cuántas personas en total, sumando ambos integrantes de cada pareja." />
          <Tarjeta etiqueta="Nuevas últimos 7 días" valor={String(usuarios.nuevasUltimos7Dias)} colorValor="var(--accent)" info="Parejas que se registraron por primera vez esta última semana." />
        </GrillaTarjetas>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <TituloSeccion icono={Activity}>Uso real</TituloSeccion>
          <Link href="/admin/uso" className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)] [touch-action:manipulation]">
            Ver más <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
        <GrillaTarjetas>
          <Tarjeta
            etiqueta="Parejas activadas"
            valor={usuarios.totalParejas > 0 ? `${uso.activadosAlgunaVez} de ${usuarios.totalParejas}` : null}
            insight="Registraron al menos una acción real (gasto, meta o pregunta)"
            progreso={porcentajeActivadas ?? undefined}
            info="Cuántas parejas, de todas las registradas, llegaron a usar la app de verdad."
          />
          <Tarjeta etiqueta="Acciones últimos 7 días" valor={String(uso.accionesUltimos7Dias)} info="Gastos, metas y preguntas respondidas, sumando todas las parejas, esta última semana." />
          <Tarjeta
            etiqueta="Retención D1"
            valor={uso.retencionD1 !== null ? `${uso.retencionD1}%` : null}
            insight="Volvieron al día siguiente de unirse"
            progreso={uso.retencionD1 ?? undefined}
            info="De las parejas que llevan al menos 1 día, cuántas volvieron a usar la app al día siguiente."
          />
        </GrillaTarjetas>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <TituloSeccion icono={Sparkles}>Costo real de la IA (este mes)</TituloSeccion>
          <Link href="/admin/costo-ia" className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)] [touch-action:manipulation]">
            Ver más <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Gastado hoy" valor={`$${costoIA.costoHoyUsd.toFixed(3)} USD`} info="Suma de todo lo gastado en IA desde la medianoche de hoy." />
          <Tarjeta etiqueta="Gastado este mes" valor={`$${costoIA.costoMesUsd.toFixed(3)} USD`} destacada info="Suma de todo lo gastado en IA desde el día 1 de este mes." />
          <Tarjeta etiqueta="Llamadas este mes" valor={String(costoIA.llamadasMes)} info="Cuántas veces se llamó a la IA este mes, entre escaneos y respuestas del asistente." />
        </GrillaTarjetas>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <TituloSeccion icono={ShieldCheck}>Salud</TituloSeccion>
          <Link href="/admin/salud" className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)] [touch-action:manipulation]">
            Ver más <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
        <GrillaTarjetas>
          <Tarjeta etiqueta="Tipos de error distintos" valor={String(errores.length)} info="Cuántos errores diferentes están ocurriendo, sin contar repeticiones del mismo." />
          <Tarjeta etiqueta="Error más frecuente" valor={errores[0] ? `${errores[0].veces}×` : null} insight={errores[0]?.message} info="El error que más veces se ha repetido — normalmente el que más urge arreglar." />
        </GrillaTarjetas>
      </section>
    </div>
  );
}
