import axios from 'axios';

type HeadersInput = { token: string };

export async function httpUploadFiles(strapiUrl: string, files: File[], headersIn: HeadersInput) {
  // Use native fetch + FormData to avoid axios/undici FormData incompatibilities in Node runtimes.
  const multipart = new FormData();
  for (const file of files) multipart.append('files', file);
  const res = await fetch(`${strapiUrl}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${headersIn.token}` },
    body: multipart,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Upload failed with ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await res.json();
  return await res.text();
}

export async function httpPutProductMedia(
  strapiUrl: string,
  productId: string | number,
  mediaIds: number[],
  headersIn: HeadersInput,
) {
  const payload = { data: { media: mediaIds } };
  const { data } = await axios.request({
    method: 'PUT',
    url: `${strapiUrl}/api/products/${encodeURIComponent(String(productId))}`,
    headers: {
      Authorization: `Bearer ${headersIn.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: payload,
  });
  return data;
}

export async function httpFindProductByDocumentId(strapiUrl: string, documentId: string) {
  const { data } = await axios.get(`${strapiUrl}/api/products`, {
    params: { 'filters[documentId][$eq]': documentId },
  });
  return data;
}

export async function httpDeleteAsset(strapiUrl: string, id: number, headersIn: HeadersInput) {
  await axios.request({
    method: 'DELETE',
    url: `${strapiUrl}/api/upload/files/${id}`,
    headers: { Authorization: `Bearer ${headersIn.token}` },
  });
}


