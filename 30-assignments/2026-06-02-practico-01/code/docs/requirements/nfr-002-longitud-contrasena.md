# NFR-002: Registro — Longitud de Contraseña

> **Validación:** Registro — Longitud de Contraseña
> **HTTP Status:** `400 Bad Request`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ✅ | Test 🧪

---

## Descripción

Cuando un usuario intenta registrarse con una contraseña que no cumple con la longitud mínima de 8 caracteres, el sistema debe rechazar la operación antes de aplicar `bcrypt.hash`, devolviendo un `400 Bad Request` con un mensaje específico. Esto ahorra recursos de cómputo (hashing) y guía al usuario.

## Criterios de Aceptación

### Backend
- [x] En `authController.register`, antes de `bcrypt.hash(password, 10)`, se valida que `password.length >= 8`
- [x] Si la contraseña es menor a 8 caracteres, responde con HTTP `400` y `{ message: "La contraseña debe tener al menos 8 caracteres." }`
- [x] No se ejecuta `bcrypt.hash` si la validación falla
- [x] No se ejecuta la consulta a la DB si la validación falla

### Frontend
- [x] El formulario de registro muestra un modal/mensaje con "La contraseña debe tener al menos 8 caracteres."
- [x] El mensaje es específico para este error (no un genérico "Error en el registro")
- [x] Los campos del formulario no se pierden al mostrar el error

### Tests
- [x] **Test positivo:** Registrar con contraseña de 8 caracteres → espera `201`
- [x] **Test negativo:** Registrar con contraseña de 7 caracteres → espera `400` + mensaje específico
- [x] **Test de borde:** Registrar con contraseña vacía → espera `400` (por la validación de presencia existente)
- [x] **Test de borde:** Registrar con contraseña de exactamente 8 caracteres → espera `201`

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Contraseña < 8 caracteres | `400` | `{ message: "La contraseña debe tener al menos 8 caracteres." }` |
| Username o password vacío | `400` | `{ message: "Usuario y contraseña son requeridos." }` |
| Registro exitoso | `201` | `{ message: "Usuario registrado con éxito.", userId }` |

## Notas de Implementación

- La validación debe colocarse en `authController.js` **antes** de la línea `const hashedPassword = await bcrypt.hash(password, 10);`
- El orden de validaciones sugerido: (1) presencia de campos, (2) longitud mínima de password, (3) bcrypt hash, (4) inserción en DB
- `testUtils.resetState()` debe ejecutarse antes de cada test para estado limpio
