export type Role = 'ADMIN' | 'PROFESSOR' | 'STUDENT';
export type Visibility = 'OCULTO' | 'PUBLICO';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Material {
  id: string;
  title: string | null;
  author: string | null;
  description: string | null;
  subject: string | null;
  year: number | null;
  ownerId: string;
  ownerEmail?: string;
  visibility: Visibility;
  isDraft: boolean;
  publishedAt: string | null;
  deletedAt: string | null;
  file: FileInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface MaterialInput {
  title?: string;
  author?: string;
  description?: string;
  subject?: string;
  year?: number;
}

export interface CatalogQuery {
  q?: string;
  subject?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface AdminMaterialsQuery {
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}
