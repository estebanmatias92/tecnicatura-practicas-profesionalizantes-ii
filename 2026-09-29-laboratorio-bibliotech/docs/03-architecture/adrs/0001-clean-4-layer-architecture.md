# ADR-0001: Clean 4 Layers como estilo de arquitectura

- **Status**: Accepted
- **Date**: 2026-10-13
- **Deciders**: Tech Lead + Stakeholder (aprobado por usuario 2026-10-13)
- **Consulted**: `docs/agents/architecture.md`, `docs/agents/workflow.md` (RUP)

## Context

BiblioTech debe aislar reglas de negocio (roles, cascada BR-004, validación BR-003) de NestJS/Multer/TypeORM para que un cambio de framework no reescriba el dominio. NFRs que motivan: NFR-003/004/006 (seguridad auditable en un solo lugar), NFR-001 (lectura rápida sin N+1), RST-004 (persistencia solo vía Repository), charter req 5 (separación Frontend/Backend) y req 7 (Validator central).

## Decision

Adoptar **Clean 4 Layers** (`Entities → Use Cases → Interface Adapters → Frameworks & Drivers`) con Dependency Rule: los imports apuntan solo hacia adentro; `Entities` no conocen nada externo; `Use Cases` no importan `Frameworks`.

## Responsibility assignment (GRASP)

- `*UseCase.execute()` — **Controller** (`Mission:` single entry point per system operation, UI stays thin): cada evento de sistema (UC-001..UC-006) entra por un UseCase, nunca por lógica en el controller HTTP.
- Creación de agregados (`User.create`, `Material.create` + `FileBlob`) — **Creator** (`Mission:` one stable owner per lifecycle, no scattered `new`).
- Repositorios y `FileStorage` como puertos — **Indirection** (`Mission:` both sides depend on something stable).

## Consequences

- **Positive**: dominio testeable sin DB ni HTTP (pirámide 80% unit); cascada BR-004 y guards en un solo lugar auditable; cambio de storage/ORM sin tocar UseCases.
- **Negative / Costs**: más clases que un CRUD directo (6 UseCases, 3 puertos); curva de Dependency Rule para el equipo.
- **Risks**: God-controller si un UseCase absorbe varios flujos — mitigado con un UseCase por flujo C-1/C-2/C-3 y revisión Low Coupling/High Cohesion.

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| MVC clásico (Reenskaug) | Simple, menos clases | Reglas en controllers acoplados a NestJS | Viola Dependency Rule; NFR-004/006 no auditables en un punto |
| Hexagonal (Cockburn) | Puertos explícitos | Boilerplate de puertos/adaptadores extra | Poder equivalente; desproporcionado a escala lab CRUD |

## Compliance

Revisión de grafo de imports (`dependency-cruiser` o review): 0 imports de `@nestjs/*`/typeorm en `entities/` y `usecases/`. Cada UseCase mapea a su UC.

## References

- FR-001..FR-013, NFR-003/004/006, RST-004, UC-001..UC-006
- `docs/agents/architecture.md`, `class-diagram.puml`, `sequence-diagram-UC-*.puml`
