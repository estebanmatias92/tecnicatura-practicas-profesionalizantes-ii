# Sample Vault — Configuración del sistema

Este documento centraliza todas las constantes y variables de entorno que gobiernan el comportamiento del sistema. Para modificar un comportamiento (límites, seguridad, rangos), este es el punto de entrada único.

## Ubicación de las configuraciones

| Archivo | Propósito |
|---------|-----------|
| `backend/config/constants.js` | Constantes del sistema (límites, rangos, valores fijos) |
| `backend/.env` | Variables de entorno sensibles (no versionado, ver `.env.example`) |
| `backend/config/db.js` | Pool de conexión a MariaDB |
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
| `MAX_FILE_SIZE` | `10 * 1024 * 1024 + 1` | Tamaño máximo de archivo (10 MB + 1 byte por el límite exclusivo de busboy) |
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

## `backend/.env`

Variables de entorno para conexiones sensibles (no versionado en git).

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `samplevault-db` | Host de MariaDB |
| `DB_USER` | `samplevault` | Usuario de base de datos |
| `DB_PASS` | `samplevault` | Contraseña de base de datos |
| `DB_NAME` | `samplevault` | Nombre de la base de datos |
| `JWT_SECRET` | `secreto123` | Secreto para firmar tokens JWT |
| `NODE_ENV` | `testing` | Entorno (`testing` para tests, `production` para producción) |
| `PORT` | `3000` | Puerto del servidor Express |

> El archivo `.env` no está versionado. Usar `.env.example` como plantilla.

---

## Referencias en el código

### Backend

| Archivo | Constante usada |
|---------|----------------|
| `config/multerConfig.js` | `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES` |
| `controllers/authController.js` | `PASSWORD_MIN_LENGTH`, `BCRYPT_SALT_ROUNDS` |

### Para futuros NFRs

- NFR-006 (BPM range): usar `BPM_MIN` y `BPM_MAX` en `controllers/sampleController.js`
- Cualquier nuevo límite: agregar la constante en `constants.js` e importarla donde se requiera
