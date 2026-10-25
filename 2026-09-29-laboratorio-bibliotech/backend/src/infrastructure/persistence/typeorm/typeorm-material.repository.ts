import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Material } from '../../../model/entities/material.entity';
import { Visibility } from '../../../model/entities/enums';
import type {
  MaterialFilter,
  MaterialPage,
  MaterialRepository,
} from '../../../model/repositories/material.repository';
import { toFileBlobOrm, toMaterialDomain, toMaterialOrm } from './mappers';
import { FileBlobOrm, MaterialOrm, UserOrm } from './orm-entities';

@Injectable()
export class TypeOrmMaterialRepository implements MaterialRepository {
  constructor(
    @InjectRepository(MaterialOrm)
    private readonly repo: Repository<MaterialOrm>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, options?: { withDeleted?: boolean }): Promise<Material | null> {
    const qb = this.baseQuery().where('material.id = :id', { id });
    if (!options?.withDeleted) {
      qb.andWhere('material.deleted_at IS NULL');
    }
    const orm = await qb.getOne();
    return orm ? toMaterialDomain(orm) : null;
  }

  async save(material: Material): Promise<Material> {
    await this.dataSource.transaction(async (manager) => {
      if (material.file) {
        await manager.save(FileBlobOrm, toFileBlobOrm(material.file));
      }
      await manager.save(MaterialOrm, toMaterialOrm(material));
    });

    const saved = await this.findById(material.id, { withDeleted: true });
    return saved ?? material;
  }

  async deleteFileBlob(id: string): Promise<void> {
    await this.repo.manager.delete(FileBlobOrm, id);
  }

  async listCatalog(filter: MaterialFilter): Promise<MaterialPage> {
    const qb = this.baseQuery()
      .where('material.visibility = :visibility', { visibility: Visibility.PUBLICO })
      .andWhere('material.deleted_at IS NULL');

    if (filter.q?.trim()) {
      qb.andWhere('(LOWER(material.title) LIKE :q OR LOWER(material.author) LIKE :q)', {
        q: `%${filter.q.trim().toLowerCase()}%`,
      });
    }
    if (filter.subject?.trim()) {
      qb.andWhere('LOWER(material.subject) LIKE :subject', {
        subject: `%${filter.subject.trim().toLowerCase()}%`,
      });
    }
    if (filter.year) {
      qb.andWhere('material.publication_year = :year', { year: filter.year });
    }

    qb.orderBy('material.published_at', 'DESC')
      .addOrderBy('material.created_at', 'DESC')
      .offset((filter.page - 1) * filter.limit)
      .limit(filter.limit);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(toMaterialDomain), total, page: filter.page, limit: filter.limit };
  }

  async listByOwner(ownerId: string): Promise<Material[]> {
    const rows = await this.baseQuery()
      .where('material.owner_id = :ownerId', { ownerId })
      .andWhere('material.deleted_at IS NULL')
      .orderBy('material.updated_at', 'DESC')
      .getMany();
    return rows.map(toMaterialDomain);
  }

  async listAll(options: {
    includeDeleted: boolean;
    page: number;
    limit: number;
  }): Promise<MaterialPage> {
    const qb = this.baseQuery();
    if (!options.includeDeleted) {
      qb.where('material.deleted_at IS NULL');
    }

    qb.orderBy('material.created_at', 'DESC')
      .offset((options.page - 1) * options.limit)
      .limit(options.limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map(toMaterialDomain),
      total,
      page: options.page,
      limit: options.limit,
    };
  }

  private baseQuery(): SelectQueryBuilder<MaterialOrm> {
    return this.repo
      .createQueryBuilder('material')
      .leftJoinAndMapOne('material.owner', UserOrm, 'owner', 'owner.id = material.owner_id')
      .leftJoinAndMapOne('material.file', FileBlobOrm, 'file', 'file.id = material.file_blob_id');
  }
}
