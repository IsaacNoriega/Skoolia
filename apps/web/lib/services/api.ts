// src/lib/api.ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  method?: HttpMethod;
  body?: unknown; // JSON
  retryOn401?: boolean;
};

const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.API_SERVER_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

let refreshPromise: Promise<void> | null = null;

async function tryParseJson(res: Response): Promise<unknown | undefined> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return undefined;
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

async function refreshSession(): Promise<void> {
  // evita múltiples refresh simultáneos
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 🔥 manda cookies
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await tryParseJson(res);
        throw new ApiError('Refresh failed', res.status, data);
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const method: HttpMethod = opts.method ?? 'GET';
  const retryOn401 = opts.retryOn401 ?? !path.startsWith('/auth/');

  const headers = new Headers(opts.headers);
  if (!headers.has('Content-Type') && opts.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const doFetch = async (): Promise<Response> => {
    console.log('[API] Fetch:', { url, method, opts });
    const res = await fetch(url, {
      ...opts,
      method,
      headers,
      credentials: 'include', //  cookies para httponly
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    console.log('[API] Response:', res.status, res.statusText);
    return res;
  };

  // 1er intento
  let res = await doFetch();

  // si expiró access_token -> refresh -> retry 1 vez
  if (retryOn401 && res.status === 401) {
    try {
      await refreshSession();
      res = await doFetch();
    } catch {
      // refresh falló: ya no hay sesión válida
      // deja que el caller decida qué hacer
    }
  }

  if (!res.ok) {
    const data = await tryParseJson(res);
    throw new ApiError('Request failed', res.status, data);
  }

  // si no hay body (204) o no es json
  if (res.status === 204) return undefined as T;

  const data = (await tryParseJson(res)) as T;
  return data;
}
