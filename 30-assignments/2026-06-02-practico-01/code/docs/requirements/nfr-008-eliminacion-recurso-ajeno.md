# NFR-008: Seguridad — Eliminación de Recurso Ajeno

> **Validación:** Eliminación de Recurso Ajeno
> **HTTP Status:** `403 Forbidden` / `404 Not Found`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ⚠️ (parcial) | Test ❌

---

## Descripción

Cuando un productor intenta eliminar un sample que no le pertenece, el sistema debe rechazar la operación. El SP `sp_find_sample_by_id` y `sp_delete_sample` filtran por `user_id`, pero el mensaje actual es genérico ("El sample no existe o no tienes permisos"). Se requiere un mensaje más específico y una validación explícita en el controlador.

## Criterios de Aceptación

### Backend

- [ ] `sampleController.deleteSample` verifica que el sample pertenezca al usuario autenticado
- [ ] Si el sample existe pero no pertenece al usuario, responder HTTP `403` y `{ message: "No tienes permisos para eliminar este sample." }`
- [ ] Si el sample no existe (independientemente del usuario), responder HTTP `404` y `{ message: "El sample solicitado no existe." }`
- [ ] Diferenciar claramente entre "no existe" y "no tienes permisos" (códigos HTTP distintos)

### Frontend

- [ ] Mostrar modal/mensaje específico: "No tienes permisos para eliminar este sample."
- [ ] Diferenciar visualmente del mensaje de "no existe"

### Tests

- [ ] **Test positivo:** Eliminar sample propio → espera `200`
- [ ] **Test negativo 1:** Login como `pepe`, intentar eliminar sample de `admin` → espera `403` + mensaje específico
- [ ] **Test negativo 2:** Eliminar sample con ID inexistente → espera `404`
- [ ] **Test de borde:** Login como admin, intentar eliminar sample de otro usuario → definir política (403 si no es admin, o permitir si es admin)

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
