# NFR-009: Integridad — Borrado Fantasma (ID Inexistente)

> **Validación:** Borrado Fantasma — ID inexistente
> **HTTP Status:** `404 Not Found`
> **Prioridad:** Media
> **Estado actual:** Backend ✅ | Frontend ⚠️ (parcial) | Test ❌

---

## Descripción

Cuando un usuario intenta eliminar un sample proporcionando un ID que no existe en la base de datos, el sistema debe responder con un `404 Not Found` claro. Actualmente el SP retorna `undefined` y el controlador responde con "El sample no existe o no tienes permisos para eliminarlo". Se requiere separar el mensaje.

## Criterios de Aceptación

### Backend

- [ ] `sampleController.deleteSample` verifica si el sample existe (sin filtrar por usuario primero)
- [ ] Si el ID no existe en la tabla `samples`, responder HTTP `404` y `{ message: "El sample solicitado no existe." }`
- [ ] Si el sample existe pero no pertenece al usuario, responder HTTP `403` (ver NFR-008)

### Frontend

- [ ] Mostrar modal/mensaje específico: "El sample solicitado no existe."
- [ ] No confundir con mensaje de permisos

### Tests

- [ ] **Test positivo:** Eliminar sample con ID válido y propio → espera `200`
- [ ] **Test negativo:** Eliminar sample con ID `99999` (inexistente) → espera `404`
- [ ] **Test de borde:** Eliminar con ID `0` → espera `404`
- [ ] **Test de borde:** Eliminar con ID negativo → espera `400` o `404` según validación de parámetros

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| ID existe y es propio | `200` | `{ message: "Registro eliminado y archivo físico removido con éxito." }` |
| ID no existe | `404` | `{ message: "El sample solicitado no existe." }` |
| ID existe pero no es propio | `403` | `{ message: "No tienes permisos para eliminar este sample." }` |

## Notas de Implementación

- Separar la lógica de `deleteSample` en dos pasos: (1) buscar por ID sin filtro de usuario, (2) verificar propiedad
- Esto implica agregar un nuevo método en `sampleRepo` como `findByIdOnly(id)` que no filtre por `user_id`
- O usar `sp_find_sample_by_id` sin el parámetro de usuario (nuevo SP)
- `testUtils.resetState()` antes de cada test
