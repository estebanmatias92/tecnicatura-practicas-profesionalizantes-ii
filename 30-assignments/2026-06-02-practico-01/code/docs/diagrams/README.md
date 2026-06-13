# Diagramas — Sample Vault

> Conjunto de diagramas PlantUML para onboarding en el proyecto brownfield.
> Para renderizar, usá el plugin PlantUML de Obsidian o `plantuml` CLI.

## Índice

| Diagrama | Tipo | Propósito |
| ---------- | ------ | ----------- |
| [Diagrama de Contexto](./context-diagram.md) | C4 Context | System Boundary: actores, sistema, sistemas externos |
| [Diagrama de Capas](./layer-diagram.md) | Capas | Separación Frontend → API → Middleware → Controladores → Repos → DB/FS |
| [Diagrama de Paquetes](./package-diagram.md) | Package UML | Paquetes internos del backend y frontend |
| [Secuencia: Login](./sequence-login/.md) | Sequence UML | Flujo completo de autenticación |
| [Secuencia: Subir Sample](./sequence-upload.md) | Sequence UML | Flujo completo de subida de audio |
| [Secuencia: Eliminar Sample](./sequence-delete.md) | Sequence UML | Flujo completo de eliminación con ownership check |
| [Diagrama Entidad-Relación](./erd.md) | ERD | Tablas, columnas, claves, stored procedures |

## Requisitos para renderizar

- **Obsidian**: plugin "PlantUML" (community plugin)
- **VSCode**: extensión "PlantUML" de jebbs
- **CLI**: `plantuml diagrama.puml`

Para el diagrama de contexto (C4): el `!include` apunta al repositorio oficial de C4-PlantUML.
Requiere internet la primera vez. Sin conexión, descargar de [https://github.com/plantuml-stdlib/C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML)

## Relación con el SDLC

Estos diagramas son artefactos de la fase **Diseño de Ingeniería** del ciclo adaptado.
Ver [SDLC README](../sdlc/README.md).

## Ubicación de cada validación en los diagramas

Cada validación del [backlog](../requirements/validations-backlog.md) afecta partes específicas del sistema:

| Validación | Se ve en | Archivos clave |
| ------------ | ---------- | ---------------- |
| Contraseña corta | [Secuencia: Login](./sequence-login/.md)  → authController | `authController.js` |
| BPM inválido | [Secuencia: Subir Sample](./sequence-upload.md) → sampleController | `sampleController.js` |
| Límite de peso | [Diagrama de Capas](./layer-diagram.md) → multer layer | `multerConfig.js` |
| Token manipulado | [Secuencia: Login](./sequence-login/.md)  → verifyToken | `authMiddleware.js` |
| Recurso ajeno | [Secuencia: Eliminar Sample](./sequence-delete.md) → sampleRepo | `sampleRepo.js` / SPs |
| Borrado fantasma | [Secuencia: Eliminar Sample](./sequence-delete.md) → sampleRepo | `sampleRepo.js` / SPs |
