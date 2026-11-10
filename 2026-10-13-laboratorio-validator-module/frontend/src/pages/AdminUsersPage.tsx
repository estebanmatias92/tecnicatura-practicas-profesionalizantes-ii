import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Role, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../lib/format';

export function AdminUsersPage() {
  const { user: current } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.users.list();
      setUsers(result.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.users.create({ email, password, role });
      setEmail('');
      setPassword('');
      setRole('STUDENT');
      setNotice('Usuario creado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(target: User, nextRole: Role): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await api.users.updateRole(target.id, nextRole);
      setNotice(`Rol de ${target.email} actualizado.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el rol');
    }
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Usuarios</h1>
          <p className="muted">Creá cuentas y asigná roles. Los registros públicos siempre son Student.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <section className="panel">
        <h2>Crear usuario</h2>
        <form className="form form-inline" onSubmit={create}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="persona@bibliotech.local"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label>
            Rol
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="STUDENT">Estudiante</option>
              <option value="PROFESSOR">Profesor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Creando…' : 'Crear'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Cuentas</h2>
        {loading ? (
          <div className="page-loading">Cargando usuarios…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th>Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.email}
                      {item.id === current?.id && <span className="badge badge-neutral">Vos</span>}
                    </td>
                    <td>{roleLabel(item.role)}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString('es-AR')}</td>
                    <td>
                      <select
                        value={item.role}
                        onChange={(event) => void changeRole(item, event.target.value as Role)}
                        disabled={item.id === current?.id}
                        aria-label={`Rol de ${item.email}`}
                      >
                        <option value="STUDENT">Estudiante</option>
                        <option value="PROFESSOR">Profesor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
