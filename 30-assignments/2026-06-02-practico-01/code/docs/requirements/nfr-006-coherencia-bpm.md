# NFR-006: Subida — Coherencia del BPM

> **Validación:** Subida — Coherencia del BPM
> **HTTP Status:** `400 Bad Request`
> **Prioridad:** Alta
> **Estado actual:** Backend ✅ | Frontend ✅ | Test ✅ | 🚀

---

## Descripción

Cuando un usuario sube un sample con un valor de BPM fuera del rango musical coherente (20–300), el sistema debe rechazar la operación con un `400 Bad Request`. Actualmente solo se aplica `parseInt(bpm) || 0`, sin validación de rango. Esto permite valores incoherentes que contaminan los metadatos.

## Criterios de Aceptación

### Backend

- [x] En `sampleController.uploadSample`, validar que el BPM esté en el rango 20–300 (inclusive)
- [x] Si el BPM está fuera de rango, responder con HTTP `400` y `{ message: "El BPM debe estar entre 20 y 300." }`
- [x] Si el BPM no es un número válido (NaN), responder con HTTP `400` y `{ message: "El BPM debe ser un valor numérico." }`
- [x] Eliminar el archivo físico si la validación falla (para no dejar basura en `uploads/`)
- [x] No ejecutar la consulta a la DB si la validación falla

### Frontend

- [x] Mostrar modal/mensaje específico: "El BPM debe estar entre 20 y 300."
- [x] Mostrar modal/mensaje específico: "El BPM debe ser un valor numérico."
- [x] Los demás campos del formulario deben conservarse al mostrar el error

### Tests

- [x] **Test positivo:** Subir sample con BPM = 120 → espera `201`
- [x] **Test negativo 1:** Subir con BPM = 10 → espera `400` + mensaje de rango
- [x] **Test negativo 2:** Subir con BPM = 350 → espera `400` + mensaje de rango
- [x] **Test negativo 3:** Subir con BPM = "abc" → espera `400` + mensaje numérico
- [x] **Test de borde:** Subir con BPM = 20 → espera `201`
- [x] **Test de borde:** Subir con BPM = 300 → espera `201`
- [x] **Test de borde:** Subir con BPM = 19 → espera `400`
- [x] **Test de borde:** Subir con BPM = 301 → espera `400`
- [x] **Test de borde:** Subir con BPM = 0 → espera `400`

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| BPM en rango (20–300) | `201` | `{ message: "Sample cargado exitosamente...", id, path }` |
| BPM fuera de rango | `400` | `{ message: "El BPM debe estar entre 20 y 300." }` |
| BPM no numérico | `400` | `{ message: "El BPM debe ser un valor numérico." }` |

## Notas de Implementación

- Reemplazar `bpm: parseInt(bpm) || 0` en `sampleController.js:42` por validación explícita
- Orden sugerido: (1) validar que display_name y category existan, (2) validar BPM, (3) guardar en DB
- El BPM opcional (no enviado) debería usar un valor por defecto o ser tratado como null
- La eliminación del archivo físico si falla la validación sigue el principio GREENSOFT de eficiencia de almacenamiento
- `testUtils.resetState()` antes de cada test
