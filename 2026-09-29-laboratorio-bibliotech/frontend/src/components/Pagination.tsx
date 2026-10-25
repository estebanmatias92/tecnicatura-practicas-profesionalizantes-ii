interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="button button-ghost"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </button>
      <span>
        Página {page} de {pages} · {total} material{total === 1 ? '' : 'es'}
      </span>
      <button
        type="button"
        className="button button-ghost"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        Siguiente
      </button>
    </nav>
  );
}
