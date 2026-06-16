# NFR-005: Subida — Límite de Peso

> **Validación:** Subida — Límite de Peso
> **HTTP Status:** `413 Payload Too Large`
> **Prioridad:** Media
> **Estado actual:** Backend ❌ | Frontend ❌ | Test ❌

---

## Descripción

Cuando un usuario intenta subir un archivo de audio que excede el tamaño máximo permitido (10 MB), el sistema debe rechazar la subida con un `413 Payload Too Large` antes de almacenar el archivo en disco. Esto protege los recursos del servidor (almacenamiento, ancho de banda) y sigue el principio de eficiencia GREENSOFT.

## Criterios de Aceptación

### Backend

- [ ] Configurar `limits.fileSize` en Multer con un máximo de `10 * 1024 * 1024` (10 MB)
- [ ] Si el archivo excede el límite, Multer debe lanzar un error `LIMIT_FILE_SIZE`
- [ ] Capturar el error `LIMIT_FILE_SIZE` y responder con HTTP `413` y `{ message: "El archivo excede el límite de 10 MB." }`
- [ ] No escribir ningún archivo en `uploads/` si excede el límite
- [ ] No ejecutar ninguna consulta a la DB si excede el límite

### Frontend

- [ ] Mostrar modal/mensaje específico: "El archivo excede el límite de 10 MB."
- [ ] El mensaje debe ser visible para el usuario antes de cualquier otra interacción

### Tests

- [ ] **Test positivo:** Subir archivo de 1 MB → espera `201`
- [ ] **Test negativo:** Subir archivo de 15 MB → espera `413` + mensaje
- [ ] **Test de borde:** Subir archivo de exactamente 10 MB → espera `201`
- [ ] **Test de borde:** Subir archivo de 10.1 MB → espera `413`

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Archivo dentro del límite | `201` | `{ message: "Sample cargado exitosamente...", id, path }` |
| Archivo excede 10 MB | `413` | `{ message: "El archivo excede el límite de 10 MB." }` |

## Notas de Implementación

- Agregar `limits: { fileSize: 10 * 1024 * 1024 }` en la configuración de Multer (`multerConfig.js`)
- Express maneja `413` automáticamente si Multer está configurado correctamente
- Capturar el error específico: `err.code === 'LIMIT_FILE_SIZE'`
- También se puede agregar validación en el frontend con `file.size` antes del envío
- `testUtils.resetState()` antes de cada test
