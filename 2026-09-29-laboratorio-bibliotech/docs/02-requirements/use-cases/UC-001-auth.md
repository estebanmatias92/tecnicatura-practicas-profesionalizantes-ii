# UC-001: Autenticarse (registro + login)

- **ID**: UC-001
- **Traced FRs**: FR-001, FR-002, FR-003
- **Primary Actor**: Student / Professor / Admin
- **Secondary Actors**: —
- **Precondition**: Validator con reglas BR-003 cargadas
- **Success Postcondition**: actor con JWT válido (expira ≤24h)
- **Priority**: Must
- **Source**: PRD F-001

## Main Flow (happy path)

1. Actor envía email + password (+ rol si lo crea Admin).
2. Sistema valida formato vía Validator.
3. Sistema verifica credencial (registro: email único + hash BCrypt; login: compara hash).
4. Sistema emite JWT con `userId` + `role`.
5. Sistema responde 200/201 con token (nunca el password).

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 2a | Email/password inválidos | 400 con mensaje de Validator |
| 3a | Email duplicado (registro) | 409 |
| 3a | Credencial incorrecta (login) | 401 sin distinguir usuario/existe |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| E-001 | JWT expirado/manipulado | 401, frontend redirige a login |

## Associated Business Rules

- BR-003: email válido, password ≥ 8 (Validator central).
- BR-002: rutas protegidas exigen `Authorization: Bearer`; guard de rol tras verificar token.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-001 Autenticarse
  Scenario: registro student válido
    Given reglas BR-003 activas
    When POST /auth/register con email válido y password ≥ 8
    Then 201 con JWT y sin password en respuesta

  Scenario: login con password incorrecta
    Given usuario existente
    When POST /auth/login con password errónea
    Then 401 sin indicar si el email existe

  Scenario: acceso con rol insuficiente
    Given JWT válido de Student
    When POST /material (solo Professor/Admin)
    Then 403
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-001.puml` (en `ooad-architect`).

## Notes / Open

- [ ] OQ-01 cerrada: auto-registro Student + Admin crea cualquier rol.
