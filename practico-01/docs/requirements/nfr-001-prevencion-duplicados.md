# NFR-001: Registro — Prevención de Duplicados

> **Validación:** Registro — Prevención de Duplicados
> **HTTP Status:** `409 Conflict`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ✅ | Test 🧪

---

## Descripción

Cuando un usuario intenta registrarse con un nombre de usuario que ya existe en la base de datos, el sistema debe rechazar la operación con un código `409 Conflict` y un mensaje claro indicando la causa. Esto evita duplicados y asegura la unicidad del campo `username`.

## Criterios de Aceptación

### Backend

- [x] El controlador `authController.register` captura el error `ER_DUP_ENTRY` de MySQL
- [x] Responde con HTTP `409` y `{ message: "El nombre de usuario ya existe." }`
- [x] No se ejecuta `bcrypt.hash` ni se inserta ningún registro si el username ya existe
- [x] No se filtran detalles internos (como el stack trace) al cliente

### Frontend

- [x] El formulario de registro muestra un modal/mensaje con el texto "El nombre de usuario ya existe."
- [x] El mensaje se muestra en la interfaz sin recargar la página
- [x] El campo `username` mantiene el valor ingresado para que el usuario pueda corregirlo

### Tests

- [x] **Test positivo:** Registrar usuario nuevo → espera `201` + `userId`
- [x] **Test negativo:** Registrar el mismo usuario dos veces → primera `201`, segunda `409` con mensaje de duplicado
- [ ] **Test de borde:** Registrar con username que difiere solo en mayúsculas (depende del collation de la DB) → verificar comportamiento esperado

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Registro exitoso | `201` | `{ message: "Usuario registrado con éxito.", userId }` |
| Username duplicado | `409` | `{ message: "El nombre de usuario ya existe." }` |
| Error interno | `500` | `{ message: "Error interno durante el registro." }` |

## Notas de Implementación

- MySQL lanza `ER_DUP_ENTRY` (código `1062`) cuando se viola la constraint `UNIQUE` en `users.username`
- La captura actual ya está implementada en `authController.js:45-47`
- El test debe usar `testUtils.resetState()` antes de cada ejecución para garantizar estado limpio
