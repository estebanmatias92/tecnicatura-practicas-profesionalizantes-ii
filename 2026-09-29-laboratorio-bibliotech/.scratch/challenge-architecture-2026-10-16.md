# tmp — /ooad-challenge report: architecture / class-diagram.puml (2026-10-16)

Adversarial pass (`ooad-challenge`, phase `architect`).

- Artifact under review: `docs/03-architecture/class-diagram.puml`
- Supporting artifact set inspected: `docs/03-architecture/` (`data-model-er.puml`, `c4-context.puml`, `c4-container.puml`, `sequence-diagram-UC-001/002/004.puml`, `adrs/0001-0003`, `README.md`)
- Upstream source of truth: `docs/02-requirements/` (`SRS.md`, `UC-001..006`, `RTM.csv`, `crc-cards.md`, `conceptual-model.puml`) + `docs/01-discovery/PRD.md` + `CONTEXT.md`
- Reviewers: 2 fresh-context sub-agents (Trace & Spec; Security & Domain & BR); orchestrator re-verified every cited line and re-derived severity from evidence.
- **Status: findings only.** Stopped before `/ooad-breakout`. No CCB ticket filed, no RTM row mutated, no artifact edited.

## Consolidated findings

| # | Root cause (upstream defect) | Sightings (trace + evidence) | Persona | Severity | Class | Existing ticket |
|---|------------------------------|------------------------------|---------|----------|-------|-----------------|
| 1 | **ER places the 1:1 cascade FK the wrong way.** `materials.blob_id UNIQUE → file_blobs.id` with `ON DELETE CASCADE` means *delete blob ⇒ delete material* — the inverse of C-1/C-3 ("delete material ⇒ blob"). The C-2 chain `users CASCADE materials CASCADE file_blobs` breaks at link 2, orphaning every blob on account deletion. | `data-model-er.puml:24` (`blob_id FK UNIQUE`), `:41` (`users CASCADE materials`), `:42` (`materials ||--|| file_blobs ON DELETE CASCADE [C-1/C-3]`); vs `UC-004-admin.md:23,25`, `CHANGELOG-RE.md:24`, `ADR-0003:14,24` ("cascada dura a nivel DB"). | Domain & BR / Trace | **high**¹ | delta-arch | BT-06 (item 3) |
| 2 | **Core imports point outward: `Validator` (Interface Adapter) is invoked directly by UseCases**, and it also absorbs authorization (`validateTarget … 403 si no Admin`) — merging BR-003 data-validation with authz. | `README.md:26` (Validator in Interface Adapters), `:31` (imports only inward); `sequence-diagram-UC-001.puml:17`, `sequence-diagram-UC-002.puml:18,20`, `sequence-diagram-UC-004.puml:41`; vs `ADR-0002:20` (guards as adapters). | Trace / Security | medium | delta-arch | BT-06 (item 1) |
| 3 | **Framework behavior lives in the Clean core.** `AuthSession` is declared an Entity yet owns `verify(password,hash)` (BCrypt) and `sign(userId,role)` (JWT), forcing `entities → frameworks` and pulling the signing secret into the domain. | `class-diagram.puml:46-52`; `sequence-diagram-UC-001.puml:22,30`; vs `README.md:24` ("cero imports framework"), `ADR-0001:14`. | Security / Trace | medium | delta-arch | BT-06 (item 2) |
| 4 | **Design model is incomplete/incoherent: operations invoked by sequences are not declared, and reads/updates have no path.** `findByEmail` absent from `UserRepository`; `Material.create`/`FileBlob.create` absent from entities despite ADR-0001 Creator; `validateTarget` absent from `Validator`; `checkRole` absent. `verify` runs before the `User` that supplies the hash is loaded. No `findById` for UC-003/UC-006 or the C-1 ownership check; no update op for FR-011 role-change / FR-013 edit. `User.isOwner(materialId)` is Feature Envy and duplicates `Material.isOwnedBy`. | `sequence-diagram-UC-001.puml:22,25`; `sequence-diagram-UC-002.puml:16,26`; `sequence-diagram-UC-004.puml:18,41` vs `class-diagram.puml:19-20,34,55-99` (`Validator:94-99` has no `validateTarget`, no `validateRole`); `ADR-0001:19`. | Trace & Spec | medium | delta-arch | BT-05 (items 1,2,3) |
| 5 | **UseCase/flow coverage gap.** A single `ManageMaterialUseCase` with `deleteMaterial`+`deleteUser` and **no `execute()`** absorbs C-1/C-2/C-3, contradicting "un UseCase por flujo" (`ADR-0001:18,26`, `README.md:25`). UC-003 read-by-id has no dedicated UseCase; sequence diagrams for UC-003/UC-005/UC-006 are absent (`UC-003:57`, `UC-005:90`, `UC-006:84` self-mark "pendiente"). (UC-005/UC-006 *do* have `SearchCatalogUseCase`/`DownloadFileUseCase`; the gap is flow coverage + read-by-id, not total absence.) | `class-diagram.puml:67-70,119-124`; `class-diagram.puml:64,71`; `README.md:20`. | Trace & Spec / Domain | medium | delta-arch | BT-05 (item 4) |
| 6 | **Cascade rollback/transaction ordering is unmodelable as drawn.** UC-002 stores bytes (`FS.store`) *before* the DB transaction, with no cleanup on failure → orphan blob; UC-004 does `FS.remove` *after* DB commit yet declares "500 + rollback" — contradicting `ADR-0003:26` ("transacción-primero + remove + rollback"). Moreover `deleteWithBlob`/`deleteCascade` return `void`, so `FS.remove(storageKey)` has no source for the key. | `sequence-diagram-UC-002.puml:24,29`; `sequence-diagram-UC-004.puml:20-24,44-47`; `class-diagram.puml:83` (`deleteWithBlob(id): void`), `:79` (`deleteCascade(userId): void`). | Domain & BR / Trace | medium | delta-arch | BT-05 (item 5) |
| 7 | **`file_name` (v0.4.1) has no design path.** ER declares `file_blobs.file_name NN`, but `FileBlob` has no `fileName` attribute and `FileBlob.create(storageKey, mime, size)` never sets it; `FileStorage.store(bytes)` receives no name → the `Content-Disposition: filename` of UC-006 is not producible. | `data-model-er.puml:34`; `class-diagram.puml:37-44,89-93`; `sequence-diagram-UC-002.puml:26`; `UC-006-download.md:26`. | Trace & Spec | medium | delta-arch | BT-05 (item 8) / pairs BT-02 |
| 8 | **ADR-0002 is not realized.** Protected Variations is claimed as GoF Strategy for `Validator` and search filters, and Command for UseCases, but the model has a concrete `Validator` and a bare `SearchCatalogUseCase.execute(query)` — no Strategy/Command types; the `JwtAuthGuard`/`RolesGuard` adapters it names are also absent (role check appears only as ad-hoc `UC -> UC : checkRole`). | `ADR-0002:14,18,20`; `class-diagram.puml:64-66,75-99,129`; `sequence-diagram-UC-002.puml:16`; vs `README.md:26`. | Trace & Spec | medium | delta-arch | BT-05 (item 6); guards = new sighting |
| 9 | **Architecture-driving decisions lack an ADR.** No auth ADR (JWT TTL/BCrypt cost) although RTM rows cite ADR-0001 for NFR-003; SRS §3.1/§6 explicitly leave the hard-cascade decision as "ADR pendiente (cascada)" and no such ADR exists among 0001-0003. | `SRS.md:65,86`; `RTM.csv:2,17`; `adrs/0001:10,14`, `adrs/0003:1,14`. | Domain & BR / Trace | medium | delta-arch | BT-05 (item 7, auth) + **new** (cascade) |
| 10 | **Declared index cannot serve UC-005, so NFR-001's "vía índices" claim is unbacked.** `INDEX (title, author, subject, year)` cannot serve `q`/partial author-subject (leading-wildcard LIKE), the `created_at DESC` order, `edition`, or `tags`; UC-005 requires indices incl. `tags`. | `data-model-er.puml:22,27`; `UC-005-search.md:20-24`; vs `ADR-0003:24`. | Domain & BR / Trace | medium | delta-arch | BT-06 (item 4) |
| 11 | **C4 context under-maps actors to UCs.** Missing Admin→UC-002 ("Admin también puede" upload) and Admin/Professor→UC-003/005/006/004 reads + own-delete. | `c4-context.puml:16-18`; `UC-002-upload.md:5`; `UC-003-read.md:5`; `UC-004-admin.md:5`; `UC-005-search.md:5`; `UC-006-download.md:5`. | Trace & Spec | low | delta-arch | BT-06 (item 6) |
| 12 | **`3NF` claim is false/unqualified with `tags JSON`.** Multivalued JSON array violates 1NF; tradeoff is documented in ADR-0003 but the ER title asserts 3NF. | `data-model-er.puml:5,22`; `ADR-0003:25,33`. | Domain & BR | low² | delta-arch | BT-06 (item 5) |
| 13 | **Approval drift.** `README.md:1` dates the architecture "aprobado 2026-10-13", but the ER was modified 2026-10-14 (v0.4.1, `file_name`) with no recorded re-approval. | `README.md:1`; `data-model-er.puml:34`; `CHANGELOG-RE.md:17-21`. | Trace & Spec | low | delta-arch | BT-06 (item 7) |
| 14 | **Role-escalation has no design guard.** `RegisterUserUseCase.execute(dto)` accepts role; no `Validator.validateRole`/constraint forces `Student` on self-registration, and the UC-004 role-change flow is unmodeled. | `class-diagram.puml:55-57,94-99`; `UC-001-auth.md:14`; `UC-004-admin.md:14`. | Security | medium | delta-arch (+delta-spec) | BT-07 (spec) + BT-05 (model) |
| 15 | **Stored filename is un-sanitized on the read path.** `file_name` persists the raw client filename and UC-006 echoes it verbatim into `Content-Disposition: inline; filename="…"`; no Validator op or FileStorage step sanitizes it. | `data-model-er.puml:34`; `UC-006-download.md:16,23-26`; `class-diagram.puml:37-44` (no `fileName`/sanitize step). | Security | low³ | delta-spec | **new** |
| 16 | **`AuthSession` is modelled as a persisted 1:* child of `User` but has no table.** `User "1" -- "*" AuthSession` implies persistence; the ER has no `auth_sessions` table (JWT is stateless). | `class-diagram.puml:46-52,104`; `data-model-er.puml:7-39` (3 tables only). | Domain & BR | low | delta-arch | **new** |
| 17 | **Upload validation may sit after receipt.** `Ctrl (FileInterceptor)` then `UC -> Val : validateFile(mime, size)`, while Multer consumes/writes at interceptor time; NFR-005 "antes de persistir" is only falsifiable once build fixes where `limits`/`fileFilter` live. | `sequence-diagram-UC-002.puml:4,14,18`; `UC-002-upload.md:34,42`; `NFR-005 SRS.md:77`. | Security | **maybe-false** | delta-arch | **new** |

¹ Upgraded from reviewer `medium`: reproduced break of BR-004 reachable on every account/material delete; gates sign-off.
² Downgraded from reviewer `maybe-false`: the defect is cosmetic (title word) given the tradeoff is documented — real but no behavioral consequence.
³ Downgraded from reviewer `medium`: Node `setHeader` rejects CRLF (injection leg) and the MIME allowlist + explicit `Content-Type` bound the XSS leg ⇒ partial repro defaults down.

**Raw findings: 24 → consolidated: 17** (16 confirmed + 1 `maybe-false`).

## Aggregate `[Formality]` note

`executed 3, gaps:`

- **Probe-list completeness:** the `architect` list has no `[Formality]`-tagged probes; structural checks run: all 3 ADRs carry Alternatives + Consequences; RTM rows and UC Gherkin exist; all C4/ER/class diagrams render. Gaps — sequence diagrams exist only for UC-001/002/004 while UC-003/005/006 are self-marked "pendiente" (`UC-003:57`, `UC-005:90`, `UC-006:84`, `README.md:20`), so their message→operation and port mappings are uncheckable.
- **GRASP annotation:** `sequence-diagram-UC-002.puml:20` (`validateMetadata`) is the only `UC -> Val` message without a `GRASP … Mission:` citation; `checkRole` (`:16`) is annotated but maps to no class operation.
- **Class relations:** the `Relations` block (`class-diagram.puml:101-111`) omits `DownloadFileUseCase` entirely and never links `LoginUseCase`/`RegisterUserUseCase` to `UserRepository`, nor `UploadMaterialUseCase` to `Validator`/`FileStorage`/`FileBlobRepository` ⇒ several collaborations are unmapped (folded into #4/#5, not counted separately).

## Probes executed / inapplicable

**Executed:**
- `[Trace]` Every sequence message maps to a class operation citing a GRASP pattern → #4, #5, #8, aggregate
- `[Trace]` Every `Protected Variations` names the GoF that implements it → #8
- `[Domain]` Any God-controller / Feature Envy → #4, #5
- `[Trace]` Dependency Rule: no import points outward → #2, #3
- `[Domain]` Every architecture-driving NFR has an ADR with alternatives + consequences → #9, #10
- `[Domain]` Data model normalized; cascade/delete behaviour stated → #1, #6, #10, #11², #12, #15

**Invariants checked:** BR-002 (#2/#8 guards), BR-003 (#2), BR-004 (#1, #6, #7), NFR-001 (#10), NFR-003 (#3, #9), NFR-005 (#15, #17), NFR-006 (#2, #8, #14), RST-004 (#2).

**Inapplicable:** `build`/`verify`/`ship` probe sections (no `src/`, tests, or release notes exist); no physical-loan/reservation/fine/notification surfaces in scope.

**Invariants that hold:** FR-001/UC-001 auth happy path, FR-004/UC-002 1:1 duplicate→201, FR-006/007 all-roles-read reproduce correctly in the model; ADR-0001/0002/0003 each carry alternatives + consequences.

## Convergence / routing (no ticket filed — stopped before `/ooad-breakout`)

Findings **#1-#14** map onto the existing open (unapproved) breakout tickets **BT-05** (design-model completeness), **BT-06** (architectural integrity), and **BT-07** (registration role-escalation), recorded in `CHANGELOG-RE.md:3-15`. Findings **#15 (filename sanitization), #16 (`auth_sessions` modelling), #17 (Multer timing, `maybe-false`)** and the **cascade-ADR** leg of #9 and the **guards** leg of #8 are **new** — not covered by any open BT ticket.

Suggested destinations (to be filed by `/ooad-breakout`, not here): all `delta-arch` rows → `ooad-architect`; `delta-spec` rows (#14 role rule, #15 filename sanitization) → `ooad-requirements`. RTM rows `FR-001/002/004/008/011/012/013`, `NFR-001/003/005/006`, `BR-004`, `RST-004` remain the affected traces.
