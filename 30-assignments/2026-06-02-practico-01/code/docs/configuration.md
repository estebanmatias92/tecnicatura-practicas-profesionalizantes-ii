# Sample Vault — Configuración del sistema

Este documento centraliza todas las constantes y variables de entorno que gobiernan el comportamiento del sistema. Para modificar un comportamiento (límites, seguridad, rangos), este es el punto de entrada único.

## Ubicación de las configuraciones

| Archivo | Propósito |
|---------|-----------|
| `backend/config/constants.js` | Constantes del sistema (límites, rangos, valores fijos) |
| `.env` | Variables para Docker Compose (`COMPOSE_PROJECT_NAME`, `NODE_ENV`) — no versionado |
| `.env.example` | Plantilla con valores de ejemplo (versionado) |
| `docker-compose.yaml` | Variables de entorno del backend (`DB_HOST`, `DB_USER`, `JWT_SECRET`, etc.) |
| `backend/config/db.js` | Pool de conexión a MariaDB (usa vars de `docker-compose.yaml`) |
| `backend/config/multerConfig.js` | Middleware Multer (usa `constants.js`) |

---

## `backend/config/constants.js`

Archivo que centraliza todos los valores de configuración del dominio. Se importa por destructuring donde se necesite:

```js
const { MAX_FILE_SIZE } = require('../config/constants');
```

### Constantes disponibles

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `MAX_FILE_SIZE` | `10 * (1024 * 1024)` | Tamaño máximo de archivo (10 MB por defecto) |
| `ALLOWED_MIME_TYPES` | `['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac']` | Tipos MIME aceptados en subida |
| `PASSWORD_MIN_LENGTH` | `8` | Longitud mínima de contraseña |
| `BCRYPT_SALT_ROUNDS` | `10` | Rondas de sal para bcrypt |
| `BPM_MIN` | `20` | BPM mínimo permitido (para NFR-006) |
| `BPM_MAX` | `300` | BPM máximo permitido (para NFR-006) |

### Cómo modificar

1. Editar `backend/config/constants.js`
2. Reconstruir el contenedor: `make up`

> **Importante:** No hardcodear estos valores en controladores, rutas o frontend. Siempre importar desde `constants.js`.

---

## `.env` (raíz del proyecto) y `docker-compose.yaml`

El archivo `.env` en la raíz del proyecto solo define variables para Docker Compose.
Las variables de entorno del backend se inyectan directamente en el contenedor a través del bloque `environment` de `docker-compose.yaml`.

| Variable | Ejemplo | Descripción | Fuente |
|----------|---------|-------------|--------|
| `COMPOSE_PROJECT_NAME` | `practico-final-ppii` | Prefijo para volúmenes y redes Docker | `.env` |
| `NODE_ENV` | `production` | Entorno (`testing` para tests, `production` para producción). Se sobreescribe via `docker-compose.yaml: NODE_ENV: \${NODE_ENV:-production}` | `.env` (interpolado por Docker Compose) |
| `DB_HOST` | `db` | Host de MariaDB (nombre del servicio Docker) | `docker-compose.yaml` |
| `DB_USER` | `samplevault` | Usuario de base de datos | `docker-compose.yaml` |
| `DB_PASS` | `samplevault` | Contraseña de base de datos | `docker-compose.yaml` |
| `DB_NAME` | `samplevault` | Nombre de la base de datos | `docker-compose.yaml` |
| `JWT_SECRET` | `tu_clave_secreta_super_segura` | Secreto para firmar tokens JWT | `docker-compose.yaml` |
| `PORT` | `3000` | Puerto del servidor Express | `docker-compose.yaml` |

> El archivo `.env` de la raíz no está versionado. Usar `.env.example` como plantilla.
> Las variables del backend se modifican en `docker-compose.yaml`. Después de cambiar, reconstruir con `make up`.

### Uso en desarrollo local (sin Docker)

Si se ejecuta Node fuera del contenedor, crear un archivo `backend/.env` con las mismas variables que `docker-compose.yaml` definió en `environment`. El backend leerá `process.env.DB_HOST`, etc., sin cambios de código.

---

## Referencias en el código

### Backend

| Archivo | Constante / Variable usada |
|---------|-----------------------------|
| `config/multerConfig.js` | `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES` |
| `controllers/authController.js` | `PASSWORD_MIN_LENGTH`, `BCRYPT_SALT_ROUNDS` |
| `controllers/sampleController.js` | `BPM_MIN`, `BPM_MAX` |
| `middleware/authMiddleware.js` | `SECRET_KEY` (lee `process.env.JWT_SECRET`) |

### Para futuros NFRs

- Cualquier nuevo límite: agregar la constante en `constants.js` e importarla donde se requiera
