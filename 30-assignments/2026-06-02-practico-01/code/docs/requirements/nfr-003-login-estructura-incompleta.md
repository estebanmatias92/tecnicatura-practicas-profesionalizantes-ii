# NFR-003: Login — Estructura Incompleta

> **Validación:** Login — Estructura Incompleta
> **HTTP Status:** `400 Bad Request`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ✅ | Test 🧪

---

## Descripción

Cuando un usuario intenta iniciar sesión sin enviar todos los campos requeridos (`username` y `password`), el sistema debe rechazar la solicitud con un `400 Bad Request` antes de intentar cualquier autenticación. Esto evita consultas innecesarias a la base de datos y guía al usuario.

## Criterios de Aceptación

### Backend
- [x] En `authController.login`, se verifica que `username` y `password` estén presentes y no sean cadenas vacías
- [x] Si falta alguno, responde con HTTP `400` y `{ message: "Credenciales incompletas." }`
- [x] No se ejecuta `userRepo.findByUsername` si la validación falla

### Frontend
- [x] El formulario de login muestra un modal/mensaje con "Credenciales incompletas."
- [x] El mensaje es específico (no un genérico "Error de inicio de sesión")

### Tests
- [x] **Test positivo:** Login con `username` y `password` válidos → espera `200` + `token`
- [x] **Test negativo 1:** Login sin `username` → espera `400` + mensaje
- [x] **Test negativo 2:** Login sin `password` → espera `400` + mensaje
- [x] **Test negativo 3:** Login con ambos campos vacíos (`""`) → espera `400` + mensaje

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Campos incompletos | `400` | `{ message: "Credenciales incompletas." }` |
| Credenciales inválidas | `401` | `{ message: "Credenciales inválidas." }` |
| Login exitoso | `200` | `{ message: "Login exitoso.", token, role }` |

## Notas de Implementación

- La validación actual en `authController.js:63-65` ya cubre este caso
- El test debe verificar `response.status === 400` y el mensaje exacto
- Usar `testUtils.resetState()` antes de cada test
