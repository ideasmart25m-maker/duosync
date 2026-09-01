export default function TerminosPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-2">
        Términos y condiciones
      </h1>
      <p className="text-[12px] text-[var(--text-tertiary)] mb-8">Última actualización: 27 de agosto de 2026</p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
        DuoSync es un servicio operado por Gloria Alvarado, persona natural, desde Colombia. Al
        crear una cuenta aceptan estos términos y nuestra{' '}
        <a href="/privacidad" className="underline">Política de privacidad</a>.
      </p>

      <h2 className="text-lg font-semibold mb-2">Qué es DuoSync (y qué no es)</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        DuoSync es una app para que una pareja registre y organice sus gastos compartidos y
        mantenga una dinámica diaria de conexión. Es una herramienta de registro y organización:
        no es un producto financiero regulado, no da asesoría financiera, y no se conecta a sus
        cuentas bancarias ni mueve su dinero.
      </p>

      <h2 className="text-lg font-semibold mb-2">Suscripción y cobro</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        La suscripción es un solo pago que cubre a los dos integrantes de la pareja, mensual o
        anual según el plan que elijan. Tienen 7 días de prueba gratis; si no cancelan antes de que
        termine, el cobro se hace automáticamente al precio vigente del plan elegido y se repite
        cada mes o cada año hasta que cancelen. El pago lo procesa Hotmart, nuestra pasarela de
        pago.
      </p>

      <h2 className="text-lg font-semibold mb-2">Cómo cancelar</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Pueden cancelar cuando quieran desde el área de miembros de Hotmart (el mismo lugar donde
        hicieron el pago) — no queda ningún cobro después de la fecha en que cancelen. Si tienen
        problemas para encontrarla, escríbannos y los ayudamos.
      </p>

      <h2 className="text-lg font-semibold mb-2">Licencia de uso</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Les damos permiso personal, no comercial y no transferible para usar DuoSync mientras su
        suscripción esté activa. No pueden revender el acceso ni usarlo para operar un servicio
        propio.
      </p>

      <h2 className="text-lg font-semibold mb-2">Sobre las funciones con inteligencia artificial</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        El plan Premium incluirá escaneo de recibos y un asistente con inteligencia artificial.
        Mientras estas funciones estén en construcción, no forman parte de lo que reciben hoy — ver
        el detalle en el{' '}
        <a href="/aviso-ia" className="underline">Aviso de IA</a>. Cuando estén activas: los
        gastos, montos y demás datos que ustedes ingresan siguen siendo suyos; solo los usamos para
        darles el resultado que piden.
      </p>

      <h2 className="text-lg font-semibold mb-2">Responsabilidad</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        DuoSync los ayuda a llevar el registro de sus gastos, pero no garantiza que esté libre de
        errores; revisen los montos que registran (a mano o, más adelante, con ayuda de IA) antes
        de tomar decisiones importantes con esa información. No respondemos por decisiones
        financieras que tomen basándose únicamente en la app.
      </p>

      <h2 className="text-lg font-semibold mb-2">Suspensión de cuenta</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Podemos suspender una cuenta si detectamos uso indebido (compartir el acceso fuera de la
        pareja registrada, intentar vulnerar la seguridad de la app, o falta de pago), avisando
        primero por correo salvo que el riesgo sea inmediato.
      </p>

      <h2 className="text-lg font-semibold mb-2">Ley aplicable</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
        Estos términos se rigen por las leyes de Colombia.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed">
        ¿Dudas ahora mismo? Escríbannos a{' '}
        <a href="mailto:legal@duosync.app" className="underline">
          legal@duosync.app
        </a>
        .
      </p>
    </main>
  );
}
