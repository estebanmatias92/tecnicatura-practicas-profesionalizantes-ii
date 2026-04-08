# <img src="frontend/img/favicon.png" width="45" height="45" align="center"> SampleVault

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

## 🐳 Desarrollo con Docker

### Requisitos Previos

* Docker Engine >= 20.10
* Docker Compose >= 2.0

### Servicios Identificados

1. **MySQL 8.0** - Base de datos relacional para persistencia de metadatos (usuarios, samples)
2. **Node.js 18 (Alpine)** - Entorno de ejecución del backend con hot-reload

### Estructura de Orquestación

```
├── docker-compose.yml          # Configuración base
├── docker-compose.override.yml # Desarrollo (aplicado por defecto)
├── docker-compose.test.yml     # Testing
├── docker-compose.mock.yml     # Mock/Desarrollo alternativo
├── config/db/
│   └── .env                    # Credenciales DB (SSOT)
└── backend/
    └── .env                   # Config app (PORT, JWT_SECRET)
```

### Levantar el Entorno de Desarrollo

```bash
# Iniciar los servicios (desarrollo)
docker compose up -d

# Verificar que los contenedores estén corriendo
docker compose ps
```

### Entornos Alternativos

```bash
# Testing
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Mock/Desarrollo alternativo
docker compose -f docker-compose.yml -f docker-compose.mock.yml up -d
```

### Acceder a la Aplicación

Una vez iniciados los servicios, accede a:

* **Frontend + Backend:** <http://localhost:3000>

### Hot-Reload

El entorno de desarrollo está configurado con:

* **Bind-mount** del código fuente del backend (`./backend:/app`)
* **Volumenes** para `node_modules` y `uploads`
* **nodemon** para reinicio automático del servidor al detectar cambios

### Comandos Útiles

```bash
# Ver logs del backend
docker compose logs -f backend

# Ver logs de la base de datos
docker compose logs -f db

# Detener los servicios
docker compose down

# Reiniciar los servicios (rebuild)
docker compose up -d --build

# Acceder al contenedor del backend
docker exec -it samplevault-backend sh

# Acceder a MySQL
docker exec -it samplevault-db mysql -u root -p
```

## 📚 Documentación Adicional

* [Configuración Docker](docs/docker-setup.md) - Detalles técnicos de la orquestación

---

## 🚀 Inicialización Manual (Sin Docker)

### Requisitos Previos

* Node.js 18+
* MySQL 8.0

### Base de Datos

1. Crear la base de datos y usuario:

```sql
CREATE DATABASE samplevault;
CREATE USER 'samplevault'@'localhost' IDENTIFIED BY 'samplevault';
GRANT ALL PRIVILEGES ON samplevault.* TO 'samplevault'@'localhost';
FLUSH PRIVILEGES;
```

1. Ejecutar el script de inicialización:

```bash
mysql -u root -p samplevault < backend/config/init.sql
```

### Backend

```bash
cd backend
npm install
```

### Archivo .env

El backend lee las credenciales de la base de datos desde variables de entorno. Crear `backend/.env`:

```text
PORT=3000
DB_HOST=localhost
DB_USER=samplevault
DB_PASS=samplevault
DB_NAME=samplevault
JWT_SECRET=tu_clave_secreta_super_segura
```

### Iniciar el Servidor

```bash
cd backend
npm run dev
```

Acceder a <http://localhost:3000>

---

## 📂 Estructura del Proyecto

```text
├── docker-compose.yml          # Orquestación de servicios
├── docker-compose.override.yml # Override desarrollo
├── docker-compose.test.yml     # Override testing
├── docker-compose.mock.yml     # Override mock
├── config/
│   └── db/
│       └── .env               # Credenciales DB (SSOT)
├── backend/
│   ├── config/                # Configuración de Multer y DB.
│   ├── controllers/           # Lógica de negocio.
│   ├── repositories/          # Acceso a datos (SQL).
│   ├── routes/                # Rutas de acceso a módulos del backend.
│   ├── uploads/               # Almacenamiento físico de sonidos.
│   ├── .env                   # Configuración app
│   └── utils/                 # Helpers de sistema de archivos (fileHelper).
├── frontend/
│   ├── css/                   # Estilos personalizados.
│   ├── html/                  # Archivos de maquetación estáticos.
│   ├── img/                   # Activos visuales (favicon.png).
│   └── js/
│       ├── components/        # Manejadores de UI dinámicos (uiHandlers.js).
│       ├── frontControllers/  # Controladores de lógica frontend.
│       ├── services/          # Cliente API (apiService.js).
│       └── utils/             # Lógica de sesión (authHelper.js).
└── test-samples/              # Samples de prueba para subir.
```
