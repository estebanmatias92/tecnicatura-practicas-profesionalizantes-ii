# Validation — Fagan Inspection (RE baseline v0.4.0)

Inspección del analista sobre `raw-needs.md`, `SRS.md`, `UC-001..006`, `conceptual-model.puml`, `context.puml`, `crc-cards.md`, `RTM.csv`, `CONTEXT.md`. Checklist: complete, consistent, unambiguous, verifiable, traceable, correct, boundary defined.

Hallazgos v0.2.0: OQ-03 sin objeto (visibilidades eliminadas por decisión stakeholder Login-para-todo + enmienda del charter); BR-001/BR-005 y FR-005 eliminadas con IDs estables sin renumerar; FR-007/BR-002 reescritas (todo exige JWT); FR-013 (professor edita lo propio) con caso positivo. Cada FR/NFR tiene ID y criterio medible; cada UC trae Gherkin;
RTM cubre PRD→FR→UC→clase (19 filas); glosario en `CONTEXT.md` sin sinónimos en conflicto. Modelos re-renderizan con `make docs` (`plantuml -tsvg -pipe`, svg actualizados). Defectos Fagan abiertos: 0.

## Re-inspección v0.3.0 (metadatos + filtros, hash-dedup, descarga sin cap)

Alcance: UC-002, UC-005, UC-006 + `raw-needs` (BR-007), `SRS` (§3/§6), `conceptual-model.puml/.svg`, `crc-cards.md` (Material, MaterialRepository, Validator, FileStorage), `RTM.csv` (20 filas), `CONTEXT.md` (contentHash, subject/tags; descartados category/similar-almacenado), `CHANGELOG-RE.md`.

- Complete: UC-002 fija tabla de metadatos (title/author + 4 opcionales con reglas) y flujo 409-duplicado; UC-005 fija params, semántica AND, envelope con ejemplo y 400s; UC-006 fija MIME/inline, precedencia 401→404 y Won't-cap con mitigación.
- Consistent: BR-007 referenciada en raw-needs, SRS §6, UC-002, CRC y RTM; NFR-005 amplía a fixtures duplicadas; UC-005 aclara prioridad FR-009 Should / FR-010 Could.
- Unambiguous: contentHash definido como SHA-256 de los bytes (no del filename) en UC-002, CONTEXT y nota del modelo; limitación PDF-vs-EPUB documentada; `category` y `similar_resources` almacenado explícitamente fuera con alternativa derivada.
- Verifiable: 11 escenarios Gherkin nuevos (UC-002 ×3, UC-005 ×4, UC-006 ×3) con Given/When/Then ejecutables; constraint única contentHash como mecanismo de carrera concurrente.
- Traceable: RTM 20 filas (nueva BR-007 → Material/FileStorage/MaterialRepository); cada FR tocada traza a su UC.
- Correct/boundary: `conceptual-model.svg` re-renderizado (contiene contentHash); sin cambios de arquitectura ni código (puerta a `ooad-architect` intacta).

Defectos Fagan abiertos v0.3.0: 0.

## Re-inspección v0.3.1 (transferencia de ownership FR-014)

Alcance: UC-004 (flujos T-1..T-4, E-001 sin cascada, 7 escenarios Gherkin nuevos) + `raw-needs` (FR-014, BR-004 extendida), `SRS` (§3/§6), `RTM.csv` (21 filas), `CONTEXT.md` (Professor), `CHANGELOG-RE.md`.

- Complete: transferencia voluntaria, borrado explícito, precondición de borrado de cuenta con 409+pendientes y force-transfer Admin, todos con Gherkin.
- Consistent: BR-004/SRS §6/UC-004 E-001 dicen lo mismo (sin cascada); FR-014 traza a UC-004 y a Material;User.
- Unambiguous: destino debe ser Professor existente (si no → 400); 409 incluye materialIds; "todos" en force-transfer = sin lista de ids.
- Verifiable: 7 escenarios ejecutables; precondición verificable por conteo de material por ownerId.
- Traceable: RTM 21 filas; CONTEXT actualizado.

Defectos Fagan abiertos v0.3.1: 0. Firmas humanas PRD/SRS siguen pendientes; avance a `ooad-architect` por orden explícita del usuario (2026-10-03), como en v0.1.0.

## Re-inspección v0.4.0 (cascada dura 1:1, sin dedup, sin transfer)

Alcance: UC-002 (sin BR-007, duplicados → 201+201), UC-004 (flujos C-1..C-3, E-001 con rollback, FR-014 eliminada) + `raw-needs` (FR-004/BR-004 reescritas, BR-007/FR-014 eliminadas, BR-006 → RST-004, NFR-005 sin duplicadas), `SRS` (§3/§5/§6), `conceptual-model.puml/.svg` (split Material/FileBlob 1:1 CASCADE), `crc-cards.md` (FileBlob, FileBlobRepository), `RTM.csv` (20 filas con BR-004/RST-004), `CONTEXT.md` (FileBlob, descartados transfer/dedup/withdraw), `CHANGELOG-RE.md`.

- Complete: cascada delete-user y delete-material con blob, duplicados con 201, todos con Gherkin (UC-002 ×1 nuevo, UC-004 ×3 cascada).
- Consistent: BR-004/raw-needs/SRS §6/UC-004 E-001 dicen lo mismo (cascada dura); ningún doc exige transfer, 409-duplicado ni precondición sin material.
- Unambiguous: 1:1 nacimiento-muerte juntos, sin refCount, sin compartir blob, sin withdraw v1; contentHash informativo no-único.
- Verifiable: escenarios ejecutables (GET material/file → 404 tras cascada; doble POST mismos bytes → 2 ids/blobIds).
- Traceable: RTM 20 filas (BR-004 → User;Material;FileBlob; RST-004 → repositories); cada FR viva traza a su UC.

Defectos Fagan abiertos v0.4.0: 0.

Proceso pendiente (no defecto del contenido): firmas formales de PRD y SRS siguen abiertas; el avance fue por decisión explícita del usuario (2026-10-03), registrada en `CHANGELOG-RE.md`. Puerta RUP: requerir firmas antes de `ooad-architect`.
| Role | Date | Signature |
|------|------|-----------|
| Analyst (agent) | 2026-10-03 | Fagan passed, 0 open defects |
| Stakeholder | | |
| Tech Lead | | |
