import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Material } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { MaterialCard } from '../components/MaterialCard';
import { MaterialFormModal } from '../components/MaterialFormModal';
import { ReaderModal } from '../components/ReaderModal';

export function MyMaterialsPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Material | null | undefined>(undefined);
  const [reading, setReading] = useState<Material | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.materials.mine();
      setItems(result.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus materiales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>): Promise<void> {
    setError(null);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la acción');
    }
  }

  async function remove(material: Material): Promise<void> {
    if (!window.confirm(`¿Eliminar “${material.title ?? 'Sin título'}”? Quedará en la papelera.`)) {
      return;
    }
    await run(() => api.materials.remove(material.id));
  }

  async function download(material: Material): Promise<void> {
    try {
      const blob = await api.materials.download(material.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file?.originalName ?? 'material';
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo descargar');
    }
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Área de autor</p>
          <h1>Mis materiales</h1>
          <p className="muted">
            Creá borradores, subí archivos y decidí cuándo publicar u ocultar cada material.
          </p>
        </div>
        <button type="button" className="button button-primary" onClick={() => setEditing(null)}>
          Nuevo material
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Cargando tus materiales…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Todavía no tenés materiales"
          description="Creá tu primer borrador y publicalo cuando esté listo."
          action={
            <button type="button" className="button button-primary" onClick={() => setEditing(null)}>
              Crear material
            </button>
          }
        />
      ) : (
        <div className="material-grid">
          {items.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              showOwner
              onRead={() => setReading(material)}
              onDownload={() => void download(material)}
              actions={
                <>
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => setEditing(material)}
                  >
                    Editar
                  </button>
                  {!material.isDraft && material.visibility === 'OCULTO' && (
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => void run(() => api.materials.publish(material.id))}
                    >
                      Publicar
                    </button>
                  )}
                  {material.visibility === 'PUBLICO' && (
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => void run(() => api.materials.hide(material.id))}
                    >
                      Ocultar
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button-danger button-small"
                    onClick={() => void remove(material)}
                  >
                    Eliminar
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <MaterialFormModal
          key={editing?.id ?? 'new'}
          material={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => void load()}
        />
      )}
      {reading && <ReaderModal material={reading} onClose={() => setReading(null)} />}
    </div>
  );
}
