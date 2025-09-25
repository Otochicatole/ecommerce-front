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
    reasons.push('el archivo supera 1MB o no pudo comprimirse por debajo de 1MB');
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
    if (textBlob.includes('network') || (err as any).code === 'ECONNABORTED' || (err as any).code === 'ENOTFOUND') {
      reasons.push('problema de red al contactar Strapi');
    }
    if (reasons.length < 2) {
      reasons.push('error interno del servidor de archivos');
    }
    const friendly = `no se pudo subir la imagen. posibles causas: ${reasons.join('; ')}${serverMessage ? `. detalle: ${serverMessage}` : ''}`;
    return new Error(friendly);
  }
  return new Error('no se pudo subir la imagen por un error inesperado en el servidor');
}


