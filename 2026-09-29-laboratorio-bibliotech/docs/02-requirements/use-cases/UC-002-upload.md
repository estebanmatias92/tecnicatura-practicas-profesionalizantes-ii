# UC-002: Subir material

- **ID**: UC-002
- **Traced FRs**: FR-004
- **Primary Actor**: Professor (Admin también puede)
- **Secondary Actors**: —
- **Precondition**: JWT con rol Professor/Admin; límites PDF/EPUB ≤50MB
- **Success Postcondition**: material persistido con metadatos + binario guardado
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

## Content Hash / Dedup (BR-007)

- `contentHash` = SHA-256 hex (64 chars) calculado sobre **los bytes del binario** (stream del temp de Multer, `node:crypto`), nunca sobre el filename. Dos nombres distintos con mismos bytes → mismo hash; mismo nombre con bytes distintos → hash distinto.
- Alcance global (cualquier dueño). Misma obra en PDF vs EPUB → hashes distintos → no se deduplica (dedup por bytes, no por obra; limitación conocida).
- Carrera concurrente (dos subidas idénticas a la vez): la constraint única en DB sobre `contentHash` se mapea a 409.

## Main Flow (happy path)

1. Professor envía archivo + metadatos (título/autor obligatorios; subject/year/edition/tags opcionales).
2. Sistema verifica rol (403 si Student).
3. Sistema valida MIME + tamaño vía Multer/Validator (antes de persistir) y valida metadatos vía `class-validator` (400 si inválidos).
4. Sistema calcula SHA-256 sobre los bytes; si el hash ya existe → 409 con `{existingId}`, borra el temp, nada persistido.
5. Sistema guarda binario (FileStorage) y crea Material con ownerId + contentHash.
6. Sistema responde 201 con metadatos (sin bytes).

## Alternative Flows

| Step | Condition | Action |
|------|-----------|--------|
| 3a | MIME no permitido o >50MB | 413/415 con mensaje, nada persistido |
| 3a | Metadatos inválidos (título/autor ausentes, year fuera de rango, tag inválido, subject largo) | 400 vía `class-validator`, nada persistido |
| 4a | SHA-256 de los bytes ya existe (global, cualquier dueño) | 409 con `{existingId}`, borra temp, nada persistido |

## Exception Flows

| ID | Error | Handling |
|----|-------|----------|
| E-001 | Fallo de escritura en storage | 500, rollback de metadatos |

## Associated Business Rules

- BR-006: persistencia solo vía Repository.
- BR-007: dedup global por SHA-256 de los bytes (no del filename); duplicado → 409.
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

  Scenario: subida de binario duplicado
    Given material existente con SHA-256 H y JWT Professor
    When POST /material con bytes cuyo SHA-256 es H (aunque el filename difiera)
    Then 409 con existingId y nada persistido
```

## Sequence Diagram

See `../../03-architecture/sequence-diagram-UC-002.puml` (en `ooad-architect`).

## Notes / Open

- [ ] OQ-02 cerrada como supuesto lab (PDF/EPUB, 50MB); revalidable.
