# Raw Needs — BiblioTech (Elicitation)

> Fuente: `docs/01-discovery/*` + `docs/bibliotech.md`. Cada hallazgo con ID y fuente. Decisiones OQ-01–OQ-04 tomadas aquí (ver §6); OQ-05 ya decidida (NestJS + React + TS).

## FR — lo que el sistema hace

| ID | Necesidad | Fuente |
|----|-----------|--------|
| FR-001 | El sistema permite registrar usuarios (Student auto-registro; Admin crea cualquier rol) | PRD F-001, OQ-01 |
| FR-002 | El sistema autentica con email+password y emite sesión JWT (BCrypt) | PRD F-001, charter §3 |
| FR-003 | El sistema autoriza por rol (Admin/Professor/Student) cada endpoint | PRD F-001/F-004 |
| FR-004 | Professor sube material (archivo + metadatos: title/author obligatorios; subject/year/edition/tags opcionales) vía Multer; dedup por SHA-256 de los bytes → 409 | PRD F-002, charter req 4, v0.3.0 |
| FR-006 | El sistema expone catálogo consultable (exige JWT) | PRD F-003 |
| FR-007 | Lectura de material: exige JWT; todos los roles ven todo | PRD F-003 enmendado |
| FR-008 | Descarga del archivo original (exige JWT; 401 antes que 404; inline con filename; MIME pdf/epub; sin cap global v1 → streaming + rate-limit, ADR en architect) | PRD F-009 (Should), v0.3.0 |
| FR-009 | Búsqueda/filtrado de catálogo (q general + author/subject/year/rango/edition/tag; AND entre params; envelope items/total/page/limit, defaults page=1 limit=10 max=50) | PRD F-008 (Should), v0.3.0 |
| FR-010 | Paginación de catálogo | PRD F-010 (Could) |
| FR-011 | Admin gestiona usuarios (alta/baja/cambio de rol) | PRD F-004, OQ-04 |
| FR-012 | Admin edita/elimina cualquier material | PRD F-004, OQ-04 |
| FR-013 | Professor edita/elimina su propio material (ownerId) | PRD F-002, OQ-04 + aclaración stakeholder 2026-10-03 |
| FR-014 | Transferencia de ownership: Professor transfiere material propio a otro Professor en cualquier momento; borrado de cuenta Professor exige precondición sin material (si no → 409); Admin fuerza transferencia de uno/todos los recursos entre Professors | v0.3.1, decisión stakeholder 2026-10-03 |

## NFR — calidad (ISO 25010, medibles)

| ID | Necesidad | Categoría | Métrica / Target | Fuente |
|----|-----------|-----------|------------------|--------|
| NFR-001 | Lectura pública p95 < 200ms en lab | Performance | p95, k6/Jest | PRD KPI |
| NFR-002 | Subida válida (≤50MB) completa < 60s | Performance | log inicio→201 | PRD KPI |
| NFR-003 | Passwords con BCrypt cost ≥ 10; JWT expira ≤ 24h | Security | config audit | Charter §3 |
| NFR-004 | Passwords nunca en claro ni en logs/respuestas | Security | test + review | Charter §3 |
| NFR-005 | MIME + tamaño + SHA-256 duplicado validados antes de persistir | Security/Reliability | fixtures válidas/inválidas + duplicadas | Supuesto OQ-02, v0.3.0 |
| NFR-006 | Sin token → 401 en todo; el rol solo restringe mutación | Security | matriz tests × rol | PRD KPI |

## BR — reglas de negocio (no negociables)

| ID | Regla | Fuente |
|----|-------|--------|
| BR-002 | Sin token → 401 en todo (lectura incluida); el rol solo restringe mutación | Charter req 2 enmendado |
| BR-003 | Email con formato válido; password ≥ 8 chars (Validator central) | Charter req 7 |
| BR-004 | Professor edita/elimina/transfiere solo material propio; Admin todo (incluye force-transfer); borrar cuenta Professor exige precondición sin material (sin cascada) | OQ-04, v0.3.1 |
| BR-006 | Sin SQL en controladores; acceso a datos solo vía Repository | Charter req 6 |
| BR-007 | Dedup global por SHA-256 de los bytes del binario (no del filename); duplicado → 409 con existingId, nada persistido | v0.3.0 |

_ELIMINADAS en v0.2.0 (IDs estables, sin renumerar): BR-001 (flag obligatorio), BR-005 (ocultar privados a anónimos). FR-005 (flag por material) eliminada idem._

## RST — constraints

| ID | Constraint | Fuente |
|----|------------|--------|
| RST-001 | Backend Node 22 + TS + NestJS | PRD OQ-05 decidida |
| RST-002 | Frontend React + TS (Vite build, Vitest) separado, API REST | PRD OQ-05 decidida |
| RST-003 | MariaDB 11 como motor mínimo | Charter req 8 |
| RST-004 | Frontend/Backend separados; Validator/Filter central | Charter req 5, 7 |
| RST-005 | Formatos aceptados PDF/EPUB, tamaño máximo 50MB (supuesto lab) | OQ-02 |

## §6 Decisiones que cierran OQ-01–OQ-04

- **OQ-01** → Student auto-registro + Admin crea usuarios de cualquier rol (FR-001).
- **OQ-02** → PDF/EPUB, 50MB máx (RST-005, NFR-002/005). Supuesto de laboratorio, revalidable.
- **OQ-03** → superseded en v0.2.0 (era BR-005; sin objeto tras Login-para-todo).
- **OQ-04** → BR-004 + FR-011/FR-012. Aclaración 2026-10-03: Professor modifica (edita/elimina) lo propio vía FR-013; Admin no necesita ser owner.
- **v0.2.0 Login-para-todo** → OQ-03 sin objeto; BR-001/BR-005 y FR-005 eliminadas; BR-002 y FR-007 reescritas (todo exige JWT).
