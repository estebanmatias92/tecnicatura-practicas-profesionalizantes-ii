# ADR-0001: Clean 4 Layers como estilo de arquitectura

- **Status**: Accepted (rev. v0.5.1 — back-edge CCB BT-05/BT-06)
- **Date**: 2026-10-13 (rev. 2026-10-16)
- **Deciders**: Tech Lead + Stakeholder (aprobado por usuario 2026-10-13; rev. aprobada 2026-10-16)
- **Consulted**: `docs/agents/architecture.md`, `docs/agents/workflow.md` (RUP)

## Context

BiblioTech debe aislar reglas de negocio (roles, cascada BR-004, validación BR-003) de NestJS/Multer/TypeORM para que un cambio de framework no reescriba el dominio. NFRs que motivan: NFR-003/004/006 (seguridad auditable en un solo lugar), NFR-001 (lectura rápida sin N+1), RST-004 (persistencia solo vía Repository), charter req 5 (separación Frontend/Backend) y req 7 (Validator central).

## Decision

Adoptar **Clean 4 Layers** (`Entities → Use Cases → Interface Adapters → Frameworks & Drivers`) con Dependency Rule: los imports apuntan solo hacia adentro; `Entities` no conocen nada externo; `Use Cases` no importan `Frameworks`.

La Dependency Rule se realiza mediante **puertos** (interfaces propiedad de `Use Cases`): `ValidatorPort`, `PasswordHasher`, `TokenSigner`, `FileStorage` y los `*Repository`. Los adapters (`BiblioValidator`, `BcryptHasher`, `JwtTokenSigner`, `DiskFileStorage`, `TypeOrm*Repository`) implementan esos puertos y viven en capas externas. Así, ni el dominio ni los UseCases dependen de crypto, HTTP o TypeORM.

## Responsibility assignment (GRASP)

- `*UseCase` — **Controller** (`Mission:` single entry point per system operation, UI stays thin): cada evento de sistema (UC-001..UC-006) entra por un UseCase, **un punto de entrada por evento**. Se agrupa por agregado (High Cohesion): `ManageMaterialUseCase` (material) y `ManageUsersUseCase` (cuenta/rol), cada uno con un método por flujo, en lugar de un único God-controller (rev. v0.5.1, BT-05 §4).
- Creación de agregados (`User.create`, `Material.create` + `FileBlob`) — **Creator** (`Mission:` one stable owner per lifecycle, no scattered `new`).
- Repositorios, `FileStorage`, `PasswordHasher`, `TokenSigner`, `ValidatorPort` como puertos — **Indirection** (`Mission:` both sides depend on something stable).
- `User.tokenVersion` — **Information Expert** (`Mission:` co-locate behavior with information): la cuenta conoce su versión de token; el guard compara y revoca (NFR-006, ADR-0004).

## Consequences

- **Positive**: dominio testeable sin DB ni HTTP (pirámide 80% unit); cascada BR-004 y guards en un solo lugar auditable; cambio de storage/ORM/crypto sin tocar UseCases; dependency-cruiser garantiza 0 imports framework en `entities/`/`usecases/`.
- **Negative / Costs**: más clases que un CRUD directo (8 UseCases/métodos, 7 puertos); curva de Dependency Rule para el equipo.
- **Risks**: God-controller si un UseCase absorbe varios flujos — mitigado con un UseCase por evento/agregado y revisión Low Coupling/High Cohesion (BT-05 §4 resuelto en rev. v0.5.1).

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| MVC clásico (Reenskaug) | Simple, menos clases | Reglas en controllers acoplados a NestJS | Viola Dependency Rule; NFR-004/006 no auditables en un punto |
| Hexagonal (Cockburn) | Puertos explícitos | Boilerplate de puertos/adaptadores extra | Poder equivalente; desproporcionado a escala lab CRUD |

## Compliance

Revisión de grafo de imports (`dependency-cruiser` o review): 0 imports de `@nestjs/*`/typeorm en `entities/` y `usecases/`. Cada UseCase mapea a su UC.

## Revision v0.5.1 (2026-10-16) — resolución BT-05/BT-06

- Crypto fuera de Entities: `AuthSession` es un Value Object transitorio; `verify`/`sign` viven en `PasswordHasher`/`TokenSigner` (BT-06 §2).
- `ValidatorPort` es puerto (UseCases), no adapter→UseCase (BT-06 §1).
- Un UseCase por agregado: `ManageMaterialUseCase` (C-1/C-3 + FR-013) + `ManageUsersUseCase` (C-2 + FR-011) (BT-05 §4).

## References

- FR-001..FR-013, NFR-003/004/006, RST-004, UC-001..UC-006
- `docs/agents/architecture.md`, `class-diagram.puml`, `sequence-diagram-UC-*.puml`
- ADR-0002 (Strategy), ADR-0004 (auth/revocación), ADR-0005 (cascada)
