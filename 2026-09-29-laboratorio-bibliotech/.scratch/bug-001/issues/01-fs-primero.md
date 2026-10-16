# BUG-001 — FS-primero (E-001) no cumplido en borrado usuario

Status: open
Type: delta-arch (ADR-0005) / delta-spec (UC-004 E-001)
Trace: docs/03-architecture/adrs/0005-cascade-consistency.md; docs/02-requirements/use-cases/UC-004-admin.md; backend/src/adapters/persistence/typeorm/typeorm-repositories.ts:89-100
Evidence:
- ADR-0005 declara "FS-primero (idempotente)" para borrado de cuenta (C-2, E-001).
- `TypeOrmUserRepository.deleteCascade` (line 89-100) ejecuta `tx.delete(MaterialOrm, ids)` + `tx.delete(FileBlobOrm, ...)` + `tx.delete(UserOrm, userId)` antes de que `ManageUsersUseCase.deleteUser` llame `storage.remove(key)` (line 60). Esto viola FS-primero.
- `docs/05-qa/test-cases.md:42` registra DIVERGENT; `invariant:B-3` cubre split de usecase pero no el orden transaccional.
Classification: delta-arch (el diseño ADR-0005 debe reconciliarse con el repositorio) y delta-spec (UC-004 E-001 debe reflejar el orden real o el repositorio debe cambiar).
Repro: ejecutar `deleteUser(3)` con material existente: DB borra `UserOrm` y `MaterialOrm`/`FileBlobOrm` en la transacción; si `tx.rollback()` ocurre después (simulado), el FS sigue limpio (inconsistente, no idempotente).
Fix requires: editar `docs/03-architecture/adrs/0005-cascade-consistency.md` (si el orden DB-primero es intencional) o `docs/02-requirements/use-cases/UC-004-admin.md` (si E-001 debe actualizarse a DB-primero) o el repositorio debe implementar `findCascadeKeys` + FS-primero + DB-después.
No code workaround applied.
