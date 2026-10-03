# PRD: BiblioTech

> Perfil RUP (Inception). Fuente: `docs/bibliotech.md`. Todo lo no evidenciado va como supuesto explícito en §6, no rellenado en silencio.

## 1. Vision / Elevator Pitch

BiblioTech es una plataforma web simple y segura para que una biblioteca publique y consulte libros digitales: los profesores suben material, los estudiantes autenticados leen y la administración mantiene control total. Existe porque hoy publicar y consultar material es friccionado e inseguro; el éxito es subir + leer con roles claros bajo arquitectura en capas con buenas prácticas de backend.

## 2. Users / Personas

| Persona | Goal | Current Pain |
|---------|------|--------------|
| Admin | Control total de usuarios y material | Sin panel único, gestión ad-hoc |
| Professor | Subir material y que quede disponible | Subida sin trazabilidad ni validación |
| Student | Leer material autenticado | Login obligatorio o enlaces sueltos |

Detalle en `personas.md`.

## 3. KPIs / Success Criteria (measurable)

| KPI | Target | How Measured |
|-----|--------|--------------|
| Subida professor de punta a punta | 100% de subidas válidas < 60s (supuesto) | Log backend: inicio subida → `201 Created` |
| Lectura autenticada por rol | 100% de GET con JWT válido → 200; sin token → 401 (supuesto) | Test E2E matriz con/sin `Authorization` |
| Control de acceso por rol | 0 accesos cruzados en matriz Admin/Professor/Student (supuesto) | Matriz de tests 401/403 por endpoint × rol |
| Validación de negocio | 100% de emails/passwords inválidos rechazados con mensaje (supuesto) | Tests Validator con fixtures válidas/inválidas |

Targets son supuestos de laboratorio a validar en `ooad-verify`; no hay baseline de producción.

## 4. Features (prioritized MoSCoW)

| ID | Feature | Priority | Rationale |
|----|---------|----------|-----------|
| F-001 | Auth + autorización por roles (Admin/Professor/Student), sesión JWT + BCrypt | Must | Req 1–3, corazón del control de acceso |
| F-002 | Subida de material por Professor (Multer), metadatos (sin visibilidad) | Must | Req 4; flujo principal de publicación |
| F-003 | Lectura/consulta de material; exige JWT, todos los roles ven todo | Must | Req 2 enmendado (Login para todo) |
| F-004 | Gestión total Admin (usuarios + material) | Must | Req 2 Admin acceso total |
| F-005 | Separación Frontend/Backend + patrón Repository | Must | Req 5–6, constraint arquitectónica |
| F-006 | Módulo Validator/Filter (email, password, …) | Must | Req 7, reglas de negocio centralizadas |
| F-007 | Persistencia mínima en MariaDB | Must | Req 8, motor mínimo exigido |
| F-008 | Búsqueda/filtrado de catálogo (por título/autor) | Should | Supuesto: sin esto la consulta no escala; confirmar en requirements |
| F-009 | Descarga de archivo original | Should | Supuesto: leer incluye descargar; confirmar formato (PDF/EPUB) |
| F-010 | Paginación de catálogo | Could | Supuesto de usabilidad, no exigido |
| F-011 | Préstamos físicos, reservas, multas, notificaciones | Won't | Out-of-scope declarado en charter |

## 5. Out of Scope

Préstamo físico, reservas, multas, notificaciones. Tampoco (supuesto): editor de contenido, DRM, lectura offline, multi-idioma, SSO externo.

## 6. Assumptions / Risks

| Assumption | Impact if False | Mitigation |
|------------|-----------------|------------|
| Stack decidido: Node 22 + TS, NestJS (`@nestjs/jwt` + `bcrypt`, Multer `FileInterceptor`, `class-validator`, TypeORM/MariaDB 11), React + TS (Vite build, Vitest). Formalizar en `ooad-architect` vía ADR | Medio: re-trabajo si ADR lo revierte | ADR en architect; scaffold recién en `ooad-build` |
| Material = archivo binario + metadatos (título/autor, sin visibilidad) | Alto: modelo de datos cambia | Validar tipos (PDF/EPUB) en requirements |
| Toda lectura/búsqueda exige JWT; sin visibilidades (decisión stakeholder 2026-10-03, enmienda charter) | Medio: contradice texto original del charter | Charter enmendado en `docs/bibliotech.md` |
| Student se registra con email+password validados por Validator | Medio: flujo de alta indefinido | Pregunta abierta OQ-01 |
| Límite de tamaño/tipo de archivo por definir | Medio: Multer sin `limits` | Definir en requirements, test de borde |
| Targets de §3 son de laboratorio, sin usuarios reales | Bajo: KPIs no productivos | Re-medición en cada iteración RUP |

## 7. Open Questions

- [ ] OQ-01 ¿Student se auto-registra o lo crea Admin? → stakeholder → antes de requirements
- [ ] OQ-02 ¿Formatos aceptados (PDF/EPUB/otros) y tamaño máximo? → stakeholder → antes de architect
- [x] OQ-03 Sin objeto: sin visibilidades no hay nada que ocultar (decisión Login-para-todo 2026-10-03)
- [ ] OQ-04 ¿Admin edita/elimina material ajeno y gestiona roles? → stakeholder → antes de requirements
- [x] OQ-05 Decidido: NestJS + React + TS (Vite como build tool, no framework). Resta ADR formal → tech lead → en architect

## Approval

| Role | Date | Signature |
|------|------|-----------|
| PO/Stakeholder | | |
| Tech Lead | | |

> Puerta RUP: no avanzar a `ooad-requirements` sin revisión humana de este PRD.
