# ADR-0001: MVC (Reenskaug) como arquitectura para BiblioTech

- **Status**: Accepted (rev. v0.6.0 — reemplaza Clean 4 Layers; aprobado post-challenge 2026-10-16)
- **Date**: 2026-10-16
- **Deciders**: Tech Lead + Stakeholder (aprobado usuario; reemplaza Clean 4 Layers por MVC estilo Reenskaug)
- **Consulted**: `docs/agents/architecture.md`, `docs/agents/workflow.md` (RUP), `docs/bibliotech.md`

## Context

BiblioTech es una biblioteca digital con roles `Admin`, `Professor`, `Student`. La arquitectura previa (`Clean 4 Layers`) aisló reglas de negocio pero introdujo complejidad de capas (Entities, Use Cases, Ports, Adapters, Frameworks) que supera la escala del laboratorio. El usuario aprobó explícitamente el modelo **MVC clásico (Reenskaug)**: separación simple en **Model** (datos + reglas), **View** (presentación / React SPA) y **Controller** (coordinación de eventos, sin reglas de dominio). Esto reemplaza Clean 4 Layers y simplifica la estructura sin perder la separación Frontend/Backend ni la seguridad JWT+BCrypt+Multer.

Los NFR (NFR-003/004/006 seguridad auditable, NFR-001 lectura rápida, RST-004 persistencia vía repositorios, charter req 5 separación FE/BE) siguen aplicando; se reubican en los roles MVC en lugar de las 4 capas.

## Decision

Adoptar **MVC estilo Reenskaug** (`Model → Controller → View`) para BiblioTech, reemplazando `Clean 4 Layers`.

- **Model** (`User`, `Material`, `FileBlob`, `AuthSession`, repositorios, validadores, hashers): posee datos, reglas de negocio puras y persistencia. Es independiente del framework HTTP (no importa `@nestjs/*`). Corresponde al dominio + repositorios + servicios internos (equivalente al core anterior, sin la capa Use Cases separada).
- **View** (`React SPA`, componentes de lectura/búsqueda/subida, interfaces de usuario): presenta datos y captura eventos del usuario; no contiene reglas de negocio ni acceso directo a DB. Solo interactúa con Controllers.
- **Controller** (`AuthController`, `MaterialsController`, `UsersController`, `JwtAuthGuard`, `RolesGuard`): recibe eventos del usuario (HTTP desde la View / API), orquesta la interacción con el Model y devuelve la respuesta. Es el punto de entrada por flujo (UC-001..UC-006), agrupado por agregado (`ManageMaterial` / `ManageUsers`), sin God-controller.

Regla de dependencia (cambio respecto a Clean 4 Layers):
- **Controllers dependen del Model** (llaman a repositorios, entidades, servicios internos).
- **Views interactúan con Controllers** (HTTP/REST o eventos; no acceden al Model directamente).
- **No hay regla de dependencia "solo hacia adentro"** como en Clean 4 Layers: los Controllers son el punto de conexión explícito entre la capa de presentación (View) y el dominio (Model). El Model sigue sin depender de Controllers ni de Views.

La seguridad (JWT + BCrypt), la validación (`class-validator`), la persistencia (TypeORM sobre MariaDB 11) y el manejo de archivos (Multer) siguen como detalles reemplazables tras los Controllers y dentro del Model.

## Responsibility assignment (GRASP) — actualizado para MVC

- `*Controller` (`AuthController`, `MaterialsController`, `UsersController`) — **Controller** (`Mission:` single entry point per system operation, UI stays thin): cada evento de sistema (UC-001..UC-006) entra por un Controller, agrupado por agregado (Material / Users). La View envía eventos; el Controller los traduce.
- `User.create`, `Material.create`, `FileBlob.create` — **Creator** (`Mission:` one stable owner per lifecycle, no scattered `new`).
- `Material.isOwnedBy`, `Material.applyPatch` — **Information Expert** (`Mission:` co-locate behavior with information). `Material` conoce su `ownerId` y sus metadatos; `User` conoce su `tokenVersion`.
- `User.updateRole`, `User.bumpVersion` — **Information Expert** (`Mission:` co-locate mutation with data): el usuario conoce su rol y su versión de token; el Controller (`ManageUsersUseCase` en diseño anterior, ahora `UsersController`) invoca estas mutaciones.
- Repositorios (`UserRepository`, `MaterialRepository`, `FileBlobRepository`), `FileStorage`, `PasswordHasher`, `TokenSigner`, `ValidatorPort` — **Indirection** (`Mission:` both sides depend on something stable). Los Controllers y el Model dependen de interfaces, no de implementaciones concretas.
- `ValidatorPort` como puerto — **Pure Fabrication** (`Mission:` protect domain cohesion; reglas fuera del Model). `BiblioValidator` implementa el puerto en la capa de Adapters.

## Consequences

- **Positive**: modelo más simple y legible que Clean 4 Layers; menos capas y clases (Controllers reemplazan Use Cases como orquestadores); separación clara Model/View/Controller facilita el mantenimiento del lab; los Controllers siguen siendo auditables para seguridad (JWT/BCrypt) sin distribuir reglas en capas adicionales.
- **Negative / Costs**: los Controllers absorben la coordinación que antes estaba en Use Cases; sin disciplina, un Controller puede volverse God-controller — mitigado con un Controller por agregado (`MaterialsController` para material, `UsersController` para cuenta/rol) y revisión `Low Coupling` / `High Cohesion`.
- **Risks**: si la View accede directamente al Model (bypassing Controller) se rompe MVC — mitigado por la separación FE/BE (React SPA solo habla con Controllers vía HTTP) y por la ausencia de acceso DB en el frontend.

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| Clean 4 Layers (previo) | Aislamiento fuerte; Dependency Rule explícita | Exceso de capas y puertos para escala lab; más clases (8 UseCases, 7 puertos); curva de aprendizaje alta para el equipo | El usuario aprobó explícitamente MVC; la escala del lab no justifica la complejidad adicional |
| Hexagonal (Cockburn) | Puertos explícitos; testabilidad alta | Boilerplate de adaptadores/puertos desproporcionado; no aporta más que Clean 4 para este dominio | Reemplazado por el mismo razonamiento que Clean 4: exceso para escala lab |

## Compliance

- Los Controllers (`MaterialsController`, `UsersController`, `AuthController`) cubren UC-001..UC-006, sin God-controller.
- El Model (`User`, `Material`, `FileBlob`, repos, servicios internos) tiene cero imports de `@nestjs/*`; los Controllers importan los servicios del Model.
- Las Views (`React SPA`) no importan ni dependen del Model directamente; solo consumen Controllers.
- Cada Controller mapea a su UC (`sequence-diagram-UC-*.puml`); `class-diagram.puml` declara `updateRole` y `bumpVersion` en `User`.

## References

- FR-001..FR-013, NFR-001/002/003/004/005/006, RST-003/004/005, UC-001..UC-006
- `docs/bibliotech.md` (charter: roles, JWT+BCrypt, Multer, separación FE/BE)
- `docs/agents/architecture.md`, `class-diagram.puml`, `sequence-diagram-UC-*.puml`
- MVC (Reenskaug) — Modelo original (Smalltalk-76); referencia: `docs/03-architecture/adrs/0001-mvc.md` (este ADR reemplaza `0001-clean-4-layer-architecture.md`)
- ADR-0002 (Strategy para reglas), ADR-0003 (ORM vs SQL), ADR-0004 (auth JWT revocación), ADR-0005 (cascada consistencia), ADR-0006 (índices búsqueda)
