import type { Material } from '../entities/material.entity';

export interface MaterialFilter {
  q?: string;
  subject?: string;
  year?: number;
  page: number;
  limit: number;
}

export interface MaterialPage {
  items: Material[];
  total: number;
  page: number;
  limit: number;
}

export interface MaterialRepository {
  findById(id: string, options?: { withDeleted?: boolean }): Promise<Material | null>;
  save(material: Material): Promise<Material>;
  deleteFileBlob(id: string): Promise<void>;
  listCatalog(filter: MaterialFilter): Promise<MaterialPage>;
  listByOwner(ownerId: string): Promise<Material[]>;
  listAll(options: { includeDeleted: boolean; page: number; limit: number }): Promise<MaterialPage>;
}

export const MATERIAL_REPOSITORY = Symbol('MATERIAL_REPOSITORY');
