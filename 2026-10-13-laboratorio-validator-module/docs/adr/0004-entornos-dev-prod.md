# Entornos dev y prod con Docker Compose

## Status

accepted

## Context

El proyecto necesita un entorno autocontenido, aislado y reproducible, con dos
perfiles que difieran en credenciales, artefactos y constraints de ejecución.

## Decision

Docker Compose con **base + overrides**:

- `compose.yaml`: servicios `db`, `backend` y `frontend`, red y volúmenes internos.
- `compose.dev.yaml`: hot reload, bind mounts, puertos de desarrollo (`FRONTEND_PORT`, `API_PORT_HOST`, `DB_PORT_HOST`, `8081`), Adminer, seed demo y tests disponibles.
- `compose.prod.yaml`: imágenes multi-stage, sin código fuente montado, sin tests ni devDependencies, migraciones explícitas, solo bootstrap de Admin, sin datos demo, puerto público `8080`. Usa el proyecto `bibliotech-prod` para aislar sus volúmenes de los de desarrollo.

Puertos:

- Los puertos **internos** son contratos fijos entre servicios (`backend` `3000`, `db` `3306`, `nginx` `80`): no se parametrizan, son la identidad de cada servicio dentro de la red.
- Los puertos **publicados en el host** se parametrizan con el sufijo `*_PORT_HOST` (`FRONTEND_PORT`, `API_PORT_HOST`, `DB_PORT_HOST`). Cambiarlos es una edición de `.env`, sin rebuild.
- La API se publica en el host solo en desarrollo (`API_PORT_HOST`); en producción no se publica y solo se alcanza vía nginx en la red interna.

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
- Cambiar un puerto del host es editar `.env`, sin rebuild; el puerto interno de cada servicio permanece fijo como contrato.
