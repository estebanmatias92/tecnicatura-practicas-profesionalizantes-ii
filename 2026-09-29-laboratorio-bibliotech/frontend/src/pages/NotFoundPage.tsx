import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        404
      </div>
      <h1>Página no encontrada</h1>
      <p>La ruta que buscás no existe.</p>
      <Link to="/" className="button button-primary">
        Volver al catálogo
      </Link>
    </div>
  );
}
