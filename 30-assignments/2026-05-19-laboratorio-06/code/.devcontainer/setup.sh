#!/bin/bash

echo "Starting project setup..."

# 1. Esperar a que MariaDB esté listo (la feature lo inicia automáticamente)
until mysqladmin ping -h "localhost" --silent; do
    echo "Waiting for MariaDB..."
    sleep 2
done

# 2. Importar la base de datos
# Como server.js y las rutas están en /backend, buscamos el SQL allí[cite: 1, 3]
if [ -f "backend/config/init.sql" ]; then
    sudo mysql -u root < backend/config/init.sql
    echo "✅ Database initialized[cite: 3]."
else
    echo "⚠️ Warning: init.sql not found at backend/config/"
fi

# 3. Configurar Node.js v24
# La imagen base tiene nvm preinstalado
nvm install 24
nvm use 24

# 4. Instalación de dependencias en backend
if [ -d "backend" ]; then
    cd backend
    npm install
    
    # 5. Crear el archivo .env dinámicamente[cite: 2]
    echo "Creating .env file..."
    cat <<EOF > .env
PORT=3000
DB_HOST=localhost
DB_USER=samplevaulrf2
DB_PASS=samplevaulrf2
DB_NAME=samplevaulrf2
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=testing
EOF
    echo "✅ Backend dependencies installed and .env created[cite: 2]."
else
    echo "❌ Error: backend directory not found."
fi

echo "🚀 Setup complete! Sample Vault is ready for testing."