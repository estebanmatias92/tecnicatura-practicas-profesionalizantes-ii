# Breakout — gap BT-11

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, phase `architect`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `architect` · Slice `UC-002` |
| **Trace** | `NFR-005` |
| **Invariant** | `NFR-005` (validación MIME/tamaño **antes** de persistir) |
| **Evidence** | `sequence-diagram-UC-002.puml:4,14,18`; `use-cases/UC-002-upload.md:34,42`; `SRS.md:77` |
| **Classification** | `delta-arch → ooad-architect` |
| **Blocking** | `no` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

La secuencia dibuja `Ctrl (FileInterceptor)` que recibe el archivo y **luego** `UC -> Val : validateFile(mime, size)` (`sequence-diagram-UC-002.puml:4,14,18`), pero Multer consume/escribe en el interceptor; si los `limits`/`fileFilter` no viven en el interceptor, la validación ocurre después de la recepción y NFR-005 ("antes de persistir", `SRS.md:77`) queda sin garantía verificable.

Marcado **`maybe-false`**: solo es falseable una vez que `ooad-build` fije dónde viven `limits`/`fileFilter`; si ya están en el interceptor, el diagrama solo omite el orden y no hay defecto.

## Why this classification

La corrección edita `docs/03-architecture/` (secuencia UC-002, ubicación de la validación) → CCB Request `delta-arch`, no bug de código.

## Disposition

- [x] RTM `NFR-005` en `Blocked` con id de ticket (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-architect`: orden interceptor→validación fijado — `FileInterceptor(memoryStorage + limits + fileFilter)` valida en el borde, luego re-validación en el UseCase (v0.5.1, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
