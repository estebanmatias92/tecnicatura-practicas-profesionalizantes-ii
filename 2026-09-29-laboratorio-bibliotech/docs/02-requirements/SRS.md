# Software Requirements Specification (SRS) — BiblioTech (híbrido RUP)

## 1. Introduction

### 1.1 Purpose

Baseline de requerimientos (Elaboration) para diseñar y construir BiblioTech. Audiencia: stakeholder, tech lead, equipo `ooad-architect`/`ooad-build`.

### 1.2 Scope

Plataforma web de libros digitales: auth por roles, subida (Multer), lectura pública/privada, gestión Admin, catálogo con búsqueda/paginación, persistencia MariaDB. No incluye: préstamos, reservas, multas, notificaciones, DRM, offline, SSO.

### 1.3 Definitions and Glossary

See [`../../CONTEXT.md`](../../CONTEXT.md) y `docs/01-discovery/glossary-draft.md`.

## 2. General Description

### 2.1 Product Perspective

NestJS + React + TS, Frontend/Backend separados vía REST. Contexto en `context.puml`; modelo en `conceptual-model.puml`.

### 2.2 Main Features

Auth JWT+BCrypt (UC-001), subida Professor (UC-002), lectura por visibilidad (UC-003), gestión Admin (UC-004), búsqueda/paginación (UC-005), descarga (UC-006).

### 2.3 Constraints

| ID | Description | Source |
|----|-------------|--------|
| RST-001 | Backend Node 22 + TS + NestJS | PRD OQ-05 |
| RST-002 | Frontend React + TS (Vite, Vitest), API REST | PRD OQ-05 |
| RST-003 | MariaDB 11 mínimo | Charter req 8 |
| RST-004 | F/B separados; Validator central | Charter req 5, 7 |
| RST-005 | PDF/EPUB ≤ 50MB (supuesto lab) | OQ-02 |

## 3. Functional Requirements

| ID | Description | Source (PRD/UC) | Priority | Dependency |
|----|-------------|-----------------|----------|------------|
| FR-001 | Registrar usuarios (Student auto-registro; Admin crea roles) | F-001 / UC-001 | Must | — |
| FR-002 | Login emite JWT (BCrypt, expira ≤24h) | F-001 / UC-001 | Must | FR-001 |
| FR-003 | Autorización por rol en cada endpoint | F-001 / UC-001..004 | Must | FR-002 |
| FR-004 | Professor sube archivo + metadatos (title/author + subject/year/edition/tags opcionales; dedup SHA-256 → 409, BR-007) | F-002 / UC-002 | Must | FR-003 |
| FR-006 | Catálogo consultable (exige JWT) | F-003 / UC-003 | Must | FR-003 |
| FR-007 | Lectura exige JWT; todos los roles ven todo | F-003 / UC-003 | Must | FR-003 |
| FR-008 | Descarga del original (exige JWT; 401 primero; inline; sin cap global v1) | F-009 / UC-006 | Should | FR-007 |
| FR-009 | Búsqueda/filtrado (q + campos, AND, envelope paginado) | F-008 / UC-005 | Should | FR-006 |
| FR-010 | Paginación de catálogo | F-010 / UC-005 | Could | FR-006 |
| FR-011 | Admin CRUD usuarios | F-004 / UC-004 | Must | FR-003 |
| FR-012 | Admin CRUD cualquier material | F-004 / UC-004 | Must | FR-003 |
| FR-013 | Professor edita/elimina material propio | F-002 / UC-004 | Must | FR-003, FR-004 |
| FR-014 | Transferencia de ownership (Professor→Professor; Admin force-transfer; borrado de cuenta exige sin material, sin cascada) | UC-004 | Must | FR-003, FR-011 |

Criterio de aceptación por FR: ver UC correspondiente (Gherkin).

## 3.1 Traceability Matrix (excerpt)

| FR | UC | Conceptual Class | ADR |
|----|----|------------------|-----|
| FR-001/002 | UC-001 | User, AuthSession | ADR pendiente (architect) |
| FR-004 | UC-002 | Material, FileStorage | ADR pendiente (architect) |
| FR-006/007 | UC-003 | Material | ADR pendiente |

Full RTM at `RTM.csv`.

## 4. Non-Functional Requirements (measurable)

| ID | Description | Category (ISO25010) | Metric | Target | How Verified |
|----|-------------|---------------------|--------|--------|--------------|
| NFR-001 | Lectura autenticada rápida | Performance | p95 | <200ms lab | k6/Jest en verify |
| NFR-002 | Subida ≤50MB completa | Performance | duración | <60s | log inicio→201 |
| NFR-003 | Hash + expiración sesión | Security | config | BCrypt ≥10, JWT ≤24h | audit config |
| NFR-004 | Sin secretos en claro/logs | Security | inspección | 0 ocurrencias | tests + review |
| NFR-005 | MIME/tamaño antes de persistir | Security/Reliability | fixtures | 100% rechazo | tests borde |
| NFR-006 | 0 accesos sin token; 0 mutaciones cruzadas por rol | Security | matriz | 0 fallos | matriz 401/403 |

## 5. Conceptual Model

See `conceptual-model.puml` (+ `.svg`). Entidades: User (Role), Material, AuthSession.

## 6. Design Constraints

Clean 4 Layers, dependencia hacia adentro; Repository (TypeORM) como única salida a MariaDB (BR-006); Validator (`class-validator`) como Pure Fabrication; dedup por SHA-256 con constraint única (BR-007); borrado seguro sin cascada con transferencia de ownership (FR-014, BR-004) → ADR en architect.

## 7. Approval / Baseline

| Role | Date | Signature |
|------|------|-----------|
| Analyst | | |
| Stakeholder | | |
| Tech Lead | | |

> Validado en `validation.md` (Fagan). Baseline `v0.2.0` en `CHANGELOG-RE.md`.
