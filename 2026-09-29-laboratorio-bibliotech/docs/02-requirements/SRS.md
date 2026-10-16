# Software Requirements Specification (SRS) — BiblioTech (híbrido RUP)

## 1. Introduction

### 1.1 Purpose

Baseline de requerimientos (Elaboration) para diseñar y construir BiblioTech. Audiencia: stakeholder, tech lead, equipo `ooad-architect`/`ooad-build`.

### 1.2 Scope

Plataforma web de libros digitales: auth por roles (JWT), subida (Multer), lectura autenticada (todos los roles ven todo; sin visibilidades), gestión Admin, catálogo con búsqueda/paginación, persistencia MariaDB. No incluye: préstamos, reservas, multas, notificaciones, editor de contenido, DRM, lectura offline, multi-idioma, SSO externo.

### 1.3 Definitions and Glossary

See [`../../CONTEXT.md`](../../CONTEXT.md) (canónico), `glossary.md` (baseline RE) y `docs/01-discovery/glossary-draft.md` (borrador).

## 2. General Description

### 2.1 Product Perspective

NestJS + React + TS, Frontend/Backend separados vía REST. Contexto en `context.puml`; modelo en `conceptual-model.puml`.

### 2.2 Main Features

Auth JWT+BCrypt (UC-001), subida Professor (UC-002), lectura autenticada (UC-003), gestión Admin (UC-004), búsqueda/paginación (UC-005), descarga (UC-006).

### 2.3 Constraints

| ID | Description | Source |
|----|-------------|--------|
| RST-001 | Backend Node 22 + TS + NestJS | PRD OQ-05 |
| RST-002 | Frontend React + TS (Vite, Vitest), API REST | PRD OQ-05 |
| RST-003 | MariaDB 11 mínimo | Charter req 8 |
| RST-004 | F/B separados; Validator central; acceso a datos solo vía Repository | Charter req 5, 6, 7 |
| RST-005 | PDF/EPUB ≤ 50MB (supuesto lab) | OQ-02 |

## 3. Functional Requirements

| ID | Description | Source (PRD/UC) | Priority | Dependency |
|----|-------------|-----------------|----------|------------|
| FR-001 | Registrar usuarios (auto-registro fuerza `Student` e ignora cualquier rol provisto por el cliente; solo un Admin autenticado crea/promueve otros roles) | F-001 / UC-001 | Must | — |
| FR-002 | Login emite JWT (BCrypt, expira ≤24h) | F-001 / UC-001 | Must | FR-001 |
| FR-003 | Autorización por rol en cada endpoint | F-001 / UC-001..004 | Must | FR-002 |
| FR-004 | Professor (y Admin, control total) sube archivo + metadatos (title/author + subject/year/edition/tags opcionales; duplicados permitidos — cada POST crea Material + FileBlob 1:1 nuevos) | F-002 / UC-002 | Must | FR-003 |
| FR-006 | Catálogo consultable (exige JWT) | F-003 / UC-003 | Must | FR-003 |
| FR-007 | Lectura exige JWT; todos los roles ven todo | F-003 / UC-003 | Must | FR-003 |
| FR-008 | Descarga del original (exige JWT; 401 primero; inline; sin cap global v1) | F-009 / UC-006 | Should | FR-007 |
| FR-009 | Búsqueda/filtrado de catálogo (q **token/prefijo** vía FULLTEXT + campos, AND, envelope paginado) | F-008 / UC-005 | Should | FR-006 |
| FR-010 | Paginación de catálogo | F-010 / UC-005 | Could | FR-006 |
| FR-011 | Admin CRUD usuarios (borrar Professor borra en cascada sus materials + blobs) | F-004 / UC-004 | Must | FR-003 |
| FR-012 | Admin CRUD cualquier material (borrar material borra su blob) | F-004 / UC-004 | Must | FR-003 |
| FR-013 | Professor edita/elimina material propio + su blob | OQ-04 / UC-004 | Must | FR-003, FR-004 |

_METADATOS v0.3.0 (procedencia: stakeholder 2026-10-03): FR-004 amplía metadatos a subject/year/edition/tags; FR-009 amplía filtros a author/subject/year/rango/edition/tag. Enmiendan el texto PRD F-002/F-008 ("título/autor"), ratificadas en `CHANGELOG-RE.md` v0.3.0._

_ELIMINADAS (IDs estables, sin renumerar): FR-005 (flag de visibilidad) y BR-001/BR-005 en v0.2.0; FR-014 (transferencia de ownership) en v0.4.0 — reemplazada por cascada BR-004._

Criterio de aceptación por FR: ver UC correspondiente (Gherkin).

## 3.1 Business Rules

| ID | Rule | Source | Priority |
|----|------|--------|----------|
| BR-002 | Sin token → 401 en todo (lectura incluida); el rol solo restringe mutación | Charter req 2 enmendado (v0.2.0) | Must |
| BR-003 | Email con formato válido y único (duplicado → 409); password ≥ 8 chars (Validator central) | Charter req 7 | Must |
| BR-004 | Professor edita/elimina solo material propio + su FileBlob; Admin todo; borrar cuenta Professor borra en cascada sus Materials + FileBlobs; borrar material borra su FileBlob (1:1, sin refCount, sin transferencia) | OQ-04, v0.4.0 cascada | Must |

_ELIMINADAS (IDs estables, sin renumerar): BR-001/BR-005 (v0.2.0); BR-006 → RST-004 y BR-007 (v0.4.0)._

## 3.2 Traceability Matrix (excerpt)

| FR | UC | Conceptual Class | ADR |
|----|----|------------------|-----|
| FR-001/002 | UC-001 | User, AuthSession | ADR-0001; ADR-0002 |
| FR-004 | UC-002 | Material, FileBlob, FileStorage | ADR-0001; ADR-0002; ADR-0003 |
| FR-006/007 | UC-003 | Material | ADR-0001; ADR-0003 |
| FR-011/012/013 | UC-004 | User, Material, FileBlob | ADR-0001; ADR-0003 (cascada) |

Full RTM at `RTM.csv`.

## 4. Non-Functional Requirements (measurable)

| ID | Description | Category (ISO25010) | Metric | Target | How Verified |
|----|-------------|---------------------|--------|--------|--------------|
| NFR-001 | Lectura autenticada rápida | Performance | p95 de latencia GET (catálogo y búsqueda) | <200ms lab | k6/Jest en verify |
| NFR-002 | Subida ≤50MB completa | Performance | duración POST inicio→201 | <60s | log inicio→201 |
| NFR-003 | Hash + expiración sesión | Security | BCrypt cost; expiración JWT | BCrypt ≥10, JWT ≤24h | audit config |
| NFR-004 | Sin secretos en claro/logs | Security | ocurrencias de secretos/passwords en claro en código, logs y respuestas | 0 | tests + review |
| NFR-005 | MIME/tamaño sanitizados antes de persistir; `file_name` normalizado | Security/Reliability | MIME/tamaño inválidos persistidos; nombres sin basename/CRLF servidos | 0 / 0 | tests borde (fixtures válidas/inválidas) |
| NFR-006 | 0 accesos sin token; 0 mutaciones cruzadas por rol; cambio de rol/borrado de cuenta invalida los tokens vigentes | Security | fallos de la matriz 401/403 + revocación | 0 | matriz 401/403 + test de revocación |

## 5. Conceptual Model

See `conceptual-model.puml` (+ `.svg`). Entidades: User (Role), Material, FileBlob (1:1 con Material, cascada; incluye `file_name` del original, v0.4.1), AuthSession.

## 6. Design Constraints

Clean 4 Layers, dependencia hacia adentro; Repository (TypeORM) como única salida a MariaDB (RST-004, ex-BR-006); Validator (`class-validator`) como Pure Fabrication; duplicados permitidos — cada POST crea Material + FileBlob 1:1 nuevos, sin unique en hash; `file_name` persiste el nombre original normalizado (basename, sin separadores de ruta ni caracteres de control) para `Content-Disposition`; borrado en cascada dura (delete user → materials + blobs; delete material → blob), sin transferencia (FR-014 eliminada, BR-004 v0.4.0) → ADR en architect.

## 7. Approval / Baseline

| Role | Date | Signature |
|------|------|-----------|
| Analyst | | |
| Stakeholder | | |
| Tech Lead | | |

> Validado en `validation.md` (Fagan). Baseline `v0.5.2` en `CHANGELOG-RE.md`.
