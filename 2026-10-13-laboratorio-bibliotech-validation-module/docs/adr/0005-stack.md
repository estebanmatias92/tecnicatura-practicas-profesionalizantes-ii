# Stack del backend y del frontend

## Status

accepted

## Context

La consigna exige capas, patrón Repository y un módulo Validator, con MariaDB como
motor mínimo. Se evaluaron alternativas server-rendered y frameworks más livianos.

## Decision

- **Backend**: Node 22 + TypeScript + NestJS 11. Nest aporta módulos, DI y guards sin imponer una arquitectura; la capa MVC se organiza manualmente.
- **Persistencia**: TypeORM 0.3 sobre MariaDB 11, con migraciones y repositorios detrás de interfaces del Model.
- **Auth**: JWT (`@nestjs/jwt`) + BCrypt (`bcryptjs`), con `tokenVersion` para invalidar sesiones al cambiar rol.
- **Uploads**: Multer en memoria + validación de MIME/extensión/magic bytes + storage en disco.
- **Validación**: `class-validator` en DTOs + validadores de dominio en el Model.
- **Frontend**: React 19 + TypeScript + Vite, React Router, `fetch` y `epub.js` para el visor EPUB.
- **Tests**: Jest + Supertest (backend), Vitest + Testing Library (frontend).

## Consequences

- NestJS y TypeORM son reemplazables detrás de las interfaces del Model, a costo de mapeo.
- `bcryptjs` evita compilación nativa en Alpine.
- El visor PDF usa el navegador; EPUB depende de `epub.js`.
- No hay refresh tokens ni OAuth en v1.
