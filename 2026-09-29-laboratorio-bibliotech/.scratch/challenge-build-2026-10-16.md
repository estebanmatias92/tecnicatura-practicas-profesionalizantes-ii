# tmp — /ooad-challenge report: build / backend `src/` (2026-10-16)

Adversarial pass (`ooad-challenge`, phase `build`).

- Artifact under review: `backend/src/` (+ `frontend/src/`, `api/openapi.yaml` as supporting surfaces)
- Upstream source of truth: `docs/03-architecture/` (`class-diagram.puml`, `sequence-diagram-UC-001..006.puml`, `data-model-er.puml`, `adrs/0001..0006`, `README.md`) + `docs/02-requirements/` (`SRS.md`, `use-cases/UC-001..006`, `RTM.csv`, `glossary.md`) + `CONTEXT.md`
- Reviewers: 3 fresh-context sub-agents (Security & Abuse; Domain & BR; Trace & Spec); orchestrator re-read every cited line and re-derived severity from evidence.
- **Status: findings only.** Report persistent; breakout filed for the single `delta-spec` row; no upstream artifact edited here, no code work-around.

## Consolidated findings

| # | Root cause (upstream defect) | Sightings (trace + evidence) | Severity¹ | Class | Destination |
|---|------------------------------|------------------------------|-----------|-------|-------------|
| 1 | **Token revocation (NFR-006) entirely unimplemented** — no `ver` claim, no `users.token_version`, no guard check; role-change/delete never bump. Demoted/deleted accounts keep mutating until expiry ≤24h. | `backend/src/frameworks/security/jwt-signer.ts:11`; `backend/src/adapters/http/guards.ts:35-36`; `backend/src/adapters/persistence/typeorm/orm-entities.ts:6-21`; `backend/src/usecases/manage-material.usecase.ts:55-61,69-76`; vs `adrs/0004:16`; `UC-004:31,62,94-97`; `SRS.md:90`; RTM FR-011/NFR-006. | **high** | code-fix | `ooad-build` (README B-2) |
| 2 | **Cascade order DB-first (E-001 rollback unreachable) + `ManageMaterialUseCase` conflates user+material mgmt** — deletes commit then `storage.remove`; the E-001 test asserts the *mutated* DB as expected. | `manage-material.usecase.ts:32-33,59-60`; `typeorm-repositories.ts:151-159,88-100`; `test/integration/cascade.spec.ts:83-102`; `manage-material.usecase.ts:13,55-76`; vs `adrs/0005:19`; `UC-004:48,89-92`; `class-diagram.puml:85-90`. | **high** | code-fix | `ooad-build` (README B-3) |
| 3 | **Inverted FK `materials.blob_id → file_blobs ON DELETE CASCADE`** (blob-delete ⇒ material-delete), which ADR-0005 rejects (NO ACTION/RESTRICT). | `orm-entities.ts:80`; vs `adrs/0005:17,39`. | medium² | code-fix | `ooad-build` (README B-1) |
| 4 | **`file_name` persisted/served raw; no `normalizeFileName`** — path separators/CRLF stored and echoed into `Content-Disposition`. | `upload-material.usecase.ts:41`; `materials.controller.ts:151`; `ports.ts:96-101`; `bibliotech-validator.ts:82-95`; vs `UC-006:28,93-96`; `SRS.md:89`. | medium² | code-fix | `ooad-build` (README B-4) |
| 5 | **Search uses `LIKE '%q%'` and declares no FULLTEXT/BTREE** — ADR-0006 not realized; NFR-001 p95 claim unbacked. | `typeorm-repositories.ts:133-134`; `orm-entities.ts` (no `@Index`/`@Fulltext`); vs `adrs/0006:14-19`; `UC-005:24`. | medium | code-fix | `ooad-build` (README B-5) |
| 5b | **`q` semantics conflict (RE ↔ ADR)** — UC-005 declares infix `LIKE '%q%'`; ADR-0006 declares token/prefix FULLTEXT. Fix requires editing UC-005 → CCB Request. | `UC-005:20,24`; vs `adrs/0006:14-15`; build `typeorm-repositories.ts:133-134`. | **high** | **delta-spec** | **`/ooad-breakout` → BT-12** |
| 6 | **No `invariant:<ID>` guards exist anywhere** — every BR/NFR must have a greppable invariant test (build DoD). | `rg "invariant:" backend frontend` → 0 matches; vs `ooad-build/references/definition-of-done.md` (Invariant guards), `SKILL.md:70,98`. | medium | code-fix | `ooad-build` (**new**) |
| 7 | **Storage-down download never maps to 503** — no `SERVICE_UNAVAILABLE`; stream errors at pipe time. | `download-file.usecase.ts:26`; `errors.ts:3-11`; vs `UC-006:48,88-91`. | low | code-fix | `ooad-build` (README B-6) |
| 8 | **`PATCH/DELETE /material/:id` enforce ownership but not role** — a (demoted) Student owning material can still mutate. | `materials.controller.ts:121-144` (no `@RequireRoles`); `manage-material.usecase.ts:29,45`; vs `SRS.md:52,66`; `UC-004:24,41`. | low | code-fix | `ooad-build` (**new**) |
| 9 | **DB password hardcoded default** (`bibliotech`) in source. | `app.module.ts:41`; vs `SRS.md:88` (NFR-004). | low | code-fix | `ooad-build` (**new**) |
| 10 | **Duplicate-email check-then-insert race → 500, not 409** — unique-constraint error rethrown unmapped. | `register-user.usecase.ts:34-41`; `orm-entities.ts:10`; `domain-error.mapper.ts:17-19`; vs `SRS.md:65`. | low | code-fix | `ooad-build` (**new**) |
| 11 | **`api/openapi.yaml` omits 500/503 and cites stale `SRS v0.4.0`.** | `api/openapi.yaml:2,88-94,145-148`; vs `UC-002:49`; `UC-006:42,48`. | low | code-fix | `ooad-build` (**new**) |
| 12 | **Modules missing `FR/UC [GRASP]` trace header.** | `app.module.ts:1`; `main.ts:1`; `ports.ts:1`; `errors.ts:1`; `dtos.ts:1`; vs `ooad-build/SKILL.md:45,58,93`. | low | code-fix | `ooad-build` (**new**) |
| 13 | **Frontend sends `tags` as one comma string; backend `@IsArray()` → 400** (UC-002 tags AC unsatisfiable via SPA). | `frontend/src/admin.tsx:30`; vs `dtos.ts:55-59`; `UC-002:21,86-89`. | low | code-fix | `ooad-build` (**new**) |
| 14 | **GRASP mission-tag accuracy** — `FileBlob` tagged `[Information Expert]` (static is `create`/Creator); `Role` enum tagged `[Information Expert]`. | `file-blob.entity.ts:1,31`; `role.ts:1`. | low | code-fix | `ooad-build` (**new**) |
| 15 | JWT TTL not capped at 24h (any `JWT_EXPIRES_H` > 24 silently violates NFR-003). | `app.module.ts:53` | **maybe-false** | code-fix | `ooad-build` |
| 16 | Non-numeric `page`/`limit`/`year*` silently default to 200 instead of 400 (UC-005 2a enumerates only numeric-invalid cases). | `materials.controller.ts:54-58,69-70`; vs `UC-005:30` | **maybe-false** | code-fix | `ooad-build` |

¹ Severity re-derived from evidence. ² **Downgraded from reviewer `high`**: (3) the harmful blob→material cascade is not reachable through any current flow (ordering deletes material first) ⇒ verified ADR/schema violation with bounded reach; (4) Node `setHeader` rejects CRLF (injection leg closed) and `DiskFileStorage.store` derives `storageKey` from a random name + `extname` (traversal leg not exploitable) ⇒ partial repro defaults down.

**Raw findings: 24 → consolidated: 16** (14 code-fix confirmed + 2 `maybe-false`; one of the 14 splits a code leg from a `delta-spec` leg → BT-12).

## Aggregate `[Formality]` note

`executed 0` — the `build` probe list carries no `[Formality]`-tagged probes. Structural checks run alongside: `api/openapi.yaml` paths match controllers; every active FR-001..FR-013 has a route→controller→usecase path (no orphans either direction; FR-005/FR-014 retired, `SRS.md:56`); Dependency Rule holds (0 `@nestjs/*`/typeorm imports in `entities/` + `usecases/`).

## Probes executed / inapplicable

**Executed (all 6 `build` probes):** mutating-route role+ownership → #8 (ownership green, role missing); upload path (mime/size/traversal/sanitization/stored-vs-served) → #4 (MIME+size validated at edge `materials.controller.ts:82-91`, storage key traversal-safe, filename raw); trace headers → #12/#14; invariant guards → #6; no secret/token in source/logs → #9; breakout routing → #5b/#2 (B-1..B-6 documented as open build follow-ups in `docs/03-architecture/README.md:49-57`; no upstream dir edited; the E-001 integration test encodes the *wrong* outcome as expected rather than a hidden work-around).

**Inapplicable:** none of the build probes; `discover`/`requirements`/`verify`/`ship` sections out of scope.

**Invariants that hold:** BR-002 401-first (global `JwtAuthGuard`, only `/auth/*` `@Public`), BR-003 happy-path 409, FR-004 duplicate→201, FR-007 all roles read, FR-009/010 AND-filters + pagination 1/10/50, FR-013 ownership 403, Dependency Rule.

## Routing

- **#1–#14 (+ #15/#16 `maybe-false`) → `ooad-build`** — all fixes stay in `src/`/tests (divergence is build-vs-approved-architecture; ADR-0004/0005/0006 already decided). README follow-ups already track #1(B-2), #2(B-3), #3(B-1), #4(B-4), #5(B-5), #7(B-6); #6, #8–#14 are **new** sightings.
- **#5b → `/ooad-breakout` → BT-12** — `UC-005:20` (infix `q`) vs `ADR-0006:14` (token/prefix FULLTEXT); the code-fix (B-5) is gated on resolving it. Filed at `.scratch/ccb-post-challenge/issues/12-q-semantics-vs-fulltext.md`; RTM `FR-009`/`NFR-001` → `Blocked`.
