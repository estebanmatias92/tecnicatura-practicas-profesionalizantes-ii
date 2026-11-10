# BiblioTech — Datos del Proyecto

## 1. Descripción

BiblioTech es un sistema de gestión de libros digitales que facilita a una biblioteca publicar y consultar material: los profesores suben contenidos, los estudiantes autenticados acceden como lectores y la administración mantiene control total, todo desde una plataforma web simple y segura.

## 2. Objetivos

- Implementar control de acceso por roles y gestión de material bibliográfico.
- Aplicar arquitectura en capas con buenas prácticas de backend.

## 3. Roles y acceso

- **Admin:** acceso total.
- **Professor:** sube material.
- **Student:** consulta como cliente (requiere autenticación).
- Sesión con JWT, BCrypt, etc.

## 4. Requerimientos

### Seguridad y roles

1. Autenticación y autorización mínima (Roles: Admin, Professor, Student).
2. Admin con acceso total, Professor sube material, Student consulta como cliente. Toda lectura/búsqueda exige autenticación.
3. Sesión con JWT, BCrypt, etc.

### Contenidos y archivos

4. Manejo de archivos con Multer.

### Arquitectura y código

5. Separación en capas Frontend y Backend.
6. Uso del patrón Repository.
7. Módulo Validator —o Filter— para validación de reglas de negocio (ej.: formato de email, password, etc.).

### Datos

8. Como mínimo, el motor de base de datos debe ser MariaDB (pueden usar el que quieran).

## 5. Stack decidido

Decisión (despega de Vanilla; se introduce TS + build + test desde el inicio):

- Backend: Node 22 + TypeScript + **NestJS** (módulos + DI). Auth con `@nestjs/jwt` + `bcrypt`, uploads con Multer vía `FileInterceptor`, validación con `class-validator`/`class-transformer` (es el módulo Validator/Filter), persistencia en MariaDB vía TypeORM (Repository pattern), config con `@nestjs/config`.
- Frontend: **React + TypeScript**, buildeado con **Vite** (Vite es build tool, no framework) y testeado con Vitest. Separado del backend, consume API REST.
- DB: MariaDB 11.
- Toolchain: `tsc` / `nest build`, Jest (backend) + Vitest (frontend), ESLint + Prettier.

## 6. Alcance / No-alcance

- Alcance: publicación y consulta de material bibliográfico digital con roles.
- No-alcance definido aún: préstamo físico, reservas, multas, notificaciones.
