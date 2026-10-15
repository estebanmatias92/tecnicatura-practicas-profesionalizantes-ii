# BiblioTech backend (NestJS + Clean 4 Layers)

`Entities → UseCases → Adapters → Frameworks`. Regla: imports solo hacia adentro
(`dependency-cruiser` o review; `entities/` y `usecases/` sin `@nestjs/*`/typeorm).

## Layout

```
src/
├── entities/    User, Material, FileBlob, AuthSession, Role (+ *.spec.ts)
├── usecases/    Register/Login/Upload/Search/Manage/Download + ports.ts + errors.ts
├── adapters/    http (controllers, guards, DTOs), validators (Strategy),
│                persistence/typeorm (Adapter), storage (DiskFileStorage)
└── frameworks/  nest/app.module.ts (DI Factory), security (BCrypt/JWT), main.ts
```

Cada clase lleva traza `// FR-xxx / UC-xxx [GRASP]` (ver [`docs/03-architecture/adrs/`](../docs/03-architecture/adrs/)).

## Comandos

```bash
npm install
npm test        # Jest: 55 tests (entities/usecases reales + fakes en borde lento)
npm run build   # tsc -> dist/
npm run lint    # eslint
npm start       # node dist/frameworks/main.js (requiere .env + MariaDB)
```

Dev local (`make dev-local` desde la raíz) lee el `.env` de la raíz del lab;
`backend/.env.example` es solo la plantilla de variables (ya no hay `backend/.env` en runtime).
Atajo desde la raíz del lab: `make test/lint/build/check/dev-local`
(mismo toolchain; ver `Makefile`).

## Seed Admin inicial

El registro público crea solo Student (UC-001). El primer Admin se siembra con
`make seed-admin EMAIL=x PASSWORD=y` (desde la raíz; requiere db up), o por SQL manual:

```sql
INSERT INTO users (email, password_hash, role) VALUES
('admin@biblio.tech', '<bcrypt-cost-10-de-tu-password>', 'Admin');
```

Generar el hash: `node -e "require('bcrypt').hash('tu-password',10).then(console.log)"`.
Luego el Admin promueve cuentas en `/admin` o crea Professors vía `POST /users` (UC-004).

## Contrato

[`api/openapi.yaml`](../api/openapi.yaml) (contract-first). Smoke E2E verificado UC-001..UC-006 + C-1/C-2/C-3
contra MariaDB 11 real (ver [CHANGELOG del lab](../docs/02-requirements/CHANGELOG-RE.md)).
