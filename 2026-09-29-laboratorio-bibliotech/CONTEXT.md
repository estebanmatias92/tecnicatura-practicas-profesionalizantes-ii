# CONTEXT.md — BiblioTech (single-context)

> Vocabulario ubicuo promovido de `docs/01-discovery/glossary-draft.md` y refinado en `ooad-requirements`. Consumido por todos los skills: nombrar conceptos como aquí; si el término no existe, crear entrada o reconsiderar.

| Term | Definition | Synonyms to Avoid | Related | Rule / NFR | Source |
|------|------------|-------------------|---------|------------|--------|
| Biblioteca | Colección de material digital publicado en BiblioTech | Librería (física) | Material | — | PRD F-003 |
| Material bibliográfico | Archivo (PDF/EPUB ≤50MB) + metadatos (título/autor obligatorios; subject/year/edition/tags opcionales) + contentHash SHA-256 de los bytes | Libro (papel), Sample | Biblioteca | RST-005; BR: todo logueado lee todo; BR-007 dedup global | FR-004/FR-007, UC-002/UC-003 |
| Admin | Rol con acceso total a usuarios y material | Administrador genérico | Usuario | BR-004 | FR-011/FR-012, UC-004 |
| Professor | Rol que sube material; edita/elimina/transfiere solo el propio | Docente, Maestro | Material | BR-004 | FR-004/FR-013/FR-014, UC-002/UC-004 |
| Student | Rol lector (toda lectura exige JWT) | Alumno | Material | BR-002 | FR-001/FR-007, UC-001/UC-003 |
| Usuario | Cuenta con email + password + rol (Admin/Professor/Student) | Cuenta | Sesión JWT | BR-003 | FR-001, UC-001/UC-004 |
| Sesión JWT | Token firmado (expira ≤24h) tras credenciales BCrypt (cost ≥10) | Token (solo) | Validator | NFR-003/NFR-004 | FR-002, UC-001 |
| Validator | Módulo central de reglas (email, password, …) vía `class-validator` | Validador | Sesión, Usuario | BR-003 | FR-001/FR-002, UC-001 |
| Repository | Patrón de acceso a datos (TypeORM); sin SQL en controladores | DAO | MariaDB | BR-006 | FR-004/FR-006, todas UC |
| Upload | Ingesta Multer (`FileInterceptor`) con filtro MIME + límite + SHA-256 de bytes y dedup global (409) | Carga, Subida | Material | NFR-005, RST-005, BR-007 | FR-004, UC-002 |
| ContentHash | SHA-256 hex de los bytes del binario (no del filename); único global; duplicado → 409 | Hash (solo) | Material, FileStorage | BR-007 | FR-004, UC-002 |
| Catálogo | Vista consultable/paginable del material (todo logueado ve todo; exige JWT). Filtros: q (título+autor+subject) + author/subject/year/rango/edition/tag, AND; envelope items/total/page/limit (defaults 1/10, máx 50) | Listado | Material | BR-002 | FR-006/FR-009/FR-010, UC-003/UC-005 |

## Discarded Terms

| Avoided Term | Use Instead | Reason |
|--------------|-------------|--------|
| Alumno | Student | Roles del charter en inglés |
| Docente / Maestro | Professor | Roles del charter en inglés |
| Libro | Material bibliográfico | Incluye PDF/EPUB, no solo papel |
| Carga / Subida (código) | Upload | Término Multer/Nest en código |
| Category | Subject (o nada) | Se solapa con subject; no crear dos taxonomías en v1 |
| Similar resources (almacenado) | Filtros UC-005 (mismo autor/subject) | Derivado, no relación almacenada en v1 |

## Evolution Notes

- RUP: vivir por iteración; cambios vía `docs/02-requirements/CHANGELOG-RE.md`.
