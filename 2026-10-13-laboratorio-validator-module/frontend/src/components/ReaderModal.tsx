import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { Material } from '../api/types';
import { displayTitle, isEpub, isPdf } from '../lib/format';
import { Modal } from './Modal';

interface ReaderModalProps {
  material: Material;
  onClose: () => void;
}

type EpubBook = ReturnType<typeof import('epubjs').default>;
type Rendition = ReturnType<EpubBook['renderTo']>;

export function ReaderModal({ material, onClose }: ReaderModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const epubRef = useRef<HTMLDivElement>(null);

  const mimeType = material.file?.mimeType;
  const epub = isEpub(mimeType);
  const pdf = isPdf(mimeType);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    let book: EpubBook | null = null;
    let rendition: Rendition | null = null;

    setLoading(true);
    setError(null);
    setUrl(null);

    void (async () => {
      try {
        const blob = await api.materials.file(material.id);
        if (!active) return;

        if (epub && epubRef.current) {
          const ePub = (await import('epubjs')).default;
          if (!active) return;
          book = ePub();
          await book.open(await blob.arrayBuffer(), 'binary');
          rendition = book.renderTo(epubRef.current, { width: '100%', height: '100%' });
          await rendition.display();
        } else {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'No se pudo abrir el archivo');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      rendition?.destroy();
      book?.destroy();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material.id, epub]);

  async function download(): Promise<void> {
    try {
      const blob = await api.materials.download(material.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = material.file?.originalName ?? 'material';
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo descargar el archivo');
    }
  }

  return (
    <Modal title={displayTitle(material)} onClose={onClose} wide>
      <div className="reader-toolbar">
        <span className="muted">
          {material.file?.originalName ?? 'Sin archivo'} · {material.file?.mimeType ?? '—'}
        </span>
        <button type="button" className="button button-ghost button-small" onClick={download}>
          Descargar
        </button>
      </div>

      {loading && <div className="reader-status">Abriendo material…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!material.file && <div className="reader-status">Este material no tiene archivo.</div>}

      {url && pdf && (
        <iframe className="reader-pdf" title={displayTitle(material)} src={url} />
      )}
      {epub && <div ref={epubRef} className="reader-epub" />}
      {url && !pdf && !epub && (
        <div className="reader-status">
          Este formato no se puede previsualizar. Usá “Descargar”.
        </div>
      )}
    </Modal>
  );
}
