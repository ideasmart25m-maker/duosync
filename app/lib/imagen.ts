// Reduce el tamaño de una foto antes de subirla — una foto de celular sin comprimir cuesta
// más en Storage y más tokens de visión a la IA sin ganar nada de precisión real para leer un
// recibo (30-INTEGRACION-IA.md: "caro → cachear, limitar, elegir lo más barato que sirva").
export async function comprimirImagen(archivo: File, maxLado = 1400, calidad = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) return archivo;
  ctx.drawImage(bitmap, 0, 0, ancho, alto);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? archivo), 'image/jpeg', calidad);
  });
}
