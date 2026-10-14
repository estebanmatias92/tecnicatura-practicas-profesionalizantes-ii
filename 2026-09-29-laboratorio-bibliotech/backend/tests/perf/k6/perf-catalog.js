// NFR-001 — k6: catalogo y busqueda p95<200ms en lab.
// Uso: API_URL=http://localhost:3000 JWT=<token Student> k6 run backend/tests/perf/k6/perf-catalog.js
// Thresholds: p(95)<200 en ambas rutas + error<1%. Seed previo: 100 materiales.
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    'http_req_duration{route:catalog}': ['p(95)<200'],
    'http_req_duration{route:search}': ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.API_URL || 'http://localhost:3000';
const TOKEN = __ENV.JWT || '';

export default function () {
  const headers = { Authorization: `Bearer ${TOKEN}` };
  const cat = http.get(`${BASE}/material?page=1&limit=10`, { headers, tags: { route: 'catalog' } });
  check(cat, { 'catalogo 200': (r) => r.status === 200 });
  const search = http.get(`${BASE}/material?q=redes`, { headers, tags: { route: 'search' } });
  check(search, { 'busqueda 200': (r) => r.status === 200 });
}
