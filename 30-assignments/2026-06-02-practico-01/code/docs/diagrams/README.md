# Diagramas — Sample Vault

> Conjunto de diagramas PlantUML para onboarding en el proyecto brownfield.
> Para renderizar, usá el plugin PlantUML de Obsidian o `plantuml` CLI.

## Índice

| Diagrama | Tipo | Propósito |
| ---------- | ------ | ----------- |
| [[context-diagram\|Diagrama de Contexto]] | C4 Context | System Boundary: actores, sistema, sistemas externos |
| [[layer-diagram\|Diagrama de Capas]] | Capas | Separación Frontend → API → Middleware → Controladores → Repos → DB/FS |
| [[package-diagram\|Diagrama de Paquetes]] | Package UML | Paquetes internos del backend y frontend |
| [[sequence-login\|Secuencia: Login]] | Sequence UML | Flujo completo de autenticación |
| [[sequence-upload\|Secuencia: Subir Sample]] | Sequence UML | Flujo completo de subida de audio |
| [[sequence-delete\|Secuencia: Eliminar Sample]] | Sequence UML | Flujo completo de eliminación con ownership check |
| [[erd\|Diagrama Entidad-Relación]] | ERD | Tablas, columnas, claves, stored procedures |

## Requisitos para renderizar

- **Obsidian**: plugin "PlantUML" (community plugin)
- **VSCode**: extensión "PlantUML" de jebbs
- **CLI**: `plantuml diagrama.puml`

Para el diagrama de contexto (C4): el `!include` apunta al repositorio oficial de C4-PlantUML.
Requiere internet la primera vez. Sin conexión, descargar de https://github.com/plantuml-stdlib/C4-PlantUML

## Relación con el SDLC

Estos diagramas son artefactos de la fase **Diseño de Ingeniería** del ciclo adaptado.
Ver [[../sdlc/README.md]].

## Ubicación de cada validación en los diagramas

Cada validación del [[../requirements/validations-backlog\|backlog]] afecta partes específicas del sistema:

| Validación | Se ve en | Archivos clave |
| ------------ | ---------- | ---------------- |
| Contraseña corta | [[sequence-login\|Secuencia: Login]] → authController | `authController.js` |
| BPM inválido | [[sequence-upload\|Secuencia: Subir Sample]] → sampleController | `sampleController.js` |
| Límite de peso | [[layer-diagram\|Diagrama de Capas]] → multer layer | `multerConfig.js` |
| Token manipulado | [[sequence-login\|Secuencia: Login]] → verifyToken | `authMiddleware.js` |
| Recurso ajeno | [[sequence-delete\|Secuencia: Eliminar Sample]] → sampleRepo | `sampleRepo.js` / SPs |
| Borrado fantasma | [[sequence-delete\|Secuencia: Eliminar Sample]] → sampleRepo | `sampleRepo.js` / SPs |
