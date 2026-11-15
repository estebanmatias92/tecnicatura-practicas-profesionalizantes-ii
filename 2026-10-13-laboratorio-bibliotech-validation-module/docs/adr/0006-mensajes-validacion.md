# Resolución de mensajes: validador consulta al manejador de lenguaje

## Status

accepted

## Context

El Lab 10 centraliza los mensajes de validación en un catálogo único con parámetros e idiomas (`es`/`en`). Quedan dos formas de entregar el mensaje al cliente: que el validador lance el error con el texto resuelto, o que emita clave + parámetros y el borde HTTP lo resuelva al atrapar la excepción.

## Decision

El validador de dominio consulta al manejador de lenguaje en el momento de lanzar el error y devuelve el texto resuelto. El `DomainExceptionFilter` solo serializa `message`/`error`/`statusCode`; no resuelve claves. El camino DTO (ValidationPipe + exceptionFactory localizada) es el único que convierte mensajes desde claves; ambos caminos usan el mismo `resolve()` del manejador.

## Consequences

- Un cambio de idioma afecta las validaciones posteriores sin tocar los validadores.
- Los validadores pierden su texto propio: el catálogo es la única fuente de redacción.
- El contrato HTTP queda estable: dominio devuelve `message` como string con `error: "VALIDATION"`; DTO devuelve `message` como array con `error: "Bad Request"` (convención Nest/class-validator), sin defaults en inglés ni mezcla de idiomas.
- El fallback (idioma activo → `es` → recurso inválido) vive en el manejador, no en filtros ni DTOs.
- Los validadores no admiten params de validación como mínimo: el validador pasa `{ min: 8 }`/`{ max: 72 }` explícitos; dado que las reglas están fijas en el validador, eso no es un problema.
