import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../model/entities/enums';
import type { User } from '../model/entities/user.entity';
import { ValidationError } from '../model/errors';
import { MaterialService } from '../model/services/material.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { MaterialInputDto } from './dto/material.dto';
import { AdminMaterialsQueryDto, CatalogQueryDto } from './dto/query.dto';
import {
  toMaterialPageResponse,
  toMaterialResponse,
} from './dto/responses';

function contentDisposition(kind: 'inline' | 'attachment', fileName: string): string {
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${kind}; filename*=UTF-8''${encoded}`;
}

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialService) {}

  @Get()
  async catalog(@Query() query: CatalogQueryDto) {
    return toMaterialPageResponse(await this.materials.listCatalog(query));
  }

  @Get('mine')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async mine(@CurrentUser() user: User) {
    const items = await this.materials.listMine(user);
    return { items: items.map(toMaterialResponse) };
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  async adminList(@Query() query: AdminMaterialsQueryDto) {
    return toMaterialPageResponse(
      await this.materials.listAdmin(query.includeDeleted, query.page, query.limit),
    );
  }

  @Get(':id')
  async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return toMaterialResponse(await this.materials.getForRead(id, user));
  }

  @Get(':id/file')
  async readFile(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.stream(id, user, 'inline');
  }

  @Get(':id/download')
  async downloadFile(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.stream(id, user, 'attachment');
  }

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async create(@Body() dto: MaterialInputDto, @CurrentUser() user: User) {
    return toMaterialResponse(await this.materials.createDraft(dto, user));
  }

  @Patch(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MaterialInputDto,
    @CurrentUser() user: User,
  ) {
    return toMaterialResponse(await this.materials.update(id, dto, user));
  }

  @Post(':id/file')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new ValidationError('Adjuntá un archivo');
    }
    const material = await this.materials.attachFile(
      id,
      {
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        buffer: file.buffer,
      },
      user,
    );
    return toMaterialResponse(material);
  }

  @Post(':id/publish')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return toMaterialResponse(await this.materials.publish(id, user));
  }

  @Post(':id/hide')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async hide(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return toMaterialResponse(await this.materials.hide(id, user));
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  async restore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return toMaterialResponse(await this.materials.restore(id, user));
  }

  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<void> {
    await this.materials.softDelete(id, user);
  }

  private async stream(
    id: string,
    user: User,
    kind: 'inline' | 'attachment',
  ): Promise<StreamableFile> {
    const file = await this.materials.getFile(id, user);
    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      disposition: contentDisposition(kind, file.fileName),
    });
  }
}
