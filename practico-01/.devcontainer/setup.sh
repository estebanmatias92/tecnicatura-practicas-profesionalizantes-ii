#!/bin/bash

echo "Starting project setup..."

# 1. Esperar a que MariaDB esté listo (la feature lo inicia automáticamente)
until mysqladmin ping -h "localhost" --silent; do
    echo "Waiting for MariaDB..."
    sleep 2
done

# 2. Importar la base de datos
if [ -f "backend/config/init.sql" ]; then
    sudo mysql -u root < backend/config/init.sql
    echo "✅ Database initialized."
else
    echo "⚠️ Warning: init.sql not found at backend/config/"
fi

# 3. Configurar Node.js v24
nvm install 24
nvm use 24

# 4. Instalación de dependencias en backend
if [ -d "backend" ]; then
    cd backend
    npm install

    # 5. Crear el archivo .env dinámicamente
    echo "Creating .env file..."
    cat <<EOF > .env
PORT=3000
DB_HOST=localhost
DB_USER=samplevault
DB_PASS=samplevault
DB_NAME=samplevault
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=testing
EOF
    echo "✅ Backend dependencies installed and .env created."
else
    echo "❌ Error: backend directory not found."
fi

echo "🚀 Setup complete! SampleVault is ready for testing."
