# Test Plan — BiblioTech

> Perfil RUP iterativo (`docs/agents/workflow.md`): plan por iteración, automatización incremental.
> Deriva de RE (`docs/02-requirements/SRS.md` + UC-001..006), no del código. Complementa el TDD de `ooad-build`.

## 1. Strategy by Levels (pyramid 80/15/5, Mike Cohn)

| Level | Scope | Framework | Location |
|-------|-------|-----------|----------|
| Unit 80% | entities + usecases + Validator (reglas BR-003, NFR-005, metadatos UC-002) | Jest (`*.spec.ts` colocalizados) | `backend/src/**/*.spec.ts` |
| Integration 15% | adapters + DB/FS: repositorios TypeORM + FileStorage + cascada C-1/C-2/C-3 + rollback E-001 | Jest + MariaDB 11 vía `docker compose` (`db` healthy); Testcontainers en próxima iteración | `backend/test/integration/*.spec.ts` |
| E2E 5% | flujos UC vía controllers + guards + `DomainError→HTTP` mapper (matriz 401/403, 404, 409, 413/415) | Jest (fakes en memoria; `supertest` + app Nest completa en próxima iteración) | `backend/test/e2e/*.spec.ts` |
| Frontend | api client + guards de ruta (401→`/login`, 403 vista) + filtros de catálogo | Vitest | `frontend/src/**/*.test.ts` |
| Perf | NFR-001 p95<200ms catálogo/búsqueda; NFR-002 subida ≤50MB <60s | k6 (externo, no dep npm) + gate de timing en Jest | `backend/tests/perf/*.feature` + `backend/tests/perf/k6/*.js` |

Casos Gherkin (fuente readable, 1 comportamiento por escenario, datos concretos, sin UI):
`backend/tests/cases/UC-001..006.feature`, `backend/tests/cases/NFR-003-004-006.feature`.
Cada escenario mapea 1:1 a un test Jest con el mismo nombre (ver `docs/05-qa/test-cases.md`).

Técnicas ISTQB: partición de equivalencia (roles × auth × existencia), valores borde
(password 7/8, `page` 0/1, `limit` 1/50/51, `year` 999/1000/actual/actual+1, 50MB±1),
tabla de decisión (MIME×tamaño, owner×rol×existencia, precedencia 401-antes-404).

## 2. Entry / Exit Criteria

Entry (cumplido): SRS v0.4.0 validado (Fagan 0 defectos), arquitectura aprobada
(`docs/03-architecture/README.md`), ≥1 slice verde en `src/`.

Exit (gate a `ooad-ship`):

- Todo FR/UC (FR-001..013 vivas, NFR-001..006, BR-002/003/004) mapea a ≥1 escenario `.feature` con happy+edge+error+null, y a un test Jest verde.
- `make test-cov` (equivale a `npm run test:cov --prefix backend`): gate 80% líneas/ramas en capas testeables sin DB (ver `backend/jest.config.js`); `make test` incluye además `npm test --prefix frontend` (Vitest verde).
- k6 `perf-catalog.js`: `p(95)<200ms`; `perf-upload.js`: 50MB <60s (o registrado como gap con plan).
- `RTM.csv` `FR→case` trazado; `qa-report.md` sin bugs bloqueantes; cada sección <400 palabras.

## 3. Cases

Ver `backend/tests/cases/*.feature` y `backend/tests/perf/*.feature`.
Matriz ejecutable FR→caso→resultado en `docs/05-qa/test-cases.md`.

## 4. Execution (vía `Makefile` raíz; `make help` lista todo)

| Comando `make` | Qué corre (comando subyacente) |
|---|---|
| `make test` | Jest backend (unit `src` + integration/e2e `test/`) + Vitest frontend |
| `make test-cov` | Jest con cobertura y gate 80% en capas testeables (`backend/jest.config.js`) |
| `make test-db` | Levanta MariaDB 11 (`db` healthy) y corre la suite (lista para GAP-002 DB-backed) |
| `make perf JWT=$(make token EMAIL=p PASSWORD=...)` | k6 `perf-catalog.js` (p95<200ms) + `perf-upload.js` (50MB <60s) |
| `make lint` / `make check` | eslint + tsc / puerta calidad (lint + test + test-cov) |
| `make docs` | Re-renderiza diagramas PlantUML a SVG (`plantuml -tsvg -pipe`) |

UAT: guiones por rol en `docs/uso-por-rol.md` (`:5173` — Student lector, Professor publica lo propio, Admin control total).
