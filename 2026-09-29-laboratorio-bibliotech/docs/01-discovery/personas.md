# Personas — BiblioTech

## Admin

- **Goal:** control total de usuarios y material.
- **Pain:** sin panel único, gestión ad-hoc.
- **Accede a:** gestión de usuarios, todo el material, altas/bajas.
- **Supuesto:** opera autenticado siempre; nunca anónimo.

## Professor

- **Goal:** subir material y que quede disponible para lectura.
- **Pain:** subida sin trazabilidad ni validación.
- **Accede a:** subida + metadatos (sin visibilidad); consulta total autenticada.
- **Supuesto:** solo material propio editable salvo Admin.

## Student

- **Goal:** leer todo el material autenticado.
- **Pain:** login obligatorio o enlaces sueltos.
- **Accede a:** lectura total con JWT (cualquier material, cualquier dueño).
- **Supuesto:** registro con email + password validados (OQ-01).
