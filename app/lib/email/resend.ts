import { Resend } from 'resend';

// Instanciación PEREZOSA (no al importar el módulo): si se crea al cargar el archivo, Next.js
// intenta evaluar este módulo durante el build para analizar la ruta, y sin la variable de
// entorno todavía puesta ahí, el build entero fallaba (defecto real detectado). Al crearlo
// dentro de la función que la usa, el build pasa igual y el error real (si falta la clave)
// aparece recién en producción, en el momento de mandar el correo — donde sí corresponde.
export function crearClienteResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export const REMITENTE = 'DuoSync Wallet <onboarding@resend.dev>';
