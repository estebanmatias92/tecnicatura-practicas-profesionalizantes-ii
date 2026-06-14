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
| 1 | [Registro - Prevención de Duplicados](nfr-001-prevencion-duplicados.md) | 409 | 📝 | ✅ Captura `ER_DUP_ENTRY` | ✅ showModal existente | ❌ | Alta |
| 2 | [Registro - Longitud de Contraseña](nfr-002-longitud-contrasena.md) | 400 | 📝 | ❌ No hay validación antes de bcrypt | ❌ No hay mensaje específico | ❌ | Alta |
| 3 | [Login - Estructura Incompleta](nfr-003-login-estructura-incompleta.md) | 400 | 📝 | ✅ Verifica `!username \|\| !password` | ✅ showModal existente | ❌ | Alta |

## Archivos (Multer y Storage)

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 4 | [Subida - Inconsistencia de Tipo MIME](nfr-004-inconsistencia-tipo-mime.md) | 415/400 | 📝 | ⚠️ Multer filtra MIME pero no verifica contenido real vs extensión | ❌ No hay mensaje específico | ❌ | Media |
| 5 | [Subida - Límite de Peso](nfr-005-limite-peso.md) | 413 | 📝 | ❌ No hay `limits.fileSize` en Multer | ❌ No hay mensaje específico | ❌ | Media |
| 6 | [Subida - Coherencia del BPM](nfr-006-coherencia-bpm.md) | 400 | 📝 | ❌ Solo `parseInt(bpm) \|\| 0`, sin rango (20-300) | ❌ No hay mensaje específico | ❌ | Alta |

## Seguridad (Aislamiento y Autenticación)

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 7 | [Manipulación del Token JWT](nfr-007-manipulacion-token-jwt.md) | 401 | 📝 | ✅ verifyToken rechaza firmas inválidas | ❌ No hay mensaje específico ("Sesión inválida o corrompida") | ❌ | Alta |
| 8 | [Eliminación de Recurso Ajeno](nfr-008-eliminacion-recurso-ajeno.md) | 403/404 | 📝 | ✅ SP filtra por `user_id` | ⚠️ Mensaje genérico "no tienes permisos" | ❌ | Alta |

## Integridad Lógica

| # | Validación | HTTP | NFR | Backend | Frontend | Test | Prioridad |
| --- | ----------- | ------ | --- | --------- | ---------- | ------ | ----------- |
| 9 | [Borrado Fantasma (ID inexistente)](nfr-009-borrado-fantasma.md) | 404 | 📝 | ✅ Responde 404 si `!sample` | ⚠️ Mensaje genérico | ❌ | Media |
| 10 | [Prevención de SQL Injection](nfr-010-prevencion-sql-injection.md) | 400 | 📝 | ✅ Uso de consultas preparadas (`?` en mysql2) | ❌ No implementado (ruta de búsqueda no existe aún) | ❌ | Baja |

---

## Resumen

| Estado | Cantidad |
| -------- | ---------- |
| 📝 NFR redactado | 10 |
| ✅ Completas (Backend + Frontend + Test) | 0 |
| ⚠️ Parciales (solo backend o solo frontend) | 5 |
| ❌ Sin implementar | 0 |
| 🧪 Con test | 0 |

## Cómo usar este backlog

1. Elegir una validación de la lista
2. Crear `docs/requirements/nfr-NNN-slug.md` con descripción + checklist de aceptación
3. Implementar backend y frontend
4. Escribir el test en `frontend/js/tests/`
5. Actualizar el estado en esta tabla
6. Commit a branch `apellido_nombre`
