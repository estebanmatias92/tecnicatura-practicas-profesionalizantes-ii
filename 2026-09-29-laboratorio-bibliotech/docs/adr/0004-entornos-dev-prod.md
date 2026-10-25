# Entornos dev y prod con Docker Compose

## Status

accepted

## Context

El proyecto necesita un entorno autocontenido, aislado y reproducible, con dos
perfiles que difieran en credenciales, artefactos y constraints de ejecución.

## Decision

Docker Compose con **base + overrides**:

- `compose.yaml`: servicios `db`, `backend` y `frontend`, red y volúmenes internos.
- `compose.dev.yaml`: hot reload, bind mounts, puertos de desarrollo (`5173`, `3000`, `3306`, `8081`), Adminer, seed demo y tests disponibles.
- `compose.prod.yaml`: imágenes multi-stage, sin código fuente montado, sin tests ni devDependencies, migraciones explícitas, solo bootstrap de Admin, sin datos demo, puerto público `8080`. Usa el proyecto `bibliotech-prod` para aislar sus volúmenes de los de desarrollo.

Credenciales:

- `.env.dev` generado por `make init` con valores no sensibles y `JWT_SECRET` aleatorio.
- `.env.prod` obligatorio, no versionado, validado al arranque (Joi). La app falla rápido si falta un secreto.
- Los secretos nunca se hornean en las imágenes.

Frontend:

- Dev: Vite proxy hacia la API.
- Prod: nginx sirve el build estático y proxea `/api` al backend (mismo origen, sin CORS).

## Consequences

- Un solo comando levanta cada entorno (`make dev`, `make prod`).
- La imagen de prod no contiene specs, mocks ni dependencias de test.
- El host solo necesita Docker, Compose, Make y PlantUML.
- Adminer existe únicamente en dev.
- Los tests e2e usan MariaDB real, no mocks de base de datos.
