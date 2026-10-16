# Architecture — BiblioTech (v0.6.0, MVC — aprobado 2026-10-16)

Estilo: **MVC (Reenskaug)** ([ADR-0001](adrs/0001-clean-4-layer-architecture.md) — reemplaza Clean 4 Layers). Reglas vía Strategy ([ADR-0002](adrs/0002-strategy-for-rules.md)). Persistencia TypeORM + storage local tras puertos ([ADR-0003](adrs/0003-orm-vs-sql.md)). Auth JWT/BCrypt con revocación por `token_version` ([ADR-0004](adrs/0004-auth-jwt-revocation.md)). Cascada dura y consistencia DB/FS ([ADR-0005](adrs/0005-cascade-consistency.md)). Índices para UC-005 ([ADR-0006](adrs/0006-search-indexing.md)).

> Rev. v0.5.1 (2026-10-16): back-edge del CCB post-challenge — resuelve **BT-05** (modelo de diseño), **BT-06** (integridad arquitectónica) y **BT-11** (orden Multer/NFR-005). Reconcilia el diseño con el baseline RE v0.5.0 y registra los **follow-ups** (código y RE) que aún deben converger; **no** afirma que el código ya iguale el diseño.

## C4 (sin cambios — actores/sistemas iguales)

![C4 Context](c4-context.svg)
![C4 Container](c4-container.svg)

## Clases y datos

![Classes](class-diagram.svg)
![Data model](data-model-er.svg)

## Secuencias críticas (las colaboraciones clave citan su GRASP)

- UC-001 auth: `sequence-diagram-UC-001.puml` — Controller → Pure Fabrication (ValidatorPort) → Creator → Indirection (PasswordHasher/UserRepository) → Information Expert (`tokenVersion`). Orden corregido: se carga el `User` antes de comparar (BT-05 §2).
- UC-002 upload 1:1: `sequence-diagram-UC-002.puml` — `FileInterceptor` valida en el borde (memoria + límite + MIME) antes de persistir (BT-11/NFR-005); Creator crea Material + FileBlob nuevos (duplicados → 201).
- UC-003 read-by-id: `sequence-diagram-UC-003.puml` — lectura delgada, 404 por id, todo rol ve todo (BR-002/FR-007).
- UC-004 cascada + revocación: `sequence-diagram-UC-004.puml` — Controller → Information Expert (`isOwnedBy`) → **FS-primero** (idempotente) + transacción DB (ADR-0005) → `tokenVersion` bump (NFR-006).
- UC-005 búsqueda: `sequence-diagram-UC-005.puml` — Strategy de filtros + FULLTEXT/BTREE (ADR-0006), paginación normalizada.
- UC-006 descarga: `sequence-diagram-UC-006.puml` — 401-primero (BR-002), stream + `fileName` normalizado (NFR-005).

## Capas — MVC (Reenskaug): Model / View / Controller

- **Model** (`User`, `Material`, `FileBlob`, `AuthSession`, repositorios `*Repository`, `FileStorage`, `PasswordHasher`, `TokenSigner`, `ValidatorPort`): datos + reglas de empresa puras; cero imports framework (`@nestjs/*`). Sabe sus datos y su creación/ownership (Information Expert + Creator). `AuthSession` es Value Object transitorio, sin crypto. Es independiente de Controllers y View.
- **Controller** (`AuthController`, `MaterialsController`, `UsersController`, `JwtAuthGuard`, `RolesGuard`, `DomainErrorMapper`): punto de entrada por evento de sistema (MVC Controller), agrupado por agregado (`MaterialsController` para material, `UsersController` para cuenta/rol). Recibe eventos desde la View, orquesta interacción con el Model, y devuelve respuesta. Depende del Model; no tiene reglas de dominio propias más allá de la coordinación.
- **View** (`React SPA`, componentes de lectura/búsqueda/subida, interfaces de usuario): presenta datos y captura eventos; no contiene reglas de negocio ni acceso directo al Model. Solo interactúa con Controllers (HTTP/REST). Reemplaza la capa de presentación separada sin romper la separación FE/BE.
- **Adapters / Ports** (`BiblioValidator`, `TypeOrm*Repository`, `DiskFileStorage`, `BcryptHasher`, `JwtTokenSigner`, `AppModule`): traducen entre Controllers/Model y detalles externos (DB, FS, HTTP, validación). El Model y los Controllers dependen de interfaces (`ValidatorPort`, repositorios, etc.), no de implementaciones concretas.

## Dependency Rule (cambio respecto a Clean 4 Layers)

- **Controllers dependen del Model** (llaman a repositorios, entidades y servicios internos como `PasswordHasher`, `TokenSigner`, `FileStorage`).
- **Views interactúan con Controllers** (HTTP/REST o eventos); no acceden al Model directamente.
- **No hay regla de dependencia "solo hacia adentro"** como en Clean 4 Layers: los Controllers son el punto de conexión explícito entre la capa de presentación (View) y el dominio (Model). El Model sigue sin depender de Controllers ni de Views.
- **Adapters** implementan los puertos que usa el Model; el Model no conoce los detalles de DB/FS/HTTP.
- Gate (actualizado): 0 imports `@nestjs/*` en `entities/` (Model puro); Controllers importan los puertos y servicios del Model; Views no importan el Model.

## Resolución del back-edge CCB (v0.5.1)

| Ticket | Fix arquitectónico |
|--------|--------------------|
| **BT-05** modelo de diseño | `findByEmail`/`create`/`update`/`getById` modelados en `User` (`updateRole`, `bumpVersion`); orden verify/load corregido; Controller por agregado (no God-controller); E-001 con **orden FS-primero** (ADR-0005); `file_name` en FileBlob/FileStorage; ADR-0004 auth. MVC reemplaza Use Cases por Controllers. |
| **BT-06** integridad | `ValidatorPort` usado por Controllers (no adapter→core); crypto tras `PasswordHasher`/`TokenSigner` (Model sin framework); FK de cascada corregida + ADR-0005; índices FULLTEXT/BTREE + ADR-0006; claim 3NF calificado; C4 actors→UC; MVC aprobado (ADR-0001); `crc-cards.md` actualizado; `class-diagram.puml` con `User.updateRole`/`bumpVersion`. |
| **BT-11** NFR-005 | `FileInterceptor` (memory + `limits` + `fileFilter`) valida en el borde antes del Controller (`MaterialsController`); MVC mantiene separación Controller→Model. |

## Follow-ups abiertos (NO parte del gate architect; trazados para build/RE)

Tras `/ooad-challenge` (fresh-context, v0.5.1) quedan divergencias que el diseño **documenta pero no puede cerrar** por sí solo:

**Código (`ooad-build`)** — el as-built aún no refleja este diseño:
| # | Delta | Evidencia |
|---|-------|-----------|
| B-1 | FK `materials.blob_id → file_blobs` hoy `onDelete:'CASCADE'` (invertida); cambiar a NO ACTION y confiar en la transacción (ADR-0005) | `backend/src/adapters/persistence/typeorm/orm-entities.ts:80` |
| B-2 | Añadir `users.token_version` + claim `ver` + chequeo en `JwtAuthGuard` (ADR-0004, NFR-006) | `backend/src/**` (ausente) |
| B-3 | Split `ManageMaterialUseCase` → `+ ManageUsersUseCase`; orden FS-primero en borrados (E-001) | `manage-material.usecase.ts`, `cascade.spec.ts` |
| B-4 | `ValidatorPort.normalizeFileName` + uso en `FileBlob.create` (NFR-005/BT-10) | `bibliotech-validator.ts`, `upload-material.usecase.ts` |
| B-5 | Índices `FULLTEXT(title,author,subject)` + `BTREE(year)` + `BTREE(created_at)` (ADR-0006) | migraciones/ORM |
| B-6 | UC-006 storage caído → 503 (`DomainErrorCode.SERVICE_UNAVAILABLE`, BUG-002) | `download-file.usecase.ts` |

**RE (`ooad-requirements`, delta-spec)** — contradicen el diseño aprobado. **Resueltos en RE v0.5.2 (2026-10-16)**:
| # | Delta | Evidencia | Cierre |
|---|-------|-----------|--------|
| R-1 | `q` de UC-005 declarado "parcial infijo"; FULLTEXT sirve token/prefijo → redefinir `q` (ADR-0006) | `UC-005-search.md:20` | **Resuelto** — `q` redefinido token/prefijo (UC-005 Query Semantics v0.5.2); RTM `FR-009`/`NFR-001` → `Designed`; B-5 desbloqueado. |
| R-2 | `conceptual-model.puml` aún marca cascada `<<ON DELETE CASCADE>>` y `AuthSession holds` (diseño: NO ACTION / VO transitorio) | `conceptual-model.puml:47-49` | **Resuelto** — estereotipos de cascada (DB FK vs app transaction, ADR-0005) + `AuthSession` VO transitorio (ADR-0004); SVG re-renderizado. |
| R-3 | `crc-cards.md` describe `AuthSession` como "verifica BCrypt; emite/valida JWT" (diseño: crypto tras puertos) | `crc-cards.md:49-56` | **Resuelto** — delega a `PasswordHasher`/`TokenSigner` (ADR-0004). |
| R-4 | UC-003/005/006 "Sequence Diagram … pendiente" ya existen | `UC-003:67`, `UC-005:105`, `UC-006:101` | **Resuelto** — secciones actualizadas con el contenido real de cada diagrama. |
