import { FileBlob } from '../../../model/entities/file-blob.entity';
import { Material } from '../../../model/entities/material.entity';
import { User } from '../../../model/entities/user.entity';
import { FileBlobOrm, MaterialOrm, UserOrm } from './orm-entities';

export function toUserDomain(orm: UserOrm): User {
  return User.rehydrate({
    id: orm.id,
    email: orm.email,
    passwordHash: orm.passwordHash,
    role: orm.role,
    tokenVersion: orm.tokenVersion,
    createdAt: orm.createdAt,
    updatedAt: orm.updatedAt,
  });
}

export function toUserOrm(user: User): UserOrm {
  const orm = new UserOrm();
  orm.id = user.id;
  orm.email = user.email;
  orm.passwordHash = user.passwordHash;
  orm.role = user.role;
  orm.tokenVersion = user.tokenVersion;
  orm.createdAt = user.createdAt;
  orm.updatedAt = user.updatedAt;
  return orm;
}

export function toFileBlobDomain(orm: FileBlobOrm): FileBlob {
  return FileBlob.rehydrate({
    id: orm.id,
    storageKey: orm.storageKey,
    originalName: orm.originalName,
    mimeType: orm.mimeType,
    sizeBytes: orm.sizeBytes,
    createdAt: orm.createdAt,
  });
}

export function toFileBlobOrm(file: FileBlob): FileBlobOrm {
  const orm = new FileBlobOrm();
  orm.id = file.id;
  orm.storageKey = file.storageKey;
  orm.originalName = file.originalName;
  orm.mimeType = file.mimeType;
  orm.sizeBytes = file.sizeBytes;
  orm.createdAt = file.createdAt;
  return orm;
}

export function toMaterialDomain(orm: MaterialOrm): Material {
  return Material.rehydrate({
    id: orm.id,
    title: orm.title,
    author: orm.author,
    description: orm.description,
    subject: orm.subject,
    year: orm.year,
    ownerId: orm.ownerId,
    ownerEmail: orm.owner?.email,
    file: orm.file ? toFileBlobDomain(orm.file) : null,
    visibility: orm.visibility,
    publishedAt: orm.publishedAt,
    deletedAt: orm.deletedAt,
    createdAt: orm.createdAt,
    updatedAt: orm.updatedAt,
  });
}

export function toMaterialOrm(material: Material): MaterialOrm {
  const orm = new MaterialOrm();
  orm.id = material.id;
  orm.title = material.title;
  orm.author = material.author;
  orm.description = material.description;
  orm.subject = material.subject;
  orm.year = material.year;
  orm.visibility = material.visibility;
  orm.publishedAt = material.publishedAt;
  orm.deletedAt = material.deletedAt;
  orm.createdAt = material.createdAt;
  orm.updatedAt = material.updatedAt;
  orm.ownerId = material.ownerId;
  orm.fileBlobId = material.file?.id ?? null;
  return orm;
}
