# Breakout — gap BT-06

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `architect` · Slice `UC-001/UC-002/UC-004/UC-005/UC-006` |
| **Trace** | `RST-004`, `NFR-003`, `NFR-001`, `BR-004` |
| **Invariant** | `NFR-003`, `BR-004` (claims de arquitectura no sostenibles) |
| **Evidence** | Ver Finding |
| **Classification** | `delta-arch → ooad-architect` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `resolved` |

## Finding

Integridad arquitectónica — cinco contradicciones verificadas entre capas, modelo y claims:

1. **Dependency Rule**: `Validator` vive en Interface Adapters (`README.md:26`) pero los UseCases lo invocan directo (`sequence-diagram-UC-001.puml:17`; `sequence-diagram-UC-002.puml:18,20`; `sequence-diagram-UC-004.puml:41`) → import hacia afuera, contra `README.md:31` ("imports solo hacia adentro") y la propia promesa "Toda la variación predicha vive tras Strategy".
2. **Crypto en Entities**: `AuthSession` (Entity) implementa `verify`/`sign` con BCrypt/JWT (`class-diagram.puml:46-52`), pero las Entities declaran "cero imports framework" (`README.md:24`) y ADR-0001:14 ("Entities no conocen nada externo"); no hay puerto crypto — el cableado JWT/BCrypt está en Frameworks (`README.md:27`).
3. **Cascada imposible como declarada**: la única FK es `materials.blob_id → file_blobs.id` (`data-model-er.puml:24`); `ON DELETE CASCADE` en esa dirección borra el **Material** cuando muere el **blob** — lo inverso de C-1/C-3 ("delete material → blob", `UC-004-admin.md:23,25`) y del claim "cascada dura a nivel DB" (`ADR-0003:14,24`). A nivel DB solo es enforzable user → materials.
4. **Índice vs búsqueda**: el índice declarado es `(title, author, subject, year)` (`data-model-er.puml:27`) pero `UC-005-search.md:24` exige índices con `tags`; además `q` parcial case-insensitive con `LIKE '%…%'` no es servible por ese índice — el claim "NFR-001 vía índices declarados" (`ADR-0003:24`) queda sin sustento.
5. **"3NF" con JSON** (`data-model-er.puml:5,22`): `tags JSON` viola 1NF; el tradeoff está documentado (`ADR-0003:25`) pero el título afirma 3NF sin calificar.
6. **C4 desactualizado**: `c4-context.puml:16-18` no mapea Admin→UC-002 (`UC-002-upload.md:5`), Professor→UC-003/005/006 y borrado propio (`UC-003-read.md:5`, `UC-005-search.md:5`, `UC-006-download.md:5`, `UC-004-admin.md:5`), Admin→lecturas.
7. **Deriva de aprobación**: `README.md:1` fecha la arquitectura "aprobado 2026-10-13" pero el ER se modificó el 2026-10-14 (v0.4.1, `data-model-er.puml:34`; `CHANGELOG-RE.md:3-7`) sin re-aprobación registrada.

> **Additional sighting (architect pass 2026-10-16)**
> - **Sin ADR de cascada**: SRS §3.1/§6 dejan la decisión de cascada dura como "ADR pendiente" (`SRS.md:65,86`) y no existe ADR-0004 entre 0001-0003 → refuerza el item 3 (cascada imposible como declarada).

## Why this classification

La corrección edita `docs/03-architecture/` (`class-diagram`, `data-model-er`, `c4-context`, README, ADR-0001/0003) → CCB Request `delta-arch`.

## Disposition

- [x] RTM `RST-004`, `NFR-003`, `NFR-001`, `BR-004` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [x] Back-edge `ooad-architect`: Validator/puerto, puerto crypto, cascada (ADR-0005), índice (ADR-0006), claim 3NF, C4, re-aprobación (v0.5.1, 2026-10-16) — **aprobado y baselinado**
- [x] Control devuelto — dependientes pausados, independientes continúan
