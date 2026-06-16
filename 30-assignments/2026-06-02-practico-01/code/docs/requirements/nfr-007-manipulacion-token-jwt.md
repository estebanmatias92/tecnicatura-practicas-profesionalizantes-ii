# NFR-007: Seguridad — Manipulación del Token JWT

> **Validación:** Manipulación del Token JWT
> **HTTP Status:** `401 Unauthorized`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ❌ | Test ❌

---

## Descripción

Cuando un usuario intenta acceder a rutas protegidas con un token JWT alterado, malformado, expirado o con firma inválida, el sistema debe rechazar la solicitud con un `401 Unauthorized` y un mensaje claro. Esto protege la integridad de la sesión y evita accesos no autorizados.

## Criterios de Aceptación

### Backend

- [ ] `authMiddleware.verifyToken` verifica la firma del token usando `jwt.verify` con `SECRET_KEY`
- [ ] Si el token está malformado, responde con HTTP `403` y `{ message: "Formato de token incorrecto o inexistente." }`
- [ ] Si la firma es inválida o el token expiró, responde con HTTP `401` y `{ message: "Token inválido o expirado." }`

### Frontend

- [ ] Mostrar modal/mensaje específico: "Sesión inválida o corrompida. Por favor, inicie sesión nuevamente."
- [ ] En caso de `401`, redirigir al usuario a la pantalla de login
- [ ] Limpiar `localStorage` (remover token) al detectar un `401`

### Tests

- [ ] **Test positivo:** Acceder a ruta protegida con token válido → espera `200`
- [ ] **Test negativo 1:** Acceder con token alterado (modificar último carácter) → espera `401`
- [ ] **Test negativo 2:** Acceder con token expirado (generar token con `expiresIn: '0s'`) → espera `401`
- [ ] **Test negativo 3:** Acceder sin header `Authorization` → espera `403`
- [ ] **Test de borde:** Acceder con token de otro usuario (válido pero de otro user) → espera acceso denegado si el recurso no es propio

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Sin header o formato incorrecto | `403` | `{ message: "Formato de token incorrecto o inexistente." }` |
| Firma inválida o expirado | `401` | `{ message: "Token inválido o expirado." }` |
| Token válido | Depende de la ruta | `200`, datos del recurso |

## Notas de Implementación

- Backend ya implementado en `authMiddleware.js:24-46`
- En el frontend, el `apiService.js` debe interceptar `401` y limpiar sesión
- Para el test de token expirado, generar manualmente un JWT con `expiresIn: '0s'` o `Math.floor(Date.now() / 1000) - 10`
- `testUtils.resetState()` antes de cada test
