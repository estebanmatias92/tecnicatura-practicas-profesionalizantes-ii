# Breakout — gap BT-02

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-006` |
| **Trace** | `FR-008` (UC-006 v0.4.1) |
| **Invariant** | `NFR-005`/`BR-004` (sin cambio de sentido; divergencia baseline) |
| **Evidence** | `CHANGELOG-RE.md:3-7`; `use-cases/UC-006-download.md:26`; `SRS.md:82,96` (baseline v0.4.0); `validation.md:1,43-45`; `crc-cards.md:39`; `conceptual-model.puml:31-38`; `CONTEXT.md:9`; contraste: `docs/03-architecture/data-model-er.puml:34` |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

La columna `file_blobs.file_name` (v0.4.1, decisión stakeholder 2026-10-14) está registrada en `CHANGELOG-RE.md:3-7` y presente en `UC-006-download.md:26` y el ER (`data-model-er.puml:34`), pero la baseline RE no se movió:

- `SRS.md:96` sigue en `v0.4.0` y §5 (`:82`) no menciona `file_name`.
- `validation.md` no tiene reinspección v0.4.1 (última: `v0.4.0`, 0 defectos).
- `crc-cards.md:39`, `conceptual-model.puml:31-38` y `CONTEXT.md:9` tampoco listan el atributo.

Requisito enmendado y baseline inspeccionada divergen; el "RTM sin cambios" del changelog es válido, pero la reinspección Fagan quedó pendiente.

## Why this classification

La corrección edita `docs/02-requirements/` (SRS, validation, CRC, conceptual-model, CONTEXT) → CCB Request. El lado de diseño (operación en `FileBlob` + argumento de nombre en `FileStorage.store`) se cubre en **BT-05** (`delta-arch`).

## Disposition

- [x] RTM `FR-008` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: reinspección v0.5.0 + artefactos RE (`file_name` en SRS/CRC/conceptual-model/CONTEXT) (2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
