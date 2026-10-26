#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env.dev ]; then
  echo ".env.dev ya existe; no se sobrescribe."
  exit 0
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "Se requiere openssl para generar los secretos de desarrollo." >&2
  exit 1
fi

JWT_SECRET="$(openssl rand -hex 32)"
DB_PASSWORD="$(openssl rand -hex 16)"
DB_ROOT_PASSWORD="$(openssl rand -hex 16)"

cat > .env.dev <<EOF
NODE_ENV=development

DB_NAME=bibliotech
DB_USER=bibliotech
DB_PASSWORD=${DB_PASSWORD}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_LOGGING=false

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
BCRYPT_COST=10

UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=50

ADMIN_EMAIL=admin@bibliotech.local
ADMIN_PASSWORD=Admin1234!

CORS_ORIGIN=http://localhost:5173
FRONTEND_PORT=5173
DB_PORT_HOST=3306
API_PORT_HOST=3000
EOF

chmod 600 .env.dev
echo "Generado .env.dev con secretos aleatorios."
