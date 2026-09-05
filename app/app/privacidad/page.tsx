export default function PrivacidadPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold [font-family:var(--font-display)] mb-2">
        Política de privacidad
      </h1>
      <p className="text-[12px] text-[var(--text-tertiary)] mb-8">Última actualización: 27 de agosto de 2026</p>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
        DuoSync Wallet es operada por Gloria Alvarado, persona natural, desde Colombia. Esta página
        explica qué datos guardamos de ustedes, para qué los usamos y qué pueden pedirnos en
        cualquier momento.
      </p>

      <h2 className="text-lg font-semibold mb-2">Qué datos recopilamos</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Su correo electrónico (para dejarlos entrar sin contraseña), los gastos, categorías y
        montos que registran, las respuestas a la pregunta diaria, y el código que vincula a los
        dos miembros de la pareja. No pedimos ni guardamos claves de banco ni datos de tarjetas: el
        pago lo procesa Hotmart directamente, nunca pasa por nuestros servidores.
      </p>

      <h2 className="text-lg font-semibold mb-2">Para qué los usamos</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Solo para hacer funcionar la app: sincronizar el gasto y las respuestas entre ustedes dos
        en tiempo real, enviarles el enlace de acceso a su correo, y responder cuando nos escriben.
        No vendemos sus datos a nadie ni los usamos para publicidad.
      </p>

      <h2 className="text-lg font-semibold mb-2">Con quién los compartimos</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Usamos estos proveedores externos, cada uno con una función concreta:
      </p>
      <ul className="list-disc pl-5 text-[var(--text-secondary)] leading-relaxed mb-4 space-y-1">
        <li><strong>Supabase</strong> (EE. UU.) — guarda la base de datos y gestiona el inicio de sesión.</li>
        <li><strong>Vercel</strong> (EE. UU.) — aloja la aplicación web que ustedes usan.</li>
        <li><strong>Hotmart</strong> — procesa el pago de la suscripción; ve los datos de pago, nosotros no.</li>
      </ul>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Como Supabase y Vercel operan desde Estados Unidos, sus datos viajan y se almacenan fuera de
        Colombia bajo los términos de esos proveedores. Todavía no usamos inteligencia artificial en
        la app (ver el{' '}
        <a href="/aviso-ia" className="underline">Aviso de IA</a>); el día que la activemos, nombraremos
        aquí al proveedor y les avisaremos por correo antes de que empiece a procesar sus datos.
      </p>

      <h2 className="text-lg font-semibold mb-2">Cómo pedir que borremos sus datos</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Escríbannos a{' '}
        <a href="mailto:legal@duosyncwallet.app" className="underline">legal@duosyncwallet.app</a> pidiendo el
        borrado de su cuenta. Eliminamos su perfil, sus gastos, sus respuestas y la vinculación con
        su pareja en un plazo máximo de 15 días hábiles, y les confirmamos por correo cuando esté
        hecho. Si más adelante activamos un botón de borrado dentro de la app, esta página se
        actualiza para reflejarlo.
      </p>

      <h2 className="text-lg font-semibold mb-2">Edad mínima</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        DuoSync Wallet es para personas mayores de 18 años (la suscripción requiere un medio de pago
        propio). No está dirigida a menores de edad y no recopilamos datos a sabiendas de menores.
      </p>

      <h2 className="text-lg font-semibold mb-2">Cambios a esta política</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Si cambiamos algo importante (qué datos pedimos, con quién los compartimos, o si sumamos
        IA), se los avisamos por correo antes de que el cambio entre en vigencia, además de
        actualizar la fecha de arriba.
      </p>

      <h2 className="text-lg font-semibold mb-2">Ley aplicable</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
        Como operamos desde Colombia, esta política se rige por la Ley 1581 de 2012 (protección de
        datos personales) y sus decretos reglamentarios. Si viven en otro país de Latinoamérica
        (por ejemplo México o Argentina), además tienen los derechos que les da la ley de
        protección de datos de su propio país — esta política no reemplaza esos derechos, los
        complementa.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed">
        ¿Dudas ahora mismo? Escríbannos a{' '}
        <a href="mailto:legal@duosyncwallet.app" className="underline">
          legal@duosyncwallet.app
        </a>
        .
      </p>
    </main>
  );
}
