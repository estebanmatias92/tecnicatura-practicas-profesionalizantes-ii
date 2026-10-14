# BiblioTech — biblioteca digital (lab ISFT 151)

Plataforma web simple y segura para publicar y consultar libros digitales:
Professors suben material (PDF/EPUB), todo rol autenticado lee y busca todo,
Admin tiene control total. Sin acceso anónimo. Fuera de alcance v1: préstamos,
reservas, multas, notificaciones.

- Charter: [`docs/bibliotech.md`](./docs/bibliotech.md)
- Requerimientos: [`docs/02-requirements/SRS.md`](./docs/02-requirements/SRS.md) + [`use-cases/UC-001..UC-006`](./docs/02-requirements/use-cases/)
- Arquitectura: [`docs/03-architecture/README.md`](./docs/03-architecture/README.md) (Clean 4 Layers + ADRs)
- Contrato API: [`api/openapi.yaml`](./api/openapi.yaml)

## Stack

| Capa | Tech |
| --- | --- |
| Backend | Node 22 + TypeScript + NestJS (`@nestjs/jwt` + `bcrypt`, Multer `FileInterceptor`, `class-validator`, TypeORM). Ver [`backend/README.md`](./backend/README.md) |
| Frontend | React + TypeScript (build Vite, test Vitest). Ver [`frontend/README.md`](./frontend/README.md) |
| DB | MariaDB 11 (única salida vía Repository, RST-004) |

Roles: `Admin` (total) / `Professor` (sube, gestiona lo propio) / `Student` (lectura).
Sesión JWT (expira ≤ 24h) + BCrypt (cost 10). Uploads PDF/EPUB ≤ 50 MB, un
`FileBlob` 1:1 por material (duplicados → 201), borrado en cascada dura.

## Quickstart

```bash
cp backend/.env.example .env   # .env en la RAIZ: solo para `docker compose`. Completar JWT_SECRET (NFR-004: sin default)
docker compose up --build      # db :3306, api :3000, web :5173
```

El registro público crea solo Student (UC-001): aunque el cliente envíe
`requestedRole`, el servidor lo ignora sin JWT Admin. Sembrar el primer Admin
por SQL (ver [`backend/README.md`](./backend/README.md)); luego ese Admin promueve cuentas a
Professor/Admin desde `/admin` (`PATCH /users/:id`) o las crea directo vía
`POST /users` (solo API, ver [`api/openapi.yaml`](./api/openapi.yaml)).

## Primer arranque (checklist)

1. `cp backend/.env.example .env` y completar `JWT_SECRET` (raíz, para compose).
2. `docker compose up --build` (db :3306, api :3000, web :5173).
3. Sembrar el primer Admin por SQL (ver [`backend/README.md`](./backend/README.md)).
4. Entrar a la web (`:5173`) y hacer login como Admin en `/login`.
5. Promover cuentas a Professor/Admin en `/admin` (o crearlas vía `POST /users`).
6. Cada usuario usa `/login`; tras un cambio de rol debe **loguearse de nuevo**
   (el rol viaja en el JWT).

## Uso por rol

| Rol | Cómo obtiene la cuenta | Qué hace en la UI |
| --- | --- | --- |
| Student | Auto-registro en `/register` (email + password ≥ 8) | `/` catálogo (filtros + paginación), `/material/:id` detalle, descarga del original. Sin sesión → `/login` (401 redirige). |
| Professor | Un Admin lo promueve en `/admin` (o lo crea vía `POST /users`) | Todo lo de Student + `/upload` (PDF/EPUB ≤ 50MB, título/autor obligatorios); edita/borra solo su material. `/admin` → 403. |
| Admin | El primero por SQL; los siguientes los promueve otro Admin | Todo + `/admin`: listar usuarios, cambiar rol (desplegable), borrar cuenta en cascada (C-2), borrar cualquier material (C-3). |

Paso a paso por pantalla: [`docs/uso-por-rol.md`](./docs/uso-por-rol.md).

## Desarrollo local

```bash
# Backend (requiere MariaDB + .env en backend/ — distinto del .env raíz de compose)
cd backend && npm install && npm test && npm run build && npm start
# Frontend
cd frontend && npm install && npm test && npm run build && npm run dev
```

## Layout

```
api/                 openapi.yaml (contract-first)
backend/src/         entities/ → usecases/ → adapters/ → frameworks/
frontend/src/        cliente REST delgado (auth, catálogo, subida, admin)
docs/01-discovery/   PRD, glosario
docs/uso-por-rol.md  guía de uso por rol (UI: Student/Professor/Admin)
docs/02-requirements/ SRS, UC-001..006, RTM.csv, CHANGELOG-RE.md
docs/03-architecture/ C4/UML (PUML+SVG), ADRs MADR, data-model-er
docker-compose.yaml  db + api + web
```

## Estado

Construcción verificada: Jest 55/55 + Vitest 2/2, `tsc` + `eslint` verdes,
smoke E2E UC-001..UC-006 + cascada C-1/C-2/C-3 contra MariaDB 11 real.
Pendiente: `ooad-verify` (matriz 401/403, k6 NFR-001/002) y `ooad-ship`.
