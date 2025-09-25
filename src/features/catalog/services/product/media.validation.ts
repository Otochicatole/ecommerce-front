import type { AxiosError } from 'axios';

const DEFAULT_MAX_BYTES = Math.floor(0.95 * 1024 * 1024);

export type UploadValidationConfig = {
  maxBytes?: number;
};

export function validateUploadFormData(formData: FormData, cfg?: UploadValidationConfig): File[] {
  const maxBytes = cfg?.maxBytes ?? DEFAULT_MAX_BYTES;
  const files: File[] = [];
  formData.forEach((value, key) => {
    if (key === 'files' && value instanceof File) {
      if (!(value.type && value.type.startsWith('image/'))) {
        throw new Error(`solo se permiten imágenes. archivo inválido: ${value.name}`);
      }
      if (value.size > maxBytes) {
        throw new Error(`file ${value.name} exceeds 1MB limit`);
      }
      files.push(value);
    }
  });
  return files;
}

export function requireProductId(formData: FormData): string {
  const idOrDoc = String(formData.get('id') ?? '');
  if (!idOrDoc) throw new Error('Missing product id');
  return idOrDoc;
}

export function extractNumericIds(formData: FormData, keyPrefix: string): number[] {
  const ids: number[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith(keyPrefix)) {
      const n = Number(value);
      if (Number.isFinite(n)) ids.push(n);
    }
  });
  return ids;
}

export function isNotFoundAxiosError(error: unknown): error is AxiosError {
  const err = error as { isAxiosError?: boolean; response?: { status?: number } };
  return Boolean(err?.isAxiosError) && err?.response?.status === 404;
}


