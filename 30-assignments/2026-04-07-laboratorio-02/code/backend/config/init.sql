SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- 1. Borrar la base de datos si existe para evitar conflictos de versiones anteriores
DROP DATABASE IF EXISTS samplevault;
CREATE DATABASE samplevault;
USE samplevault;

-- 2./*Crear usuario de la base de datos y otorgar permisos*/
CREATE USER 'samplevault'@'localhost' IDENTIFIED BY 'samplevault';
GRANT ALL PRIVILEGES ON samplevault.* TO 'samplevault'@'localhost';

-- 3. Crear tabla de Usuarios
-- Nota: Usamos 'username' para coincidir con userRepo.js y authController.js
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'producer') DEFAULT 'producer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla de Samples
CREATE TABLE samples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    bpm INT DEFAULT 0,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Insertar un Administrador de prueba
-- La contraseña es '12345', pero ya está hasheada con bcrypt para que el login funcione.
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS', 'admin');

-- 6. Insertar un Productor de prueba
-- La contraseña es '12345' (hasheada)
INSERT INTO users (username, password, role) 
VALUES ('pepe', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS', 'producer');