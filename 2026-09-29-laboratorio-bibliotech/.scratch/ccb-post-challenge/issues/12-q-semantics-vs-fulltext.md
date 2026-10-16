# Breakout — gap BT-12

> Filed por `/ooad-breakout` (pasada adversaria `/ooad-challenge`, phase `build`, 2026-10-16). **CCB Request**: la pipeline no lo absorbe en silencio.

| Field | Value |
|-------|-------|
| **Type** | `gap` |
| **Origin** | Fase `build` · Slice `UC-005` |
| **Trace** | `FR-009`, `NFR-001` (→ `UC-005`, `ADR-0006`) |
| **Invariant** | `NFR-001` (p95 <200ms vía índices — sin respaldo si `q` queda como infijo) |
| **Evidence** | `docs/02-requirements/use-cases/UC-005-search.md:20,24`; `docs/03-architecture/adrs/0006-search-indexing.md:14-15,19`; `backend/src/adapters/persistence/typeorm/typeorm-repositories.ts:133-134` |
| **Classification** | `delta-spec → ooad-requirements` |
| **Blocking** | `yes` |
| **Blocked-by** | `none` |
| **Status** | `open` |

## Finding

`q` está definido de forma **contradictoria** entre los dos artefactos upstream y el build no puede satisfacer ambos:

- **RE (`UC-005:20`)**: `q` es "texto general sobre título+autor+subject; **parcial, case-insensitive**" (substring **infijo**, p. ej. `LIKE '%q%'`). `UC-005:24` pide además "índices en (title, author, subject, year, tags)" y cita NFR-001 p95 <200ms.
- **Arquitectura (`ADR-0006:14-15`)**: `q` es **token/prefijo** case-insensitive vía `FULLTEXT ... MATCH ... AGAINST('término*' IN BOOLEAN MODE)`, y declara explícitamente que esto **no** es equivalente al infijo; levanta R-1 como follow-up RE.
- **Build (`typeorm-repositories.ts:133-134`)**: implementa `LIKE '%q%'` (infijo, sin `FULLTEXT`/`BTREE`), es decir **cumple UC-005 y contradice ADR-0006**; el claim "NFR-001 vía índices" de `ADR-0006:19` queda sin respaldo porque ningún BTREE/FULLTEXT sirve un leading-wildcard.

Un substring infijo no es indexable por BTREE ni FULLTEXT ⇒ mantenerlo obliga a scan y rompe NFR-001; cambiarlo a token/prefijo (ADR-0006) cambia la semántica de búsqueda del RE. La corrección exige editar `docs/02-requirements/` (o revertir el ADR), artefacto que `ooad-build` no puede tocar.

## Why this classification

La corrección edita `UC-005-search.md` (redefinir `q` como token/prefijo, o aceptar el scan como caso degradado y recalificar la nota de índices) — un artefacto de `docs/02-requirements/` que `ooad-build` no puede tocar → **CCB Request**, no bug de código. El lado de implementación (`FULLTEXT`/`BTREE`, README **B-5**) queda como `code-fix` **gated** por este ticket.

## Disposition

- [x] RTM `FR-009` y `NFR-001` en `Blocked` con ticket id (2026-10-16)
- [x] Línea CCB en `CHANGELOG-RE.md` (Request → impacto) (2026-10-16)
- [ ] Back-edge `ooad-requirements`: redefinir `q` (token/prefijo) o aceptar scan — **pendiente de aprobación de usuario**
- [ ] Control devuelto — dependientes (B-5 indexación) pausados; independientes continúan
