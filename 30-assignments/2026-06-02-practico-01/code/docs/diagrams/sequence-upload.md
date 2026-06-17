# Secuencia: Subir Sample

> Flujo completo de subida de archivo de audio. Muestra multer → validaciones → DB → file system.

![Sequence Diagram: Upload](./_assets/sequence-upload.svg)

## Puntos de validación en este flujo (orden de ejecución)

| Paso | Validación asociada | Código HTTP |
|------|---------------------|-------------|
| verifyToken | Token inválido/ausente | 401/403 |
| multer fileFilter | Tipo MIME no aceptado | 400 |
| multer limits `fileSize` | Archivo excede 10 MB | 413 |
| Controller `!req.file` | No se subió archivo | 400 |
| fileHelper.detectFileType | MIME declarado ≠ magic bytes reales | 415 |
| Controller `!display_name \|\| !category` | Metadatos obligatorios | 400 |
| validateInput | Patrón SQLi/XSS detectado | 400 |
| Controller `parseInt(bpm)` + rango `BPM_MIN..BPM_MAX` | BPM fuera de rango (20-300) o no numérico | 400 |

## Archivos involucrados

- `frontend/js/frontControllers/samplesFrontController.js` — captura submit del form
- `backend/config/multerConfig.js` — fileFilter + diskStorage + límite de peso
- `backend/controllers/sampleController.js` — validación (metadatos, BPM, magic bytes) + persistencia
- `backend/repositories/sampleRepo.js` — `sp_create_sample`
- `backend/utils/fileHelper.js` — detección por magic bytes + limpieza en caso de error
- `backend/utils/validation.js` — `validateInput` (SQLi/XSS)
