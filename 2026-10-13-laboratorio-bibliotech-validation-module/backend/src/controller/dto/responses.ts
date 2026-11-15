import type { FileBlob } from '../../model/entities/file-blob.entity';
import type { Material } from '../../model/entities/material.entity';
import type { User } from '../../model/entities/user.entity';
import type { MaterialPage } from '../../model/repositories/material.repository';
import type { AuthResult } from '../../model/services/auth.service';

export function toUserResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function toFileResponse(file: FileBlob) {
  return {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  };
}

export function toMaterialResponse(material: Material) {
  return {
    id: material.id,
    title: material.title,
    author: material.author,
    description: material.description,
    subject: material.subject,
    year: material.year,
    ownerId: material.ownerId,
    ownerEmail: material.ownerEmail,
    visibility: material.visibility,
    isDraft: material.isDraft(),
    publishedAt: material.publishedAt,
    deletedAt: material.deletedAt,
    file: material.file ? toFileResponse(material.file) : null,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

export function toMaterialPageResponse(page: MaterialPage) {
  return {
    items: page.items.map(toMaterialResponse),
    total: page.total,
    page: page.page,
    limit: page.limit,
  };
}

export function toAuthResponse(result: AuthResult) {
  return {
    accessToken: result.accessToken,
    user: toUserResponse(result.user),
  };
}
