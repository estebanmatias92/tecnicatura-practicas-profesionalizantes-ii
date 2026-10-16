# Breakout — gap BT-05

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `architect` · Slice `UC-001/UC-002/UC-003/UC-004/UC-006` |
| **Trace** | `FR-002`, `FR-004`, `FR-008`, `FR-011`, `FR-013` |
| **Invariant** | — (completitud del modelo de diseño) |
| **Evidence** | Ver Finding |
| **Classification** | `delta-arch → ooad-architect` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

El modelo de clases/secuencias invoca operaciones inexistentes o contradice los ADR aprobados:

1. **Operaciones llamadas y no modeladas**: `findByEmail(email)` (`sequence-diagram-UC-001.puml:25`) ausente de `UserRepository` (`class-diagram.puml:76-79`); `FileBlob.create(...)` + `Material.create(...)` (`sequence-diagram-UC-002.puml:26`) ausentes de las entidades (`class-diagram.puml:23-44`), aunque ADR-0001:19 asigna Creator a ambas; `validateTarget` (`sequence-diagram-UC-004.puml:41`) ausente de `Validator` (`class-diagram.puml:94-99`).
2. **Orden de secuencia imposible**: `verify(password, passwordHash)` (`sequence-diagram-UC-001.puml:22`) ocurre antes de cargar el `User` que aporta el hash (`findByEmail`, `:25`).
3. **Flujos sin UseCase**: UC-003 (lectura por id) no tiene UseCase ni `findById` (`class-diagram.puml:54-84`, ADR-0001:18 exige "cada UC-001..006 entra por un UseCase"); FR-011 "cambio de rol" y FR-013 "edita" tienen flujo y Gherkin (`UC-004-admin.md:14,54-66`) pero ninguna operación de update.
4. **God-controller vs promesa**: `ManageMaterialUseCase` absorbe C-1/C-2/C-3 con `deleteMaterial`/`deleteUser` y **sin `execute`** (`class-diagram.puml:67-70,119-124`), mientras ADR-0001:18,26, ADR-0002:14, `README.md:25` y el propio comentario del diagrama (:123) prometen "un UseCase por flujo" con `execute()`.
5. **Rollback inalcanzable como secuenciado**: UC-002 guarda bytes antes de la transacción sin limpieza ante fallo (`sequence-diagram-UC-002.puml:24-32`); UC-004 hace `FS.remove` después del commit de DB y aun así declara "500 + rollback" (`sequence-diagram-UC-004.puml:20-24,44-48`) — contradice la mitigación de ADR-0003:26 ("transacción-primero + remove + rollback").
6. **ADR-0002 sin realización**: Strategy para Validator/filtros y Command con `execute(dto)` (`ADR-0002:14,18`) no existen como clases en `class-diagram.puml`.
7. **Sin ADR de auth**: JWT TTL/BCrypt cost no tienen ADR con alternativas/consecuencias (`RTM.csv:2,17` citan ADR-0001, que solo lista NFR-003 como motivación: `ADR-0001:10,14`).
8. **`file_name` sin camino de diseño**: el ER tiene la columna (`data-model-er.puml:34`) pero `FileBlob` no tiene el atributo y `FileStorage.store(bytes)` no recibe nombre (`class-diagram.puml:37-44,89-93`) → `Content-Disposition: filename` de UC-006:26 no es producible (par de BT-02).

> **Additional sightings (architect pass 2026-10-16)**
> - `ADR-0002:20` nombra `JwtAuthGuard`/`RolesGuard` como adapters, pero no existen como clases en `class-diagram.puml`; el chequeo de rol aparece solo como `checkRole` ad-hoc (`sequence-diagram-UC-002.puml:16`) → refuerza el item 6 (realización de ADR-0002).
> - El ADR de auth (item 7) sigue ausente aunque `RTM.csv:2,17` citan ADR-0001 para NFR-003.

## Why this classification

La corrección edita `docs/03-architecture/` (class/sequence diagrams + ADRs) → CCB Request `delta-arch`, no bug de código.

## Disposition

- [x] RTM `FR-002/004/008/011/013` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-architect`: operaciones faltantes, orden, UseCases, rollback, realización ADR-0002, ADR auth, `file_name` (v0.5.1, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
