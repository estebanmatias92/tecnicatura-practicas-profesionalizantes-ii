# Eliminación lógica con papelera de Admin

## Status

accepted

## Context

La feature "Eliminar material" debe preservar trazabilidad y permitir recuperación.
Una eliminación física destruiría el archivo y el historial.

## Decision

**Eliminar** es un borrado lógico:

- Lo puede ejecutar el propietario o Admin, en cualquier visibilidad.
- El material desaparece de catálogo, búsqueda y acceso directo para todos, incluido el propietario (404).
- El archivo permanece en disco.
- Admin tiene una **Papelera** para listar eliminados y **restaurar**.
- Restaurar conserva la visibilidad previa (público sigue público; oculto sigue oculto).
- No hay purga física en v1.

## Consequences

- Se conserva la auditoría y la posibilidad de recuperación.
- El storage puede acumular archivos de materiales eliminados; se acepta en v1.
- Las consultas normales deben excluir eliminados explícitamente.
- El endpoint de restauración es exclusivo de Admin.
