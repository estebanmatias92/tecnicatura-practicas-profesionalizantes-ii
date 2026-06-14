# <img src="frontend/img/favicon-gold.png" width="45" height="45" align="center"> SampleVault

**SampleVault** es una aplicación web diseñada para la gestión profesional de librerías de sonido. Permite a los productores musicales subir, categorizar, escuchar y organizar sus muestras de audio (samples) de forma privada y segura, todo bajo una arquitectura modular y eficiente.

---

## 🚀 Características Principales

* **Gestión de Samples:** Sube archivos de audio (MP3, WAV, OGG, FLAC) con metadatos personalizados (BPM, categoría).
* **Reproductor Integrado:** Escucha tus sonidos directamente desde la biblioteca mediante una interfaz minimalista.
* **Arquitectura Limpia:** Separación total de responsabilidades entre controladores, servicios y utilidades.
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa para máxima seguridad y rendimiento.
* **Sostenibilidad de Software:** Código optimizado siguiendo principios de eficiencia en el consumo de recursos (inspirado en el modelo **GREENSOFT**).

## 🛠️ Tecnologías Utilizadas

### Backend

* **Node.js & Express:** Servidor robusto y escalable.
* **Multer:** Gestión eficiente de subida de archivos binarios.
* **MySQL/MariaDB:** Persistencia de metadatos de forma relacional.

### Frontend

* **Vanilla JavaScript:** Lógica pura sin dependencias de frameworks pesados.
* **W3.CSS:** Framework CSS ligero para una interfaz moderna y responsiva.
* **Web Components (Custom):** Manejo dinámico de la UI mediante inyección de nodos nativos.

---

### Inicialización del Backend

Entra en la carpeta del servidor e instala las dependencias necesarias:

```bash
cd backend
npm init -y  # Crea el archivo package.json por defecto
```

### Instalación de módulos

Ejecuta este comando para instalar todas las bibliotecas que configuramos en los scripts:

```bash
npm install express mysql2 cors multer jsonwebtoken bcrypt dotenv
```

### Agregar archivo .env en el directorio backend/ con estas variables como ejemplo

```text
PORT=3000
DB_HOST=localhost
DB_USER=samplevault
DB_PASS=samplevault
DB_NAME=samplevault
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=testing
```

---

## 🐳 Docker Compose (quick start)

El project name se define en `.env` (raíz del proyecto) para evitar colisiones entre assignments:

```text
COMPOSE_PROJECT_NAME=2026-06-02-practico-01
```

### Comandos disponibles (Makefile)

| Comando | Descripción |
| - | - |
| `make up` | `docker compose up --build -d` — levantar el stack |
| `make down` | `docker compose down` — bajar sin borrar volúmenes |
| `make destroy` | `docker compose down -v` — bajar y borrar volúmenes (equivale a "desde cero") |
| `make logs` | `docker compose logs -f app` — seguir logs del backend |
| `make restart` | down + up — reinicio rápido |
| `make status` | `docker compose ps` — estado de los servicios |

```bash
make up
```

La app queda disponible en `http://localhost:3000`.

---

## 📡 API Reference

**Socket:** `http://localhost:3000`

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Body | Descripción |
| - | - | - | - | - |
| `POST` | `/api/auth/register` | ✗ | `{ username, password, role_name }` | Registro (`role_name`: `admin` o `producer`) |
| `POST` | `/api/auth/login` | ✗ | `{ username, password }` | Login. Retorna `{ token, user: { id, username, role } }` |

### Samples (`/api/samples`) — requiere token JWT

| Método | Ruta | Auth | Descripción |
| - | - | - | - |
| `POST` | `/api/samples/upload` | `verifyToken` | Subir sample (form-data: `audioFile` + `display_name`, `category`, `bpm`) |
| `GET` | `/api/samples/my-samples` | `verifyToken` | Listar samples del usuario autenticado |
| `DELETE` | `/api/samples/:id` | `verifyToken` | Eliminar sample propio |

### Admin (`/api/admin`) — requiere token + rol admin

| Método | Ruta | Auth | Descripción |
| - | - | - | - |
| `GET` | `/api/admin/users` | `verifyToken` + `isAdmin` | Listar todos los usuarios |
| `DELETE` | `/api/admin/users/:id` | `verifyToken` + `isAdmin` | Eliminar usuario |

### Frontend (navegación)

Con `NODE_ENV=testing`:

| Ruta | Archivo |
| - | - |
| `/` | `frontend/html/tests.html` (zona de tests) |

Con `NODE_ENV=production`:

| Ruta | Archivo |
| - | - |
| `/` o `/login` | `login.html` |
| `/register` | `register.html` |
| `/producer-dashboard` | `producer-dashboard.html` |
| `/admin-dashboard` | `admin-dashboard.html` |

### Usuarios de prueba

| Usuario | Contraseña | Rol |
| - | - | - |
| `admin` | `12345` | admin |
| `pepe` | `12345` | producer |

---

## 📂 Estructura del Proyecto

```text
├── .devcontainer/       # Configuración de Dev Container (VS Code).
├── backend/
│   ├── config/          # Configuración de Multer y DB.
│   ├── controllers/     # Lógica de negocio.
│   ├── repositories/    # Acceso a datos (SQL).
│   ├── routes/          # Rutas de acceso a módulos del backend.
│   ├── uploads/         # Almacenamiento físico de sonidos.
│   └── utils/           # Helpers de sistema de archivos (fileHelper).
├── frontend/
│   ├── css/             # Estilos personalizados.
│   ├── html/            # Archivos de maquetación estáticos.
│   ├── img/             # Activos visuales (favicon.png).
│   └── js/
│       ├── components/  # Manejadores de UI dinámicos (uiHandlers.js).
│       ├── frontControllers/  # Controladores de lógica frontend.
│       ├── services/    # Cliente API (apiService.js).
│       ├── utils/       # Lógica de sesión (authHelper.js).
│       └── tests/       # Scripts necesarios para crear el frontend de los tests.
├── .env                 # Project name para Docker Compose (evita colisiones).
├── docker-compose.yaml  # Orquestación de servicios (db + app).
├── Dockerfile           # Build de la imagen Node.
├── Makefile             # Comandos shorthand (up, down, destroy, logs, etc.).
├── test-samples/        # Samples de prueba para subir.
├── AUTHORS.md
├── LICENSE
└── README.md
```
