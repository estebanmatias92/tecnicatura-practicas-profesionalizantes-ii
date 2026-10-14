import React, { useEffect, useState } from 'react';
import { api, getToken } from './api';

export function UploadPage() {
  const [msg, setMsg] = useState('');
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const out = await api<{ id: number }>('/material', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() ?? ''}` },
        body: fd,
      });
      setMsg(`Subido con id ${out.id} (UC-002 → 201)`);
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'error');
    }
  };
  return (
    <main>
      <h1>Subir material (UC-002, Professor/Admin)</h1>
      <form onSubmit={onSubmit}>
        <input name="file" type="file" accept="application/pdf,.epub" required />
        <input name="title" placeholder="título *" required maxLength={200} />
        <input name="author" placeholder="autor *" required maxLength={120} />
        <input name="subject" placeholder="subject" maxLength={120} />
        <input name="year" placeholder="año" type="number" />
        <input name="edition" placeholder="edición" maxLength={40} />
        <input name="tags" placeholder="tags separados por coma" />
        <button type="submit">Subir (PDF/EPUB ≤ 50MB)</button>
      </form>
      {msg && <p>{msg}</p>}
    </main>
  );
}

export function AdminPage() {
  const [users, setUsers] = useState<{ id: number; email: string; role: string }[]>([]);
  const [msg, setMsg] = useState('');
  const load = () => {
    api<{ id: number; email: string; role: string }[]>('/users')
      .then(setUsers)
      .catch((e: Error) => setMsg(e.message));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const changeRole = (id: number, role: string) => {
    api(`/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
      .then(load)
      .catch((e: Error) => setMsg(e.message));
  };
  const remove = (id: number) => {
    if (!window.confirm(`Borrar usuario ${id} en cascada (C-2)?`)) return;
    api(`/users/${id}`, { method: 'DELETE' })
      .then(load)
      .catch((e: Error) => setMsg(e.message));
  };
  return (
    <main>
      <h1>Admin — usuarios (UC-004)</h1>
      <button onClick={load}>Recargar</button>
      {msg && <p role="alert">{msg}</p>}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.email} ({u.role}){' '}
            <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
              <option>Admin</option>
              <option>Professor</option>
              <option>Student</option>
            </select>{' '}
            <button onClick={() => remove(u.id)}>Borrar + cascada</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
