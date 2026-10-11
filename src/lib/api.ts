// Thin client for the same-origin Hermes workspace API. The session cookie is
// HttpOnly + SameSite=Strict, so the browser attaches it; this code never sees it.

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

type Body = Record<string, unknown> | FormData | undefined;

export async function api<T>(path: string, init: { method?: string; body?: Body } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Workspace-Request': '1' };
  let body: BodyInit | undefined;
  if (init.body instanceof FormData) body = init.body;
  else if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { method: init.method ?? 'GET', body, headers, credentials: 'same-origin' });
  } catch {
    throw new ApiError('Server tidak bisa dihubungi. Periksa koneksi, lalu coba lagi.', 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
    const detail = typeof data?.detail === 'string' ? data.detail : null;
    throw new ApiError(detail ?? `Permintaan gagal (${response.status}).`, response.status);
  }
  return data as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body: Body = {}) => api<T>(path, { method: 'POST', body });
export const patch = <T>(path: string, body: Body = {}) => api<T>(path, { method: 'PATCH', body });
