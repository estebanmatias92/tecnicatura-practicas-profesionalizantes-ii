# UC-006: Descargar archivo original

- **ID**: UC-006
- **Traced FRs**: FR-008 (apoya FR-007)
- **Primary Actor**: lector autenticado
- **Secondary Actors**: —
- **Precondition**: JWT válido; material existente
- **Success Postcondition**: bytes del archivo entregados con MIME correcto
- **Priority**: Should
- **Source**: PRD F-009

## Main Flow (happy path)

1. Actor pide `GET /material/:id/file` con JWT.
2. Sistema verifica token primero (sin token → 401 aunque el id no exista).
3. Sistema resuelve material (inexistente → 404) y sirve binario desde FileStorage con `Content-Type` + `Content-Disposition: inline; filename="…"`.
4. Sistema responde 200.

## Headers / MIME (v0.3.0)

| Extensión | Content-Type | Disposition |
|-----------|--------------|-------------|
| `.pdf` | `application/pdf` | `inline; filename="…"` (preserva filename original) |
| `.epub` | `application/epub+zip` | `inline; filename="…"` |

Sin `Range`/`ETag`/`Last-Modified`/`HEAD` en v1 (supuesto escrito, revalidable).

## Concurrency (v0.3.0, decisión)

Sin cap global de descargas simultáneas en v1 (Won't): escala de laboratorio; contador en memoria no escala horizontalmente y un semáforo distribuido es desproporcionado. Mitigación v1: **streaming sin buffer + rate-limit por usuario/IP** (a formalizar en ADR en `ooad-architect`); reevaluar con k6 (NFR-001/002) en verify.

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 2a | Sin token (aunque el id no exista) | 401 primero |
| 3a | Material inexistente (con JWT válido) | 404 |
| 3b | Binario huérfano (metadatos sin archivo) | 500 + log (inconsistencia) |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| E-001 | Storage caído | 503 |

## Associated Business Rules

- BR-002: la descarga exige JWT como toda lectura.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-006 Descargar archivo
  Scenario: descarga con JWT
    Given material con binario y JWT Student
    When GET /material/:id/file
    Then 200 con Content-Type application/pdf

  Scenario: descarga sin token
    Given material existente
    When GET /material/:id/file sin token
    Then 401

  Scenario: descarga EPUB preserva tipo y nombre
    Given material EPUB con binario y JWT Student
    When GET /material/:id/file
    Then 200 con Content-Type application/epub+zip y Content-Disposition inline con filename

  Scenario: id inexistente con token válido
    Given JWT válido e id inexistente
    When GET /material/:id/file
    Then 404

  Scenario: id inexistente sin token
    Given id inexistente
    When GET /material/:id/file sin token
    Then 401 (auth primero)
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-006.puml` (en `ooad-architect`).

## Notes / Open

- UC-003 devuelve metadatos; UC-006 devuelve bytes (distinción v0.3.0).
- Cap de descargas simultáneas: Won't v1 → ADR + rate-limit en architect.
