# UC-004: Gestión Admin + gestión propia Professor (usuarios + material, cascada)

- **ID**: UC-004
- **Traced FRs**: FR-011, FR-012, FR-013
- **Primary Actor**: Admin (Professor para borrado/edición propios)
- **Secondary Actors**: —
- **Precondition**: JWT válido
- **Success Postcondition**: usuario/material creado, modificado o eliminado (con su FileBlob)
- **Priority**: Must
- **Source**: PRD F-004

## Main Flow (happy path)

1. Admin pide CRUD de usuario (alta/baja/cambio de rol) o de cualquier material.
2. Sistema verifica rol Admin (403 en otro caso).
3. Sistema valida datos (Validator) y aplica vía Repository.
4. Sistema responde 200/201/204.

## Cascade Flows (BR-004 v0.4.0)

| # | Flow |
|---|------|
| C-1 | Professor borra material propio: `DELETE /material/:id` propio → borra Material + su FileBlob atado (204). Material ajeno → 403. |
| C-2 | Borrado de cuenta Professor: `DELETE /users/:id` borra en cascada la cuenta + todos sus Materials + cada FileBlob atado (204). Sin precondición, sin 409-pendientes, sin transferencia. |
| C-3 | Admin borra cualquier material: `DELETE /material/:id` → borra Material + su FileBlob (204). |

Sin `PATCH /material/:id/owner` ni `PATCH /material/transfer` en v1 (FR-014 eliminada).

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 2a | No Admin (en flujos Admin) | 403 |
| 3a | Datos inválidos / email duplicado | 400/409 |
| 3a | Recurso inexistente | 404 |
| C-1a | Caller no dueño y no Admin | 403, nada eliminado |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| E-001 | Fallo al borrar blob en cascada | 500, rollback de la transacción (ni usuario ni materials eliminados) |

## Associated Business Rules

- BR-004 (v0.4.0): Professor solo lo propio + su blob; Admin todo; cascada dura 1:1; sin transferencia.
- BR-003/RST-004: validación + Repository.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-004 Gestión Admin
  Scenario: admin cambia rol
    Given JWT Admin y usuario existente
    When PATCH /users/:id con role=Professor
    Then 200 y rol efectivo en próximo login/token

  Scenario: admin elimina material ajeno + su blob
    Given JWT Admin y material con blob
    When DELETE /material/:id de otro dueño
    Then 204 y GET material → 404 y GET file → 404

  Scenario: professor edita material propio
    Given JWT Professor dueño del material
    When PATCH /material/:id con metadatos válidos
    Then 200 y cambios persistidos

  Scenario: professor elimina material ajeno
    Given JWT Professor
    When DELETE /material/:id de otro dueño
    Then 403 y material intacto

  Scenario: professor elimina material propio + su blob
    Given JWT Professor dueño del material con blob
    When DELETE /material/:id propio
    Then 204 y GET material → 404 y GET file → 404

  Scenario: borrado de cuenta professor con material a cargo → cascada
    Given cuenta Professor con 2 materiales + blobs y JWT Admin
    When DELETE /users/:id
    Then 204 y los 2 materiales → 404 y sus blobs inexistentes

  Scenario: borrado de cuenta professor sin material
    Given cuenta Professor sin material y JWT Admin
    When DELETE /users/:id
    Then 204
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-004.puml` (en `ooad-architect`).

## Notes / Open

- [x] OQ-04 cerrada: Admin todo; Professor solo propio.
- v0.4.0: FR-014 eliminada; E-001 con cascada dura 1:1 Material:FileBlob por decisión stakeholder. Sin withdraw v1.
