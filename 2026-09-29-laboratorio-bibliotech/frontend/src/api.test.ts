import { describe, it, expect } from 'vitest';
import { buildCatalogQuery } from './api';

describe('buildCatalogQuery (UC-005)', () => {
  it('arma q + filtros AND + paginacion', () => {
    const qs = buildCatalogQuery({ q: 'redes', tag: 'ospf', page: 2, limit: 10 });
    expect(qs).toContain('q=redes');
    expect(qs).toContain('tag=ospf');
    expect(qs).toContain('page=2');
    expect(qs).toContain('limit=10');
  });

  it('omite vacios (q vacio no es error, UC-005)', () => {
    expect(buildCatalogQuery({ q: '' })).toBe('');
    expect(buildCatalogQuery({})).toBe('');
  });
});
