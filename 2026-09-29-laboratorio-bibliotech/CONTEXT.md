# CONTEXT.md — BiblioTech (single-context)

> Vocabulario ubicuo promovido de `docs/01-discovery/glossary-draft.md` y refinado en `ooad-requirements`. Consumido por todos los skills: nombrar conceptos como aquí; si el término no existe, crear entrada o reconsiderar.

| Term | Definition | Synonyms to Avoid | Related | Rule / NFR | Source |
|------|------------|-------------------|---------|------------|--------|
| Biblioteca | Colección de material digital publicado en BiblioTech | Librería (física) | Material | — | PRD F-003 |
| Material bibliográfico | Publicación con dueño (metadatos: título/autor obligatorios; subject/year/edition/tags opcionales; ownerId + blobId) + un FileBlob 1:1 | Libro (papel), Sample | FileBlob, Biblioteca | RST-005; BR-002 todo logueado lee todo; BR-004 cascada | FR-004/FR-007, UC-002/UC-003/UC-004 |
| FileBlob | Binario PDF/EPUB ≤50MB (storageKey, fileName normalizado, mime, sizeBytes; contentHash informativo no-único). Sin dueño propio; nace y muere con su Material (1:1, sin refCount, sin compartir); duplicados permitidos, cada POST crea uno nuevo | Blob compartido, Archivo (solo) | Material, FileStorage | BR-004 cascada; RST-005; NFR-005 (fileName sin path/CRLF) | FR-004/FR-008, UC-002/UC-006 |
| Admin | Rol con acceso total a usuarios y material + blobs | Administrador genérico | Usuario | BR-004 | FR-011/FR-012, UC-004 |
| Professor | Rol que sube material; edita/elimina solo el propio + su blob; su borrado arrastra materials + blobs | Docente, Maestro | Material | BR-004 | FR-004/FR-013, UC-002/UC-004 |
| Student | Rol lector (toda lectura exige JWT) | Alumno | Material | BR-002 | FR-001/FR-007, UC-001/UC-003 |
| Usuario | Cuenta con email (único, 409 si duplicado) + password + rol (Admin/Professor/Student); auto-registro siempre Student | Cuenta | Sesión JWT | BR-003 | FR-001, UC-001/UC-004 |
| Sesión JWT | Token firmado (expira ≤24h) tras credenciales BCrypt (cost ≥10); cambio de rol/borrado de cuenta invalida los tokens vigentes | Token (solo) | Validator | NFR-003/NFR-004/NFR-006 | FR-002, UC-001/UC-004 |
| Validator | Módulo central de reglas (email, password, …) vía `class-validator` | Validador | Sesión, Usuario | BR-003 | FR-001/FR-002, UC-001 |
| Repository | Patrón de acceso a datos (TypeORM); sin SQL en controladores | DAO | MariaDB | RST-004 | FR-004/FR-006, todas UC |
| Upload | Ingesta Multer (`FileInterceptor`) con filtro MIME + límite; cada POST crea Material + FileBlob 1:1 nuevos, duplicados → 201 | Carga, Subida | Material, FileBlob | NFR-005, RST-005, BR-004 | FR-004, UC-002 |
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
| Transferencia / owner transfer | Cascada (C-1..C-3) | FR-014 eliminada v0.4.0; sin PATCH owner/transfer |
| Dedup global / 409-duplicado | Duplicados permitidos (201) | BR-007 eliminada v0.4.0 |
| Withdraw | DELETE (expunge) | Fuera v1, solo delete con cascada |

## Evolution Notes

- RUP: vivir por iteración; cambios vía `docs/02-requirements/CHANGELOG-RE.md`.
- v0.4.0: split Material/FileBlob 1:1 cascada dura; BR-004 reescrita; FR-014/BR-007 eliminadas; BR-006 → RST-004.
- v0.5.0 (2026-10-16): cierre CCB; `fileName` en FileBlob; email único (BR-003); revocación de tokens (NFR-006); sanitización de filename (NFR-005).
