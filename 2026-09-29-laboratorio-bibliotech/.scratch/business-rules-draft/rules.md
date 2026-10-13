# Borrador — Reglas de negocio (BiblioTech)

> Fuente vigente: `docs/02-requirements/raw-needs.md` §BR (baseline v0.3.1).
> Marca ⚠️ = en conflicto / bajo revisión en la encrucijada simple-vs-complejo.
> Marca ✅ = estable, sin conflicto conocido.
> Las eliminadas se listan al final solo como histórico (IDs estables, no reutilizar).

## BR vigentes

### BR-002 ✅ — Auth obligatoria global

- Regla: sin token → 401 en todo (lectura incluida); el rol solo restringe mutación.
- Fuente: Charter req 2 enmendado (v0.2.0 Login-para-todo).
- Estado: estable, sin conflicto.

### BR-003 ⚠️ — Validación central (subespecificada)

- Regla: email con formato válido; password ≥ 8 chars (Validator central).
- Fuente: Charter req 7.
- Conflicto: solo cubre email/password, pero el Validator real valida mucho más
  (title/author obligatorios, year/edition/tags, MIME/tamaño, paginación).
  Decidir si se amplía o si nace una BR de integridad de Material.

### BR-004 ⚠️ — Ownership personal + transferencia + borrado (god-rule)

- Regla: Professor edita/elimina/transfiere solo material propio; Admin todo
  (incluye force-transfer); borrar cuenta Professor exige precondición sin
  material (sin cascada).
- Fuente: OQ-04, v0.3.1 (FR-013/FR-014, UC-004 T-1..T-4).
- Conflicto: mezcla 4 reglas en 1 y asume "material = del Professor".
  Choca con el modelo publicación/blob (binario sin dueño) y con la rotación
  docente (el material desaparece con el Professor). Candidata a partirse en
  ownership / transferencia / precondición de borrado. Ver decisión A/B/C.

### BR-006 ⚠️ — Solo Repository (mal clasificada)

- Regla: sin SQL en controladores; acceso a datos solo vía Repository.
- Fuente: Charter req 6.
- Conflicto: no es regla de negocio, es constraint de diseño/arquitectura
  (ya citada en `SRS.md` §6). Candidata a moverse a RST/ADR.

### BR-007 ⚠️ — Dedup global con rechazo (núcleo de la encrucijada)

- Regla: dedup global por SHA-256 de los bytes del binario (no del filename);
  duplicado → 409 con existingId, nada persistido.
- Fuente: v0.3.0 (UC-002, `Material.contentHash` unique).
- Conflicto: confunde "binario = material". Con el modelo publicación/blob pasa
  a "dedup que reusa": bytes duplicados → nueva publicación que referencia el
  mismo blob (201 + `reusedBlob:true`), el 409 por duplicado desaparece y el
  `contentHash unique` vive en `FileBlob`, con borrado del blob solo cuando
  `refCount → 0`. Pendiente decidir withdraw vs eliminar (ver abajo).

## Conceptos nuevos en discusión (sin BR aún)

- **FileBlob vs Material/Publicación**: blob inmutable sin dueño
  (contentHash, storageKey, refCount) vs publicación con dueño
  (UUID, metadatos, ownerId, status active/withdrawn).
- **Withdraw**: despublica (oculta de catálogo/búsqueda, reversible), NO borra
  la fila ni toca refCount. Distinto de eliminar/expunge.
- **Expunge/eliminar**: borra la publicación; el blob físico solo se borra si era
  la última referencia.
- **Rotación docente**: pendiente elegir A (adopción Admin) / B (dueña la
  Biblioteca) / C (huérfano `owner=null`).

## Eliminadas (histórico, no reutilizar IDs)

- BR-001 (flag obligatorio) — eliminada v0.2.0.
- BR-005 (ocultar privados a anónimos) — eliminada v0.2.0.

## Mis reglas nuevas (escribir debajo, una por bloque)

```markdown
### R-??: título corto

- Regla: ...
- Ejemplo: ...
- Afecta a: (blob / publicación / ownership / borrado / withdraw)
- Duda: ...
```
