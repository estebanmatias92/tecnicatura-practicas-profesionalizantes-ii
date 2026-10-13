# Borrador — Reglas de negocio (BiblioTech)

> Resuelto en baseline v0.4.0 (`docs/02-requirements/CHANGELOG-RE.md`). Este borrador queda como registro de la decisión; la fuente vigente es `docs/02-requirements/raw-needs.md` §BR.

## BR vigentes (v0.4.0)

### BR-002 ✅ — Auth obligatoria global

- Regla: sin token → 401 en todo (lectura incluida); el rol solo restringe mutación.
- Fuente: Charter req 2 enmendado (v0.2.0 Login-para-todo).
- Estado: estable, sin cambios.

### BR-003 ✅ — Validación central

- Regla: email con formato válido; password ≥ 8 chars (Validator central).
- Fuente: Charter req 7.
- Estado: se mantiene acotada a email/password en v1; no se amplía.

### BR-004 ✅ — Ownership + cascada dura (reescrita v0.4.0)

- Regla: Professor edita/elimina solo material propio + su FileBlob; Admin todo; borrar cuenta Professor borra en cascada sus Materials y sus FileBlobs; borrar material borra su FileBlob (1:1, sin refCount, sin transferencia).
- Decide: god-rule partida y simplificada; transferencia eliminada con FR-014; rotación docente = el material muere con el Professor (decisión stakeholder 2026-10-13).

## Movidas / eliminadas (v0.4.0, IDs estables, no reutilizar)

- **BR-006 → RST-004**: no era regla de negocio, es constraint de diseño (sin SQL en controladores, solo vía Repository).
- **BR-007 eliminada**: dedup global con 409 fuera; duplicados permitidos — cada POST crea Material + FileBlob 1:1 nuevos con 201.
- **FR-014 eliminada**: sin `PATCH owner/transfer`; sin T-1..T-4.

## Modelo decidido (v0.4.0)

- **FileBlob vs Material/Publicación**: blob sin dueño propio (storageKey, mime, size, contentHash informativo no-único) 1:1 con su Material; nace y muere con él; copia nueva siempre, sin compartir.
- **Sin withdraw v1**: solo DELETE con cascada (C-1..C-3 en UC-004).

## Eliminadas históricas (no reutilizar IDs)

- BR-001 (flag obligatorio) — eliminada v0.2.0.
- BR-005 (ocultar privados a anónimos) — eliminada v0.2.0.
