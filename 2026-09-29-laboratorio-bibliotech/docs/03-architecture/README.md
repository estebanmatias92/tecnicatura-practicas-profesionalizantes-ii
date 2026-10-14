# Architecture — BiblioTech (aprobado 2026-10-13)

Estilo: **Clean 4 Layers** ([ADR-0001](adrs/0001-clean-4-layer-architecture.md)). Reglas vía Strategy ([ADR-0002](adrs/0002-strategy-for-rules.md)). Persistencia TypeORM + storage local tras puertos ([ADR-0003](adrs/0003-orm-vs-sql.md)).

## C4

![C4 Context](c4-context.svg)
![C4 Container](c4-container.svg)

## Clases y datos

![Classes](class-diagram.svg)
![Data model](data-model-er.svg)

## Secuencias críticas (cada mensaje cita su GRASP)

- UC-001 auth: `sequence-diagram-UC-001.puml` — Controller → Creator → Pure Fabrication → Indirection → Information Expert.
- UC-002 upload 1:1: `sequence-diagram-UC-002.puml` — Controller → Creator (Material + FileBlob nuevos por POST, duplicados → 201).
- UC-004 cascada C-1/C-2/C-3: `sequence-diagram-UC-004.puml` — Controller → Information Expert (`isOwnedBy`) → transacción + rollback.
- UC-003/005/006: lecturas delgadas sobre los mismos componentes (Search usa Strategy de filtros; Download exige 401-primero).

## Capas (responsabilidad en 3 líneas por capa)

- **Entities** (User, Material, FileBlob, AuthSession): reglas empresa puras, cero imports framework. Saben sus datos y su creación/ownership (Information Expert + Creator).
- **Use Cases** (6 `*UseCase.execute()`): un punto de entrada por evento de sistema (Controller/Command). Orquestan validación, persistencia y cascada; sin SQL ni HTTP.
- **Interface Adapters** (controllers, guards, repos TypeORM, Multer storage, Validator): traducen HTTP/DB/FS a puertos estables (Adapter + Indirection + Pure Fabrication). Toda la variación predicha vive tras Strategy.
- **Frameworks & Drivers** (módulos Nest, config, migraciones, SPA React): cableado DI/Factory, JWT/BCrypt configurados (NFR-003), migraciones del ER. Detalle reemplazable sin tocar el core.

## Dependency Rule

Imports solo hacia adentro (`Frameworks → Adapters → UseCases → Entities`). Gate: 0 imports `@nestjs/*`/typeorm en `entities/` + `usecases/` (review o `dependency-cruiser`).
