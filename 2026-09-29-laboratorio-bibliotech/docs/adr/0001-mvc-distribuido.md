# MVC distribuido

## Status

accepted

## Context

La cátedra exige mostrar MVC, desacoplamiento y separación en capas. El requisito
#5 pide separación Frontend/Backend, y el stack elegido es React + NestJS. Un MVC
server-rendered colapsaría ambos tiers en un solo despliegue y contradiría #5.

## Decision

Adoptamos **MVC distribuido**:

- **Model**: entidades de dominio, reglas de negocio, validadores e interfaces de repositorio. No conoce React ni Nest.
- **Controller**: controllers REST de NestJS, DTOs, guards y filtros. No contiene reglas de negocio.
- **View**: aplicación React. No accede a la base de datos; solo consume la API.

La persistencia (TypeORM), el storage de archivos y la seguridad (JWT/BCrypt) viven en
`infrastructure/` detrás de interfaces definidas por el Model. Es el detalle de
implementación que hace visible el desacoplamiento, no una cuarta capa de MVC.

## Consequences

- El Model se testea sin HTTP ni base de datos.
- Cambiar TypeORM por otro motor no toca el Model ni los controllers.
- La View puede evolucionar sin tocar el backend.
- Hay más mapeo (entidad de dominio ↔ entidad ORM) que en un CRUD acoplado.
- MVC clásico server-rendered queda descartado mientras se mantenga el requisito #5.
