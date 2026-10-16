# ADR-0005: Cascada dura Material↔FileBlob y consistencia DB/FS

- **Status**: Accepted
- **Date**: 2026-10-16
- **Deciders**: Tech Lead + Stakeholder (aprobado por usuario 2026-10-16)
- **Consulted**: `docs/02-requirements/SRS.md` §6, BR-004 v0.4.0, `UC-004` (C-1/C-2/C-3, E-001)

## Context

BR-004 v0.4.0 exige **cascada dura 1:1**: borrar una cuenta Professor borra sus Materials + FileBlobs; borrar un Material borra su FileBlob; duplicados permitidos (cada POST crea Material + FileBlob nuevos). NFR-005 exige que el binario y sus metadatos no diverjan. Dos defectos verificados en el diseño previo:

1. **FK invertida (BT-06 §3)**: el ER declaraba `materials.blob_id → file_blobs.id ON DELETE CASCADE`, lo que **cascada en el sentido opuesto** (borrar el blob borra el material) — no C-1/C-3 — y contradice el claim "cascada dura a nivel DB".
2. **Rollback inalcanzable (BT-05 §5, BUG-001)**: `deleteWithBlob`/`deleteCascade` commiteaban antes de `storage.remove`; si el FS fallaba, la DB ya había mutado, imposibilitando el "500 + rollback (nada eliminado)" de UC-004 E-001.

## Decision

- **Dirección de la FK**: se mantiene `materials.blob_id → file_blobs.id` (preserva el modelo de dominio y la API `blobId`), **sin `ON DELETE CASCADE`** (NO ACTION/RESTRICT). La FK `users.owner_id → users` conserva `ON DELETE CASCADE`.
- **Cascada material→blob** se enforza en una **transacción de aplicación** dentro del repositorio (`deleteWithBlob(id)` / `deleteCascade(userId)`). La cascada user→material→blob queda atómica en DB (una transacción).
- **Consistencia DB/FS y E-001 — orden FS-primero**: el UseCase (1) **lee** el objetivo y sus `storageKey` (`findById` + `FileBlobRepository.findById`, o `UserRepository.listOwnedStorageKeys`), (2) ejecuta `storage.remove` (idempotente, ignora ENOENT) **antes** de mutar la DB, y (3) recién entonces corre el borrado transaccional en DB. Así, si el FS falla, la DB no mutó y E-001 devuelve 500 con "nada eliminado" (criterio de UC-004). El "re-insertar tras commit" queda **descartado** por irrealizable (tras el commit la transacción no puede abortarse; además `deleteWithBlob` no conserva el payload).
- **Riesgo residual aceptado**: si la DB falla *después* de borrar el FS, queda un archivo huérfano sin fila (y una fila sin archivo). Es benigno y auto-reparable: `remove` es idempotente y un reintento del `DELETE` completa el borrado; el huérfano se registra en log. Se prefiere esto a la alternativa inversa (fila viva + archivo perdido), que rompería UC-006.

## Responsibility assignment (GRASP)

- `ManageMaterialUseCase` (C-1/C-3) y `ManageUsersUseCase` (C-2) — **Controller** + **High Cohesion** (`Mission:` every class earns its keep; fixes land in one place): orquestan la transacción y la compensación en un solo lugar.
- `Material.isOwnedBy` — **Information Expert** (`Mission:` co-locate behavior with information): decide ownership local antes del borrado (403 ajeno).
- Repos con `deleteWithBlob`/`deleteCascade` — **Indirection** (`Mission:` both sides depend on something stable): encapsulan la transacción; el core no ve SQL.

## Consequences

- **Positive**: corrige la FK invertida y hace alcanzable E-001; cascada user→material en DB y material→blob en transacción de app + FS; `API blobId` intacta; sin tablas auxiliares.
- **Negative / Costs**: la cascada material→blob no es DB-FK-driven (es transaccional); el orden FS-primero exige una lectura previa de `storageKey` y tests de E-001.
- **Risks**: archivo huérfano si la DB falla tras el `remove` (fila sin archivo) → se acepta log + reintento idempotente del `DELETE`; reevaluar con `make test-db` (GAP-002) contra MariaDB real.

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| FK hija `file_blobs.material_id → materials ON DELETE CASCADE` | Cascada 100% DB-FK-driven ambas piernas | Invierte el dueño del 1:1; reordena creación; cambia ORM/dominio/API | Churn alto frente al beneficio a escala lab |
| `ON DELETE CASCADE` en `materials.blob_id` (diseño previo) | "una línea" | Cascada invertida (blob→material) | Rompe C-1/C-3 (BT-06 §3) |
| DB-primero + re-insertar en catch | No pierde archivos si la DB falla | Tras el commit no se puede abortar; el repo no conserva el payload a re-insertar; doble escritura no atómica | Irrealizable con el contrato de puertos (F-02 del challenge v0.5.1) |
| Borrar FS después del commit (código actual, BUG-001) | Menos pasos | FS caído deja DB ya mutada → E-001 ("nada eliminado") imposible | Contradice UC-004 E-001 |
| Outbox/cola de limpieza FS | Desacoplado, robusto | Infra extra desproporcionada | Fuera de alcance lab |

> La alternativa elegida (FS-primero) acepta el riesgo residual "fila sin archivo" en fallo de DB post-remove; se documenta y se auto-repara con `remove` idempotente + reintento de `DELETE`.

## Compliance

Tests de cascada C-1/C-2/C-3 (GET → 404 tras DELETE; blobs y archivos ausentes) y E-001 (storage que falla ⇒ 500 y **nada** eliminado) en `cascade.spec.ts` + variante DB-backed (GAP-002). Traza: BR-004, FR-012/FR-013, NFR-005, UC-004.

## References

- BR-004 (v0.4.0), FR-011/012/013, NFR-005, UC-004 (C-1/C-2/C-3, E-001)
- `data-model-er.puml`, `sequence-diagram-UC-004.puml`, `class-diagram.puml`
- ADR-0003 (ORM), `docs/05-qa/bug-report.md` (BUG-001)
