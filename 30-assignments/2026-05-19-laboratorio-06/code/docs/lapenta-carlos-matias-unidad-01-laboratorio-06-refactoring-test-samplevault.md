# Backlog — Tests Faltantes (Frontend)

Batería de tests pendientes identificados para `frontend/js/tests/`. Orientado a desarrolladores juniors.

---

## Prioridad Alta — Casos borde obvios

- [ ] **Registro duplicado** — `POST /api/auth/register`
  Enviar un username que ya existe (ej: `pepe`). Esperar `409` o `400`.
  *Patrón:* Ej01 (exerciseTests.js).

- [ ] **Login con usuario inexistente** — `POST /api/auth/login`
  Enviar `{ username: "noexiste", password: "x" }`. Esperar `401`.
  *Patrón:* authTests.js (test de password incorrecto).

- [ ] **Subir archivo con tipo inválido** — `POST /api/samples/upload`
  Enviar un `.txt` en lugar de audio. El controller rechaza tipos no permitidos. Esperar `400`.
  *Patrón:* Ej04 (exerciseTests.js).

- [ ] **Subir sin archivo** — `POST /api/samples/upload`
  FormData sin el campo `audioFile`. Esperar `400`.
  *Patrón:* Ej04 (exerciseTests.js).

- [ ] **Samples sin token** — `GET /api/samples/my-samples`
  Llamar sin header `Authorization`. Esperar `401`.
  *Patrón:* authTests.js + expect(status === 401).

- [ ] **Admin: eliminar usuario** — `DELETE /api/admin/users/:id`
  Login como admin, elegir un ID distinto al propio, eliminar. Esperar `200`.
  *Patrón:* Ej03 (exerciseTests.js).

---

## Prioridad Media — Seguridad y reglas de negocio

- [ ] **Admin: auto-eliminación** — `DELETE /api/admin/users/:id`
  Intentar eliminarse a sí mismo. El controller debe rechazarlo. Esperar `403`.
  *Patrón:* Ej02 (exerciseTests.js).

- [ ] **Admin: listar usuarios sin token** — `GET /api/admin/users`
  Sin autenticación. Esperar `401`.
  *Patrón:* authTests.js.

- [ ] **Admin: eliminar usuario sin token** — `DELETE /api/admin/users/:id`
  Sin autenticación. Esperar `401`.
  *Patrón:* authTests.js.

---

## Prioridad Baja — Mejoras

- [ ] **Registro sin password** — `POST /api/auth/register`
  Body: `{ username: "test_" + Date.now() }`. Esperar `400`.
  *Patrón:* Ej04 (exerciseTests.js).

- [ ] **Eliminar sample de otro usuario** — `DELETE /api/samples/:id`
  Login como pepe, tomar un ID de sample que pertenezca a admin. Esperar `403`/`404`.
  *Patrón:* Ej02 + Ej03 (exerciseTests.js).

---

## 🐛 Bug existente

- [ ] **Corregir test "Usuario Incorrecto"** — `authTests.js:34`
  El test etiquetado "Test Login - Usuario Incorrecto (Juan y 12345)" tiene el body copiado del test anterior:
  ```js
  body: JSON.stringify({ username: 'pepe', password: '123' })
  ```
  Debería usar `username: 'juan'` para probar realmente un usuario inexistente.
