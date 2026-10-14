// FR-006/FR-009/FR-010 / UC-003/UC-005 [Controller] — SearchCatalogUseCase.
// Normaliza paginacion (defaults 1/10, max 50) y delega filtros al puerto
// (Protected Variations -> Strategy en el adapter, ADR-0002). TDD Slice 3 (RED).
import { SearchCatalogUseCase } from './search-catalog.usecase';
import type { MaterialRepository } from './ports';

function setup() {
  const materials: MaterialRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    search: jest.fn().mockResolvedValue({ items: [{ id: 1 }], total: 1, page: 2, limit: 10 }),
    deleteWithBlob: jest.fn(),
  };
  return { uc: new SearchCatalogUseCase(materials), materials };
}

describe('SearchCatalogUseCase (FR-009/FR-010 / UC-005)', () => {
  it('pagina con envelope items/total/page/limit', async () => {
    const { uc } = setup();
    const out = await uc.execute({ page: 2, limit: 10 });
    expect(out).toEqual({ items: [{ id: 1 }], total: 1, page: 2, limit: 10 });
  });

  it('aplica defaults page=1 limit=10 cuando no vienen', async () => {
    const { uc, materials } = setup();
    await uc.execute({});
    expect(materials.search).toHaveBeenCalledWith({}, 1, 10);
  });

  it.each([{ page: 0 }, { limit: 0 }, { limit: 51 }, { yearFrom: 2020, yearTo: 2010 }])(
    'query invalida %p -> 400 y sin tocar el repositorio',
    async (q) => {
      const { uc, materials } = setup();
      await expect(uc.execute(q)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(materials.search).not.toHaveBeenCalled();
    },
  );

  it('UC-003: getById existente -> material; inexistente -> 404', async () => {
    const { uc, materials } = setup();
    (materials.findById as jest.Mock).mockResolvedValue({ id: 1 });
    expect(await uc.getById(1)).toEqual({ id: 1 });
    (materials.findById as jest.Mock).mockResolvedValue(null);
    await expect(uc.getById(999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
