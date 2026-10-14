# Test Cases — BiblioTech (FR→caso→resultado)

> Matriz ejecutable del `test-plan.md`. Fuente RE: `docs/02-requirements/SRS.md` + UC-001..006.
> `PASS` = escenario `.feature` con test Jest verde mismo nombre. `DIVERGENT` = el código
> no cumple el spec (bug en `bug-report.md`, el test documenta el comportamiento real).
> `PENDING` = `it.todo` o script sin ejecutar (gap en `bug-report.md`).
> Suite 2026-10-14: **15 suites, 144 PASS + 3 todo, 0 FAIL** (`npx jest --coverage`).

## UC-001 auth — `backend/tests/cases/UC-001.feature` → `backend/test/e2e/auth-matrix.spec.ts`

| FR/BR | Escenarios | Resultado |
|-------|------------|-----------|
| FR-001 | registro válido / duplicado case-insensitive / email inválido ×4 / password 7 vs 8 / cuerpo nulo / pide Admin queda Student / Admin crea con rol / crear sin requestedRole 400 / AuthController delega ×4 | PASS |
| FR-002 | login válido / password mala 401 opaco / email inexistente mismo mensaje / JWT expirado-manipulado 401 | PASS |
| FR-003 | rol insuficiente 403 / rol suficiente pasa / mapper 8 códigos→status | PASS |
| BR-003 | partición email+password, borde 7/8, nulo | PASS (más tabla en `bibliotech-validator.spec.ts`) |

## UC-002 upload — `tests/cases/UC-002.feature` → `test/e2e/materials-flow.spec.ts`

| FR/BR/NFR | Escenarios | Resultado |
|-----------|------------|-----------|
| FR-004 | válida 1:1 / opcionales persistidos / Student 403 / sin token 401 / MIME 415 / >50MB 413 / 50MB exacto 201 / sin title 400 / year 999 400 / tags duplicados 400 / duplicado→2 recursos / fallo storage con rollback | PASS (12/12) |
| BR-004 | duplicados permitidos, cada POST crea Material+FileBlob nuevos | PASS |
| RST-005/NFR-005 | borde 50MB±1 sobre tamaño declarado; límite Multer del controller por inspección (`materials.controller.ts:85`) | PASS con nota |

## UC-003 lectura — `tests/cases/UC-003.feature` → `materials-flow` + `auth-matrix` (guards)

| FR/BR | Escenarios | Resultado |
|-------|------------|-----------|
| FR-006/007 | Student lee ajeno / envelope catálogo / inexistente 404 | PASS |
| BR-002 | sin token 401 / expirado 401 / 401-antes-404 | PASS (tests de guards compartidos) |

## UC-004 admin — `tests/cases/UC-004.feature` → `materials-flow` + `test/integration/cascade.spec.ts`

| FR/BR | Escenarios | Resultado |
|-------|------------|-----------|
| FR-011 | cambia rol / crea con rol / sin requestedRole 400 / no-Admin 403 / sin passwordHash en lista / borra inexistente 404 / C-2 con y sin material | PASS |
| FR-012 | C-3 Admin borra ajeno + blob + archivo | PASS |
| FR-013 | edita propio 200 / edita ajeno 403 intacto / elimina ajeno 403 / C-1 elimina propio + blob | PASS |
| BR-004 E-001 | fallo FS en borrado material y en borrado cuenta | DIVERGENT → BUG-001 (la DB ya mutó; el test lo documenta en verde) |

## UC-005 búsqueda — `tests/cases/UC-005.feature` → `materials-flow.spec.ts`

| FR | Escenarios | Resultado |
|----|------------|-----------|
| FR-009 | q título / q vacío 200 / autor parcial insensitive / tags AND / rango inclusivo / rango inválido 400 | PASS |
| FR-010 | página 2/10 de 25 / defaults 1/10 / page 0 400 / limit 1000 400 | PASS |

## UC-006 descarga — `tests/cases/UC-006.feature` → `materials-flow.spec.ts`

| FR/BR | Escenarios | Resultado |
|-------|------------|-----------|
| FR-008 | PDF mime+filename / EPUB preservado / inexistente 404 / huérfano 500 | PASS |
| BR-002 | sin token 401 / 401-antes-404 | PASS (guards compartidos) |
| E-001 | storage caído → 503 especificado | DIVERGENT → BUG-002 (sube error crudo, Nest da 500 genérico) |

## NFR seguridad — `tests/cases/NFR-003-004-006.feature` → `test/security/security-audit.spec.ts` + `auth-matrix`

| NFR | Escenarios | Resultado |
|-----|------------|-----------|
| NFR-003 | cost<10 rechazado / roundtrip BCrypt / JWT exp−iat ≤24h (config de `AppModule`) | PASS |
| NFR-004 | toPublic sin password / register-login sin password / 0 console.* en src (salvo banner `main.ts`) | PASS |
| NFR-006 | matriz 401 ×9 rutas / 403 Student / 403 Professor-ajeno / Admin todo | PASS |
| NFR-005 | fixtures PNG/0B/50MB+1/MIME nulo 100% rechazo | PASS (`bibliotech-validator.spec.ts` + UC-002) |

## NFR performance — `tests/perf/*.feature` + `tests/perf/k6/*.js`

| NFR | Escenarios | Resultado |
|-----|------------|-----------|
| NFR-001 | catálogo y getById p95<200ms (20/10 VUs) | PENDING → GAP-003 (requiere API+seed+k6) |
| NFR-002 | PDF 50MB <60s inicio→201 | PENDING → GAP-003 |

## Pendientes estructurales

| ID | Alcance | Estado |
|----|---------|--------|
| GAP-001 | `supertest` + app Nest (headers `Content-Disposition`, `FileInterceptor` 50MB/415 reales, `ValidationPipe` DTO) | `describe` ausente; controller directo cubre el mapeo |
| GAP-002 | DB-backed TypeORM + MariaDB 11 (filtros UC-005 reales, cascada transaccional) | 3 × `it.todo` en `cascade.spec.ts` |
| GAP-004 | Vitest guards de ruta y filtros de catálogo frontend | solo `api.test.ts` (2 tests) |
