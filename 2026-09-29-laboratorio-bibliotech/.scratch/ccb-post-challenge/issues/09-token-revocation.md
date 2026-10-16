# Breakout — gap BT-09

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-004` |
| **Trace** | `FR-011`, `NFR-006` |
| **Invariant** | `NFR-006` (0 mutaciones cruzadas por rol) |
| **Evidence** | `use-cases/UC-004-admin.md:24` (C-2 borra cuenta sin revocar token); `UC-004-admin.md:56` ("rol efectivo en próximo login/token"); `SRS.md:78` (NFR-006) |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

Un cambio de rol o el borrado de cuenta no invalidan los JWT vigentes: C-2 elimina la cuenta sin revocar tokens (`UC-004-admin.md:24`) y el nuevo rol rige recién "en próximo login/token" (`UC-004-admin.md:56`). Queda una ventana (≤24h por expiración) en la que un token viejo sigue mutando con el rol anterior, contra `NFR-006` "0 mutaciones cruzadas por rol" (`SRS.md:78`). Severidad re-derivada `low` (ventana acotada y documentada).

## Why this classification

La corrección edita `docs/02-requirements/` (UC-004 + SRS §4/NFR-006) → **CCB Request**, no bug de código. La revocación efectiva (denylist / versión de token) tocará diseño en `ooad-architect`.

## Disposition

- [x] RTM `FR-011` y `NFR-006` en `Blocked` con id de ticket (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: invalidación de token por cambio de rol/borrado de cuenta (NFR-006) (v0.5.0, 2026-10-16) — **aprobado y baselinado**; realización de diseño en `ooad-architect`
- [x] Control devuelto — dependientes pausados, independientes continúan
