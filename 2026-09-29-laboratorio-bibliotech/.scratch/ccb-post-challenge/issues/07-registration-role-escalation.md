# Breakout — gap BT-07

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-001` |
| **Trace** | `FR-001`, `FR-003` |
| **Invariant** | `BR-003` (validación de registro) — falta la regla de rol |
| **Evidence** | `use-cases/UC-001-auth.md:14` ("+ rol si lo crea Admin"); `UC-001-auth.md:41-57` (sin escenario 400/403 de escalada); `SRS.md:41` (FR-001 sin regla de rol forzado); `raw-needs.md:9` |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

UC-001 acepta que el registro incluya rol ("+ rol si lo crea Admin", `UC-001-auth.md:14`), pero ni el SRS ni el UC fijan que el auto-registro sea siempre `Student` ni rechazan un `role=Admin/Professor` provisto por el cliente. No hay regla 400/403 ni escenario Gherkin para la escalada de privilegios (`UC-001-auth.md:41-57`); la intención solo aparece en `docs/uso-por-rol.md`, no baseline.

## Why this classification

La corrección edita `docs/02-requirements/` (SRS §3, UC-001 + Gherkin), artefactos que `ooad-build` no puede tocar → **CCB Request**, no bug de código.

## Disposition

- [x] RTM `FR-001` en `Blocked` con id de ticket (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: auto-registro fuerza `Student` e ignora `requestedRole` del cliente + Gherkin (v0.5.0, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
