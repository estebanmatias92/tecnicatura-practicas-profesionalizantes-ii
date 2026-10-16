# ADR-0002: Strategy para reglas de validación y filtros + Command para UseCases

- **Status**: Accepted (rev. v0.5.1 — realización de Strategy y guards)
- **Date**: 2026-10-13 (rev. 2026-10-16)
- **Deciders**: Tech Lead (aprobado por usuario 2026-10-13; rev. aprobada 2026-10-16)
- **Consulted**: `docs/02-requirements/crc-cards.md` (Validator, MaterialRepository)

## Context

Las reglas varían por flujo: BR-003 (email/password), RST-005/NFR-005 (MIME/tamaño), metadatos UC-002 (title/author + 4 opcionales, + `file_name` normalizado v0.5.0), filtros UC-005 (`q` + campos + paginación, AND). Con `if`-chains en controllers, cada regla nueva toca código probado (viola OCP) y esparce el conocimiento (feature envy). NFRs que motivan: NFR-005 (100% rechazo con fixtures + filename normalizado), NFR-001 (filtros con índices), NFR-006 (matriz 401/403 + revocación).

## Decision

**Strategy** (GoF conductual) detrás de `ValidatorPort` y de la composición de filtros de `SearchCatalogUseCase`; **Command** (GoF conductual) para los UseCases (un objeto con `execute`/método por flujo: Register, Login, Upload, Search, ManageMaterial, ManageUsers, Download); **Factory** vía DI de Nest para el cableado (creación configurada, solo en Frameworks).

`ValidatorPort` se realiza como **clases `Rule`** (`EmailRule`, `PasswordRule`, `FileRule`, `MetadataRule`, `FileNameRule`) detrás de la fachada `BiblioValidator implements ValidatorPort`: regla nueva = clase nueva, sin tocar callers (OCP). Los **guards** (`JwtAuthGuard`, `RolesGuard`) se realizan como adapters (Indirection), no como GoF Proxy/Decorator.

## Responsibility assignment (GRASP)

- Validator y estrategias de filtro — **Protected Variations** (`Mission:` predicted instability never leaks to clients) implementado con GoF **Strategy**; `ValidatorPort` en sí — **Pure Fabrication** (`Mission:` protect domain cohesion; all GoF patterns are fabrications of this kind).
- `*UseCase` como Command — **Controller** (`Mission:` single entry point per system operation) + GoF **Command** para invocación uniforme.
- Guards (`JwtAuthGuard`, `RolesGuard`) modelados como adapters (Indirection), no como GoF Proxy/Decorator — nombrar un patrón de moda sin fuerzas que lo pidan violaría la Mission de GoF.

## Consequences

- **Positive**: regla/filtro nuevo = clase nueva, sin tocar callers (OCP); matriz 401/403 + revocación centralizada y testeable con fixtures.
- **Negative / Costs**: más clases pequeñas (`Rule` por regla); interfaz de estrategia que mantener.
- **Risks**: sobre-ingeniería si se aplica a reglas estables — limitado a puntos de variación predichos (validación, filtros, filename).

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| `if`-chains en controllers | Menos clases | OCP violado; God-controller; feature envy | Cada regla nueva toca código probado |
| Observer para "eventos de dominio" | Desacople pub/sub | Sin consumidores (notificaciones fuera de alcance) | Sin fuerzas: BR/out-of-scope lo prohíbe en v1 |
| State para Material/FileBlob | Modela ciclos de vida | No hay máquina de estados (cascada = borrado, no estado) | Patrón por moda, sin problema real |
| Singleton en dominio | Acceso global | Estado global, tests frágiles | Scope de provider Nest en Frameworks en su lugar |
| Decorator para guards | Encadenar authz | Sin fuerzas: el pipeline de Nest ya compone guards | Proxy/Decorator sin problema a resolver |

## Compliance

Tests de borde por estrategia (fixtures MIME/tamaño/metadatos/filename → 400/413/415/500, nada persistido); Gherkin UC-002/UC-005 en verify. `class-diagram.puml` muestra `BiblioValidator ..|> ValidatorPort` y los guards como adapters.

## Revision v0.5.1 (2026-10-16) — realización de Strategy y guards

- `BiblioValidator implements ValidatorPort` con `Rule` classes; guards `JwtAuthGuard`/`RolesGuard` presentes (BT-05 §6, BT-06 §1/§8).

## References

- FR-004/FR-009/FR-010, NFR-001/005/006, BR-003, UC-002/UC-005
- GoF `Mission:` named, evaluated solutions with explicit tradeoffs — esta ADR registra problema, alternativa descartada y tradeoff aceptado por patrón.
