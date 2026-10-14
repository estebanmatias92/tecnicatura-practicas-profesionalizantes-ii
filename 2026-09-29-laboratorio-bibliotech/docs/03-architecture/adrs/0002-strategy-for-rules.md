# ADR-0002: Strategy para reglas de validación y filtros + Command para UseCases

- **Status**: Accepted
- **Date**: 2026-10-13
- **Deciders**: Tech Lead (aprobado por usuario 2026-10-13)
- **Consulted**: `docs/02-requirements/crc-cards.md` (Validator, MaterialRepository)

## Context

Las reglas varían por flujo: BR-003 (email/password), RST-005/NFR-005 (MIME/tamaño), metadatos UC-002 (title/author + 4 opcionales), filtros UC-005 (`q` + campos + paginación, AND). Con `if`-chains en controllers, cada regla nueva toca código probado (viola OCP) y esparce el conocimiento (feature envy). NFRs que motivan: NFR-005 (100% rechazo con fixtures), NFR-001 (filtros indexados), NFR-006 (matriz 401/403).

## Decision

**Strategy** (GoF conductual) detrás de `Validator` y de la composición de filtros de `SearchCatalogUseCase`; **Command** (GoF conductual) para los UseCases (un objeto con `execute(dto)` por flujo: Register, Login, Upload, Search, Manage, Download); **Factory** vía DI de Nest para el cableado (creación configurada, solo en Frameworks).

## Responsibility assignment (GRASP)

- Validator y estrategias de filtro — **Protected Variations** (`Mission:` predicted instability never leaks to clients) implementado con GoF **Strategy**; Validator en sí — **Pure Fabrication** (`Mission:` protect domain cohesion; all GoF patterns are fabrications of this kind).
- `*UseCase` como Command — **Controller** (`Mission:` single entry point per system operation) + GoF **Command** para invocación uniforme.
- Guards (`JwtAuthGuard`, `RolesGuard`) modelados como adapters (Indirection), no como GoF Proxy/Decorator — nombrar un patrón de moda sin fuerzas que lo pidan violaría la Mission de GoF.

## Consequences

- **Positive**: regla/filtro nuevo = clase nueva, sin tocar callers (OCP); matriz 401/403 centralizada y testeable con fixtures.
- **Negative / Costs**: más clases pequeñas; interfaz de estrategia que mantener.
- **Risks**: sobre-ingeniería si se aplica a reglas estables — limitado a puntos de variación predichos (validación, filtros).

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| `if`-chains en controllers | Menos clases | OCP violado; God-controller; feature envy | Cada regla nueva toca código probado |
| Observer para "eventos de dominio" | Desacople pub/sub | Sin consumidores (notificaciones fuera de alcance) | Sin fuerzas: BR/out-of-scope lo prohíbe en v1 |
| State para Material/FileBlob | Modela ciclos de vida | No hay máquina de estados (cascada = borrado, no estado) | Patrón por moda, sin problema real |
| Singleton en dominio | Acceso global | Estado global, tests frágiles | Scope de provider Nest en Frameworks en su lugar |

## Compliance

Tests de borde por estrategia (fixtures MIME/tamaño/metadatos → 400/413/415, nada persistido); Gherkin UC-002/UC-005 en verify.

## References

- FR-004/FR-009/FR-010, NFR-001/005/006, BR-003, UC-002/UC-005
- GoF `Mission:` named, evaluated solutions with explicit tradeoffs — esta ADR registra problema, alternativa descartada y tradeoff aceptado por patrón.
