# UC-002: Subir material

- **ID**: UC-002
- **Traced FRs**: FR-004
- **Primary Actor**: Professor (Admin también puede)
- **Secondary Actors**: —
- **Precondition**: JWT con rol Professor/Admin; límites PDF/EPUB ≤50MB
- **Success Postcondition**: material + FileBlob 1:1 persistidos (binario guardado)
- **Priority**: Must
- **Source**: PRD F-002

## Metadata Fields

| Field | Required | Type / Rule | Source |
|-------|----------|-------------|--------|
| `title` | Yes | string, trim, 1–200 chars | FR-004 |
| `author` | Yes | string, trim, 1–120 chars | FR-004 |
| `subject` | No | string, trim, 1–120 chars | v0.3.0 |
| `year` | No | int, 1000–año actual | v0.3.0 |
| `edition` | No | string, trim, 1–40 chars (admite "2da", "rev.3") | v0.3.0 |
| `tags` | No | array ≤10, c/u lowercase-trim 1–30 chars, sin duplicados | v0.3.0 |

Fuera v1 (explícito): `category` (se solapa con `subject`); `similar_resources` almacenado (se deriva por autor/subject en UC-005).

## Blobs / Duplicados (v0.4.0)

- Cada `POST /material` crea un `Material` + un `FileBlob` 1:1 nuevos, aunque los bytes coincidan con otro material existente. Duplicados permitidos — nunca 409 por contenido.
- `contentHash` (SHA-256 de los bytes, si se calcula) es informativo, no único; no gobierna nada.

## Main Flow (happy path)

1. Professor envía archivo + metadatos (título/autor obligatorios; subject/year/edition/tags opcionales).
2. Sistema verifica rol (403 si Student).
3. Sistema valida MIME + tamaño vía Multer/Validator (antes de persistir) y valida metadatos vía `class-validator` (400 si inválidos).
4. Sistema guarda binario como FileBlob nuevo (FileStorage) y crea Material con ownerId + blobId.
5. Sistema responde 201 con metadatos (sin bytes).

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 3a | MIME no permitido o >50MB | 413/415 con mensaje, nada persistido |
| 3a | Metadatos inválidos (título/autor ausentes, year fuera de rango, tag inválido, subject largo) | 400 vía `class-validator`, nada persistido |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| E-001 | Fallo de escritura en storage | 500, rollback de metadatos |

## Associated Business Rules

- RST-004: persistencia solo vía Repository.
- BR-004 (v0.4.0): cada material nace con su propio FileBlob 1:1; duplicados permitidos.
- RST-005: PDF/EPUB ≤50MB.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: UC-002 Subir material
  Scenario: subida válida professor
    Given JWT Professor
    When POST /material con PDF + metadatos válidos
    Then 201 y material consultable

  Scenario: student intenta subir
    Given JWT Student
    When POST /material
    Then 403

  Scenario: archivo excede límite
    Given JWT Professor
    When POST /material con binario >50MB
    Then 413 y nada persistido

  Scenario: subida con metadatos opcionales válidos
    Given JWT Professor
    When POST /material con PDF + title/author + subject/year/edition/tags válidos
    Then 201 y material consultable con los opcionales persistidos

  Scenario: subida con año fuera de rango
    Given JWT Professor
    When POST /material con year=999
    Then 400 y nada persistido

  Scenario: subida de binario duplicado → dos recursos
    Given material existente con bytes B y JWT Professor
    When POST /material con bytes B (aunque el filename difiera)
    Then 201 con id y blobId nuevos y ambos materiales consultables
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-002.puml` (en `ooad-architect`).

## Notes / Open

- [ ] OQ-02 cerrada como supuesto lab (PDF/EPUB, 50MB); revalidable.
