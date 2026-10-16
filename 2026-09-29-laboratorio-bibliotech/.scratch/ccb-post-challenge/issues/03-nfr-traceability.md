# Breakout — gap BT-03

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-005/UC-006` |
| **Trace** | `NFR-001`, `NFR-002`, `NFR-004`, `NFR-006` |
| **Invariant** | `NFR-002`, `NFR-004` (sin fila RTM) |
| **Evidence** | `RTM.csv:17-20` (solo NFR-001/003/005/006); `SRS.md:74,76`; `SRS.md:76-77`; `use-cases/UC-005-search.md:24,57-60`; `use-cases/UC-006-download.md:61-64`; `raw-needs.md:30` |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

La trazabilidad de NFR tiene cuatro huecos verificados:

1. **NFR-002** (subida ≤50MB <60s) y **NFR-004** (sin secretos en claro/logs) están definidos en `SRS.md:74,76` pero no tienen fila en `RTM.csv` (filas NFR: 001/003/005/006).
2. Las celdas "Metric" de **NFR-004** ("inspección") y **NFR-005** ("fixtures") son métodos de verificación, no métricas (`SRS.md:76-77`), aunque `validation.md` afirma criterio medible para cada NFR.
3. La fila `NFR-001` mapea solo `UC-003` (`RTM.csv:19`), pero `UC-005-search.md:24` declara que aplica a la búsqueda.
4. La fila `NFR-006` mapea `UC-001..004` (`RTM.csv:20`), pero `UC-005-search.md:57-60` y `UC-006-download.md:61-64` asertan 401 (0 accesos sin token).
5. `raw-needs.md:30` dice "Lectura **pública** p95 < 200ms" — wording previo a v0.2.0 que contradice BR-002 y `SRS.md:73` ("Lectura autenticada").

## Why this classification

La corrección edita `docs/02-requirements/` (SRS §4, RTM, raw-needs) → CCB Request.

## Disposition

- [x] RTM `NFR-001` y `NFR-006` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: filas NFR-002/004, métricas medibles, cobertura de filas, wording `raw-needs` (v0.5.0, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
