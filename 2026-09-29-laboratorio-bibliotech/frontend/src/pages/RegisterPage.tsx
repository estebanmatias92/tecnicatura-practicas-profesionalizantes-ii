import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Sumate a la biblioteca</p>
        <h1>Crear cuenta</h1>
        <p className="muted">
          Las cuentas nuevas se crean como <strong>Student</strong>. Un Admin puede cambiar tu rol.
        </p>

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
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <button type="submit" className="button button-primary" disabled={sending}>
            {sending ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </p>
      </section>
    </div>
  );
}
