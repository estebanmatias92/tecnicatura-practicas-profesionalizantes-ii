# NFR-008: Seguridad — Eliminación de Recurso Ajeno

> **Validación:** Eliminación de Recurso Ajeno
> **HTTP Status:** `403 Forbidden` / `404 Not Found`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ✅ | Test 🧪

---

## Descripción

Cuando un productor intenta eliminar un sample que no le pertenece, el sistema debe rechazar la operación. El SP `sp_find_sample_by_id` y `sp_delete_sample` filtran por `user_id`, pero el mensaje actual es genérico ("El sample no existe o no tienes permisos"). Se requiere un mensaje más específico y una validación explícita en el controlador.

## Criterios de Aceptación

### Backend

- [x] `sampleController.deleteSample` verifica que el sample pertenezca al usuario autenticado
- [x] Si el sample existe pero no pertenece al usuario, responder HTTP `403` y `{ message: "No tienes permisos para eliminar este sample." }`
- [x] Si el sample no existe (independientemente del usuario), responder HTTP `404` y `{ message: "El sample solicitado no existe." }`
- [x] Diferenciar claramente entre "no existe" y "no tienes permisos" (códigos HTTP distintos)
- [x] Admin puede eliminar cualquier sample (bypass de propiedad)

### Frontend

- [x] Mostrar modal/mensaje específico: "No tienes permisos para eliminar este sample."
- [x] Diferenciar visualmente del mensaje de "no existe"

### Tests

- [x] **Test positivo:** Eliminar sample propio → espera `200`
- [x] **Test negativo 1:** Login como `pepe`, intentar eliminar sample de `admin` → espera `403` + mensaje específico
- [x] **Test negativo 2:** Eliminar sample con ID inexistente → espera `404`
- [x] **Test de borde:** Login como admin, intentar eliminar sample de otro usuario → espera `200` (admin bypass)

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Sample propio eliminado | `200` | `{ message: "Registro eliminado y archivo físico removido con éxito." }` |
| Sample existe pero no es propio | `403` | `{ message: "No tienes permisos para eliminar este sample." }` |
| Sample no existe | `404` | `{ message: "El sample solicitado no existe." }` |

## Notas de Implementación

- El SP `sp_find_sample_by_id` ya recibe `user_id` como filtro, lo que retorna `undefined` si no es del usuario
- Mejorar `sampleController.deleteSample` para distinguir entre "no existe" y "sin permisos" usando dos consultas o una consulta sin filtro de usuario primero
- `testUtils.resetState()` antes de cada test
