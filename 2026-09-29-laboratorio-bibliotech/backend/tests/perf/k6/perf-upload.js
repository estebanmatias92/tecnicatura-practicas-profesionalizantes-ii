// NFR-002 — k6: subida PDF 50MB completa en <60s (log inicio -> 201).
// Uso: API_URL=http://localhost:3000 JWT=<token Professor> FILE=/tmp/fixtures/big-50mb.pdf \
//      k6 run backend/tests/perf/k6/perf-upload.js
// Generar fixture: head -c 52428800 /dev/urandom > /tmp/fixtures/big-50mb.pdf
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: { 'http_req_duration{route:upload}': ['max<60000'] },
};

const BASE = __ENV.API_URL || 'http://localhost:3000';
const TOKEN = __ENV.JWT || '';
const FILE = __ENV.FILE || '/tmp/fixtures/big-50mb.pdf';

export default function () {
  const bin = open(FILE, 'b');
  const payload = { file: http.file(bin, 'big-50mb.pdf', 'application/pdf'), title: 'Perf 50MB', author: 'k6' };
  const res = http.post(`${BASE}/material`, payload, { headers: { Authorization: `Bearer ${TOKEN}` }, tags: { route: 'upload' } });
  check(res, { 'subida 201': (r) => r.status === 201, 'subida <60s': (r) => r.timings.duration < 60000 });
}
