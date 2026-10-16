# Raw Needs — BiblioTech (Elicitation)

> Fuente: `docs/01-discovery/*` + `docs/bibliotech.md`. Cada hallazgo con ID y fuente. Decisiones OQ-01–OQ-04 tomadas aquí (ver §6); OQ-05 ya decidida (NestJS + React + TS).

## FR — lo que el sistema hace

| ID | Necesidad | Fuente |
|----|-----------|--------|
| FR-001 | El sistema permite registrar usuarios (auto-registro fuerza `Student` e ignora cualquier `role` provisto por el cliente; Admin crea/promueve cualquier rol) | PRD F-001, OQ-01, v0.5.0 |
| FR-002 | El sistema autentica con email+password y emite sesión JWT (BCrypt) | PRD F-001, charter §3 |
| FR-003 | El sistema autoriza por rol (Admin/Professor/Student) cada endpoint | PRD F-001/F-004 |
| FR-004 | Professor sube material (archivo + metadatos: title/author obligatorios; subject/year/edition/tags opcionales) vía Multer; duplicados permitidos — cada POST crea Material + FileBlob 1:1 nuevos aunque los bytes coincidan | PRD F-002, charter req 4, v0.4.0 |
| FR-006 | El sistema expone catálogo consultable (exige JWT) | PRD F-003 |
| FR-007 | Lectura de material: exige JWT; todos los roles ven todo | PRD F-003 enmendado |
| FR-008 | Descarga del archivo original (exige JWT; 401 antes que 404; inline con filename; MIME pdf/epub; sin cap global v1 → streaming + rate-limit, ADR en architect) | PRD F-009 (Should), v0.3.0 |
| FR-009 | Búsqueda/filtrado de catálogo (q general **token/prefijo case-insensitive** sobre título+autor+subject, FULLTEXT; + author/subject/year/rango/edition/tag; AND entre params; envelope items/total/page/limit, defaults page=1 limit=10 max=50) | PRD F-008 (Should), v0.5.2 (BT-12) |
| FR-010 | Paginación de catálogo | PRD F-010 (Could) |
| FR-011 | Admin gestiona usuarios (alta/baja/cambio de rol) | PRD F-004, OQ-04 |
| FR-012 | Admin edita/elimina cualquier material | PRD F-004, OQ-04 |
| FR-013 | Professor edita/elimina su propio material (ownerId); eliminar material borra su FileBlob atado | PRD F-002, OQ-04 + aclaración stakeholder 2026-10-03, v0.4.0 |

_ELIMINADA v0.4.0 (ID estable, sin renumerar): FR-014 (transferencia de ownership — reemplazada por cascada BR-004)._

_ELIMINADAS en v0.2.0 (IDs estables, sin renumerar): BR-001 (flag obligatorio), BR-005 (ocultar privados a anónimos). FR-005 (flag por material) eliminada idem._

## NFR — calidad (ISO 25010, medibles)

| ID | Necesidad | Categoría | Métrica / Target | Fuente |
|----|-----------|-----------|------------------|--------|
| NFR-001 | Lectura autenticada p95 < 200ms en lab | Performance | p95, k6/Jest | PRD KPI |
| NFR-002 | Subida válida (≤50MB) completa < 60s | Performance | log inicio→201 | PRD KPI |
| NFR-003 | Passwords con BCrypt cost ≥ 10; JWT expira ≤ 24h | Security | config audit | Charter §3 |
| NFR-004 | Passwords nunca en claro ni en logs/respuestas | Security | test + review | Charter §3 |
| NFR-005 | MIME + tamaño validados antes de persistir | Security/Reliability | fixtures válidas/inválidas | Supuesto OQ-02, v0.4.0 |
| NFR-006 | Sin token → 401 en todo; el rol solo restringe mutación; cambio de rol/borrado de cuenta invalida los tokens vigentes | Security | matriz tests × rol + test revocación | PRD KPI, v0.5.0 |

## BR — reglas de negocio (no negociables)

| ID | Regla | Fuente |
|----|-------|--------|
| BR-002 | Sin token → 401 en todo (lectura incluida); el rol solo restringe mutación | Charter req 2 enmendado |
| BR-003 | Email con formato válido y único (duplicado → 409); password ≥ 8 chars (Validator central) | Charter req 7, v0.5.0 |
| BR-004 | Professor edita/elimina solo material propio + su FileBlob; Admin todo; borrar cuenta Professor borra en cascada sus Materials y sus FileBlobs; borrar material borra su FileBlob (1:1, sin refCount, sin transferencia) | OQ-04, v0.4.0 cascada |

_ELIMINADAS v0.4.0 (IDs estables, sin renumerar): BR-007 (dedup global con 409 — duplicados permitidos, cada POST crea FileBlob nuevo); BR-006 como BR (movida a RST-004 — no es negocio, es constraint de diseño)._

_ELIMINADAS en v0.2.0 (IDs estables, sin renumerar): BR-001 (flag obligatorio), BR-005 (ocultar privados a anónimos). FR-005 (flag por material) eliminada idem._

## RST — constraints

| ID | Constraint | Fuente |
|----|------------|--------|
| RST-001 | Backend Node 22 + TS + NestJS | PRD OQ-05 decidida |
| RST-002 | Frontend React + TS (Vite build, Vitest) separado, API REST | PRD OQ-05 decidida |
| RST-003 | MariaDB 11 como motor mínimo | Charter req 8 |
| RST-004 | Frontend/Backend separados; Validator/Filter central; sin SQL en controladores, acceso a datos solo vía Repository (ex-BR-006) | Charter req 5, 6, 7, v0.4.0 |
| RST-005 | Formatos aceptados PDF/EPUB, tamaño máximo 50MB (supuesto lab) | OQ-02 |

## §6 Decisiones que cierran OQ-01–OQ-04

- **OQ-01** → Student auto-registro + Admin crea usuarios de cualquier rol (FR-001).
- **OQ-02** → PDF/EPUB, 50MB máx (RST-005, NFR-002/005). Supuesto de laboratorio, revalidable.
- **OQ-03** → superseded en v0.2.0 (era BR-005; sin objeto tras Login-para-todo).
- **OQ-04** → BR-004 + FR-011/FR-012. Aclaración 2026-10-03: Professor modifica (edita/elimina) lo propio vía FR-013; Admin no necesita ser owner.
- **v0.4.0 cascada dura 1:1** → FR-014 eliminada (sin transferencia ni force-transfer); BR-004 reescrita con cascada (delete user → materials + blobs; delete material → blob); BR-007 eliminada (duplicados permitidos, copia nueva siempre); BR-006 movida a RST-004; Material + FileBlob 1:1 nacimiento-muerte juntos, sin refCount, sin withdraw v1.
- **v0.2.0 Login-para-todo** → OQ-03 sin objeto; BR-001/BR-005 y FR-005 eliminadas; BR-002 y FR-007 reescritas (todo exige JWT).
- **v0.5.0 cierre CCB (2026-10-16)** → BR-002 restaurada en SRS + RTM; unicidad de email codificada en BR-003 (409); auto-registro fuerza Student (BT-07); 403 de edición de material ajeno (BT-08); invalidación de token por cambio de rol/borrado de cuenta (BT-09, NFR-006); sanitización de `file_name` (BT-10, NFR-005); `file_name` (v0.4.1) baselinado (BT-02); trazabilidad NFR y Gherkin completados (BT-03/BT-04).
