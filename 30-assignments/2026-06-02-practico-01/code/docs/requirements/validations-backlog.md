# Validations Backlog — Sample Vault

> Estado actual de las 10 validaciones propuestas para el TP.
> Cada alumno debe elegir una y completar el ciclo: RE → Diseño → Implementación → Test.

## Leyenda

| Icono | Significado |
| ------- | ------------- |
| ✅ | Ya implementado |
| ⚠️ | Implementación parcial / incompleta |
| ❌ | No implementado |
| 📝 | User Story redactada (RE completado) |
| 🔧 | En implementación |
| 🧪 | Test escrito |
| 🚀 | Completado (ciclo entero) |

---

## Autenticación y Usuarios

| # | Validación | HTTP | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --------- | ---------- | ------ | ----------- |
| 1 | Registro - Prevención de Duplicados | 409 | ✅ Captura `ER_DUP_ENTRY` | ✅ showModal existente | ❌ | Alta |
| 2 | Registro - Longitud de Contraseña | 400 | ❌ No hay validación antes de bcrypt | ❌ No hay mensaje específico | ❌ | Alta |
| 3 | Login - Estructura Incompleta | 400 | ✅ Verifica `!username \|\| !password` | ✅ showModal existente | ❌ | Alta |

## Archivos (Multer y Storage)

| # | Validación | HTTP | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --------- | ---------- | ------ | ----------- |
| 4 | Subida - Inconsistencia de Tipo MIME | 415/400 | ⚠️ Multer filtra MIME pero no verifica contenido real vs extensión | ❌ No hay mensaje específico | ❌ | Media |
| 5 | Subida - Límite de Peso | 413 | ❌ No hay `limits.fileSize` en Multer | ❌ No hay mensaje específico | ❌ | Media |
| 6 | Subida - Coherencia del BPM | 400 | ❌ Solo `parseInt(bpm) \|\| 0`, sin rango (20-300) | ❌ No hay mensaje específico | ❌ | Alta |

## Seguridad (Aislamiento y Autenticación)

| # | Validación | HTTP | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --------- | ---------- | ------ | ----------- |
| 7 | Manipulación del Token JWT | 401 | ✅ verifyToken rechaza firmas inválidas | ❌ No hay mensaje específico ("Sesión inválida o corrompida") | ❌ | Alta |
| 8 | Eliminación de Recurso Ajeno | 403/404 | ✅ SP filtra por `user_id` | ⚠️ Mensaje genérico "no tienes permisos" | ❌ | Alta |

## Integridad Lógica

| # | Validación | HTTP | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --------- | ---------- | ------ | ----------- |
| 9 | Borrado Fantasma (ID inexistente) | 404 | ✅ Responde 404 si `!sample` | ⚠️ Mensaje genérico | ❌ | Media |
| 10 | Prevención de SQL Injection | 400 | ✅ Uso de consultas preparadas (`?` en mysql2) | ❌ No implementado (ruta de búsqueda no existe aún) | ❌ | Baja |

---

## Resumen

| Estado | Cantidad |
| -------- | ---------- |
| ✅ Completas (Backend + Frontend + Test) | 0 |
| ⚠️ Parciales (solo backend o solo frontend) | 5 |
| ❌ Sin implementar | 5 |
| 🧪 Con test | 0 |

## Cómo usar este backlog

1. Elegir una validación de la lista
2. Crear `docs/requirements/req-NNN-slug.md` con User Story + Gherkin
3. Implementar backend y frontend
4. Escribir el test en `frontend/js/tests/`
5. Actualizar el estado en esta tabla
6. Commit a branch `apellido_nombre`
