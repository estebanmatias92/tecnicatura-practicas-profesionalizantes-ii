import type { ReactNode } from 'react';
import type { Material } from '../api/types';
import { displayTitle, fileKind, formatDate } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface MaterialCardProps {
  material: Material;
  onRead?: () => void;
  onDownload?: () => void;
  actions?: ReactNode;
  showOwner?: boolean;
}

export function MaterialCard({
  material,
  onRead,
  onDownload,
  actions,
  showOwner = false,
}: MaterialCardProps) {
  const kind = material.file ? fileKind(material.file.mimeType) : null;

  return (
    <article className="material-card">
      <div className="material-card-top">
        <span className={`file-chip${kind ? ` file-chip-${kind.toLowerCase()}` : ''}`}>
          {kind ?? 'Sin archivo'}
        </span>
        <StatusBadge material={material} />
      </div>

      <h3>{displayTitle(material)}</h3>
      <p className="material-author">{material.author ?? 'Autor sin definir'}</p>

      <p className="material-description">
        {material.description ?? 'Sin descripción.'}
      </p>

      <dl className="material-meta">
        <div>
          <dt>Materia</dt>
          <dd>{material.subject ?? '—'}</dd>
        </div>
        <div>
          <dt>Año</dt>
          <dd>{material.year ?? '—'}</dd>
        </div>
        {showOwner && (
          <div>
            <dt>Propietario</dt>
            <dd>{material.ownerEmail ?? '—'}</dd>
          </div>
        )}
        <div>
          <dt>Publicado</dt>
          <dd>{formatDate(material.publishedAt)}</dd>
        </div>
      </dl>

      <div className="material-actions">
        {onRead && (
          <button
            type="button"
            className="button button-primary button-small"
            onClick={onRead}
            disabled={!material.file}
          >
            Leer material
          </button>
        )}
        {onDownload && (
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={onDownload}
            disabled={!material.file}
          >
            Descargar
          </button>
        )}
        {actions}
      </div>
    </article>
  );
}
