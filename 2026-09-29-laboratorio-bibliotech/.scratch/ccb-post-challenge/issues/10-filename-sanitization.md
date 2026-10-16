# Breakout — gap BT-10

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, phase `architect`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `architect` · Slice `UC-006` |
| **Trace** | `FR-008` |
| **Invariant** | `NFR-005` |
| **Evidence** | `data-model-er.puml:34` (`file_name`); `use-cases/UC-006-download.md:16,23-26`; `class-diagram.puml:37-44` (FileBlob sin `fileName` ni paso de sanitización) |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

`file_name` persiste el nombre **crudo** provisto por el cliente (`data-model-er.puml:34`) y UC-006 lo refleja verbatim en `Content-Disposition: inline; filename="…"` (`UC-006-download.md:16,23-26`) sin ningún paso de sanitización (ni operación de `Validator` ni en `FileStorage.store`; `class-diagram.puml:37-44,89-93`). No hay regla de negocio que normalice el nombre antes de persistir o al servir.

Severidad re-derivada `low`: Node `setHeader` rechaza CRLF (corta la pata de inyección de header) y el allowlist MIME + `Content-Type` explícito acotan la pata XSS ⇒ repro parcial, se baja.

## Why this classification

La corrección edita `docs/02-requirements/` (UC-006 + regla de sanitización en SRS/UC; el paso de diseño queda en BT-05 item 8) → **CCB Request**. El modelo de diseño que lo realizaría es `delta-arch` (BT-05).

## Disposition

- [x] RTM `FR-008` en `Blocked` con id de ticket (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-requirements`: regla de sanitización de `file_name` (persistencia y `Content-Disposition`) (v0.5.0, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
