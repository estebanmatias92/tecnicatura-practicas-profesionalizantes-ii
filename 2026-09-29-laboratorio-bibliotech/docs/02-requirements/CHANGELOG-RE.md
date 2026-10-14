# CHANGELOG-RE — BiblioTech

## v0.4.1 — 2026-10-14 (file_name UX para descarga)

- Nueva columna `file_blobs.file_name VARCHAR(255) NOT NULL`: persiste el nombre original del upload para `Content-Disposition: inline; filename="…"` (UC-006). Aditiva, sin renumerar: ningún FR/NFR cambia de sentido; la cascada 1:1 no se toca; RTM sin cambios.
- Rationale (decisión stakeholder 2026-10-14, cierra hueco de procedencia v0.3.0): el filename es el nombre del recurso para el usuario (metadato UX, nunca clave — BR-004 ya establecía que el hash se calcula sobre los bytes, no el filename). Alternativa descartada: nombre derivado `material-{id}.{ext}` (incumple "preserva filename original" de UC-006).
- Trazabilidad: UC-006 (línea v0.4.1) + `docs/03-architecture/data-model-er.puml` + `api/openapi.yaml` (ya describía filename).

## v0.4.0 — 2026-10-13 (cascada dura 1:1, sin dedup, sin transfer)

- Eliminadas FR-014 (transferencia/force-transfer, sin `PATCH owner/transfer`) y BR-007 (dedup global con 409 → duplicados permitidos, cada POST crea Material + FileBlob 1:1 nuevos con 201). BR-006 movida a RST-004 (constraint de diseño, no negocio).
- BR-004 reescrita: Professor edita/elimina solo lo propio + su blob; Admin todo; `DELETE user` Professor borra materials + blobs; `DELETE material` borra su blob. Sin precondición, sin 409-pendientes. UC-004 reescrito (flujos C-1..C-3, E-001 con rollback); UC-002 sin hash-dedup (escenario duplicado → 201+201).
- Modelo: split Material (publicación con ownerId+blobId) / FileBlob (storageKey, mime, size, hash informativo no-único) 1:1 `ON DELETE CASCADE`, sin refCount, sin withdraw v1. CRC: nueva FileBlob + FileBlobRepository; RTM 20 filas (BR-004 cascada, RST-004); CONTEXT con FileBlob y descartados transfer/dedup/withdraw; NFR-005 sin fixtures duplicadas.

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
