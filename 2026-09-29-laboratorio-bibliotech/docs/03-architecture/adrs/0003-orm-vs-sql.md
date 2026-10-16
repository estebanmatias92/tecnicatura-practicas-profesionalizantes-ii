# ADR-0003: TypeORM Repository (Adapter) sobre MariaDB + storage local vía puerto FileStorage

- **Status**: Accepted (rev. v0.5.1 — cascada, índice y normalización corregidos)
- **Date**: 2026-10-13 (rev. 2026-10-16)
- **Deciders**: Tech Lead (aprobado por usuario 2026-10-13; rev. aprobada 2026-10-16)
- **Consulted**: Charter req 8 (MariaDB mínimo), `docs/02-requirements/crc-cards.md`

## Context

Charter exige MariaDB como mínimo y patrón Repository (RST-004: sin SQL en controladores); Multer vía `FileInterceptor` para uploads. Tensión: SQL directo es más rápido de escribir pero acopla el dominio al motor; un storage distribuido escala pero es desproporcionado al laboratorio. NFRs que motivan: NFR-001 (p95 <200ms → índices + paginación), NFR-002 (≤50MB en <60s → streaming sin buffer), UC-004 E-001 (cascada transaccional con rollback), UC-006 (streaming + rate-limit por usuario/IP en v1, sin cap global).

## Decision

**TypeORM** como único acceso a **MariaDB 11** tras los puertos `UserRepository`/`MaterialRepository`/`FileBlobRepository` (GoF **Adapter**); binarios en **storage local** tras el puerto `FileStorage` (adapter `DiskFileStorage`); esquema según `data-model-er.puml`.

- **Normalización**: el esquema está en 3NF salvo `tags JSON` (viola 1NF estricta). Tradeoff escala-lab aceptado: un join N:M para ≤10 tags opcionales es desproporcionado (rev. v0.5.1, BT-06 §5).
- **Cascada dura** C-1/C-2/C-3: `users → materials` con `ON DELETE CASCADE` a nivel DB; `materials → file_blobs` en **transacción de aplicación** (`deleteWithBlob`/`deleteCascade`) + limpieza FS. La dirección de la FK `materials.blob_id` **no** usa `ON DELETE CASCADE` (lo invertiría, borrando el material al borrar el blob). Detalle y mitigación de E-001 en **ADR-0005** (rev. v0.5.1, BT-06 §3, BUG-001).
- **Índices** (NFR-001): estrategia en **ADR-0006** (`FULLTEXT(title,author,subject)` + `BTREE(year)` + `BTREE(created_at)`; `tags` best-effort).

## Responsibility assignment (GRASP)

- Repositorios TypeORM y `DiskFileStorage` — **Indirection** (`Mission:` both sides depend on something stable) implementado con GoF **Adapter** (desacopla framework del core).
- Orquestación de cascada en `ManageMaterialUseCase` (C-1/C-3) y `ManageUsersUseCase` (C-2) — **High Cohesion** (`Mission:` every class earns its keep; fixes land in one place) + **Low Coupling** (`Mission:` independent classes; change stops rippling): un UseCase por agregado, repos por agregado.
- `contentHash` informativo no-único — **Information Expert** invertido: FileBlob conoce el hash pero *ninguna* decisión vive en él (BR-004 v0.4.0).

## Consequences

- **Positive**: cambio de motor/storage sin tocar UseCases; cascada garantizada en DB (user→material) + transacción de app (material→blob) + FS; NFR-001 respaldado por FULLTEXT/BTREE (ADR-0006).
- **Negative / Costs**: overhead ORM frente a SQL crudo; `tags` JSON renuncia a joins y a indexación plena (aceptado a escala lab).
- **Risks**: binario huérfano si FS falla tras el commit — mitigado con la secuencia transacción + `remove` + **compensación** (E-001 → 500, nada eliminado). Ver ADR-0005; reevaluar con k6 en verify.

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| SQL crudo en controllers | Máximo control, menos capas | Acopla dominio a MariaDB; viola RST-004 | Viola Dependency Rule y charter req 6 |
| Tabla `tags` + join N:M | 3NF estricta, indexable | Tabla + joins por ≤10 tags opcionales | Desproporcionado; JSON + reevaluación futura (ADR-0006) |
| Unique en `contentHash` (dedup) | Ahorra bytes | 409-duplicado contradice BR-004 v0.4.0 | Eliminado por stakeholder (BR-007 fuera) |
| Storage distribuido/S3 | Escala horizontal | Operativa injustificada en lab | Puerto FileStorage deja la puerta abierta |
| Cap global de descargas (semáforo) | Protege picos | Contador en memoria no escala; distribuido desproporcionado | Won't v1: streaming + rate-limit, reevaluar con k6 |

## Compliance

Migraciones TypeORM generan el esquema ER (incl. `token_version`, `FULLTEXT`, índices); tests de cascada (GET → 404 tras DELETE, doble POST mismos bytes → 2 ids, E-001 → DB sin mutar); k6 NFR-001/002 en verify.

## References

- FR-004/FR-008/FR-011/012/013, NFR-001/002/005, RST-003/004/005, BR-004, UC-002/004/006
- `data-model-er.puml`, `sequence-diagram-UC-002.puml`, `sequence-diagram-UC-004.puml`
- ADR-0005 (cascada/consistencia), ADR-0006 (índices)
