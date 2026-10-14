# QA Report — BiblioTech (iteración verify 2026-10-14)

## Estrategia

Pirámide 80/15/5 adaptada al stack (Jest + Vitest, sin pytest/behave): unit colocalizado en `backend/src` (entities/usecases/Validator), integration+e2e en `backend/test` (guards, controllers, flujos con estado, cascada, auditoría), `.feature` como fuente legible con mapeo 1:1 a tests del mismo nombre. Técnicas ISTQB: partición (rol×auth×existencia), bordes (password 7/8, page 0/1, limit 50/51, year 999/1000, 50MB±1) y tablas de decisión (MIME×tamaño, owner×rol, 401-antes-404). Detalle en `test-plan.md`.

## Ejecución

`npx jest --coverage`: 15 suites verdes, 144 PASS + 3 todo, 0 FAIL. Frontend `vitest`: 2 PASS. Cobertura: entities 94%, usecases 93,5%, validators 90,7%, security 100%, adapters/http 84% (guards ~100%, mapper 86%). En cero: `persistence/typeorm`, `disk-file-storage` y `app.module` — requieren MariaDB/Nest reales (GAP-002/GAP-001). Global 64%: el núcleo testeable sin DB supera el 80%; el gate total queda parcial. k6 pendiente (GAP-003). UAT manual por `docs/uso-por-rol.md` pendiente de credenciales seed.

## Trazabilidad

Toda FR viva (FR-001..013), NFR-003/004/005/006 y BR-002/003/004 mapean a ≥1 escenario en `backend/tests/cases/*.feature` con happy+edge+error+null, y a test verde (matriz en `test-cases.md`). NFR-001/002 tienen `.feature` + scripts k6 sin ejecutar. `RTM.csv` ya trazaba `FR→UC→clase→ADR→Test_Feature`; no se tocó el baseline RE: el estado `Designed→Covered` se propone como cambio RE en la próxima iteración, con esta matriz como evidencia.

## Gaps y bugs

Dos divergencias reales, ninguna bloqueante: BUG-001 (major) — E-001 de borrado no revierte la DB porque `deleteWithBlob`/`deleteCascade` confirman antes que `storage.remove`; BUG-002 (minor) — storage caído en descarga sube error crudo (500 genérico) en vez del 503 especificado; falta el código `SERVICE_UNAVAILABLE`. Gaps: GAP-001 (sin supertest+app), GAP-002 (sin DB-backed; 3 `it.todo`), GAP-003 (k6 sin correr), GAP-004 (frontend mínimo). Detalle y fixes en `bug-report.md`.

## Veredicto

Gate a `ooad-ship`: **NO-GO condicional**. Funcional verde y trazado, 0 bloqueantes, pero el loop Construction (`ooad-build` ↔ `ooad-verify`) sigue: cerrar BUG-001/002, portar cascada y filtros a MariaDB 11 (GAP-002), añadir app e2e (GAP-001) y correr k6 (GAP-003) hasta p95<200ms. Re-verificar con suite verde + cobertura global ≥80% antes de Transition.
