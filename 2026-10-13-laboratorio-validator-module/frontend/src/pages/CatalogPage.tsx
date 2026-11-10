import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Material, Page } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { MaterialCard } from '../components/MaterialCard';
import { Pagination } from '../components/Pagination';
import { ReaderModal } from '../components/ReaderModal';

interface Filters {
  q: string;
  subject: string;
  year: string;
}

const LIMIT = 12;

export function CatalogPage() {
  const [filters, setFilters] = useState<Filters>({ q: '', subject: '', year: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Material> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<Material | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      api.materials
        .catalog({
          q: filters.q || undefined,
          subject: filters.subject || undefined,
          year: filters.year ? Number(filters.year) : undefined,
          page,
          limit: LIMIT,
        })
        .then((result) => {
          if (active) setData(result);
        })
        .catch((cause) => {
          if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, page]);

  function updateFilter(key: keyof Filters, value: string): void {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
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
      <section className="hero">
        <div>
          <p className="eyebrow">Biblioteca digital</p>
          <h1>Materiales para aprender, ordenados para encontrar.</h1>
          <p className="hero-text">
            Explorá publicaciones de profesores y estudiantes. Leé en el visor o descargá el
            archivo original.
          </p>
        </div>
        <div className="hero-stat">
          <strong>{data?.total ?? 0}</strong>
          <span>materiales públicos</span>
        </div>
      </section>

      <section className="filters" aria-label="Filtros del catálogo">
        <label>
          Buscar
          <input
            type="search"
            value={filters.q}
            onChange={(event) => updateFilter('q', event.target.value)}
            placeholder="Título o autor"
          />
        </label>
        <label>
          Materia
          <input
            value={filters.subject}
            onChange={(event) => updateFilter('subject', event.target.value)}
            placeholder="Ej. Bases de Datos"
          />
        </label>
        <label>
          Año
          <input
            type="number"
            min={1000}
            max={2100}
            value={filters.year}
            onChange={(event) => updateFilter('year', event.target.value)}
            placeholder="2026"
          />
        </label>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && !data ? (
        <div className="page-loading">Cargando catálogo…</div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="material-grid">
            {data.items.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                showOwner
                onRead={() => setReading(material)}
                onDownload={() => void download(material)}
              />
            ))}
          </div>
          <Pagination page={page} limit={LIMIT} total={data.total} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="No hay materiales para mostrar"
          description="Probá con otros filtros o volvé más tarde."
        />
      )}

      {reading && <ReaderModal material={reading} onClose={() => setReading(null)} />}
    </div>
  );
}
