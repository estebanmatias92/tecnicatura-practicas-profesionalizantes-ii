// Frontend BiblioTech — cliente REST delgado (toda la logica vive en el backend).
// UC-001..UC-006 via api/openapi.yaml. JWT en localStorage (lab; prod: httpOnly cookie).

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Material {
  id: number;
  title: string;
  author: string;
  subject?: string;
  year?: number;
  edition?: string;
  tags?: string[];
  ownerId: number;
}

const BASE = import.meta.env['VITE_API_URL'] ?? '';

export function getToken(): string | null {
  return localStorage.getItem('bibliotech_token');
}

export function getRole(): string | null {
  return localStorage.getItem('bibliotech_role');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    localStorage.removeItem('bibliotech_token');
    window.location.hash = '#/login';
    throw new Error('401: sesion requerida (BR-002)');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`${res.status}: ${(body as { message?: string }).message ?? 'error'}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Construye el query UC-005 (q + filtros AND + paginacion). Testeado en api.test.ts. */
export function buildCatalogQuery(params: {
  q?: string;
  author?: string;
  subject?: string;
  year?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v))) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
