# Breakout — gap BT-08

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-004` |
| **Trace** | `FR-013` |
| **Invariant** | `BR-004` (Professor edita/elimina solo lo propio) |
| **Evidence** | `SRS.md:52` (FR-013); `use-cases/UC-004-admin.md:36` (solo delete: "nada eliminado"); `UC-004-admin.md:68-71` (Gherkin delete-ajeno); sin flujo negativo de edición ajena |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

BR-004/FR-013 ("edita/elimina solo material propio", `SRS.md:52`) declaran la regla, pero UC-004 solo tiene resultado negativo para el borrado: la alternativa C-1a "nada eliminado" (`UC-004-admin.md:36`) y el escenario Gherkin `professor elimina material ajeno` (`UC-004-admin.md:68-71`). No hay 403 declarado para la **edición** de material ajeno (`PATCH`), ni escenario que lo cubra.

## Why this classification

La corrección edita `docs/02-requirements/` (UC-004 + Gherkin, coherencia FR-013) → **CCB Request**, no bug de código.

## Disposition

- [x] RTM `FR-013` en `Blocked` con id de ticket (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: 403 de edición ajena + escenario Gherkin `PATCH` (v0.5.0, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
