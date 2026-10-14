import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getRole } from './api';

export function useAuth() {
  const nav = useNavigate();
  const login = async (email: string, password: string) => {
    const out = await api<{ token: string; role: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('bibliotech_token', out.token);
    localStorage.setItem('bibliotech_role', out.role);
    nav('/');
  };
  const logout = () => {
    localStorage.removeItem('bibliotech_token');
    localStorage.removeItem('bibliotech_role');
    nav('/login');
  };
  return { login, logout, role: getRole() };
}

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  return (
    <main>
      <h1>BiblioTech — login (UC-001)</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password).catch((e2: Error) => setErr(e2.message));
        }}
      >
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password ≥ 8" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
      {err && <p role="alert">{err}</p>}
      <p>
        ¿Sin cuenta? <Link to="/register">Registro Student</Link>
      </p>
    </main>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  return (
    <main>
      <h1>BiblioTech — registro (UC-001)</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          api<{ token: string; role: string }>('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
            .then((out) => {
              localStorage.setItem('bibliotech_token', out.token);
              localStorage.setItem('bibliotech_role', out.role);
              nav('/');
            })
            .catch((e2: Error) => setErr(e2.message));
        }}
      >
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password ≥ 8" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Registrarme</button>
      </form>
      {err && <p role="alert">{err}</p>}
    </main>
  );
}
