# UC-005: Buscar, filtrar y paginar catálogo

- **ID**: UC-005
- **Traced FRs**: FR-009, FR-010 (apoya FR-006)
- **Primary Actor**: cualquier lector autenticado
- **Secondary Actors**: —
- **Precondition**: JWT válido
- **Success Postcondition**: página con lo pedido; toda consulta exige JWT
- **Priority**: Should (paginación Could)
- **Source**: PRD F-008, F-010

## Main Flow (happy path)

1. Actor pide `GET /material` con JWT y query opcional: `q`, `author`, `subject`, `year`, `yearFrom`, `yearTo`, `edition`, `tag` (repetible), `page`, `limit`.
2. Sistema verifica token (sin token → 401) y aplica filtros + paginación.
3. Sistema responde 200 con envelope `{items, total, page, limit}`.

## Query Semantics (v0.3.0)

- `q`: texto general sobre título+autor+subject; parcial, case-insensitive; `q` vacío/ausente = sin filtro de texto (no 400).
- Filtros de campo: `author`/`subject` parcial case-insensitive; `year` exacto; `yearFrom`/`yearTo` rango inclusivo (`yearFrom > yearTo` → 400); `edition` exacto case-insensitive; `tag` repetible (`?tag=a&tag=b` = contiene ambas).
- Combinación: AND entre params distintos. `similar_resources` no es campo almacenado: se deriva con estos filtros (mismo autor/subject).
- Paginación: defaults `page=1`, `limit=10`, `maxLimit=50`; `page < 1`, `limit < 1` o `limit > 50` → 400. Orden v1: más reciente primero; sin `sort` custom.
- Nota architect: índices en (title, author, subject, year, tags); NFR-001 p95 <200ms aplica.

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 2a | Parámetros inválidos (`page<1`, `limit<1`, `limit>50`, `yearFrom>yearTo`, year fuera de rango) | 400 con mensaje |

## Response Envelope

```json
{ "items": [ { "id": 1, "title": "…", "author": "…", "subject": "…", "year": 2020, "edition": "2da", "tags": ["redes"] } ], "total": 25, "page": 2, "limit": 10 }
```

## Exception Flows

| ID  | Error | Handling |
| --- | ----- | -------- |
| —   | —     | —        |

## Associated Business Rules

- BR-002: sin token → 401; el filtro de texto nunca sustituye auth.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-005 Buscar catálogo
  Scenario: búsqueda por título como student
    Given 3 materiales con "redes" en título (distintos dueños) y JWT Student
    When GET /material?q=redes
    Then 200 con los 3 y total consistente

  Scenario: búsqueda sin token
    Given materiales existentes
    When GET /material?q=redes sin token
    Then 401

  Scenario: paginación
    Given 25 materiales y JWT válido
    When GET /material?page=2&limit=10
    Then 200 con 10 items, total 25

  Scenario: q vacío no es error
    Given materiales existentes y JWT válido
    When GET /material?q=
    Then 200 con envelope y total consistente

  Scenario: filtro por tags múltiples (AND)
    Given materiales con tags variados y JWT válido
    When GET /material?tag=redes&tag=ospf
    Then 200 solo con los que contienen ambas

  Scenario: rango de años inválido
    Given JWT válido
    When GET /material?yearFrom=2020&yearTo=2010
    Then 400

  Scenario: límite excede máximo
    Given JWT válido
    When GET /material?limit=1000
    Then 400
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-005.puml` (en `ooad-architect`).

## Notes / Open

- Prioridad: FR-009 Should, FR-010 Could (paginación Could dentro de UC Should).
- v0.3.0: `category` fuera (solapa con `subject`); `similar_resources` derivado, no almacenado.
