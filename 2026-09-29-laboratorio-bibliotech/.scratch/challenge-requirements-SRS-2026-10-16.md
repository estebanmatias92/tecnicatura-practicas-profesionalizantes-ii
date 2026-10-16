# tmp — /ooad-challenge report: requirements / SRS.md (2026-10-16)

Adversarial pass (`ooad-challenge`, phase `requirements`).

- Artifact under review: `docs/02-requirements/SRS.md`
- Upstream source of truth: `docs/01-discovery/PRD.md`
- Supporting artifact set inspected: `docs/02-requirements/` (`RTM.csv`, `use-cases/UC-001..006`, `raw-needs.md`, `glossary.md`, `validation.md`, `CHANGELOG-RE.md`), `CONTEXT.md`
- Reviewers: 2 fresh-context sub-agents (Trace & Spec; Security & Domain & BR); orchestrator re-verified every cited line.
- **Status: findings only.** Stopped before `/ooad-breakout`. No CCB ticket filed, no RTM row mutated.

## Consolidated findings

| # | Root cause (upstream defect) | Sightings (trace + evidence) | Persona | Severity | Class | Existing ticket |
|---|------------------------------|------------------------------|---------|----------|-------|-----------------|
| 1 | BR-002 (global "sin token → 401 en todo") is unbaselined — defined and depended on but absent from SRS and RTM | `raw-needs.md:41` defines it; cited by `UC-001:37`, `UC-003:33`, `UC-005:46`, `UC-006:50`; absent from `SRS.md` §3/§4/§6 (§6 names only BR-004/ex-BR-006); no row in `RTM.csv` (only BR-003 :15, BR-004 :21). `validation.md:5` claims it was "reescrita". | Domain & BR | high | delta-spec | BT-01 |
| 2 | Pre-v0.2.0 public/visibility wording contradicts FR-007 & the Login-para-todo amendment | `SRS.md:11` "lectura pública/privada"; `SRS.md:25` "lectura por visibilidad (UC-003)" vs `FR-007` (`SRS.md:46` "todos los roles ven todo", JWT) and `UC-003:8,61`. | Security | medium | delta-spec | BT-04 |
| 3 | v0.4.1 `file_name` + baseline pointer not propagated | `CHANGELOG-RE.md:14-18` (v0.4.1) and `UC-006:26` define `file_blobs.file_name`; `CONTEXT.md:9` FileBlob lacks it; `SRS.md:82,96` still baseline "v0.4.0". | Domain & BR | medium | delta-spec | BT-02 |
| 4 | NFR quality & trace gaps | NFR-002 (`SRS.md:74`) and NFR-004 (`SRS.md:76`) have no RTM row (`RTM.csv:17-20`); "Metric" cells are methods not metrics — `inspección`/`fixtures` (`SRS.md:76-77`); NFR-001 coverage misses UC-005 (`RTM.csv:19` vs `UC-005:24`); NFR-006 coverage misses UC-005/006 (`RTM.csv:20` vs `UC-005:57`, `UC-006:61`); `raw-needs.md:30` still "Lectura pública". | Trace & Spec | medium | delta-spec | BT-03 |
| 5 | Declared UC branches have no Gherkin (unverifiable) | 409 `UC-001:25`; E-001 expired `UC-001:32`; 415 MIME `UC-002:42`; 404 `UC-003:23`; 404+E-001 rollback `UC-004:35,42`; 500 orphan + E-001 503 `UC-006:40,46`; no empty-result/null scenario anywhere (`UC-005:67` covers empty *input* only). | Trace & Spec | medium | delta-spec | BT-04 |
| 6 | Spec provenance drift beyond the PRD | FR-004 adds `subject/year/edition/tags`+contentHash (`SRS.md:44`, `UC-002:12-23`) vs PRD F-002 "sin visibilidad" / §6 "título/autor" (`PRD.md:35,55`; §6 rates model change **Alto**); FR-009 adds range/tag filters (`SRS.md:48`, `UC-005:18-24`) vs PRD F-008 "por título/autor" (`PRD.md:41`); §1.2 drops PRD §5's "editor de contenido"/"multi-idioma" (`SRS.md:11` vs `PRD.md:48`). | Domain & BR | medium | delta-spec | BT-04 (partial) |
| 7 | Self-registration role-escalation rule missing | `UC-001:14` accepts "(+ rol si lo crea Admin)" but no FR/UC forces Student or rejects client-supplied `role=Admin/Professor`; no 400/403 rule, no Gherkin (`UC-001:41-57`). Intent only in non-baseline `docs/uso-por-rol.md`. | Security | medium | delta-spec | **new** |
| 8 | Professor edit-of-foreign-material has no negative outcome | BR-004/FR-013 say "edita/elimina solo propio" (`SRS.md:52`), but the only negative flow is delete-specific — `UC-004:36` ("nada eliminado") and Gherkin `UC-004:68-71` (delete only). Edit-ajeno 403 undeclared. | Security | low¹ | delta-spec | **new** |
| 9 | Token not invalidated on role-change / account-deletion | `UC-004:24` states new role effective only "en próximo login/token"; C-2 (`UC-004:24`) deletes account without revoking tokens; window ≤24h vs NFR-006 "0 mutaciones cruzadas" (`SRS.md:78`). | Security | low¹ | delta-spec | **new** |
| 10 | Trace-edge defects (both directions) | FR-006↔UC-005 orphan: `UC-005:4` claims "(apoya FR-006)" but FR-006→UC-003 only (`SRS.md:45`, `RTM.csv:6`); BR-003→UC-002 spurious (`RTM.csv:15` vs `UC-002:51-55`); FR-013 provenance misattributed to PRD F-002 (`SRS.md:52`, `RTM.csv:13` vs `PRD.md:35`, `raw-needs.md:20`). | Trace & Spec | low | delta-spec | BT-04 |
| 11 | Stale baseline/process claims | `validation.md:43-45` "0 defectos abiertos" + "cada FR/NFR trazado" contradicts six open Blocking CCB rows (`CHANGELOG-RE.md:3-12`) and finding 4; `SRS.md:62-65` marks every ADR "ADR pendiente (architect)" while `RTM.csv:2-21` assigns ADR-0001/0002/0003 and ADRs are `Accepted` (2026-10-13). | Domain & BR | low | delta-spec | BT-04/BT-06 |
| 12 | UC-002 grants Admin upload with no FR basis | `UC-002:5` "Professor (Admin también puede)" vs FR-004 professor-only (`SRS.md:44`), PRD F-002 (`PRD.md:35`). | Domain & BR | low | delta-spec | BT-04 |

¹ Downgraded from reviewer `medium`: rule exists in BR-004 / window is documented ⇒ partial repro.

## Aggregate `[Formality]` note

`executed 3, gaps:`

- **UC flow completeness:** `UC-003:27-29` and `UC-005:39-42` have empty Exception-Flows tables (structurally present, no content).
- **Glossary:** `glossary.md` carries no term rows (defers to `CONTEXT.md`); no contradictory synonyms found, but `SRS.md:15` points to `glossary-draft.md`, never the baseline `glossary.md`.
- **Structural completeness:** all SRS §1-§7 sections exist/populated. Supporting gaps — FR-005 removed silently (`SRS.md:44-45` jumps FR-004→FR-006; only FR-014 noted at :54); RST-004 source cell drops charter req 6/"Repository" (`SRS.md:34` vs `raw-needs.md:56`); §1.2 abridged (see #6).

## Probes executed / inapplicable

**Executed:**
- `[Trace]` FR↔UC orphan both directions → #10
- `[Trace]` Every NFR has metric + target → #4
- `[Domain]` Every BR referenced by ≥1 FR and encoded in ≥1 UC step → #1, #10
- `[Domain]` Every Gherkin AC covers happy + edge + error + null → #5
- `[Formality]` UC alternative + exception flows → aggregate
- `[Formality]` Glossary synonyms → aggregate

**Inapplicable:** OQ-03 (superseded, no artifact); physical-loan/reservation/fine/notification probes (no such requirements).

**Invariants that hold:** PRD F-003/FR-006/007, OQ-01/FR-001, OQ-04/FR-011-012 reproduce correctly.

## Convergence

Findings #1-6, #10-12 map onto existing open (unapproved) `BT-01..BT-06` (see `CHANGELOG-RE.md:3-12`). Findings **#7, #8, #9** (authorization gaps) are **new** — not covered by any open BT ticket.
