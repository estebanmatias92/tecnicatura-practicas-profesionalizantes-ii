import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, buildCatalogQuery, type Material, type Page } from './api';

export function CatalogPage() {
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Material> | null>(null);
  const [err, setErr] = useState('');

  const load = (p: number) => {
    api<Page<Material>>(`/material${buildCatalogQuery({ q, author, subject, page: p, limit: 10 })}`)
      .then((d) => {
        setData(d);
        setPage(d.page);
        setErr('');
      })
      .catch((e: Error) => setErr(e.message));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <h1>Catálogo (UC-003/UC-005)</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
      >
        <input placeholder="q: título/autor/subject" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input placeholder="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <button type="submit">Buscar</button>
      </form>
      {err && <p role="alert">{err}</p>}
      {data && (
        <>
          <p>
            {data.total} resultado(s) — pág. {data.page}
          </p>
          <ul>
            {data.items.map((m) => (
              <li key={m.id}>
                <Link to={`/material/${m.id}`}>
                  {m.title} — {m.author}
                </Link>{' '}
                {m.year ? `(${m.year})` : ''}
              </li>
            ))}
          </ul>
          <button disabled={page <= 1} onClick={() => load(page - 1)}>
            ←
          </button>
          <button disabled={!data || page * data.limit >= data.total} onClick={() => load(page + 1)}>
            →
          </button>
        </>
      )}
    </main>
  );
}

export function DetailPage({ id }: { id: number }) {
  const [m, setM] = useState<Material | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api<Material>(`/material/${id}`)
      .then(setM)
      .catch((e: Error) => setErr(e.message));
  }, [id]);
  const download = async () => {
    // UC-006 exige JWT: se descarga via fetch con Bearer (un <a> no envia el header).
    const res = await fetch(`/material/${id}/file`, { headers: { Authorization: `Bearer ${localStorage.getItem('bibliotech_token') ?? ''}` } });
    if (!res.ok) {
      setErr(`${res.status}: descarga fallida`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = m?.title ?? `material-${id}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (err) return <p role="alert">{err}</p>;
  if (!m) return <p>Cargando…</p>;
  return (
    <main>
      <h1>
        {m.title} (UC-003)
      </h1>
      <p>
        {m.author} {m.subject ? `· ${m.subject}` : ''} {m.year ? `· ${m.year}` : ''} {m.edition ? `· ed. ${m.edition}` : ''}
      </p>
      {m.tags && <p>tags: {m.tags.join(', ')}</p>}
      <button onClick={download}>Descargar original (UC-006)</button>
    </main>
  );
}
