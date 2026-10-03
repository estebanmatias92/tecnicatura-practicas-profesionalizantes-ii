# UC-003: Consultar catálogo y leer material

- **ID**: UC-003
- **Traced FRs**: FR-006, FR-007
- **Primary Actor**: Student / Professor / Admin (todos autenticados)
- **Secondary Actors**: —
- **Precondition**: JWT válido
- **Success Postcondition**: actor ve todo el material (sin distinción por rol)
- **Priority**: Must
- **Source**: PRD F-003

## Main Flow (happy path)

1. Actor pide catálogo o material por id con JWT.
2. Sistema verifica token (sin token → 401).
3. Sistema responde 200 con lo pedido (toda lectura autorizada a todo rol).

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 2a | Sin token o token inválido/expirado | 401 |
| 3a | Material inexistente | 404 |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| — | — | — |

## Associated Business Rules

- BR-002: sin token → 401 en todo; el rol solo restringe mutación.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-003 Leer material
  Scenario: student lee material ajeno
    Given JWT Student y material de otro dueño
    When GET /material/:id
    Then 200

  Scenario: lectura sin token
    Given material existente
    When GET /material/:id sin Authorization
    Then 401

  Scenario: token expirado
    Given JWT expirado
    When GET /material
    Then 401
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-003.puml` (en `ooad-architect`).

## Notes / Open

- [ ] Sin notas abiertas (v0.2.0 eliminó visibilidades; el ADR 401-vs-404 quedó sin objeto).
