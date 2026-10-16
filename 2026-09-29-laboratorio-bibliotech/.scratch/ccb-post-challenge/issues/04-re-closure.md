# Breakout — gap BT-04

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `requirements` · Slice `UC-001..UC-006` |
| **Trace** | `FR-001`, `FR-002`, `FR-004`, `FR-006`, `FR-011`, `FR-012`, `FR-013` |
| **Invariant** | — (cobertura de escenarios y trazas) |
| **Evidence** | Ver Finding |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

Cierre de cobertura RE con evidencia verificada:

1. **Ramas declaradas sin escenario Gherkin**: UC-001 409 duplicado (`UC-001-auth.md:25`) y E-001 expirado (`:32`); UC-002 415 MIME (`UC-002-upload.md:42`; 413 sí cubierto en `:71-74`); UC-003 404 (`UC-003-read.md:23`); UC-004 404 (`UC-004-admin.md:35`) y E-001 rollback (`:42`); UC-006 500 huérfano (`UC-006-download.md:40`) y E-001 503 (`:46`).
2. **Dimensión null/empty ausente**: ningún UC cubre resultado vacío (catálogo sin materiales, búsqueda sin coincidencias); `UC-005-search.md:67-70` cubre `q` vacío (entrada), no conjunto vacío.
3. **Trazas inconsistentes**: `UC-005-search.md:4` declara "apoya FR-006" pero `RTM.csv:6` mapea FR-006 solo a UC-003; `RTM.csv:15` traza BR-003 → UC-002 sin respaldo (BR-003 es email/password: `UC-001-auth.md:36`; UC-002 solo valida MIME/metadatos `:51-55`).
4. **Regla sin ID**: la unicidad de email (409, `UC-001-auth.md:16,25`) no está codificada en ningún BR/FR (BR-003 es solo formato: `raw-needs.md:42`).
5. **Walkthrough CRC**: `crc-cards.md:60` dice "UC-001 paso 4 → compara hash", pero el paso 4 emite JWT y la comparación es el paso 3 (`UC-001-auth.md:16-17`).
6. **Procedencia FR-013**: `RTM.csv:13` la traza a PRD `F-002`, que solo cubre subida (`PRD.md:35`); la fuente real es OQ-04 + aclaración stakeholder 2026-10-03 (`raw-needs.md:20`).
7. **Texto SRS vencido**: `SRS.md:11` ("lectura pública/privada") y `:25` ("lectura por visibilidad") contradicen FR-007 (`SRS.md:46`), UC-003 (`UC-003-read.md:8,61`) y la enmienda Login-para-todo v0.2.0.

## Why this classification

Todas las correcciones editan `docs/02-requirements/` (UC, RTM, CRC, SRS) → CCB Request.

## Disposition

- [x] RTM `FR-001/002/004/006/011/012/013` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: escenarios faltantes + resultado vacío + trazas + ID unicidad + CRC + procedencia + texto SRS (v0.5.0, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
