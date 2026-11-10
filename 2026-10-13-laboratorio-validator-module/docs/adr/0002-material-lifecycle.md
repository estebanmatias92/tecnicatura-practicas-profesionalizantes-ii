# Ciclo de vida y visibilidad del material

## Status

accepted

## Context

El material puede estar en construcción o publicado, y además puede ocultarse sin
perder su condición de publicación. Modelarlo como dos entidades (Borrador y
Publicación) duplicaría archivo, ID y enlaces.

## Decision

Una sola entidad **Material** con dos atributos independientes:

- **Visibilidad**: `OCULTO` (por defecto) o `PUBLICO`.
- **Fecha de primera publicación**: nula hasta la primera publicación.

Derivaciones:

- **Borrador** = material nunca publicado (fecha nula). Siempre oculto.
- **Publicación** = material publicado al menos una vez (fecha no nula). Puede estar oculto o público.

Transiciones:

- **Publicar**: OCULTO → PUBLICO. Exige título, autor y archivo. Setea la fecha de primera publicación solo la primera vez.
- **Ocultar**: PUBLICO → OCULTO. No borra la fecha de publicación.
- El borrador se crea automáticamente al ingresar el primer campo no vacío del formulario; nunca se crea vacío.

Reglas de acceso:

- Catálogo y búsqueda muestran solo materiales públicos y no eliminados.
- El propietario y Admin ven los ocultos; el resto recibe 404 (no 403) para no filtrar existencia.
- `autor` (obra) y `propietario` (usuario) son conceptos distintos.

## Consequences

- Publicar y ocultar son operaciones reversibles sobre el mismo ID.
- Un material oculto publicado conserva su fecha de publicación y puede volver a publicarse.
- No hay aprobación de Admin para publicar.
- Sin versionado, deduplicación ni transferencia de propiedad en v1.
