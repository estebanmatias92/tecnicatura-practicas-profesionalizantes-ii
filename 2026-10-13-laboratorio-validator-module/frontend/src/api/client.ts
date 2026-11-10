import type {
  AdminMaterialsQuery,
  AuthResponse,
  CatalogQuery,
  Material,
  MaterialInput,
  Page,
  Role,
  User,
} from './types';

const TOKEN_KEY = 'bibliotech.token';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function normalizeMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'Ocurrió un error inesperado';
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const code =
    payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : undefined;
  return new ApiError(normalizeMessage(payload), response.status, code);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: rawHeaders, ...rest } = options;
  const headers = new Headers(rawHeaders);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { headers });
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

function queryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
    register: (email: string, password: string) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: { email, password } }),
    me: () => request<User>('/auth/me'),
  },
  materials: {
    catalog: (query: CatalogQuery = {}) =>
      request<Page<Material>>(`/materials${queryString(query)}`),
    mine: () => request<{ items: Material[] }>('/materials/mine'),
    adminList: (query: AdminMaterialsQuery = {}) =>
      request<Page<Material>>(`/materials/admin${queryString(query)}`),
    get: (id: string) => request<Material>(`/materials/${id}`),
    create: (input: MaterialInput) =>
      request<Material>('/materials', { method: 'POST', body: input }),
    update: (id: string, input: MaterialInput) =>
      request<Material>(`/materials/${id}`, { method: 'PATCH', body: input }),
    upload: (id: string, file: File) => {
      const body = new FormData();
      body.append('file', file);
      return request<Material>(`/materials/${id}/file`, { method: 'POST', body });
    },
    publish: (id: string) =>
      request<Material>(`/materials/${id}/publish`, { method: 'POST' }),
    hide: (id: string) => request<Material>(`/materials/${id}/hide`, { method: 'POST' }),
    remove: (id: string) => request<void>(`/materials/${id}`, { method: 'DELETE' }),
    restore: (id: string) =>
      request<Material>(`/materials/${id}/restore`, { method: 'POST' }),
    file: (id: string) => requestBlob(`/materials/${id}/file`),
    download: (id: string) => requestBlob(`/materials/${id}/download`),
  },
  users: {
    list: () => request<{ items: User[] }>('/users'),
    create: (input: { email: string; password: string; role: Role }) =>
      request<User>('/users', { method: 'POST', body: input }),
    updateRole: (id: string, role: Role) =>
      request<User>(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  },
};
