// UC-002/003/005/006 + UC-004 material [Controller-Adapter] — delegacion
// total a usecases. Multer FileInterceptor con filtro MIME + limite 50MB
// (NFR-005 en el borde; el usecase re-valida antes de persistir).
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  HttpCode,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { UploadMaterialUseCase } from '../../usecases/upload-material.usecase';
import { SearchCatalogUseCase } from '../../usecases/search-catalog.usecase';
import { ManageMaterialUseCase } from '../../usecases/manage-material.usecase';
import { DownloadFileUseCase } from '../../usecases/download-file.usecase';
import { Role } from '../../entities/role';
import { DomainError } from '../../usecases/errors';
import { toHttp } from './domain-error.mapper';
import { RequireRoles, type AuthenticatedRequest } from './guards';
import { UploadMetaDto, UpdateMaterialDto } from './dtos';

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'application/epub+zip'];

function callerOf(req: AuthenticatedRequest): { callerId: number; callerRole: Role } {
  if (!req.user) throw new DomainError('UNAUTHORIZED', 'sin JWT');
  return { callerId: req.user.userId, callerRole: req.user.role };
}

@Controller('material')
export class MaterialsController {
  constructor(
    private readonly upload: UploadMaterialUseCase,
    private readonly search: SearchCatalogUseCase,
    private readonly manage: ManageMaterialUseCase,
    private readonly download: DownloadFileUseCase,
  ) {}

  @Get()
  async catalog(@Query() q: Record<string, string | string[]>): Promise<unknown> {
    try {
      const num = (v: unknown): number | undefined => {
        if (v === undefined) return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
      };
      const tags = q['tag'] === undefined ? undefined : Array.isArray(q['tag']) ? q['tag'] : [q['tag']];
      const out = await this.search.execute({
        q: q['q'] as string | undefined,
        author: q['author'] as string | undefined,
        subject: q['subject'] as string | undefined,
        year: num(q['year']),
        yearFrom: num(q['yearFrom']),
        yearTo: num(q['yearTo']),
        edition: q['edition'] as string | undefined,
        tags: tags as string[] | undefined,
        page: num(q['page']),
        limit: num(q['limit']),
      });
      return { items: out.items.map((m) => m.toPublic()), total: out.total, page: out.page, limit: out.limit };
    } catch (e) {
      toHttp(e);
    }
  }

  @Post()
  @RequireRoles(Role.Professor, Role.Admin)
  // memoryStorage: Multer solo transporta (<=50MB); la persistencia es del
  // puerto FileStorage (DiskFileStorage) via el usecase (Dependency Rule).
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        // HttpException (no DomainError): Multer/Nest la respeta tal cual -> 415.
        if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
        else cb(new UnsupportedMediaTypeException('MIME permitido: PDF/EPUB (NFR-005)'), false);
      },
    }),
  )
  async uploadMaterial(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() meta: UploadMetaDto,
  ): Promise<unknown> {
    try {
      if (!file) throw new DomainError('BAD_REQUEST', 'file requerido (multipart file)');
      const caller = callerOf(req);
      return await this.upload.execute({
        callerId: caller.callerId,
        callerRole: caller.callerRole,
        file: { buffer: file.buffer, mime: file.mimetype, size: file.size, originalName: file.originalname },
        meta: { title: meta.title, author: meta.author, subject: meta.subject, year: meta.year, edition: meta.edition, tags: meta.tags },
      });
    } catch (e) {
      toHttp(e);
    }
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    try {
      return (await this.search.getById(id)).toPublic();
    } catch (e) {
      toHttp(e);
    }
  }

  @Patch(':id')
  async updateOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() patch: UpdateMaterialDto,
  ): Promise<unknown> {
    try {
      const caller = callerOf(req);
      return await this.manage.updateMaterial({ callerId: caller.callerId, callerRole: caller.callerRole, materialId: id, patch });
    } catch (e) {
      toHttp(e);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      const caller = callerOf(req);
      await this.manage.deleteMaterial({ callerId: caller.callerId, callerRole: caller.callerRole, materialId: id });
    } catch (e) {
      toHttp(e);
    }
  }

  @Get(':id/file')
  async downloadOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    try {
      const out = await this.download.execute({ materialId: id });
      res.setHeader('Content-Type', out.mime);
      res.setHeader('Content-Disposition', `inline; filename="${out.fileName}"`);
      (out.stream as NodeJS.ReadableStream).pipe(res);
    } catch (e) {
      toHttp(e);
    }
  }
}
