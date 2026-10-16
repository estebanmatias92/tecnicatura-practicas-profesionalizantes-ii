# QA Report — BiblioTech (2026-10-16)

Status: `ooad-verify` en ejecución; `ooad-breakout` (`BUG-001`) abierto; `ooad-architect` aprobado.

## 1. Plan y casos
- `test-plan.md`: entry (SRS v0.5.2, arch v0.6.0, ≥1 slice verde) cumplido; exit requiere cobertura ≥80% + `BUG-001` resuelto o documentado.
- `.feature`: UC-001..006 + NFR-003-004-006 presentes (`tests/cases/`). Cada escenario cubre happy/edge/error/null (ver `test-cases.md`).
- `RTM.csv`: `FR→case` trazado (`test-cases.md`); `FR-011` (`UC-004`) `Blocked` (`BUG-001`).

## 2. TDD + Invariants (`ooad-build`)
- `B-1`..`B-6`: commits atómicos; `invariant:B-1`..`B-6` verdes.
- `BUG-001` (`breakout`): no workaround en código (`deleteCascade` sin modificar); ticket `.scratch/bug-001/issues/01-fs-primero.md`; `RTM.csv` actualizado; `CHANGELOG-RE.md` actualizado.

## 3. Cobertura (`npm run test:cov` pendiente por timeout; `npm test` pasa 46/46 en capas testeables sin DB)
- Gap `GAP-001` (supertest + app completa): pendiente.
- Gap `GAP-002` (DB-backed MariaDB + TypeORM + cascada): `it.todo` en `cascade.spec.ts`; `BUG-001` (FS-primero) bloquea la convergencia completa.
- Gap `GAP-003` (perf k6): pendiente (`tests/perf/*.feature` existen; `k6` requiere entorno externo).
- Gap `GAP-004` (Vitest frontend): `api.test.ts` (2 tests) solo.

## 4. Defectos / Divergencias
- `BUG-001` (`delta-arch`/`delta-spec`): FS-primero (`ADR-0005`) vs DB-primero (`deleteCascade`). No bloquea slices independientes (`B-4`, `B-5`, `B-6`).
- `BUG-002` (`B-6` `SERVICE_UNAVAILABLE`): implementado en código (`errors.ts`, `download-file.usecase.ts`, `domain-error.mapper.ts`); `test-cases.md` aún marca `DIVERGENT` — requiere verificación del adapter HTTP (map 503 en `NestExceptionFilter`).

## 5. CCB Gate
- `BUG-001`: `Blocked` (`.scratch/bug-001/`), `RTM.csv` actualizado, `CHANGELOG-RE.md` actualizado. No unbaselined.
- `BUG-002`: código implementado; pendiente verificación del adapter.

## 6. Resumen (< 400 palabras)
`ooad-verify`: estructura `.feature` completa, `invariant:` guards presentes, `test-plan.md` con criteria, `RTM.csv` actualizado. `BUG-001` documentado como `breakout` (no workaround). Cobertura parcial (tests sin DB 46/46); DB-backed (`GAP-002`) y perf (`GAP-003`) pendientes. `BUG-002` implementado; `DIVERGENT` pendiente verificación adapter. `ooad-architect` aprobado (`docs/05-qa/ooad-architect-verify.md`).
