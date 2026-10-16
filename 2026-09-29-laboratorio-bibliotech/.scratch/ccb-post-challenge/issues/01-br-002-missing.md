# Breakout — gap BT-01

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-001/UC-003/UC-005/UC-006` |
| **Trace** | `BR-002` → `FR-007`, `NFR-006` |
| **Invariant** | `BR-002` (regla vigente sin artefacto baseline) |
| **Evidence** | `raw-needs.md:41`; `.scratch/business-rules-draft/rules.md:7-11`; `SRS.md` §3/§4/§6 (sin BR-002); `RTM.csv:15,21` (solo BR-003/BR-004); `use-cases/UC-001-auth.md:37`, `UC-003-read.md:33`, `UC-005-search.md:46`, `UC-006-download.md:50`; `validation.md:5` |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

BR-002 ("sin token → 401 en todo, lectura incluida; el rol solo restringe mutación") es regla vigente: está definida en `raw-needs.md:41`, registrada como "estable, sin cambios" en `.scratch/business-rules-draft/rules.md:7-11` y citada por los cuatro UC de lectura (`UC-001-auth.md:37`, `UC-003-read.md:33`, `UC-005-search.md:46`, `UC-006-download.md:50`). Sin embargo:

- `SRS.md` no contiene BR-002 en ninguna sección (la inspección Fagan v0.4.0 declaró 0 defectos abiertos y `validation.md:5` afirma que BR-002 fue "reescrita").
- `RTM.csv` no tiene fila para BR-002 (solo BR-003 en la fila 15 y BR-004 en la 21).

Una regla de negocio global de autenticación queda inverificable: sin definición en la baseline ni fila de trazabilidad.

## Why this classification

La corrección edita `docs/02-requirements/` (`SRS.md` + `RTM.csv` + UC que la citan), artefactos que `ooad-build` no puede tocar → **CCB Request**, no bug de código.

## Disposition

- [x] RTM `FR-007` y `NFR-006` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: BR-002 restaurada en `SRS.md` §3.1 + fila RTM `BR-002`; coherencia de UC (v0.5.0, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
