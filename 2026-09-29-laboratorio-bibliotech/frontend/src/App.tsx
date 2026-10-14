import React from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import { LoginPage, RegisterPage, useAuth } from './auth';
import { CatalogPage, DetailPage } from './catalog';
import { UploadPage, AdminPage } from './admin';
import { getToken, getRole } from './api';

function DetailRoute() {
  const { id } = useParams();
  return <DetailPage id={Number(id)} />;
}

function Guard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  if (!getToken()) return <Navigate to="/login" />;
  if (roles && !roles.includes(getRole() ?? '')) return <p role="alert">403: rol insuficiente</p>;
  return children;
}

function Nav() {
  const { logout, role } = useAuth();
  if (!getToken()) return null;
  return (
    <nav>
      <Link to="/">Catálogo</Link> | <Link to="/upload">Subir</Link> |<Link to="/admin">Admin</Link> | {role}{' '}
      <button onClick={logout}>Salir</button>
    </nav>
  );
}

export function App() {
  return (
    <HashRouter>
      <Nav />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <Guard>
              <CatalogPage />
            </Guard>
          }
        />
        <Route
          path="/material/:id"
          element={
            <Guard>
              <DetailRoute />
            </Guard>
          }
        />
        <Route
          path="/upload"
          element={
            <Guard roles={['Professor', 'Admin']}>
              <UploadPage />
            </Guard>
          }
        />
        <Route
          path="/admin"
          element={
            <Guard roles={['Admin']}>
              <AdminPage />
            </Guard>
          }
        />
      </Routes>
    </HashRouter>
  );
}
