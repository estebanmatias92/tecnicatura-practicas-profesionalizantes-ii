# BUG-001 — FS-primero (E-001) no cumplido en borrado usuario

Status: open -> reclassified to `code-fix` (2026-10-16)
Type: **code-fix** (no `delta-arch` ni `delta-spec`)
Trace: docs/03-architecture/adrs/0005-cascade-consistency.md; docs/02-requirements/use-cases/UC-004-admin.md; backend/src/adapters/persistence/typeorm/typeorm-repositories.ts:89-100
Evidence:
- ADR-0005 (§Decision) declara "FS-primero (idempotente)" para borrado de cuenta (C-2, E-001): (1) leer `storageKey`, (2) `storage.remove`, (3) transacción DB.
- `UC-004` E-001: "Fallo al borrar blob en cascada → 500, rollback de la transacción (ni usuario ni materials eliminados)".
- `TypeOrmUserRepository.deleteCascade` (line 89-100) hace DB primero (`tx.delete` antes de `storage.remove`). Esto viola ADR-0005 y hace E-001 irrealizable.
- `docs/05-qa/test-cases.md:42` registra DIVERGENT.
Classification (reclassified): `code-fix`. El diseño (`ADR-0005`) y el RE (`UC-004`) no requieren cambio; el repositorio debe implementar `findCascadeKeys` + FS-primero + DB-después.
Repro: `deleteUser(3)` con material existente: DB muta antes que FS; `tx.rollback()` deja archivo limpio pero fila ausente (inconsistente), y `storage.remove` nunca se llama si la DB falla antes.
Fix: implementar `deleteCascade` como `findCascadeKeys` (solo `find`, no `delete`) + `usecase` hace `remove` primero + luego `deleteCascade`. No modificar `docs/03-architecture/` ni `docs/02-requirements/`.
