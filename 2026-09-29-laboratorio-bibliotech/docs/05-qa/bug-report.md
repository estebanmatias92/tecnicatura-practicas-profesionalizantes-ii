# Bug Report — BiblioTech (iteración verify 2026-10-14)

> Severidad: `blocking` (frena el gate) / `major` (fix antes de prod) / `minor` (backlog).
> `gap` = cobertura ausente, no defecto de código. Trazan a `test-cases.md`.

## Bugs (divergencia spec ↔ código)

### BUG-001 — major — E-001 sin rollback en borrados (UC-004, BR-004)

- Spec (`UC-004.md` E-001): fallo al borrar blob en cascada → 500 con rollback (ni usuario ni materials eliminados).
- Código (`manage-material.usecase.ts:26-34,55-61`): `deleteWithBlob`/`deleteCascade` (DB) corren antes que `storage.remove` (FS); si el FS falla, la DB ya mutó.
- Evidencia: `test/integration/cascade.spec.ts` → "E-001 material/usuario" (verdes documentando el comportamiento real).
- Fix propuesto (`ooad-build`): orden inverso con compensación (borrar FS primero y reintentar, o re-insertar en catch), o transacción que abarque el registro del archivo; criterio: los `it.todo` de E-001 DB-backed en `cascade.spec.ts`.

### BUG-002 — minor — descarga con storage caído no da 503 (UC-006 E-001)

- Spec (`UC-006.md` E-001): storage caído → 503.
- Código (`download-file.usecase.ts:21-27` + `domain-error.mapper.ts`): `storage.stream` lanza error crudo fuera de `DomainError`; `toHttp` lo re-lanza y Nest lo serializa como 500 genérico. No existe código `SERVICE_UNAVAILABLE`.
- Evidencia: `test/e2e/materials-flow.spec.ts` → "storage caído propaga el error".
- Fix propuesto: `DomainErrorCode` + `SERVICE_UNAVAILABLE → 503` y `try/catch` en el usecase; test ya escrito espera el mapeo.

## Gaps (sin defecto, falta ejecución)

| ID | Severidad | Detalle | Cierre |
|----|-----------|---------|--------|
| GAP-001 | major | Sin `supertest` + app Nest: headers reales (`Content-Disposition`), `FileInterceptor` (50MB/415 en el borde HTTP), `ValidationPipe` de DTOs. Controller directo cubre el mapeo usecase→HTTP. | Añadir `@nestjs/testing` + `test/e2e/*.app-spec.ts` |
| GAP-002 | major | Sin DB-backed: filtros UC-005 contra MariaDB real (índices, collation insensitive) y cascada transaccional (criterio BUG-001). | `docker compose up -d db` + portar `cascade.spec.ts` a TypeOrm |
| GAP-003 | major | k6 sin ejecutar (NFR-001 p95<200ms, NFR-002 50MB<60s). Scripts listos en `tests/perf/k6/`. | API + seed 100 + `k6 run` en verify-2 |
| GAP-004 | minor | Frontend: solo `api.test.ts`; sin tests de guards de ruta ni filtros de catálogo. | Vitest por rol (Student/Professor/Admin) |

Bloqueantes: **0**. La suite automatizada está verde; BUG-001/002 y GAP-001..003 deben cerrarse antes de `ooad-ship`.
