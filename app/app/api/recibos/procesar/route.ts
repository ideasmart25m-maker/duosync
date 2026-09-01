import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { leerRecibo } from '@/lib/ai/receipt-scan';

// BFF (09-SEGURIDAD.md): el navegador nunca llama a Anthropic directo — sube la foto a Storage,
// crea la fila `receipt_scans`, y avisa a ESTA ruta para que el servidor (con la clave de IA y
// la clave secreta de Supabase) haga el trabajo pesado. El estado/monto los escribe el servidor
// (crearClienteAdmin), nunca el cliente — así lo exige la política de `receipt_scans` desde que
// se diseñó la tabla en la Sesión 6.
export async function POST(request: NextRequest) {
  const { scanId } = await request.json();
  if (!scanId || typeof scanId !== 'string') {
    return NextResponse.json({ error: 'Falta el id del escaneo.' }, { status: 400 });
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión activa.' }, { status: 401 });

  // La consulta pasa por RLS con la sesión del usuario: si la fila no es de SU pareja, esto
  // devuelve null y cortamos aquí — no hace falta reimplementar la verificación de pertenencia.
  const { data: scan, error: errorScan } = await supabase.from('receipt_scans').select('id, couple_id, imagen_path, estado').eq('id', scanId).maybeSingle();
  if (errorScan || !scan) {
    return NextResponse.json({ error: 'No encontramos ese recibo.' }, { status: 404 });
  }
  if (scan.estado !== 'pendiente') {
    // Ya se procesó (o se está procesando) — evita reprocesar y gastar dos veces por un doble-tap.
    return NextResponse.json({ ok: true, yaProcesado: true });
  }

  const admin = crearClienteAdmin();
  await admin.from('receipt_scans').update({ estado: 'procesando' }).eq('id', scanId);

  try {
    const { data: categorias, error: errorCat } = await supabase.from('categories').select('id, nombre').eq('couple_id', scan.couple_id);
    if (errorCat) throw errorCat;

    const { data: archivo, error: errorDescarga } = await supabase.storage.from('recibos').download(scan.imagen_path);
    if (errorDescarga || !archivo) throw errorDescarga ?? new Error('No pudimos leer la foto guardada.');

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = archivo.type === 'image/png' ? 'image/png' : archivo.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

    const resultado = await leerRecibo(base64, mediaType, categorias ?? []);

    if (!resultado.esRecibo) {
      await admin
        .from('receipt_scans')
        .update({ estado: 'error', error_mensaje: 'No pudimos leer la foto — ¿es un recibo?', procesado_at: new Date().toISOString() })
        .eq('id', scanId);
      return NextResponse.json({ ok: true });
    }

    await admin
      .from('receipt_scans')
      .update({
        estado: 'listo',
        monto_detectado: resultado.monto,
        categoria_sugerida_id: resultado.categoriaId,
        procesado_at: new Date().toISOString(),
      })
      .eq('id', scanId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Degradación elegante (30-INTEGRACION-IA.md): el usuario siempre puede registrar el gasto
    // a mano si la IA falla — nunca una pantalla rota por un error del proveedor.
    await admin
      .from('receipt_scans')
      .update({ estado: 'error', error_mensaje: 'No pudimos leer el recibo. Regístralo a mano.', procesado_at: new Date().toISOString() })
      .eq('id', scanId);
    console.error('[recibos/procesar] error:', e);
    return NextResponse.json({ ok: true });
  }
}
