// FR-006/FR-007/FR-009/FR-010 / UC-003/UC-005 [Controller] — lectura y
// busqueda. Normaliza paginacion (defaults 1/10, max 50, UC-005); filtros
// al puerto (Protected Variations -> Strategy en adapter, ADR-0002).
import { DomainError } from './errors';
import type { MaterialRepository, MaterialFilters, Page } from './ports';
import type { Material } from '../entities/material.entity';

const MAX_LIMIT = 50;
const MIN_YEAR = 1000;

export class SearchCatalogUseCase {
  constructor(private readonly materials: MaterialRepository) {}

  async execute(query: Partial<MaterialFilters> & { page?: number; limit?: number }): Promise<Page<Material>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    if (!Number.isInteger(page) || page < 1) throw new DomainError('BAD_REQUEST', 'page >= 1');
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new DomainError('BAD_REQUEST', `limit 1..${MAX_LIMIT}`);
    }
    const currentYear = new Date().getFullYear();
    for (const y of [query.year, query.yearFrom, query.yearTo]) {
      if (y !== undefined && (!Number.isInteger(y) || y < MIN_YEAR || y > currentYear)) {
        throw new DomainError('BAD_REQUEST', `year ${MIN_YEAR}..${currentYear}`);
      }
    }
    if (query.yearFrom !== undefined && query.yearTo !== undefined && query.yearFrom > query.yearTo) {
      throw new DomainError('BAD_REQUEST', 'yearFrom <= yearTo');
    }
    const { page: _page, limit: _limit, ...filters } = query;
    void _page;
    void _limit;
    return this.materials.search(filters, page, limit);
  }

  async getById(materialId: number): Promise<Material> {
    const found = await this.materials.findById(materialId);
    if (!found) throw new DomainError('NOT_FOUND', 'material inexistente');
    return found;
  }
}
