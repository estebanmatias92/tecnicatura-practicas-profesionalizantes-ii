Adversarial review — phase `architect`, docs/03-architecture/ vs upstream docs/02-requirements/ (SRS.md, RTM.csv, crc-cards.md, conceptual-model.puml, UC-*.md). Fresh context; no praise.

Reference `references/challenge-probes.md` does not exist in repo; probes executed are the 6 explicit checks + structural checks from `.scratch/challenge-architecture-2026-10-16.md` and `docs/agents/architecture.md`.

=== FALSIFIABLE FINDINGS (file:line evidence) ===

1. [Sequence citation gap — not every message binds GRASP + Mission] `docs/03-architecture/sequence-diagram-UC-002.puml:24` (`UC -> Val : validateFile`) has no adjacent `GRASP … Mission:` citation; `:26` (`validateMetadata`) lacks one; `:30` (`normalizeFileName`) lacks one. Previous citation at `:21` binds to `assertCanUpload`, not to validation/messages after. Aggregate note below consolidates remaining gaps.

2. [Protected Variations names GoF — holds] `ADR-0002:14` names Strategy (Validator/filters) + Command (UseCases) + Adapter (guards/repo); `class-diagram.puml:250-252` names Strategy explicitly (`GoF Strategy`); `sequence-diagram-UC-005.puml:16` names `GoF Strategy`. No missing GoF naming.

3. [God-controller / Feature-envy — none present] `ManageMaterialUseCase` (`class-diagram.puml:80-84`) and `ManageUsersUseCase` (`:85-90`) split by aggregate (material vs users); previous `User.isOwnedBy` feature-envy removed (`class-diagram.puml:228-230` notes `Material.isOwnedBy` replaces it). No single controller absorbs all flows.

4. [Dependency Rule — respected in design] `README.md:31-35` states inward-only; `class-diagram.puml:9` (Entities: zero framework imports), ports (`ValidatorPort`, `PasswordHasher`, `TokenSigner`, `FileStorage`) owned by Use Cases (`:97-142`); adapters (`BiblioValidator`, `BcryptHasher`, `JwtTokenSigner`, `DiskFileStorage`) implement ports at adapter layer (`:145-157`); framework wiring (`AppModule`) at bottom (`:160-168`). No outward arrows.

5. [Every architecture-driving NFR has ADR with alternatives/consequences — holds] `NFR-001` → ADR-0006 (`FULLTEXT/BTREE`, alternatives: `LIKE` scan, tags table, external engine); `NFR-002` → ADR-0003 (`streaming`, alternatives: SQL raw, distributed); `NFR-003` → ADR-0004 (`BCrypt cost >=10`, alternatives: stateless JWT, denylist); `NFR-004` → ADR-0004 (`JWT_SECRET`, no default); `NFR-005` → ADR-0002 (`Strategy` rules) + ADR-0005 (`FS-first`); `NFR-006` → ADR-0004 (`token_version`, alternatives: denylist, refresh). All 6 ADRs contain `Alternatives Considered` + `Consequences` tables/sections.

6. [Data model — normalized claim qualified; cascade behavior stated; citation error] `data-model-er.puml:5` claims "normalizada salvo `tags` JSON (tradeoff, ADR-0005)" — **citation error**: normalization tradeoff is documented in `ADR-0003:16`, not ADR-0005. Cascade behavior stated: `:24` (`users.owner_id` → `ON DELETE CASCADE [C-2]`); `:25` (`materials.blob_id` → `NO ACTION`; cascada atómica en transacción, ADR-0005); `:43-44` relations confirm directions. Normalization note at `:74-76` qualifies 3NF except `tags` (1NF violation). Correct.

=== ADDITIONAL FALSIFIABLE GAPS (not in user’s 6-point list but reachable by upstream checks) ===

7. [Sequence message → class operation: missing `update`/`applyPatch` declaration for User] `sequence-diagram-UC-004.puml:58` shows `user.role = role; user.tokenVersion += 1` (mutation) but `class-diagram.puml:16-24` (`User`) declares `create`, `toPublic`, no `updateRole`, `bumpVersion`, or `applyPatch`. `Material.applyPatch` (`:39`) exists; `User` equivalent absent. This breaks the "operations invoked by sequences are declared" invariant from the previous challenge (`BT-05`); README `:41` claims `update` modelado but class model does not show it.

8. [Data-model title typo: ADR reference wrong] `data-model-er.puml:5` — `ADR-0005` cited for normalization tradeoff; should be `ADR-0003` (see #6).

9. [Upstream CRC cards: GRASP assignments still marked "pendiente"] `docs/02-requirements/crc-cards.md:12,26,41,56,70,79,89` each line ends `GRASP (architect) → pendiente`. These upstream artifacts were not updated to match the approved architecture design (v0.5.1). This is an upstream traceability gap, not an architecture violation, but it means the upstream `crc-cards.md` does not validate the architect decisions.

=== AGGREGATE [Formality] NOTE ===
`references/challenge-probes.md` missing; executed structural checks derived from `docs/agents/architecture.md` and `.scratch/challenge-architecture-2026-10-16.md`. Sequence-message citations are partial (UC-002 lacks direct bindings for validation/normalization; UC-001/003/004/005/006 bind most messages but return paths lack citations — not required by the design but the user’s "every message" standard is stricter than the artifact delivers). Protected Variations naming complete (`ADR-0002`, `class-diagram.puml`, `sequence-diagram-UC-005.puml`). God-controller/feature-envy absent. Dependency Rule respected. All architecture-driving NFRs traced to ADRs with alternatives + consequences (`ADR-0001` through `ADR-0006`). Data-model normalization qualified correctly; cascade directions explicitly stated (`ON DELETE CASCADE` for user→material, `NO ACTION` + app transaction for material→blob); single citation typo (`ADR-0005` for normalization tradeoff) falsified at `data-model-er.puml:5`.

No God-controller, no feature-envy, no outward dependency, no missing GoF naming, no missing ADR for NFRs. Residual gaps: missing `User` mutation operations (`#7`); sequence citation completeness (`#1`); upstream `crc-cards.md` unupdated (`#9`).
