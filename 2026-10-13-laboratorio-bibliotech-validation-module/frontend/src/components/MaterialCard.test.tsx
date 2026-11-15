import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Material } from '../api/types';
import { MaterialCard } from './MaterialCard';

const base: Material = {
  id: 'm1',
  title: 'Introducción a los sistemas',
  author: 'Ana Gómez',
  description: 'Conceptos fundamentales.',
  subject: 'Análisis de Sistemas',
  year: 2024,
  ownerId: 'u1',
  ownerEmail: 'ana@bibliotech.local',
  visibility: 'PUBLICO',
  isDraft: false,
  publishedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  file: {
    id: 'f1',
    originalName: 'apunte.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('MaterialCard', () => {
  it('renders metadata and triggers actions', async () => {
    const onRead = vi.fn();
    const onDownload = vi.fn();
    render(
      <MaterialCard material={base} showOwner onRead={onRead} onDownload={onDownload} />,
    );

    expect(screen.getByText(base.title as string)).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Público')).toBeInTheDocument();
    expect(screen.getByText(base.ownerEmail as string)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Leer material' }));
    await userEvent.click(screen.getByRole('button', { name: 'Descargar' }));
    expect(onRead).toHaveBeenCalledOnce();
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('disables reading when there is no file and shows fallbacks', () => {
    render(
      <MaterialCard
        material={{
          ...base,
          title: null,
          author: null,
          description: null,
          subject: null,
          year: null,
          file: null,
          isDraft: true,
          publishedAt: null,
          visibility: 'OCULTO',
        }}
        onRead={vi.fn()}
      />,
    );

    expect(screen.getByText('Sin título')).toBeInTheDocument();
    expect(screen.getByText('Sin archivo')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leer material' })).toBeDisabled();
  });
});
