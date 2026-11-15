import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Bienvenido de nuevo</p>
        <h1>Ingresar</h1>
        <p className="muted">Accedé para gestionar tus materiales y leer contenido oculto.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="persona@bibliotech.local"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Tu contraseña"
            />
          </label>
          <button type="submit" className="button button-primary" disabled={sending}>
            {sending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tenés cuenta? <Link to="/register">Creá una</Link>
        </p>
      </section>
    </div>
  );
}
