# NFR-004: Subida — Inconsistencia de Tipo MIME

> **Validación:** Subida — Inconsistencia de Tipo MIME
> **HTTP Status:** `415 Unsupported Media Type` / `400 Bad Request`
> **Prioridad:** Media
> **Estado actual:** Backend ✅ | Frontend ✅ | Test 🧪

---

## Descripción

Cuando un usuario sube un archivo cuyo tipo MIME no coincide con los formatos de audio permitidos (MP3, WAV, OGG, FLAC), el sistema debe rechazar la subida. Actualmente Multer filtra por MIME pero no verifica que el contenido real del archivo coincida con su extensión. Se requiere una validación más rigurosa que inspeccione los _magic bytes_ del archivo.

## Criterios de Aceptación

### Backend

- [x] Multer ya filtra por MIME (`audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`) — mantener esta capa
- [x] Agregar una segunda capa de validación que lea los _magic bytes_ (firma de archivo) para confirmar el tipo real
- [x] Si el MIME declarado no coincide con el contenido real, responder HTTP `415` con `{ message: "El tipo de archivo no coincide con su contenido real." }`
- [x] Si el MIME no está en la lista de permitidos, responder HTTP `400` con `{ message: "Formato de archivo no soportado. Use MP3, WAV, OGG o FLAC." }`
- [x] Eliminar el archivo físico del uploads/ si la validación falla (para no dejar basura)

### Frontend

- [x] Mostrar modal/mensaje específico: "El tipo de archivo no coincide con su contenido real."
- [x] Mostrar modal/mensaje específico: "Formato de archivo no soportado. Use MP3, WAV, OGG o FLAC."

### Tests

- [x] **Test positivo:** Subir archivo `.wav` con MIME `audio/wav` válido → espera `201`
- [x] **Test negativo 1:** Subir archivo renombrado `.mp3` que en realidad es un `.txt` → espera `415`
- [x] **Test negativo 2:** Subir archivo `.pdf` con MIME `application/pdf` → espera `400`
- [ ] **Test de borde:** Subir archivo sin extensión pero con MIME válido → espera `201` o `400` según contenido real

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Archivo válido | `201` | `{ message: "Sample cargado exitosamente...", id, path }` |
| MIME vs contenido no coinciden | `415` | `{ message: "El tipo de archivo no coincide con su contenido real." }` |
| MIME no permitido | `400` | `{ message: "Formato de archivo no soportado. Use MP3, WAV, OGG o FLAC." }` |

## Notas de Implementación

- Los _magic bytes_ conocidos: MP3 → `FF FB` o `FF F3` / `49 44 33` (ID3), WAV → `52 49 46 46` (RIFF), OGG → `4F 67 67 53` (OggS), FLAC → `66 4C 61 43` (fLaC)
- La validación debe ocurrir después de Multer pero antes de guardar en DB
- Usar `fs.open` + `fs.read` para leer los primeros bytes del archivo subido
- `testUtils.resetState()` antes de cada test
