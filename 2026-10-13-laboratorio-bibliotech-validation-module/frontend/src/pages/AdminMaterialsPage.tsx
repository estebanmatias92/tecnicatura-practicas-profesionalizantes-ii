import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Material, Page } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { ReaderModal } from '../components/ReaderModal';
import { StatusBadge } from '../components/StatusBadge';
import { displayTitle, fileKind, formatDate } from '../lib/format';

const LIMIT = 20;

export function AdminMaterialsPage() {
  const [includeDeleted, setIncludeDeleted] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Material> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reading, setReading] = useState<Material | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.materials.adminList({ includeDeleted, page, limit: LIMIT });
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los materiales');
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(message);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la acción');
    }
  }

  async function remove(material: Material): Promise<void> {
    if (!window.confirm(`¿Eliminar “${displayTitle(material)}”?`)) return;
    await run(() => api.materials.remove(material.id), 'Material enviado a la papelera.');
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Papelera y publicaciones</h1>
          <p className="muted">
            Revisá todos los materiales, incluidos los eliminados, y restaurá lo que haga falta.
          </p>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(event) => {
              setIncludeDeleted(event.target.checked);
              setPage(1);
            }}
          />
          Incluir eliminados
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading && !data ? (
        <div className="page-loading">Cargando materiales…</div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Estado</th>
                  <th>Propietario</th>
                  <th>Archivo</th>
                  <th>Publicado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <strong>{displayTitle(material)}</strong>
                      <small className="table-sub">
                        {material.subject ?? 'Sin materia'} · {material.year ?? '—'}
                      </small>
                    </td>
                    <td>
                      <StatusBadge material={material} />
                    </td>
                    <td>{material.ownerEmail ?? '—'}</td>
                    <td>{material.file ? fileKind(material.file.mimeType) : '—'}</td>
                    <td>{formatDate(material.publishedAt)}</td>
                    <td>
                      <div className="table-actions">
                        {material.file && (
                          <button
                            type="button"
                            className="button button-ghost button-small"
                            onClick={() => setReading(material)}
                          >
                            Leer
                          </button>
                        )}
                        {material.deletedAt ? (
                          <button
                            type="button"
                            className="button button-primary button-small"
                            onClick={() =>
                              void run(
                                () => api.materials.restore(material.id),
                                'Material restaurado.',
                              )
                            }
                          >
                            Restaurar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button button-danger button-small"
                            onClick={() => void remove(material)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={LIMIT} total={data.total} onChange={setPage} />
        </>
      ) : (
        <EmptyState title="No hay materiales" description="La papelera está vacía." />
      )}

      {reading && <ReaderModal material={reading} onClose={() => setReading(null)} />}
    </div>
  );
}
