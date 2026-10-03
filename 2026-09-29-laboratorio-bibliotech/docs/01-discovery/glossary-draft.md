# Domain Glossary — draft (BiblioTech)

> Borrador de `ooad-discover`; se refina en `ooad-requirements`. Cada término lo usa al menos una feature del PRD. Sin `CONTEXT.md` previo, no hay contradicciones.

| Term | Definition | Synonyms to Avoid | Related | Rule / NFR | Source (PRD/FR/UC) |
|------|------------|-------------------|---------|------------|---------------------|
| Biblioteca | Colección de material digital publicado en BiblioTech | Librería (física) | Material | — | PRD F-003 |
| Material bibliográfico | Archivo (PDF/EPUB ≤50MB) + metadatos (título/autor; sin visibilidad) | Libro (solo papel), Sample | Biblioteca | BR: todo logueado lee todo | PRD F-002/F-003 |
| Admin | Rol con acceso total a usuarios y material | Administrador del sistema (genérico) | Usuario | BR: puede todo | PRD F-001/F-004 |
| Professor | Rol que sube material | Docente, Maestro | Material | BR: crea material, edita el propio | PRD F-001/F-002 |
| Student | Rol lector (toda lectura autenticada) | Alumno (mismo, fijar Student) | Material | BR: sin token → 401 | PRD F-001/F-003 |
| Sesión JWT | Sesión con token firmado + password con BCrypt | Token (solo) | Validator | BR: credenciales validadas antes de emitir | PRD F-001/F-006 |
| Validator/Filter | Módulo central de reglas de negocio (email, password, …) | Validador (variante) | Sesión JWT, Student | BR: rechaza inválidos con mensaje | PRD F-006 |
| Repository | Patrón de acceso a datos entre dominio y MariaDB | DAO, Repositorio (variante) | MariaDB | BR: sin SQL en controladores | PRD F-005/F-007 |
| Upload (Multer) | Ingesta de archivo binario con límites y filtro | Carga, Subida (fijar Upload en código) | Material, Validator | BR: tipo/tamaño validados | PRD F-002 |

## Discarded Terms

| Avoided Term | Use Instead | Reason |
|--------------|-------------|--------|
| Alumno | Student | Unificar con roles del charter en inglés |
| Docente / Maestro | Professor | Unificar con roles del charter en inglés |
| Libro | Material bibliográfico | Incluye PDF/EPUB/otros, no solo papel |
| Carga / Subida (en código) | Upload | Fijar término de Multer en código |

## Evolution Notes

- RUP: refinar por iteración; validar en `ooad-requirements`.
