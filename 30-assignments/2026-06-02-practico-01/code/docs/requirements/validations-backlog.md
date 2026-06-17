# Validations Backlog — Sample Vault

> Estado actual de las 10 validaciones propuestas para el TP.
> Cada alumno debe elegir una y completar el ciclo: RE → Diseño → Implementación → Test.

## Leyenda

| Icono | Significado |
| ------- | ------------- |
| ✅ | Ya implementado |
| ⚠️ | Implementación parcial / incompleta |
| ❌ | No implementado |
| 📝 | NFR redactado (RE completado) |
| 🔧 | En implementación |
| 🧪 | Test escrito |
| 🚀 | Completado (ciclo entero) |

---

## Autenticación y Usuarios

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 1 | [Registro - Prevención de Duplicados](nfr-001-prevencion-duplicados.md) | 409 | 📝 | ✅ Captura `ER_DUP_ENTRY` | ✅ showModal existente | 🧪 | Alta |
| 2 | [Registro - Longitud de Contraseña](nfr-002-longitud-contrasena.md) | 400 | 📝 | ✅ Valida `password.length` antes de bcrypt | ✅ showModal con mensaje específico | 🧪 | Alta |
| 3 | [Login - Estructura Incompleta](nfr-003-login-estructura-incompleta.md) | 400 | 📝 | ✅ Verifica `!username \|\| !password` | ✅ showModal existente | 🧪 | Alta |

## Archivos (Multer y Storage)

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 4 | [Subida - Inconsistencia de Tipo MIME](nfr-004-inconsistencia-tipo-mime.md) | 415/400 | 📝 | ✅ Magic bytes + MIME filter (2 capas) | ✅ showModal con mensaje específico | 🧪 | Media |
| 5 | [Subida - Límite de Peso](nfr-005-limite-peso.md) | 413 | 📝 | ✅ `limits.fileSize` configurado + 413 capturado | ✅ showModal con mensaje específico | 🧪 | Media |
| 6 | [Subida - Coherencia del BPM](nfr-006-coherencia-bpm.md) | 400 | 📝 | ✅ Valida rango 20-300 + numérico, elimina archivo si falla | ✅ Modal con mensaje específico | 🧪 | Alta |

## Seguridad (Aislamiento y Autenticación)

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 7 | [Manipulación del Token JWT](nfr-007-manipulacion-token-jwt.md) | 401 | 📝 | ✅ verifyToken rechaza firmas inválidas | ✅ Modal con "Sesión inválida o corrompida" + redirect login | 🧪 | Alta |
| 8 | [Eliminación de Recurso Ajeno](nfr-008-eliminacion-recurso-ajeno.md) | 403/404 | 🚀 | ✅ Controller diferencia 403/404 + admin bypass | ✅ Modal con mensaje específico + titles diferenciados | 🧪 | Alta |

## Integridad Lógica

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 9 | [Borrado Fantasma (ID inexistente)](nfr-009-borrado-fantasma.md) | 404 | 🚀 | ✅ Controller responde "El sample solicitado no existe." | ✅ Modal con título "No encontrado" | 🧪 | Media |
| 10 | [Prevención de SQL Injection](nfr-010-prevencion-sql-injection.md) | 400 | 🚀 | ✅ Validation layer + SPs + DB user `SELECT, EXECUTE` | ✅ Sin barra de búsqueda (N/A), errores SQL nunca llegan al frontend | 🧪 | Baja |

---

## Resumen

| Estado | Cantidad |
| -------- | ---------- |
| 📝 NFR redactado | 10 |
| 🚀 Ciclo completo (Backend + Frontend + Test) | 10 |
| ⚠️ Parciales (falta backend, frontend o test) | 0 |
| ❌ Sin implementar | 0 |
| 🧪 Con test | 10 |

## Cómo usar este backlog

1. Elegir una validación de la lista
2. Crear `docs/requirements/nfr-NNN-slug.md` con descripción + checklist de aceptación
3. Implementar backend y frontend
4. Escribir el test en `frontend/js/tests/`
5. Actualizar el estado en esta tabla
6. Commit a branch `apellido_nombre`
