# Secuencia: Eliminar Sample

> Flujo completo de eliminación de sample. Muestra ownership check → DB delete → file cleanup.

![Sequence Diagram: Delete](./_assets/sequence-delete.svg)

## Puntos de validación en este flujo

| Paso | Validación asociada | Código HTTP |
| ---- | --------------------- | ------------- |
| verifyToken | Token inválido | 401/403 |
| findById(id, userId) | Recurso ajeno / ID orishing | 404 |
| findById(id, userId) | Borrado fantasma (ID inexiste/ya borrado) | 404 |

## Ownership enforcement

El control de propiedad se implementa **en dos niveles**:

1. **Stored Procedure:** `sp_find_sample_by_id(p_id, p_user_id)` — filtra por ambos parámetros.
   Si el sample pertenece a otro usuario, no se devuelve ninguna fila.
2. **Controller:** si `!sample` (query resultó vacío), responde 404 sin distinguir entre "no existe" y "no es tuyo" (seguridad por omisión).

## Archivos involucrados

- `frontend/js/frontControllers/samplesFrontController.js` — confirm() + apiService
- `backend/controllers/sampleController.js` — método `deleteSample`
- `backend/repositories/sampleRepo.js` — `findById`, `delete`
- `backend/utils/fileHelper.js` — eliminación física del archivo
