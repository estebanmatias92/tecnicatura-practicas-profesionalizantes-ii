import { describe, expect, it } from 'vitest';
import {
  displayTitle,
  fileKind,
  formatBytes,
  formatDate,
  initials,
  isEpub,
  isPdf,
  materialStatus,
  roleLabel,
} from './format';

describe('format helpers', () => {
  it('formats dates and invalid values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
    expect(formatDate('2026-10-24T12:00:00.000Z')).toContain('2026');
  });

  it('formats bytes across units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('derives material status in priority order', () => {
    expect(
      materialStatus({ deletedAt: '2026-01-01', isDraft: true, visibility: 'PUBLICO' }),
    ).toEqual({ label: 'Eliminado', tone: 'danger' });
    expect(materialStatus({ deletedAt: null, isDraft: true, visibility: 'OCULTO' })).toEqual({
      label: 'Borrador',
      tone: 'neutral',
    });
    expect(materialStatus({ deletedAt: null, isDraft: false, visibility: 'PUBLICO' })).toEqual({
      label: 'Público',
      tone: 'success',
    });
    expect(materialStatus({ deletedAt: null, isDraft: false, visibility: 'OCULTO' })).toEqual({
      label: 'Oculto',
      tone: 'warning',
    });
  });

  it('normalizes titles, roles and files', () => {
    expect(displayTitle({ title: '  ' })).toBe('Sin título');
    expect(displayTitle({ title: 'Álgebra' })).toBe('Álgebra');
    expect(roleLabel('ADMIN')).toBe('Admin');
    expect(roleLabel('PROFESSOR')).toBe('Profesor');
    expect(roleLabel('STUDENT')).toBe('Estudiante');
    expect(fileKind('application/pdf')).toBe('PDF');
    expect(fileKind('application/epub+zip')).toBe('EPUB');
    expect(fileKind('text/plain')).toBe('Archivo');
    expect(isPdf('application/pdf')).toBe(true);
    expect(isEpub('application/epub+zip')).toBe(true);
    expect(initials('ana@bibliotech.local')).toBe('AN');
  });
});
