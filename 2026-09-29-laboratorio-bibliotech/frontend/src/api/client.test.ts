import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, clearToken, getToken, setToken } from './client';

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

function blobResponse(blob: Blob, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    blob: async () => blob,
    json: async () => ({}),
  } as Response;
}

describe('api client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it('stores and clears the token', () => {
    expect(getToken()).toBeNull();
    setToken('abc');
    expect(getToken()).toBe('abc');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('logs in with JSON and returns the session', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ accessToken: 'token', user: { id: '1', email: 'a@b.c' } }),
    );

    const result = await api.auth.login('a@b.c', 'secret123');

    expect(result.accessToken).toBe('token');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(options.method).toBe('POST');
    expect(options.headers.get('Content-Type')).toBe('application/json');
    expect(options.body).toBe(JSON.stringify({ email: 'a@b.c', password: 'secret123' }));
  });

  it('sends the bearer token on authenticated requests', async () => {
    setToken('jwt');
    fetchMock.mockResolvedValue(jsonResponse({ id: '1', email: 'a@b.c', role: 'STUDENT' }));

    await api.auth.me();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('builds catalog query strings and omits empty values', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 12 }));

    await api.materials.catalog({ q: 'sistemas', year: 2026, page: 2, subject: '' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/materials?q=sistemas&year=2026&page=2');
  });

  it('uploads files as multipart form data', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'm1' }));
    const file = new File(['contenido'], 'apunte.pdf', { type: 'application/pdf' });

    await api.materials.upload('m1', file);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get('file')).toBe(file);
    expect(options.headers.has('Content-Type')).toBe(false);
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 204));

    await expect(api.materials.remove('m1')).resolves.toBeUndefined();
  });

  it('maps API errors and joins validation messages', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ statusCode: 400, message: ['email inválido', 'password corta'], error: 'VALIDATION' }, 400),
    );

    await expect(api.auth.login('x', 'y')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION',
      message: 'email inválido. password corta',
    });
  });

  it('falls back to a generic message for unknown errors', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('sin json');
      },
    } as unknown as Response);

    await expect(api.auth.me()).rejects.toThrow('Ocurrió un error inesperado');
  });

  it('downloads files as blobs and surfaces errors', async () => {
    const blob = new Blob(['pdf']);
    fetchMock.mockResolvedValueOnce(blobResponse(blob));
    await expect(api.materials.download('m1')).resolves.toBe(blob);

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'No encontrado' }, 404));
    await expect(api.materials.file('m2')).rejects.toBeInstanceOf(ApiError);
  });
});
