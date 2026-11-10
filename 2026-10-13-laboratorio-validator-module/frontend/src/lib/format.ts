import type { Material, Role } from '../api/types';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function displayTitle(material: Pick<Material, 'title'>): string {
  return material.title?.trim() || 'Sin título';
}

export function materialStatus(material: Pick<Material, 'deletedAt' | 'isDraft' | 'visibility'>): {
  label: string;
  tone: StatusTone;
} {
  if (material.deletedAt) return { label: 'Eliminado', tone: 'danger' };
  if (material.isDraft) return { label: 'Borrador', tone: 'neutral' };
  if (material.visibility === 'PUBLICO') return { label: 'Público', tone: 'success' };
  return { label: 'Oculto', tone: 'warning' };
}

export function roleLabel(role: Role): string {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'PROFESSOR') return 'Profesor';
  return 'Estudiante';
}

export function fileKind(mimeType: string | undefined): 'PDF' | 'EPUB' | 'Archivo' {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/epub+zip') return 'EPUB';
  return 'Archivo';
}

export function isPdf(mimeType: string | undefined): boolean {
  return mimeType === 'application/pdf';
}

export function isEpub(mimeType: string | undefined): boolean {
  return mimeType === 'application/epub+zip';
}

export function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
