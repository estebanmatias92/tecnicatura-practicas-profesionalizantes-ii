# ADR-0006: Estrategia de indexación para UC-005 (NFR-001 p95 <200ms)

- **Status**: Accepted
- **Date**: 2026-10-16
- **Deciders**: Tech Lead (aprobado por usuario 2026-10-16)
- **Consulted**: `docs/02-requirements/use-cases/UC-005-search.md` (query semantics), `SRS.md` §4 (NFR-001)

## Context

UC-005 exige: `q` **parcial case-insensitive** sobre title+author+subject (implementado con `LIKE '%…%'`), filtros de campo (`author`/`subject` parcial, `year` exacto, rango `yearFrom`/`yearTo`, `edition` exacto ci, `tag` repetible con `JSON_CONTAINS`), paginación con orden **más reciente primero**, y NFR-001 p95 <200ms. El ER previo declaraba un único `INDEX (title, author, subject, year)`, que **no puede** servir un `LIKE '%…%'` (leading wildcard), ni `created_at DESC`, ni `tags`. El claim "NFR-001 vía índices declarados" quedaba sin sustento (BT-06 §4).

## Decision

- **`q` (búsqueda de texto)**: `FULLTEXT INDEX (title, author, subject)` en MariaDB, consultado con `MATCH(...) AGAINST('término*' IN BOOLEAN MODE)` — **match por token/prefijo**. Esto **no** es equivalente a un substring infijo (`LIKE '%q%'`): FULLTEXT indexa palabras, no subcadenas internas. Se define por tanto la semántica de `q` como **token/prefijo case-insensitive**.
- **Reconciliación RE pendiente (delta-spec)**: `UC-005-search.md:20` declara `q` "parcial case-insensitive" (infijo). El substring infijo **no es index-servable** por ningún BTREE ni FULLTEXT; mantenerlo obliga a `LIKE '%q%'` (scan) y rompe NFR-001. Se levanta un follow-up para redefinir `q` como token/prefijo (o aceptar el scan como caso degradado). Hasta entonces, NFR-001 aplica a la ruta FULLTEXT token/prefijo, **no** al infijo.
- **Rango/orden**: `INDEX (year)` para `year`/`yearFrom`/`yearTo`; `INDEX (created_at)` para el orden v1 (más reciente primero).
- **`tags`**: se mantiene `JSON_CONTAINS(tags, ?)` (scan **best-effort**, no indexable de forma nativa en MariaDB 11 para AND de tags arbitrarios). Tradeoff aceptado a escala lab; si la métrica degrada, el plan de escape es columnas generadas + índices o tabla de tags (misma decisión que ADR-0003).
- **`author`/`subject`/`edition`**: `q` cubre author/subject por FULLTEXT; filtros exactos (`edition` ci) por `LOWER()` (índice funcional no portable → se acepta).
- La afirmación NFR-001 se **califica**: "q token/prefijo vía FULLTEXT; year/orden vía BTREE; tags e infijo best-effort (scan)". k6 mide p95 real contra MariaDB (GAP-003).

## Responsibility assignment (GRASP)

- `SearchCatalogUseCase` — **Controller** (`Mission:` single entry point per system operation): normaliza paginación y valida rangos; no conoce índices.
- `MaterialRepository` (adapter) — **Protected Variations** (`Mission:` predicted instability never leaks to clients): encapsula `FULLTEXT`/`JSON_CONTAINS`; cambiar la estrategia no toca el UseCase.

## Consequences

- **Positive**: NFR-001 respaldado por índices reales para `q` (token/prefijo) y orden; el ER ya no afirma algo falso; plan de escape documentado para `tags` e infijo.
- **Negative / Costs**: FULLTEXT ≠ `LIKE '%…%'` (infijo no indexable) → la semántica RE de `q` debe reconciliarse (delta-spec, arriba); FULLTEXT tiene stopwords/min-length configurables; `tags` sigue costando scan.
- **Risks**: collation/case-sensitivity y stopwords distintos a los fakes en memoria — cubierto por GAP-002 (`make test-db`).

## Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| `INDEX (title, author, subject, year)` (previo) | Simple | No sirve `%q%`, orden, tags | Claim NFR-001 insostenible (BT-06 §4) |
| `LIKE '%q%'` sin índice | Cero cambios | Full scan | Rompe p95 en catálogo grande |
| Tabla `tags` + join N:M indexado | `tags` indexable | Tabla + joins por ≤10 tags optativos | Desproporcionado (ADR-0003) |
| Motor externo (Elastic/Meilisearch) | Búsqueda avanzada | Infra extra | Fuera de alcance lab |

## Compliance

Esquema con FULLTEXT + BTREE en `data-model-er.puml`/migraciones; k6 `perf-catalog.js` (NFR-001) y `test-db` (GAP-002) contra MariaDB real. Traza: NFR-001, FR-009/FR-010, UC-005.

## References

- NFR-001; FR-009, FR-010; UC-005
- `data-model-er.puml`, `sequence-diagram-UC-005.puml`, ADR-0003
