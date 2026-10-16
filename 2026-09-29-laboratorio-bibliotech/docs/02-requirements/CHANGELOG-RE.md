# CHANGELOG-RE — BiblioTech

## v0.5.1 — 2026-10-16 (cierre CCB architect post-challenge)

**Aprobados y baselinados** (`delta-arch → ooad-architect`), back-edge resuelto (aprobación de usuario 2026-10-16):

- **BT-05** modelo de diseño completado: operaciones faltantes (`findByEmail`, `User/Material/FileBlob.create`, `SearchCatalogUseCase.getById`, `updateMaterial`, `changeUserRole`, `listUsers`), orden verify/load corregido, UseCase por agregado (`ManageMaterialUseCase` + `ManageUsersUseCase`, no God-controller), rollback E-001 con compensación, realización de ADR-0002 (Strategy `Rule` + guards), ADR-0004 auth (JWT/BCrypt), `file_name` en FileBlob/FileStorage (normalizado).
- **BT-06** integridad arquitectónica: `ValidatorPort` en UseCases (Dependency Rule); crypto tras `PasswordHasher`/`TokenSigner` (Entities sin imports framework); FK de cascada corregida + **ADR-0005** (cascada/consistencia); índices `FULLTEXT`/`BTREE` + **ADR-0006**; claim 3NF calificado; C4 actors→UC; re-aprobación README (v0.5.1).
- **BT-11** NFR-005: `FileInterceptor` (memoryStorage + `limits` + `fileFilter`) valida en el borde antes del UseCase; secuencia UC-002 actualizada.
- **BT-09** (realización de diseño): revocación de tokens por `users.token_version` (`ver` en JWT) → **ADR-0004** (NFR-006, ventana 0).

- Impacto: `docs/03-architecture/` (`class-diagram`, `data-model-er`, `sequence-diagram-UC-001..006`, `c4-context`, `c4-container`, README, ADR-0001..0006), `RTM.csv` (filas desbloqueadas: `Designed`), `Makefile` (lista PUML).
- Verificación: `make docs` verde (todos los PUML → SVG); challenge fresco de arquitectura → `.scratch/challenge-architecture-2026-10-16.md` (re-ejecutado v0.5.1).

## CCB Requests — 2026-10-16 (`delta-spec`, resueltos en v0.5.0)

> Breakout tickets BT-01..BT-04 y BT-07..BT-10 en `.scratch/ccb-post-challenge/issues/`; aprobados y baselinados en v0.5.0 (abajo). BT-05/BT-06/BT-11 (`delta-arch`) resueltos en v0.5.1 (arriba).

## v0.5.0 — 2026-10-16 (cierre CCB RE post-challenge)

**Aprobados y baselinados** (`delta-spec → ooad-requirements`), tras `/ooad-challenge` (2026-10-16):

- **BT-01** BR-002 restaurada en `SRS.md` §3.1 (Business Rules) + fila RTM `BR-002`; coherencia con UC-001/003/005/006.
- **BT-02** `file_name` (v0.4.1) baselinado: `SRS.md` §5/§6, `crc-cards.md` (FileBlob/Validator), `conceptual-model.puml`(+svg), `CONTEXT.md`; reinspección Fagan v0.5.0.
- **BT-03** filas RTM `NFR-002`/`NFR-004`; métricas medibles en NFR-004/005; cobertura `NFR-001`/`NFR-006` ampliada a UC-005/006; wording `raw-needs` NFR-001 ("autenticada").
- **BT-04** Gherkin de ramas declaradas (409/E-001/415/404/500/503) + resultado vacío; trazas FR-006↔UC-005 y BR-003→UC-002 corregidas; unicidad de email en BR-003 (409); paso CRC corregido; procedencia FR-013 = OQ-04; texto SRS §1.2/§2.2 saneado; ADR reales en §3.2; FR-005/FR-014 y BR eliminadas documentadas.
- **BT-07** auto-registro fuerza `Student` e ignora `requestedRole` provisto por el cliente; Gherkin de no-escalada.
- **BT-08** 403 declarado para edición de material ajeno + escenario Gherkin `PATCH`.
- **BT-09** invalidación de tokens por cambio de rol/borrado de cuenta (NFR-006); realización de diseño en `ooad-architect`.
- **BT-10** sanitización de `file_name` (persistencia + `Content-Disposition`, basename sin CRLF); Gherkin.

**Pendientes** (`delta-arch → ooad-architect`, sin aprobar): BT-05, BT-06, BT-11.

- Impacto: `SRS.md`, `raw-needs.md`, `RTM.csv` (23 filas), `use-cases/UC-001..006`, `crc-cards.md`, `conceptual-model.puml/.svg`, `CONTEXT.md`, `validation.md`.
- Verificación: Fagan v0.5.0, 0 defectos RE abiertos (`validation.md`).

## CCB Requests cerrados — 2026-10-16 (`delta-arch`, resueltos en v0.5.1)

> Breakout tickets BT-05/BT-06/BT-11 en `.scratch/ccb-post-challenge/issues/`. **Aprobados por el usuario y baselinados en `ooad-architect` (v0.5.1, arriba).**
> BT-01..BT-04 y BT-07..BT-10 fueron aprobados y baselinados en v0.5.0.

- **BT-05** **Resuelto** — modelo de diseño completado (operaciones faltantes; orden verify/load; UseCase por agregado; rollback/compensación E-001; realización ADR-0002; ADR-0004 auth; `file_name` normalizado) → impacto: `class-diagram.puml`, `sequence-diagram-UC-*.puml`, `adrs/0004`.
- **BT-06** **Resuelto** — integridad: `ValidatorPort` en UseCases; crypto tras puertos; FK de cascada + `ADR-0005`; índices `FULLTEXT`/`BTREE` + `ADR-0006`; claim 3NF calificado; C4 actors→UC; re-aprobación README v0.5.1.
- **BT-11** **Resuelto** — orden interceptor→validación fijado (NFR-005): `sequence-diagram-UC-002.puml` + `class-diagram.puml`.

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
