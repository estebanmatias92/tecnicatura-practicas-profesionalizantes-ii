import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { initials, roleLabel } from '../lib/format';

function navClass({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? ' nav-link-active' : ''}`;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand" aria-label="BiblioTech, ir al catálogo">
            <span className="brand-mark" aria-hidden="true">
              B
            </span>
            <span>
              <strong>BiblioTech</strong>
              <small>Biblioteca digital</small>
            </span>
          </NavLink>

          <nav className="main-nav" aria-label="Navegación principal">
            <NavLink to="/" end className={navClass}>
              Catálogo
            </NavLink>
            {(user?.role === 'PROFESSOR' || user?.role === 'ADMIN') && (
              <NavLink to="/mine" className={navClass}>
                Mis materiales
              </NavLink>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <NavLink to="/admin/materials" className={navClass}>
                  Papelera
                </NavLink>
                <NavLink to="/admin/users" className={navClass}>
                  Usuarios
                </NavLink>
              </>
            )}
          </nav>

          <div className="account">
            {user ? (
              <>
                <span className="avatar" aria-hidden="true">
                  {initials(user.email)}
                </span>
                <span className="account-text">
                  <strong>{user.email}</strong>
                  <small>{roleLabel(user.role)}</small>
                </span>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="button button-ghost button-small">
                  Ingresar
                </NavLink>
                <NavLink to="/register" className="button button-primary button-small">
                  Crear cuenta
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>BiblioTech · Prácticas Profesionalizantes II</span>
        <span>Materiales académicos, accesibles y ordenados.</span>
      </footer>
    </div>
  );
}
