# UC-004: Gestión Admin + transferencia de ownership (usuarios + material)

- **ID**: UC-004
- **Traced FRs**: FR-011, FR-012, FR-013, FR-014
- **Primary Actor**: Admin (Professor para transferencia propia y borrado propio)
- **Secondary Actors**: —
- **Precondition**: JWT válido; transfer/borrado de cuenta operan sobre Professor con/sin material a cargo según flujo
- **Success Postcondition**: usuario/material creado, modificado, transferido o eliminado
- **Priority**: Must
- **Source**: PRD F-004

## Main Flow (happy path)

1. Admin pide CRUD de usuario (alta/baja/cambio de rol) o de cualquier material.
2. Sistema verifica rol Admin (403 en otro caso).
3. Sistema valida datos (Validator) y aplica vía Repository.
4. Sistema responde 200/201/204.

## Transfer Flows (FR-014, v0.3.1)

| # | Flow |
|---|------|
| T-1 | Professor transfiere material propio a otro Professor: `PATCH /material/:id/owner` con `newOwnerId` (destino con rol Professor existente). Sistema verifica: caller es dueño (o Admin), destino es Professor válido, material existe. Efecto: `ownerId` pasa al destino. Responde 200. |
| T-2 | Borrado explícito de material propio: Professor puede `DELETE /material/:id` propio en cualquier momento (sin pasar por transferencia). |
| T-3 | Borrado de cuenta Professor: **precondición: sin material a cargo**. Si tiene material → 409 con lista de `materialIds` pendientes (debe transferir T-1 o borrar T-2 primero). Sin material → se elimina la cuenta (204). |
| T-4 | Admin fuerza transferencia: `PATCH /material/transfer` o por item con `fromProfessorId` + `toProfessorId` (+ lista opcional de ids; ausente = todos). Destino debe ser Professor. Responde 200 con conteo transferido. |

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 2a | No Admin (en flujos Admin) | 403 |
| 3a | Datos inválidos / email duplicado | 400/409 |
| 3a | Recurso inexistente | 404 |
| T-1a | Caller no dueño y no Admin | 403 |
| T-1a/T-4a | Destino inexistente o sin rol Professor | 400 (destino inválido, nada transferido) |
| T-3a | Cuenta Professor con material a cargo | 409 con `materialIds` pendientes, nada eliminado |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| E-001 | Eliminar cuenta Professor con material propio | 409 con pendientes; **sin cascada** (decisión v0.3.1: transferencia o borrado explícito primero; cascada descartada) |

## Associated Business Rules

- BR-004: Professor solo lo propio; Admin todo.
- BR-003/BR-006: validación + Repository.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-004 Gestión Admin
  Scenario: admin cambia rol
    Given JWT Admin y usuario existente
    When PATCH /users/:id con role=Professor
    Then 200 y rol efectivo en próximo login/token

  Scenario: admin elimina material ajeno
    Given JWT Admin
    When DELETE /material/:id de otro dueño
    Then 204

  Scenario: professor edita material propio
    Given JWT Professor dueño del material
    When PATCH /material/:id con metadatos válidos
    Then 200 y cambios persistidos

  Scenario: professor elimina material ajeno
    Given JWT Professor
    When DELETE /material/:id de otro dueño
    Then 403

  Scenario: professor transfiere material propio a otro professor
    Given JWT Professor dueño del material y Professor destino existente
    When PATCH /material/:id/owner con newOwnerId del destino
    Then 200 y ownerId efectivo es el destino

  Scenario: professor transfiere material ajeno
    Given JWT Professor no dueño del material
    When PATCH /material/:id/owner
    Then 403 y ownerId sin cambios

  Scenario: transferencia a destino no professor
    Given JWT Professor dueño y destino Student o inexistente
    When PATCH /material/:id/owner con ese newOwnerId
    Then 400 y nada transferido

  Scenario: borrado de cuenta professor con material a cargo
    Given cuenta Professor con 2 materiales y JWT Admin
    When DELETE /users/:id
    Then 409 con los 2 materialIds pendientes y cuenta intacta

  Scenario: borrado de cuenta professor sin material
    Given cuenta Professor sin material y JWT Admin
    When DELETE /users/:id
    Then 204

  Scenario: admin fuerza transferencia total
    Given Professor origen con 3 materiales, Professor destino y JWT Admin
    When PATCH /material/transfer con fromProfessorId y toProfessorId
    Then 200 con 3 transferidos y ownerId efectivo destino en los 3
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-004.puml` (en `ooad-architect`).

## Notes / Open

- [x] OQ-04 cerrada: Admin todo; Professor solo propio.
- v0.3.1: ownership transferible (T-1..T-4); E-001 sin cascada por decisión stakeholder.
