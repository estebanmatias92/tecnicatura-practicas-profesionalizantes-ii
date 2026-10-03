# CHANGELOG-RE — BiblioTech

## v0.3.1 — 2026-10-03 (transferencia de ownership, sin cascada)

- Nueva FR-014: Professor transfiere material propio a otro Professor en cualquier momento (`PATCH /material/:id/owner`); borrado explícito propio sin transferencia previa; **borrado de cuenta Professor exige precondición sin material** (con material → 409 con pendientes); Admin fuerza transferencia de uno/todos los recursos entre Professors.
- E-001 UC-004 reescrito: cascada descartada por decisión stakeholder; BR-004 extendida; 7 escenarios Gherkin nuevos en UC-004.
- RTM 21 filas (nueva FR-014); CONTEXT Professor con transferir.

## v0.3.0 — 2026-10-03 (metadatos + filtros, hash-dedup, descarga sin cap)

- Metadatos v1: title/author obligatorios; subject/year/edition/tags opcionales (reglas en UC-002). `category` fuera (solapa con subject); `similar_resources` derivado vía UC-005, no almacenado.
- Filtros UC-005: q (título+autor+subject, parcial ci) + author/subject/year/rango/edition/tag repetible, AND entre params; `q` vacío = sin filtro; envelope `{items,total,page,limit}` (defaults 1/10, máx 50); orden v1 = más reciente.
- BR-007 dedup global: SHA-256 sobre los bytes (no el filename), constraint única, duplicado → 409 con existingId; PDF vs EPUB de la misma obra no se deduplica (limitación conocida). NFR-005 amplía fixtures a duplicadas. CRC: FileStorage calcula hash, MaterialRepository busca por contentHash.
- UC-006: 401 antes que 404; `Content-Disposition: inline` con filename; tabla MIME pdf/epub; sin `Range`/`ETag`/`HEAD` en v1 (supuesto). Cap de descargas simultáneas = Won't v1 (streaming + rate-limit por usuario/IP → ADR en architect; reevaluar con k6).
- RTM 20 filas (nueva BR-007); CONTEXT con contentHash/subject/tags y descartados category/similar-almacenado.

## v0.2.0 — 2026-10-03 (Login para todo, sin visibilidades)

- Decisión stakeholder + enmienda del charter (`docs/bibliotech.md` L5/L16/req 2): toda lectura/búsqueda exige JWT; cualquier rol ve todo; sin anónimos ni flags.
- Eliminadas BR-001/BR-005 y FR-005 (IDs estables, sin renumerar); reescritas BR-002, FR-007, UC-002/003/005/006; `Visibility` fuera del modelo; OQ-03 sin objeto; muere el ADR 401-vs-404.
- Hereda v0.1.1 (FR-013 ownership explícito).

- Aclaración stakeholder: Professor modifica (edita/elimina) material propio; Admin gestiona sin ser owner.
- Ya cubierto por BR-004; se explicita en FR-013 + caso positivo en UC-004 + fila RTM (20 filas).

## v0.1.0 — 2026-10-03 (baseline Elaboration)

- RE baseline: `raw-needs.md` (12 FR, 6 NFR, 6 BR, 5 RST), `SRS.md` híbrido, `UC-001..006` con Gherkin, `conceptual-model` + `context`, `crc-cards.md` (7 tarjetas), `RTM.csv` (19 filas), `CONTEXT.md` promovido.
- Decisiones: OQ-01 auto-registro+Admin; OQ-02 PDF/EPUB 50MB (supuesto lab); OQ-03 BR-005; OQ-04 Admin todo; OQ-05 NestJS+React+TS.
- Nota CCB: avance a requirements por orden explícita del usuario sin firma formal de PRD; firmas requeridas antes de `ooad-architect`.

## Formato CCB futuro

Request → impacto → approve/reject → nueva baseline versionada.
