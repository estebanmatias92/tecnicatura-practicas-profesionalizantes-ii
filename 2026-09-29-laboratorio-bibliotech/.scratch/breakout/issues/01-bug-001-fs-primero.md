---
Type: delta-arch (CCB Request)
Trace: FR-011 / UC-004 E-001 / ADR-0005 / docs/03-architecture/README.md:58
Status: open
Severity: medium (divergente en QA, sin work-around aceptado)
Feature: breakout
---

# BUG-001 — Delete cascade: DB borra antes que FS (contradice ADR-0005 FS-primero)

## Finding (falsifiable)
- Archivo: `backend/src/usecases/manage-users.usecase.ts:21`
- Archivo: `backend/src/adapters/persistence/typeorm/typeorm-repositories.ts:90`
- Diseño: `docs/03-architecture/README.md:58` (B-3: "orden FS-primero en borrados (E-001)")
- Repro: `tests/cases/UC-004.feature` → escenario "C-2 con material"; `test-cases.md` marca `DIVERGENT`.

## Evidence
`deleteUser` en `manage-users.usecase.ts` ejecuta:
```
const keys = await this.users.deleteCascade(input.userId);  // DB borra primero
await Promise.all(keys.map((k) => this.storage.remove(k)));   // FS limpia después
```
Esto viola `ADR-0005`: "FS-primero (idempotente)". Si la transacción DB revierte, el FS ya fue limpiado; si el FS falla primero, la DB aún no mutó, permitiendo reintentar.

## Impact
- Divergencia documentada en `docs/05-qa/test-cases.md` (BUG-001 / DIVERGENT).
- La transacción actual no es idempotente: falla de FS deja DB limpia (inconsistente con diseño).

## Classification (reclassification rule)
- ¿Requiere editar `docs/02-requirements/`? No directamente, pero `docs/03-architecture/` documenta el delta pendiente (`B-3`).
- ¿Requiere editar `docs/03-architecture/`? Sí: confirmar `ADR-0005` (FS-primero) y definir el contrato del repositorio (`deleteCascade` debe exponer datos sin borrar DB, o agregar `findCascadeKeys`).
- Por tanto: `delta-arch` → CCB Request, no `code-fix`.

## Next step
`ooad-architect` debe aprobar el cambio al contrato del repositorio o al ADR-0005. Hasta entonces, `B-3` permanece pendiente; no se introduce work-around en código.
