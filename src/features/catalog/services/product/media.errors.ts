import axios from 'axios';

export function buildFriendlyUploadError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    const resData: unknown = err.response?.data;
    let serverMessage = '';
    if (typeof resData === 'string') {
      serverMessage = resData;
    } else if (resData && typeof resData === 'object') {
      const obj = resData as Record<string, unknown>;
      const errorObj = (obj['error'] ?? {}) as Record<string, unknown>;
      serverMessage = String(errorObj['message'] ?? obj['message'] ?? err.message ?? '');
    } else {
      serverMessage = err.message;
    }
    const reasons: string[] = [];
    reasons.push('el archivo supera 1 MiB o no pudo comprimirse por debajo de 1 MiB');
    const textBlob = JSON.stringify(resData || {}).toLowerCase() + ' ' + (serverMessage || '').toLowerCase();
    if (textBlob.includes('token') || textBlob.includes('unauthorized') || textBlob.includes('forbidden')) {
      reasons.push('token de API inválido o sin permisos en Strapi');
    }
    if (textBlob.includes('body exceeded') || textBlob.includes('payload') || textBlob.includes('entity too large')) {
      reasons.push('límite de tamaño del request en el servidor; reiniciar o subir bodySizeLimit');
    }
    if (textBlob.includes('mime') || textBlob.includes('file type') || textBlob.includes('unsupported')) {
      reasons.push('formato de imagen no soportado por el plugin de upload');
    }
    const maybeAxios = err as { code?: string };
    if (textBlob.includes('network') || maybeAxios.code === 'ECONNABORTED' || maybeAxios.code === 'ENOTFOUND') {
      reasons.push('problema de red al contactar Strapi');
    }
    if (reasons.length < 2) {
      reasons.push('error interno del servidor de archivos');
    }
    const friendly = `no se pudo subir la imagen. posibles causas: ${reasons.join('; ')}${serverMessage ? `. detalle: ${serverMessage}` : ''}`;
    return new Error(friendly);
  }
  // Non-axios errors (e.g., fetch-based uploads). Parse message/status hints.
  const generic = err as { message?: unknown } | null | undefined;
  const message = generic && typeof generic.message !== 'undefined' ? String(generic.message) : '';
  const lower = message.toLowerCase();
  const reasons: string[] = [];
  if (lower.includes('413') || lower.includes('payload') || lower.includes('entity too large')) {
    reasons.push('límite de tamaño del request en el servidor; reiniciar o subir bodySizeLimit');
  }
  if (lower.includes('401') || lower.includes('unauthorized')) {
    reasons.push('token de API inválido o sin permisos en Strapi (401)');
  }
  if (lower.includes('403') || lower.includes('forbidden')) {
    reasons.push('el token no tiene permisos para el plugin Upload (403)');
  }
  if (lower.includes('415') || lower.includes('unsupported')) {
    reasons.push('formato de imagen no soportado por el plugin de upload (415)');
  }
  if (lower.includes('mime')) {
    reasons.push('formato de imagen no soportado por el plugin de upload');
  }
  if (reasons.length === 0) {
    reasons.push('error interno del servidor de archivos');
  }
  const friendly = `no se pudo subir la imagen. posibles causas: ${reasons.join('; ')}${message ? `. detalle: ${message}` : ''}`;
  return new Error(friendly);
}


