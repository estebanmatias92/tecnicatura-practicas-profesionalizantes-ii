# Configuración Docker - SampleVault

## Servicios

| Servicio | Imagen | Propósito |
|----------|--------|-----------|
| `db` | mysql:8.0 | Base de datos MySQL |
| `backend` | node:18-alpine | Servidor Node.js con Express |

## Estructura de Archivos

```
/project-root
├── docker-compose.yml          ← configuración base
├── docker-compose.override.yml ← desarrollo (aplicado por defecto)
├── docker-compose.test.yml     ← testing
├── docker-compose.mock.yml     ← mock/development alternativo
├── config/db/
│   └── .env                    ← credenciales DB (SSOT)
└── backend/
    └── .env                   ← configuración app (PORT, JWT_SECRET)
```

## Variables de Entorno

### SSOT: Single Source of Truth

Las credenciales de la base de datos viven en un solo lugar:

**`config/db/.env`** - Credenciales MySQL:

```bash
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=samplevault
MYSQL_USER=samplevault
MYSQL_PASSWORD=samplevault
```

**`backend/.env`** - Configuración de la aplicación:

```bash
PORT=3000
JWT_SECRET=your_jwt_secret_here
```

El backend hereda las variables de DB desde `config/db/.env` automáticamente a través de `env_file` en docker-compose.

## Montajes (Volumes)

### Backend

- `./backend:/app` - Código fuente (bind-mount para hot-reload)
- `./backend/uploads:/app/uploads` - Archivos subidos por usuarios
- `/app/node_modules` - Volumen anónimo para preservar node_modules del contenedor

### Frontend

- `./frontend:/frontend:ro` - Archivos estáticos (read-only)
  - **Nota**: Se monta en `/frontend` (raíz), no en `/app/../frontend`
  - El servidor Express espera esta ruta exacta para servir los HTML

## Swapping de Entornos

### Desarrollar (default)

```bash
docker compose up
```

Usa `docker-compose.override.yml` que hereda credenciales desde `config/db/.env`.

### Testing

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up
```

Usa credenciales de testing independientes, crea base de datos `samplevault_test`.

### Mock/Desarrollo alternativo

```bash
docker compose -f docker-compose.yml -f docker-compose.mock.yml up
```

Usa credenciales mock, útil para desarrollo offline.

## Healthcheck

MySQL tiene un healthcheck configurado:

```yaml
test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
interval: 10s
timeout: 5s
retries: 5
start_period: 30s
```

El backend espera `service_healthy` antes de iniciar (no solo que el contenedor arranque).

## Hot-Reload

El backend usa nodemon para reinicio automático:

- Detecta cambios en archivos `.js`, `.mjs`, `.cjs`, `.json`
- El bind-mount `./backend:/app` permite editar desde el host
- Los cambios se reflejan instantáneamente en el contenedor

## Comandos Útiles

```bash
# Desarrollo (default - usa override.yml)
docker compose up
docker compose up -d

# Ver logs
docker compose logs -f backend
docker compose logs -f db

# Reiniciar servicios
docker compose restart

# Detener servicios
docker compose down

# Testing (usa override de test)
docker compose -f docker-compose.yml -f docker-compose.test.yml up

# Mock (usa override de mock)
docker compose -f docker-compose.yml -f docker-compose.mock.yml up

# Acceder al contenedor
docker exec -it samplevault-backend sh
docker exec -it samplevault-db mysql -u root -p
```

## Notas Técnicas

1. **DB_HOST**: En Docker, el hostname de MySQL es `db` (nombre del servicio), no `localhost`
2. **Puertos**:
   - Backend: 3000
   - MySQL: 3306
3. **Red**: Los contenedores comparten la red `samplevault-network`
4. **Persistencia**: Los datos de MySQL se guardan en el volumen `mysql_data`
5. **Credenciales**: Todas las credenciales de DB están centralizadas en `config/db/.env` - el SSOT
