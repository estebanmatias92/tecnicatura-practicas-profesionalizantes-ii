# NFR-010: Seguridad — Prevención de SQL Injection

> **Validación:** Prevención de SQL Injection
> **HTTP Status:** `400 Bad Request`
> **Prioridad:** Baja
> **Estado actual:** Backend ✅ | Frontend ❌ (ruta de búsqueda no existe) | Test ❌

---

## Descripción

El sistema debe estar protegido contra ataques de inyección SQL. Actualmente todas las consultas usan parámetros posicionales (`?` en mysql2) a través de Stored Procedures, lo que proporciona protección en el backend. Sin embargo, si en el futuro se agrega una ruta de búsqueda de samples, debe implementarse con consultas parametrizadas y validación de entrada.

## Criterios de Aceptación

### Backend
- [ ] Todas las consultas SQL deben usar parámetros posicionales (`?`) o Stored Procedures
- [ ] No debe existir ninguna concatenación de strings en consultas SQL
- [ ] Si se agrega una ruta de búsqueda (GET /api/samples/search?q=...), debe usar `LIKE ?` con parámetro, no concatenación
- [ ] Validar y sanitizar todos los inputs de usuario (especialmente strings) antes de pasarlos a las consultas
- [ ] El usuario de DB (`samplevault`) tiene solo permisos `SELECT, EXECUTE` (Principio de Menor Privilegio)

### Frontend
- [ ] Si se agrega una barra de búsqueda, escapar caracteres especiales antes de enviar al backend
- [ ] No mostrar mensajes de error SQL crudos al usuario

### Tests
- [ ] **Test de seguridad:** Enviar payload con `' OR 1=1 --` en un campo de texto → esperar que no retorne datos no autorizados
- [ ] **Test de seguridad:** Enviar payload con `'; DROP TABLE samples; --` → esperar que no altere la DB
- [ ] **Test de seguridad:** Enviar payload con `<script>alert(1)</script>` → esperar que se maneje como string literal, no se ejecute
- [ ] Verificar que el usuario `samplevault` no pueda ejecutar `INSERT`, `UPDATE`, `DELETE` directos

## Mensajes Esperados

| Situación | HTTP | Respuesta |
|-----------|------|-----------|
| Consulta normal | Depende | Datos esperados |
| Intento de SQL injection | `400` | `{ message: "Caracteres no permitidos en la entrada." }` o similar |
| Error de DB | `500` | `{ message: "Error interno del servidor." }` (sin detalles SQL) |

## Notas de Implementación

- El backend actual ya está protegido: todas las consultas pasan por SP con parámetros `?`
- La configuración `init.sql` otorga solo `GRANT SELECT, EXECUTE` al usuario `samplevault`
- Para una futura ruta de búsqueda, implementar: `WHERE display_name LIKE CONCAT('%', ?, '%')`
- Usar `express-validator` o validación manual para sanitizar inputs
- `testUtils.resetState()` antes de cada test
