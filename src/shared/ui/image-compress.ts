// Utilidad de compresión en cliente para asegurar que cada imagen quede por debajo
// de un tamaño máximo (por defecto ~0.95 MB). Esta función busca el mejor equilibrio
// entre calidad y tamaño usando WebP/JPEG a través de OffscreenCanvas.
//
// Decisiones de diseño:
// - Se intenta conservar dimensiones; si querés forzar un resize, pasá maxWidth/maxHeight.
// - Se reduce la calidad en pasos hasta lograr el objetivo o llegar a un mínimo razonable.
// - Se prioriza WebP para mejor relación calidad/tamaño; si el original es PNG, se convierte.
// - Está pensada para usarse antes de armar el FormData y enviar cada archivo en requests
//   separados, evitando límites de body de Server Actions.

export type CompressOptions = {
  maxBytes?: number; // default ~0.95MB
  maxWidth?: number; // optional resize width
  maxHeight?: number; // optional resize height
  quality?: number; // 0..1 for JPEG/WebP
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
};

export async function compressToUnderSize(file: File, options: CompressOptions = {}): Promise<File> {
  // Si ya cumple tamaño, devolvemos tal cual para evitar retrabajo.
  const maxBytes = options.maxBytes ?? Math.floor(0.95 * 1024 * 1024);
  if (file.size <= maxBytes) return file;

  // Elegimos mime de salida según original o preferencia de opciones.
  const mime = options.mimeType ?? (file.type === 'image/png' ? 'image/webp' : file.type || 'image/jpeg');

  // Decodificamos el bitmap para dibujar en canvas sin tocar el DOM.
  const bitmap = await createImageBitmap(file);
  const targetWidth = options.maxWidth ?? bitmap.width;
  const targetHeight = options.maxHeight ?? bitmap.height;

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  // Pintamos la imagen en el canvas con las dimensiones objetivo.
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  // Comenzamos con una calidad alta y vamos bajando en escalones.
  let quality = options.quality ?? 0.92;
  for (let i = 0; i < 6; i++) { // up to 6 attempts
    const blob = await canvas.convertToBlob({ type: mime, quality });
    if (blob.size <= maxBytes || quality <= 0.4) {
      return new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.webp'), { type: blob.type });
    }
    quality -= 0.12;
  }
  // Fallback return last attempt even if slightly over
  const blob = await canvas.convertToBlob({ type: mime, quality });
  return new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.webp'), { type: blob.type });
}


